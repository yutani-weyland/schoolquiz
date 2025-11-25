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
    const user = await requireApiAuth()
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
      league = await (prisma as any).privateLeague.findFirst({
      where: { id, deletedAt: null },
      include: {
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
        stats: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                teamName: true,
              },
            },
          },
        },
      },
    })
    }
    
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
    const user = await getUserFromToken(request)
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

