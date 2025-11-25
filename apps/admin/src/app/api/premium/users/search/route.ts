import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireApiAuth } from '@/lib/api-auth'
import { ForbiddenError } from '@/lib/api-error'

/**
 * GET /api/premium/users/search?q=searchTerm
 * Search for premium users to share quizzes with
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireApiAuth()

    const isPremium = user.tier === 'premium' || 
      user.subscriptionStatus === 'ACTIVE' ||
      user.subscriptionStatus === 'TRIALING' ||
      (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())
    
    if (!isPremium) {
      throw new ForbiddenError('Only premium users can search for other premium users')
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query || query.length < 2) {
      return NextResponse.json({
        users: [],
        total: 0,
      })
    }

    try {
      // Search for premium users (exclude current user)
      const users = await prisma.user.findMany({
        where: {
          id: { not: user.id }, // Exclude current user
          AND: [
            {
              OR: [
                { tier: 'premium' },
                { subscriptionStatus: 'ACTIVE' },
                { subscriptionStatus: 'TRIALING' },
              ],
            },
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
              ],
            },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          tier: true,
        },
        take: limit,
        orderBy: {
          name: 'asc',
        },
      })

      return NextResponse.json({
        users,
        total: users.length,
      })
    } catch (dbError: any) {
      if (dbError.message?.includes('does not exist') || 
          dbError.message?.includes('column') ||
          dbError.code === 'P2022') {
        return NextResponse.json(
          { error: 'Database schema not migrated' },
          { status: 500 }
        )
      }
      throw dbError
    }
  } catch (error: any) {
    console.error('Error searching premium users:', error)
    return NextResponse.json(
      { error: 'Failed to search users', details: error.message },
      { status: 500 }
    )
  }
}

