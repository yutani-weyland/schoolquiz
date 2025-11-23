/**
 * GET /api/admin/search
 * Lightweight unified search endpoint for command palette
 * Returns minimal data for fast results
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const types = searchParams.get('types')?.split(',') || ['quizzes', 'achievements', 'organisations', 'users']
    const limit = parseInt(searchParams.get('limit') || '5', 10)

    if (!query || query.length < 2) {
      return NextResponse.json({
        quizzes: [],
        achievements: [],
        organisations: [],
        users: [],
      })
    }

    // Build search promises - only fetch minimal fields needed for command palette
    const promises: Promise<any>[] = []

    if (types.includes('quizzes')) {
      promises.push(
        prisma.quiz.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { slug: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: limit,
          select: {
            id: true,
            title: true,
          },
          orderBy: { createdAt: 'desc' },
        }).then(quizzes => ({ quizzes }))
      )
    } else {
      promises.push(Promise.resolve({ quizzes: [] }))
    }

    if (types.includes('achievements')) {
      promises.push(
        prisma.achievement.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { slug: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: limit,
          select: {
            id: true,
            name: true,
          },
          orderBy: { createdAt: 'desc' },
        }).then(achievements => ({ achievements }))
      )
    } else {
      promises.push(Promise.resolve({ achievements: [] }))
    }

    if (types.includes('organisations')) {
      promises.push(
        prisma.organisation.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { emailDomain: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: limit,
          select: {
            id: true,
            name: true,
          },
          orderBy: { createdAt: 'desc' },
        }).then(organisations => ({ organisations }))
      )
    } else {
      promises.push(Promise.resolve({ organisations: [] }))
    }

    if (types.includes('users')) {
      promises.push(
        prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
          },
          orderBy: { createdAt: 'desc' },
        }).then(users => ({ users }))
      )
    } else {
      promises.push(Promise.resolve({ users: [] }))
    }

    // Execute all searches in parallel
    const results = await Promise.all(promises)

    return NextResponse.json({
      quizzes: results[0].quizzes || [],
      achievements: results[1].achievements || [],
      organisations: results[2].organisations || [],
      users: results[3].users || [],
    })
  } catch (error: any) {
    console.error('Error in search endpoint:', error)
    return NextResponse.json(
      {
        quizzes: [],
        achievements: [],
        organisations: [],
        users: [],
        error: error.message,
      },
      { status: 500 }
    )
  }
}

