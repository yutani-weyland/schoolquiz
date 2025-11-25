import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireApiAuth } from '@/lib/api-auth'
import { ForbiddenError } from '@/lib/api-error'

/**
 * POST /api/private-leagues/[id]/join
 * Join a league by invite code or league ID
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiAuth()
    const { id } = await params
    const body = await request.json()
    const { inviteCode } = body
    
    const isPremium = user.tier === 'premium' || 
      user.subscriptionStatus === 'ACTIVE' ||
      user.subscriptionStatus === 'TRIALING' ||
      (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())
    
    if (!isPremium) {
      throw new ForbiddenError('Private leagues are only available to premium users')
    }
    
    // Check if DATABASE_URL is set - if not, use in-memory storage
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
      let league: any = null
      for (const [leagueId, storedLeague] of storage.leagues.entries()) {
        if (storedLeague.id === id || storedLeague.inviteCode === inviteCode?.toUpperCase()) {
          league = storedLeague
          break
        }
      }
      
      if (!league) {
        return NextResponse.json(
          { error: 'League not found' },
          { status: 404 }
        )
      }
      
      const members = storage.members.get(league.id) || new (globalThis.Set as any)()
      if (members.has(user.id)) {
        return NextResponse.json(
          { error: 'You are already a member of this league' },
          { status: 400 }
        )
      }
      
      members.add(user.id)
      storage.members.set(league.id, members)
      
      return NextResponse.json({ success: true })
    }
    
    // Find league by ID or invite code
    const league = await (prisma as any).privateLeague.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { id },
          inviteCode ? { inviteCode: inviteCode.toUpperCase() } : {},
        ].filter(Boolean),
      },
      include: {
        members: {
          where: {
            leftAt: null,
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
    
    // Check if user is already a member
    const existingMember = league.members.find((m: any) => m.userId === user.id)
    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this league' },
        { status: 400 }
      )
    }
    
    // Check if league is full
    if (league.members.length >= league.maxMembers) {
      return NextResponse.json(
        { error: 'League is full' },
        { status: 400 }
      )
    }
    
    // Add user as member
    await (prisma as any).privateLeagueMember.create({
      data: {
        leagueId: league.id,
        userId: user.id,
      },
    })
    
    // Initialize stats for this user in this league
    await (prisma as any).privateLeagueStats.upsert({
      where: {
        leagueId_userId_quizSlug: {
          leagueId: league.id,
          userId: user.id,
          quizSlug: null, // Overall stats
        },
      },
      create: {
        leagueId: league.id,
        userId: user.id,
        quizSlug: null,
      },
      update: {},
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error joining league:', error)
    return NextResponse.json(
      { error: 'Failed to join league', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/private-leagues/[id]/leave
 * Leave a league
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiAuth()
    const { id } = await params
    
    const league = await prisma.privateLeague.findUnique({
      where: { id },
    })
    
    if (!league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      )
    }
    
    // Don't allow creator to leave (they must delete the league instead)
    if (league.createdByUserId === user.id) {
      return NextResponse.json(
        { error: 'League creator cannot leave. Delete the league instead.' },
        { status: 400 }
      )
    }
    
    await prisma.privateLeagueMember.updateMany({
      where: {
        leagueId: id,
        userId: user.id,
        leftAt: null,
      },
      data: {
        leftAt: new Date(),
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error leaving league:', error)
    return NextResponse.json(
      { error: 'Failed to leave league', details: error.message },
      { status: 500 }
    )
  }
}

