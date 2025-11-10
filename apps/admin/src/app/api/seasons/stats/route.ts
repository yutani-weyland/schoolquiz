import { NextRequest, NextResponse } from 'next/server'
import { prisma, getUserTier } from '@schoolquiz/db'

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  
  if (!token) {
    return null
  }
  
  const userId = request.headers.get('x-user-id')
  
  if (!userId) {
    return null
  }
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })
  
  return user
}

/**
 * GET /api/seasons/stats
 * Get season stats for current user
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
    
    const { searchParams } = new URL(request.url)
    const seasonSlug = searchParams.get('season') || '2025' // Default to current season
    
    // Get season
    const season = await prisma.season.findUnique({
      where: { slug: seasonSlug },
    })
    
    if (!season) {
      return NextResponse.json(
        { error: 'Season not found' },
        { status: 404 }
      )
    }
    
    // Get or create season stats
    let seasonStats = await prisma.seasonStats.findUnique({
      where: {
        userId_seasonId: {
          userId: user.id,
          seasonId: season.id,
        },
      },
    })
    
    if (!seasonStats) {
      // Create default stats
      seasonStats = await prisma.seasonStats.create({
        data: {
          userId: user.id,
          seasonId: season.id,
        },
      })
    }
    
    // Get all seasons for dropdown
    const allSeasons = await prisma.season.findMany({
      orderBy: { startDate: 'desc' },
    })
    
    return NextResponse.json({
      currentSeason: {
        id: season.id,
        slug: season.slug,
        name: season.name,
        startDate: season.startDate.toISOString(),
        endDate: season.endDate.toISOString(),
      },
      stats: {
        quizzesPlayed: seasonStats.quizzesPlayed,
        perfectScores: seasonStats.perfectScores,
        averageScore: seasonStats.averageScore,
        longestStreakWeeks: seasonStats.longestStreakWeeks,
        currentStreakWeeks: seasonStats.currentStreakWeeks,
        achievementsUnlocked: seasonStats.achievementsUnlocked,
        lastPlayedAt: seasonStats.lastPlayedAt?.toISOString() || null,
      },
      availableSeasons: allSeasons.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
      })),
    })
  } catch (error: any) {
    console.error('Error fetching season stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch season stats', details: error.message },
      { status: 500 }
    )
  }
}

