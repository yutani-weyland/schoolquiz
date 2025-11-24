import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  let userId: string | null = request.headers.get('X-User-Id')
  
  if (!userId && token.startsWith('mock-token-')) {
    const parts = token.split('-')
    if (parts.length >= 3) {
      userId = parts.slice(2, -1).join('-')
    }
  }

  if (!userId) {
    return null
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
      },
    })
    return user
  } catch (error: any) {
    const errorMsg = error.message || String(error)
    if (errorMsg.includes('does not exist') || 
        errorMsg.includes('P2022') ||
        errorMsg.includes('column')) {
      try {
        const user = await (prisma as any).user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            tier: true,
          },
        })
        return user
      } catch (fallbackError) {
        return null
      }
    }
    throw error
  }
}

/**
 * GET /api/premium/users/search?q=searchTerm
 * Search for premium users to share quizzes with
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const isPremium = user.tier === 'premium' || 
      (user as any).subscriptionStatus === 'ACTIVE' ||
      (user as any).subscriptionStatus === 'TRIALING'
    
    if (!isPremium) {
      return NextResponse.json(
        { error: 'Only premium users can search for other premium users' },
        { status: 403 }
      )
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

