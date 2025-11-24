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
 * POST /api/private-leagues/join-by-code
 * Join a league using an invite code
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    const body = await request.json()
    const { inviteCode } = body
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    if (!inviteCode || !inviteCode.trim()) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      )
    }
    
    // Check if user is premium
    if (user.tier !== 'premium') {
      return NextResponse.json(
        { error: 'Private leagues are only available to premium users' },
        { status: 403 }
      )
    }
    
    // Find league by invite code
    const league = await (prisma as any).privateLeague.findFirst({
      where: {
        deletedAt: null,
        inviteCode: inviteCode.trim().toUpperCase(),
      },
      include: {
        members: {
          where: {
            leftAt: null,
          },
        },
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
        _count: {
          select: {
            members: {
              where: {
                leftAt: null,
              },
            },
          },
        },
      },
    })
    
    if (!league) {
      return NextResponse.json(
        { error: 'Invalid invite code. Please check and try again.' },
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
    if (league.maxMembers && league.members.length >= league.maxMembers) {
      return NextResponse.json(
        { error: 'This league is full' },
        { status: 400 }
      )
    }
    
    // Add user as member
    await (prisma as any).privateLeagueMember.create({
      data: {
        leagueId: league.id,
        userId: user.id,
        joinedAt: new Date(),
      },
    })
    
    // Initialize stats for this user in this league
    try {
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
    } catch (statsError: any) {
      // Stats might not exist yet, that's okay
      console.warn('Could not create league stats:', statsError.message)
    }
    
    // Return the league details with color (default to blue if not set)
    // Note: Color is currently client-side only, but we'll include a default
    const defaultColors = [
      '#3B82F6', // Blue
      '#8B5CF6', // Purple
      '#10B981', // Emerald
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#EC4899', // Pink
      '#06B6D4', // Cyan
      '#84CC16', // Lime
    ]
    // Assign color based on league ID hash for consistency
    const colorIndex = parseInt(league.id.slice(-2), 16) % defaultColors.length
    const leagueColor = (league as any).color || defaultColors[colorIndex]
    
    return NextResponse.json({ 
      success: true,
      league: {
        id: league.id,
        name: league.name,
        description: league.description,
        inviteCode: league.inviteCode,
        createdByUserId: league.createdByUserId,
        color: leagueColor,
        creator: league.creator,
        organisation: league.organisation,
        _count: league._count,
        members: league.members || [],
      },
    })
  } catch (error: any) {
    console.error('Error joining league by code:', error)
    return NextResponse.json(
      { error: 'Failed to join league', details: error.message },
      { status: 500 }
    )
  }
}

