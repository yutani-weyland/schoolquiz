import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  
  // Try to get userId from custom header (sent by client)
  let userId: string | null = request.headers.get('X-User-Id')
  
  // If not in header, try to extract from mock token format: "mock-token-{userId}-{timestamp}"
  if (!userId && token.startsWith('mock-token-')) {
    const parts = token.split('-')
    if (parts.length >= 3) {
      userId = parts.slice(2, -1).join('-') // Get everything between "mock-token" and timestamp
    }
  }

  if (!userId) {
    return null
  }

  // Fetch user from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  return user
}

function generateInviteCode(): string {
  // Generate a random 8-character code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excluding I, O, 0, 1 for clarity
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * GET /api/private-leagues
 * Get all leagues the user is a member of or has created
 */
// In-memory storage for development/testing (when DATABASE_URL is not set)
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

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if user is premium
    if (user.tier !== 'premium') {
      return NextResponse.json(
        { error: 'Private leagues are only available to premium users' },
        { status: 403 }
      )
    }
    
    // Check if DATABASE_URL is set - if not, use in-memory storage for development
    const hasDatabase = !!process.env.DATABASE_URL
    
    if (!hasDatabase) {
      // Development mode: return in-memory leagues
      const storage = getDevStorage()
      const userLeagues: any[] = []
      for (const [leagueId, league] of storage.leagues.entries()) {
        const memberIds = storage.members.get(leagueId) || new Set<string>()
        if (league.createdByUserId === user.id || memberIds.has(user.id)) {
          userLeagues.push({
            ...league,
            members: Array.from(memberIds).map((memberId: string) => ({
              id: memberId,
              userId: memberId,
              joinedAt: new Date().toISOString(),
              user: { id: memberId, name: memberId, email: memberId, teamName: null }
            })),
            _count: { members: memberIds.size }
          })
        }
      }
      return NextResponse.json({ leagues: userLeagues })
    }
    
    // Get all leagues where user is a member (not left) or creator
    // Note: This will fail until Prisma client is regenerated after migration
    let leagues: any[] = []
    try {
      leagues = await (prisma as any).privateLeague.findMany({
      where: {
        deletedAt: null,
        OR: [
          { createdByUserId: user.id },
          {
            members: {
              some: {
                userId: user.id,
                leftAt: null,
              },
            },
          },
        ],
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
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
          orderBy: {
            joinedAt: 'asc',
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
      orderBy: {
        createdAt: 'desc',
      },
    }) as any[]
    } catch (dbError: any) {
      // If the table doesn't exist yet (migration not run), return empty array
      if (dbError.message?.includes('does not exist') || 
          dbError.message?.includes('Unknown model') ||
          dbError.message?.includes('Unknown arg')) {
        console.warn('Private leagues table not found - migrations may need to be run:', dbError.message)
        return NextResponse.json({ leagues: [] })
      }
      throw dbError
    }
    
    return NextResponse.json({ leagues })
  } catch (error: any) {
    console.error('Error fetching private leagues:', error)
    const errorMessage = error.message || String(error)
    
    // Check for database connection issues
    if (errorMessage.includes('DATABASE_URL') || errorMessage.includes('Environment variable not found')) {
      return NextResponse.json(
        { error: 'Database configuration required. Please set DATABASE_URL environment variable.' },
        { status: 503 }
      )
    }
    
    // Check for migration issues
    if (errorMessage.includes('does not exist') || errorMessage.includes('Unknown model')) {
      return NextResponse.json(
        { error: 'Database migration required. Please run: npx prisma migrate dev' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch leagues', details: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * POST /api/private-leagues
 * Create a new private league
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
    
    // Check if user is premium
    if (user.tier !== 'premium') {
      return NextResponse.json(
        { error: 'Private leagues are only available to premium users' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { name, description } = body
    
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'League name is required' },
        { status: 400 }
      )
    }
    
    // Check if DATABASE_URL is set - if not, use in-memory storage for development
    const hasDatabase = !!process.env.DATABASE_URL
    
    if (!hasDatabase) {
      // Development mode: create league in memory
      const leagueId = `dev-${Date.now()}-${Math.random().toString(36).substring(7)}`
      const inviteCode = generateInviteCode()
      
      const league = {
        id: leagueId,
        name: name.trim(),
        description: description?.trim() || null,
        inviteCode,
        createdByUserId: user.id,
        creator: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        maxMembers: 50,
        deletedAt: null,
      }
      
      const storage = getDevStorage()
      storage.leagues.set(leagueId, league)
      const members = new Set<string>([user.id])
      storage.members.set(leagueId, members)
      
      return NextResponse.json({
        league: {
          ...league,
          members: [{
            id: user.id,
            userId: user.id,
            joinedAt: new Date().toISOString(),
            user: { id: user.id, name: user.name, email: user.email, teamName: user.teamName || null }
          }],
          _count: { members: 1 }
        }
      }, { status: 201 })
    }
    
    // Generate unique invite code
    let inviteCode = generateInviteCode()
    let attempts = 0
    try {
      while (await (prisma as any).privateLeague.findUnique({ where: { inviteCode } })) {
        inviteCode = generateInviteCode()
        attempts++
        if (attempts > 10) {
          return NextResponse.json(
            { error: 'Failed to generate invite code' },
            { status: 500 }
          )
        }
      }
    } catch (dbError: any) {
      if (dbError.message?.includes('does not exist') || 
          dbError.message?.includes('Unknown model')) {
        return NextResponse.json(
          { error: 'Database migration required. Please run: npx prisma migrate dev' },
          { status: 503 }
        )
      }
      throw dbError
    }
    
    // Create league
    let league: any
    try {
      league = await (prisma as any).privateLeague.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        createdByUserId: user.id,
        inviteCode,
        members: {
          create: {
            userId: user.id,
            joinedAt: new Date(),
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
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
      },
    }) as any
    } catch (dbError: any) {
      if (dbError.message?.includes('does not exist') || 
          dbError.message?.includes('Unknown model') ||
          dbError.message?.includes('Unknown arg')) {
        return NextResponse.json(
          { error: 'Database migration required. Please run: npx prisma migrate dev' },
          { status: 503 }
        )
      }
      throw dbError
    }
    
    return NextResponse.json({ league }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating private league:', error)
    const errorMessage = error.message || String(error)
    
    // Check for database connection issues
    if (errorMessage.includes('DATABASE_URL') || errorMessage.includes('Environment variable not found')) {
      return NextResponse.json(
        { error: 'Database configuration required. Please set DATABASE_URL environment variable.' },
        { status: 503 }
      )
    }
    
    // Check for migration issues
    if (errorMessage.includes('does not exist') || errorMessage.includes('Unknown model')) {
      return NextResponse.json(
        { error: 'Database migration required. Please run: npx prisma migrate dev' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create league', details: errorMessage },
      { status: 500 }
    )
  }
}

