import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'

// In-memory storage for development/testing (when DATABASE_URL is not set)
function getDevStorage(): { leagues: Map<string, any>; members: Map<string, Set<string>> } {
  if (typeof (global as any).devLeaguesStorage === 'undefined') {
    const MapConstructor = globalThis.Map as any;
    const SetConstructor = globalThis.Set as any;
    (global as any).devLeaguesStorage = new MapConstructor()
    ;(global as any).devMembersStorage = new MapConstructor()
  }
  return {
    leagues: (global as any).devLeaguesStorage,
    members: (global as any).devMembersStorage
  }
}

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
 * POST /api/private-leagues/[id]/invite
 * Invite a premium user to join the league by email
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request)
    const { id } = await params
    const body = await request.json()
    const { email } = body
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    
    // Check if DATABASE_URL is set - if not, use in-memory storage
    const hasDatabase = !!process.env.DATABASE_URL
    
    if (!hasDatabase) {
      // Development mode: find league in memory
      const storage = getDevStorage()
      const league = storage.leagues.get(id)
      
      if (!league) {
        return NextResponse.json(
          { error: 'League not found' },
          { status: 404 }
        )
      }
      
      // Check if user is creator or member
      const memberIds = storage.members.get(id) || new (globalThis.Set as any)()
      const isCreator = league.createdByUserId === user.id
      const isMember = memberIds.has(user.id)
      
      if (!isCreator && !isMember) {
        return NextResponse.json(
          { error: 'Only league members can invite others' },
          { status: 403 }
        )
      }
      
      // Find user by email (in dev mode, still query database for user lookup)
      const invitee = await (prisma as any).user.findUnique({
        where: { email: email.trim().toLowerCase() },
      })
      
      if (!invitee) {
        return NextResponse.json(
          { error: 'User not found. They must have an account to join.' },
          { status: 404 }
        )
      }
      
      if (invitee.tier !== 'premium') {
        return NextResponse.json(
          { error: 'Only premium users can be invited to private leagues' },
          { status: 403 }
        )
      }
      
      if (memberIds.has(invitee.id)) {
        return NextResponse.json(
          { error: 'User is already a member of this league' },
          { status: 400 }
        )
      }
      
      if (memberIds.size >= league.maxMembers) {
        return NextResponse.json(
          { error: 'League is full' },
          { status: 400 }
        )
      }
      
      memberIds.add(invitee.id)
      storage.members.set(id, memberIds)
      
      return NextResponse.json({
        success: true,
        message: `Successfully invited ${invitee.name || invitee.email}`,
      })
    }
    
    const league = await (prisma as any).privateLeague.findFirst({
      where: { id, deletedAt: null },
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
    
    // Check if user is creator or member
    const isCreator = league.createdByUserId === user.id
    const isMember = league.members.some((m: any) => m.userId === user.id)
    
    if (!isCreator && !isMember) {
      return NextResponse.json(
        { error: 'Only league members can invite others' },
        { status: 403 }
      )
    }
    
    // Find user by email
    const invitee = await (prisma as any).user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })
    
    if (!invitee) {
      return NextResponse.json(
        { error: 'User not found. They must have an account to join.' },
        { status: 404 }
      )
    }
    
    // Check if invitee is premium
    if (invitee.tier !== 'premium') {
      return NextResponse.json(
        { error: 'Only premium users can be invited to private leagues' },
        { status: 403 }
      )
    }
    
    // Check if user is already a member
    const existingMember = league.members.find((m: any) => m.userId === invitee.id)
    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this league' },
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
        userId: invitee.id,
        invitedByUserId: user.id,
      },
    })
    
    // Initialize stats for this user in this league
    await (prisma as any).privateLeagueStats.upsert({
      where: {
        leagueId_userId_quizSlug: {
          leagueId: league.id,
          userId: invitee.id,
          quizSlug: null,
        },
      },
      create: {
        leagueId: league.id,
        userId: invitee.id,
        quizSlug: null,
      },
      update: {},
    })
    
    return NextResponse.json({
      success: true,
      message: `Successfully invited ${invitee.name || invitee.email}`,
    })
  } catch (error: any) {
    console.error('Error inviting user:', error)
    return NextResponse.json(
      { error: 'Failed to invite user', details: error.message },
      { status: 500 }
    )
  }
}

