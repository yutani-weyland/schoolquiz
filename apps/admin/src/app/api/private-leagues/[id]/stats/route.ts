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

  const user = await prisma.user.findUnique({
    where: { id: userId },
  })
  
  return user
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
          (global as any).devLeaguesStorage = new Map<string, any>()
          (global as any).devMembersStorage = new Map<string, Set<string>>()
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
      
      const memberIds = storage.members.get(id) || new Set<string>()
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
    
    const league = await (prisma as any).privateLeague.findUnique({
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
    const stats = await (prisma as any).privateLeagueStats.findMany({
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
    const quizSlugs = await (prisma as any).privateLeagueStats.findMany({
      where: {
        leagueId: id,
        quizSlug: { not: null },
      },
      select: {
        quizSlug: true,
      },
      distinct: ['quizSlug'],
    })
    
    return NextResponse.json({
      stats,
      quizSlugs: quizSlugs.map((q: any) => q.quizSlug).filter(Boolean),
      overallStats: !quizSlug ? stats : await (prisma as any).privateLeagueStats.findMany({
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
      }),
    })
  } catch (error: any) {
    console.error('Error fetching league stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    )
  }
}

