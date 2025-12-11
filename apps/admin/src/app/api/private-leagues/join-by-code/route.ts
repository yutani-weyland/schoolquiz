import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { validateRequest } from '@/lib/api-validation'
import { JoinLeagueSchema } from '@/lib/validation/schemas'

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
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Validate request body
    const body = await validateRequest(request, JoinLeagueSchema)
    const { inviteCode, teamId } = body
    
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
        teams: {
          where: {
            leftAt: null,
          },
          include: {
            team: {
              select: {
                id: true,
                name: true,
                color: true,
                userId: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
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
            teams: {
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
    
    // If teamId is provided, join with a team
    if (teamId) {
      // Verify team belongs to user
      const team = await (prisma as any).team.findFirst({
        where: {
          id: teamId,
          userId: user.id,
        },
      })
      
      if (!team) {
        return NextResponse.json(
          { error: 'Team not found or does not belong to you' },
          { status: 404 }
        )
      }
      
      // Check if team is already in league
      const existingTeam = await (prisma as any).privateLeagueTeam.findFirst({
        where: {
          leagueId: league.id,
          teamId: teamId,
          leftAt: null,
        },
      })
      
      if (existingTeam) {
        return NextResponse.json(
          { error: 'This team is already in this league' },
          { status: 400 }
        )
      }
      
      // Check if league is full (count both members and teams)
      const [memberCount, teamCount] = await Promise.all([
        (prisma as any).privateLeagueMember.count({
          where: {
            leagueId: league.id,
            leftAt: null,
          },
        }),
        (prisma as any).privateLeagueTeam.count({
          where: {
            leagueId: league.id,
            leftAt: null,
          },
        }),
      ])
      
      if (league.maxMembers && (memberCount + teamCount) >= league.maxMembers) {
        return NextResponse.json(
          { error: 'This league is full' },
          { status: 400 }
        )
      }
      
      // Add team to league
      await (prisma as any).privateLeagueTeam.create({
        data: {
          leagueId: league.id,
          teamId: teamId,
          addedByUserId: user.id,
          joinedAt: new Date(),
        },
      })
      
      // Also add user as member if not already (for access control)
      const existingMember = league.members.find((m: any) => m.userId === user.id)
      if (!existingMember) {
        await (prisma as any).privateLeagueMember.create({
          data: {
            leagueId: league.id,
            userId: user.id,
            joinedAt: new Date(),
          },
        })
      }
    } else {
      // Join as user (legacy behavior)
      // Check if user is already a member
      const existingMember = league.members.find((m: any) => m.userId === user.id)
      if (existingMember) {
        return NextResponse.json(
          { error: 'You are already a member of this league' },
          { status: 400 }
        )
      }
      
      // Check if league is full
      const memberCount = await (prisma as any).privateLeagueMember.count({
        where: {
          leagueId: league.id,
          leftAt: null,
        },
      })
      
      if (league.maxMembers && memberCount >= league.maxMembers) {
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
            private_league_stats_leagueId_userId_quizSlug_key: {
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
        teams: league.teams || [],
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

