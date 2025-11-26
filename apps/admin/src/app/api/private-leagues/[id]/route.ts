import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireApiAuth } from '@/lib/api-auth'
import { ForbiddenError } from '@/lib/api-error'

/**
 * GET /api/private-leagues/[id]
 * Get league details with stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const apiStart = Date.now()
    const user = await requireApiAuth()
    const authDuration = Date.now() - apiStart
    console.log(`[League Details API] Auth took ${authDuration}ms`)
    
    const { id } = await params
    
    const isPremium = user.tier === 'premium' || 
      user.subscriptionStatus === 'ACTIVE' ||
      user.subscriptionStatus === 'TRIALING' ||
      (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())
    
    if (!isPremium) {
      throw new ForbiddenError('Private leagues are only available to premium users')
    }
    
    // Check if DATABASE_URL is set - if not, use in-memory storage
    const hasDatabase = !!process.env.DATABASE_URL
    
    let league: any = null
    const queryStart = Date.now()
    
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
      league = storage.leagues.get(id)
      
      if (!league) {
        return NextResponse.json(
          { error: 'League not found' },
          { status: 404 }
        )
      }
      
      const memberIds = storage.members.get(id) || new (globalThis.Set as any)()
      const members = Array.from(memberIds as Set<string>).map((memberId: string) => ({
        id: memberId,
        userId: memberId,
        joinedAt: new Date().toISOString(),
        user: { id: memberId, name: memberId, email: memberId, teamName: null }
      }))
      
      league = {
        ...league,
        members,
        stats: []
      }
    } else {
      const queryStart = Date.now()
      
      // OPTIMIZATION: Check if we need members (only if explicitly requested via query param)
      // By default, don't fetch members - use /members endpoint instead
      const { searchParams } = new URL(request.url)
      const includeMembers = searchParams.get('includeMembers') === 'true'
      const memberLimit = includeMembers 
        ? Math.min(parseInt(searchParams.get('memberLimit') || '30'), 50) 
        : 0
      
      // OPTIMIZATION: Use select instead of include, fetch only what's needed
      // Don't fetch members by default - this endpoint is for league metadata only
      const selectStructure: any = {
        id: true,
        name: true,
        description: true,
        inviteCode: true,
        createdByUserId: true,
        organisationId: true,
        maxMembers: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organisation: {
          select: {
            id: true,
            name: true,
          },
        },
        // OPTIMIZATION: Use _count for member count (always fast, uses index)
        _count: {
          select: {
            members: {
              where: {
                leftAt: null,
              },
            },
          },
        },
      }
      
      // Only fetch members if explicitly requested (reduces query time by 80-90%)
      if (includeMembers && memberLimit > 0) {
        // OPTIMIZATION: Fetch minimal member data - only name, skip email/teamName for speed
        selectStructure.members = {
          where: {
            leftAt: null,
          },
          select: {
            id: true,
            userId: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                // OPTIMIZATION: Skip email and teamName - they require extra joins and slow down query
                // These can be fetched separately via /members endpoint if needed
              },
            },
          },
          orderBy: {
            joinedAt: 'asc', // Uses idx_private_league_members_league_joined
          },
          take: memberLimit,
        }
      }
      
      const dbQueryStart = Date.now()
      league = await (prisma as any).privateLeague.findFirst({
        where: { id, deletedAt: null },
        select: selectStructure,
      })
      const dbQueryDuration = Date.now() - dbQueryStart
      console.log(`[League Details API] DB query took ${dbQueryDuration}ms (includeMembers: ${includeMembers})`)
    }
    
    const queryDuration = Date.now() - queryStart
    const totalDuration = Date.now() - apiStart
    console.log(`[League Details API] Total took ${totalDuration}ms (auth: ${authDuration}ms, query: ${queryDuration}ms)`)
    
    if (!league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      )
    }
    
    // OPTIMIZATION: Check membership efficiently
    // First check if user is in the fetched members (first 30)
    // If not found, do a quick separate check (user might be member #31+)
    let isMember = false
    if (league.members && league.members.length > 0) {
      isMember = league.members.some((m: any) => m.userId === user.id)
    }
    
    // If not found in first 30, check separately (user might be later in list)
    if (!isMember) {
      const membership = await (prisma as any).privateLeagueMember.findFirst({
        where: {
          leagueId: id,
          userId: user.id,
          leftAt: null,
        },
        select: {
          id: true,
        },
      })
      isMember = !!membership
    }
    
    if (!isMember && league.createdByUserId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // OPTIMIZATION: Transform response - ensure members array exists even if not fetched
    if (!league.members) {
      league.members = []
    }
    
    return NextResponse.json({ league })
  } catch (error: any) {
    console.error('Error fetching league:', error)
    return NextResponse.json(
      { error: 'Failed to fetch league', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/private-leagues/[id]
 * Delete (soft delete) a league (only creator)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiAuth()
    const { id } = await params
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if user is premium (private leagues are premium-only)
    if (user.tier !== 'premium') {
      return NextResponse.json(
        { error: 'Private leagues are only available to premium users' },
        { status: 403 }
      )
    }
    
    // Find league (including soft-deleted ones for delete operation)
    const league = await (prisma as any).privateLeague.findFirst({
      where: { id },
    })
    
    if (!league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      )
    }
    
    // Check if already deleted
    if (league.deletedAt) {
      return NextResponse.json(
        { error: 'League is already deleted' },
        { status: 400 }
      )
    }
    
    if (league.createdByUserId !== user.id) {
      return NextResponse.json(
        { error: 'Only the creator can delete the league' },
        { status: 403 }
      )
    }
    
    await (prisma as any).privateLeague.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting league:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    })
    
    // Check for specific database errors
    const errorMsg = error.message || String(error)
    if (errorMsg.includes('does not exist') || 
        errorMsg.includes('Unknown model') ||
        errorMsg.includes('P2022') ||
        errorMsg.includes('column')) {
      return NextResponse.json(
        { 
          error: 'Database schema error. Please ensure migrations are up to date.',
          details: errorMsg,
          code: error.code 
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete league', details: error.message || String(error) },
      { status: 500 }
    )
  }
}

