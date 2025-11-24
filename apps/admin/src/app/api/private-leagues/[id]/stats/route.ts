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
        teamName: true,
        // Exclude problematic fields that may not exist
      },
    })
    return user
  } catch (error: any) {
    // If there's a schema error, try with minimal fields
    if (error.code === 'P2022' || error.message?.includes('does not exist')) {
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
      } catch (fallbackError) {
        console.error('Error fetching user in getUserFromToken:', fallbackError)
        return null
      }
    }
    throw error
  }
}

/**
 * GET /api/private-leagues/[id]/stats
 * Get league stats - quiz leaders, total correct answers, streaks, etc.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request)
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const quizSlug = searchParams.get('quizSlug') || null
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    if (user.tier !== 'premium') {
      return NextResponse.json(
        { error: 'Private leagues are only available to premium users' },
        { status: 403 }
      )
    }
    
    // Check if DATABASE_URL is set - if not, use in-memory storage for access check
    const hasDatabase = !!process.env.DATABASE_URL
    
    if (!hasDatabase) {
      // Development mode: find league in memory
      const getDevStorage = () => {
        if (typeof (global as any).devLeaguesStorage === 'undefined') {
          const MapConstructor = globalThis.Map as any;
          const SetConstructor = globalThis.Set as any;
          (global as any).devLeaguesStorage = new MapConstructor()
          (global as any).devMembersStorage = new MapConstructor()
        }
        return {
          leagues: (global as any).devLeaguesStorage,
          members: (global as any).devMembersStorage
        }
      }
      const storage = getDevStorage()
      const league = storage.leagues.get(id)
      
      if (!league) {
        return NextResponse.json(
          { error: 'League not found' },
          { status: 404 }
        )
      }
      
      const memberIds = storage.members.get(id) || new (globalThis.Set as any)()
      const isMember = memberIds.has(user.id)
      if (!isMember && league.createdByUserId !== user.id) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
      
      // Return empty stats for dev mode
      return NextResponse.json({
        stats: [],
        quizSlugs: [],
        overallStats: [],
      })
    }
    
    const league = await (prisma as any).privateLeague.findFirst({
      where: { id, deletedAt: null },
      include: {
        members: {
          where: {
            leftAt: null,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                teamName: true,
              },
            },
          },
        },
      },
    })
    
    if (!league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      )
    }
    
    // Check if user is a member
    const isMember = league.members.some((m: any) => m.userId === user.id)
    if (!isMember && league.createdByUserId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Get stats for the league
    // If quizSlug is provided, get quiz-specific stats, otherwise overall stats
    let stats: any[] = []
    let quizSlugs: any[] = []
    let overallStats: any[] = []
    
    try {
      stats = await (prisma as any).privateLeagueStats.findMany({
        where: {
          leagueId: id,
          quizSlug: quizSlug,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              teamName: true,
            },
          },
        },
        orderBy: quizSlug
          ? [
              { score: 'desc' }, // For quiz-specific, sort by score
              { completedAt: 'asc' }, // Then by completion time (earlier = better)
            ]
          : [
              { totalCorrectAnswers: 'desc' }, // For overall, sort by total correct
              { bestStreak: 'desc' }, // Then by best streak
            ],
      })
      
      // Get all unique quiz slugs for this league
      quizSlugs = await (prisma as any).privateLeagueStats.findMany({
        where: {
          leagueId: id,
          quizSlug: { not: null },
        },
        select: {
          quizSlug: true,
        },
        distinct: ['quizSlug'],
      })
      
      // Get overall stats if quizSlug was provided
      if (quizSlug) {
        overallStats = await (prisma as any).privateLeagueStats.findMany({
          where: {
            leagueId: id,
            quizSlug: null,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                teamName: true,
              },
            },
          },
          orderBy: [
            { totalCorrectAnswers: 'desc' },
            { bestStreak: 'desc' },
          ],
        })
      } else {
        overallStats = stats
      }
    } catch (statsError: any) {
      // If stats table doesn't exist or there's an error, return empty arrays
      const errorMsg = statsError.message || String(statsError)
      if (errorMsg.includes('does not exist') || 
          errorMsg.includes('Unknown model') ||
          errorMsg.includes('private_league_stats')) {
        console.warn('League stats table not found or error querying stats:', errorMsg)
        // Return empty stats - this is okay, stats will be created as users play
        return NextResponse.json({
          stats: [],
          quizSlugs: [],
          overallStats: [],
        })
      }
      // Re-throw other errors
      throw statsError
    }
    
    return NextResponse.json({
      stats,
      quizSlugs: quizSlugs.map((q: any) => q.quizSlug).filter(Boolean),
      overallStats,
    })
  } catch (error: any) {
    console.error('Error fetching league stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    )
  }
}

