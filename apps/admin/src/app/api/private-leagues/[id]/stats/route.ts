import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireApiAuth } from '@/lib/api-auth'
import { ForbiddenError } from '@/lib/api-error'
import { auth } from '@schoolquiz/auth'

/**
 * GET /api/private-leagues/[id]/stats
 * Get league stats - quiz leaders, total correct answers, streaks, etc.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const totalStart = Date.now()
  console.log(`[Stats API] Request started at ${new Date().toISOString()}`)
  try {
    // Optimized auth: Get user ID and minimal fields as fast as possible
    const authStart = Date.now()
    console.log(`[Stats API] Starting auth at ${Date.now() - totalStart}ms`)
    
    // Try getToken first (faster, doesn't trigger session callback)
    let userId: string | null = null
    let user: any = null
    
    try {
      const { getToken } = await import('next-auth/jwt')
      const tokenStart = Date.now()
      const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET 
      })
      const tokenDuration = Date.now() - tokenStart
      console.log(`[Stats API] getToken took ${tokenDuration}ms`)
      userId = token?.sub || null
    } catch (tokenError: any) {
      console.log(`[Stats API] getToken failed: ${tokenError.message}, using auth()`)
      const sessionStart = Date.now()
      const session = await auth()
      const sessionDuration = Date.now() - sessionStart
      console.log(`[Stats API] auth() took ${sessionDuration}ms`)
      userId = session?.user?.id || null
    }
    
    if (!userId) {
      console.log(`[Stats API] No userId found`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log(`[Stats API] Got userId: ${userId} at ${Date.now() - authStart}ms`)
    
    // Fetch only the fields we need for premium check
    // Note: This query takes ~800ms due to network latency to Supabase
    // To optimize further, ensure DATABASE_URL uses connection pooler (port 6543)
    const userQueryStart = Date.now()
    user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        tier: true,
        subscriptionStatus: true,
        freeTrialUntil: true,
      },
    })
    const userQueryDuration = Date.now() - userQueryStart
    console.log(`[Stats API] User query took ${userQueryDuration}ms`)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }
    
    const authDuration = Date.now() - authStart
    const tokenAuthDuration = authDuration - userQueryDuration
    console.log(`[Stats API] Total auth took ${authDuration}ms (getToken/auth: ${tokenAuthDuration}ms, user query: ${userQueryDuration}ms)`)
    
    const paramsStart = Date.now()
    const { id } = await params
    const paramsDuration = Date.now() - paramsStart
    const { searchParams } = new URL(request.url)
    const quizSlug = searchParams.get('quizSlug') || null
    
    const isPremium = user.tier === 'premium' || 
      user.subscriptionStatus === 'ACTIVE' ||
      user.subscriptionStatus === 'TRIALING' ||
      (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())
    
    if (!isPremium) {
      throw new ForbiddenError('Private leagues are only available to premium users')
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
    
    // Optimize: Check league existence and user access in parallel with minimal data
    // Only fetch what we need for access check
    const [league, userMembership] = await Promise.all([
      (prisma as any).privateLeague.findFirst({
        where: { id, deletedAt: null },
        select: {
          id: true,
          createdByUserId: true,
        },
      }),
      // Check if user is a member (only fetch their membership record)
      (prisma as any).privateLeagueMember.findFirst({
        where: {
          leagueId: id,
          userId: user.id,
          leftAt: null,
        },
        select: {
          id: true,
        },
      }),
    ])
    
    if (!league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      )
    }
    
    // Check if user is a member or creator
    const isMember = !!userMembership
    if (!isMember && league.createdByUserId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Optimize: Run all stats queries in parallel, then batch fetch users
    let stats: any[] = []
    let quizSlugs: string[] = []
    let overallStats: any[] = []
    
    try {
      const queryStart = Date.now()
      
      // Build query promises - fetch stats WITHOUT user includes to avoid N+1
      const queries: Promise<any>[] = []
      
      // Query 1: Get user stats for the requested view (quiz-specific or overall) - NO USER INCLUDES
      const userStatsQuery = (prisma as any).privateLeagueStats.findMany({
        where: {
          leagueId: id,
          quizSlug: quizSlug,
          userId: { not: null },
          teamId: null,
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
      queries.push(userStatsQuery)
      
      // Query 1b: Get team stats for the requested view
      const teamStatsQuery = (prisma as any).privateLeagueStats.findMany({
        where: {
          leagueId: id,
          quizSlug: quizSlug,
          teamId: { not: null },
          userId: null,
        },
        orderBy: quizSlug
          ? [
              { score: 'desc' },
              { completedAt: 'asc' },
            ]
          : [
              { totalCorrectAnswers: 'desc' },
              { bestStreak: 'desc' },
            ],
      })
      queries.push(teamStatsQuery)
      
      // Query 2: Get unique quiz slugs using groupBy (more efficient than findMany + distinct)
      const quizSlugsQuery = (prisma as any).privateLeagueStats.groupBy({
        by: ['quizSlug'],
        where: {
          leagueId: id,
          quizSlug: { not: null },
        },
      })
      queries.push(quizSlugsQuery)
      
      // Query 3: Get overall stats if quizSlug was provided - NO USER INCLUDES
      const overallStatsQuery = quizSlug
        ? (prisma as any).privateLeagueStats.findMany({
            where: {
              leagueId: id,
              quizSlug: null,
            },
            // Removed include to avoid slow joins
            orderBy: [
              { totalCorrectAnswers: 'desc' },
              { bestStreak: 'desc' },
            ],
          })
        : Promise.resolve([])
      queries.push(overallStatsQuery)
      
      // Execute all queries in parallel
      const statsQueryTime = Date.now()
      const [userStatsResults, teamStatsResults, quizSlugsResults, overallStatsResults] = await Promise.all(queries)
      const statsQueryDuration = Date.now() - statsQueryTime
      
      // Extract unique user IDs and team IDs from all stats
      const userIds = new Set<string>()
      const teamIds = new Set<string>()
      
      userStatsResults.forEach((s: any) => {
        if (s.userId) userIds.add(s.userId)
      })
      teamStatsResults.forEach((s: any) => {
        if (s.teamId) teamIds.add(s.teamId)
      })
      if (quizSlug && overallStatsResults.length > 0) {
        overallStatsResults.forEach((s: any) => {
          if (s.userId) userIds.add(s.userId)
          if (s.teamId) teamIds.add(s.teamId)
        })
      }
      
      // Batch fetch all users and teams in parallel
      const usersQueryTime = Date.now()
      const [users, teams] = await Promise.all([
        userIds.size > 0
          ? (prisma as any).user.findMany({
              where: {
                id: { in: Array.from(userIds) },
              },
              select: {
                id: true,
                name: true,
                email: true,
                teamName: true,
              },
            })
          : [],
        teamIds.size > 0
          ? (prisma as any).team.findMany({
              where: {
                id: { in: Array.from(teamIds) },
              },
              select: {
                id: true,
                name: true,
                color: true,
                userId: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            })
          : [],
      ])
      const usersQueryDuration = Date.now() - usersQueryTime
      
      // Create maps for O(1) lookup
      const userMap = new Map(users.map((u: any) => [u.id, u]))
      const teamMap = new Map(teams.map((t: any) => [t.id, t]))
      
      // Combine user and team stats, map users/teams back
      const allStatsResults = [...userStatsResults, ...teamStatsResults]
      stats = allStatsResults.map((s: any) => ({
        ...s,
        user: s.userId ? (userMap.get(s.userId) || null) : null,
        team: s.teamId ? (teamMap.get(s.teamId) || null) : null,
      }))
      
      quizSlugs = quizSlugsResults
        .map((q: any) => q.quizSlug)
        .filter((slug: string | null): slug is string => slug !== null)
      
      overallStats = quizSlug
        ? overallStatsResults.map((s: any) => ({
            ...s,
            user: s.userId ? (userMap.get(s.userId) || null) : null,
            team: s.teamId ? (teamMap.get(s.teamId) || null) : null,
          }))
        : stats
      
      const totalQueryDuration = Date.now() - queryStart
      console.log(`[Stats API] Queries took ${totalQueryDuration}ms (stats: ${statsQueryDuration}ms, users/teams: ${usersQueryDuration}ms, total results: ${stats.length + overallStats.length})`)
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
    
    const totalDuration = Date.now() - totalStart
    console.log(`[Stats API] Total request took ${totalDuration}ms`)
    
    return NextResponse.json({
      stats,
      quizSlugs,
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

