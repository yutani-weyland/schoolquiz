import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireApiAuth } from '@/lib/api-auth'
import { ForbiddenError, handleApiError, ApiError } from '@/lib/api-error'

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
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })
    return user
  } catch (error: any) {
    // Handle schema mismatch errors (e.g., missing columns)
    const errorMsg = error.message || String(error)
    if (errorMsg.includes('does not exist') || 
        errorMsg.includes('referralCount') ||
        errorMsg.includes('P2022') || // Column doesn't exist
        errorMsg.includes('column')) {
      console.warn('Database schema mismatch in getUserFromToken:', errorMsg)
      // Try to fetch with minimal fields
      try {
        const user = await (prisma as any).user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            tier: true,
            teamName: true,
          },
        })
        return user
      } catch (fallbackError: any) {
        console.error('Fallback query also failed:', fallbackError)
        return null
      }
    }
    throw error
  }
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

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiAuth()
    
    // Check if user is premium
    const isPremium = user.tier === 'premium' || 
      user.subscriptionStatus === 'ACTIVE' ||
      user.subscriptionStatus === 'TRIALING' ||
      (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())
    
    if (!isPremium) {
      throw new ForbiddenError('Private leagues are only available to premium users')
    }
    
    // Check if DATABASE_URL is set - if not, use in-memory storage for development
    const hasDatabase = !!process.env.DATABASE_URL
    
    if (!hasDatabase) {
      // Development mode: return in-memory leagues
      const storage = getDevStorage()
      const userLeagues: any[] = []
      for (const [leagueId, league] of storage.leagues.entries()) {
        const memberIds = storage.members.get(leagueId) || new (globalThis.Set as any)()
        if (league.createdByUserId === user.id || memberIds.has(user.id)) {
          userLeagues.push({
            ...league,
            members: Array.from(memberIds as Set<string>).map((memberId: string) => ({
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
    // OPTIMIZED: Split OR condition into two separate queries for better performance
    // This avoids expensive nested relation queries in OR conditions
    let leagues: any[] = []
    try {
      const startTime = Date.now()
      
      // Check if we should include members (only if explicitly requested)
      const { searchParams } = new URL(request.url)
      const includeMembers = searchParams.get('includeMembers') === 'true'
      
      // Define the common include structure - OPTIMIZED: minimal data for list view
      const includeStructure: any = {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            // Skip profile for list view - can be loaded separately if needed
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
      }
      
      // Only include members if explicitly requested (reduces payload by 80-90%)
      if (includeMembers) {
        includeStructure.members = {
          where: {
            leftAt: null,
          },
          take: 50, // Limit members to prevent huge payloads
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                teamName: true,
                // Skip profile for performance - can be loaded separately if needed
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        }
      }
      
      // Query 1: Leagues where user is creator (uses index on createdByUserId)
      const [createdLeagues, memberLeagues] = await Promise.all([
        (prisma as any).privateLeague.findMany({
          where: {
            deletedAt: null,
            createdByUserId: user.id,
          },
          include: includeStructure,
          orderBy: {
            createdAt: 'desc',
          },
          take: 100,
        }) as Promise<any[]>,
        
        // Query 2: Leagues where user is an active member (uses index on userId, leftAt)
        // First get the league IDs where user is a member
        (async () => {
          const memberRecords = await (prisma as any).privateLeagueMember.findMany({
            where: {
              userId: user.id,
              leftAt: null,
            },
            select: {
              leagueId: true,
            },
            take: 100, // Limit to prevent huge queries
          }) as Array<{ leagueId: string }>
          
          if (memberRecords.length === 0) {
            return []
          }
          
          const leagueIds = memberRecords.map(m => m.leagueId)
          
          // Then fetch the leagues (excluding ones user created, to avoid duplicates)
          return (prisma as any).privateLeague.findMany({
            where: {
              deletedAt: null,
              id: { in: leagueIds },
              createdByUserId: { not: user.id }, // Exclude leagues user created (already in first query)
            },
            include: includeStructure,
            orderBy: {
              createdAt: 'desc',
            },
            take: 100,
          }) as Promise<any[]>
        })(),
      ])
      
      // Combine and deduplicate by ID (in case of any overlap)
      const leagueMap = new Map<string, any>()
      for (const league of createdLeagues) {
        leagueMap.set(league.id, league)
      }
      for (const league of memberLeagues) {
        leagueMap.set(league.id, league)
      }
      
      // Sort by createdAt descending
      leagues = Array.from(leagueMap.values()).sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }).slice(0, 100) // Final limit
      
      const duration = Date.now() - startTime
      console.log(`[API] Fetched ${leagues.length} leagues in ${duration}ms (created: ${createdLeagues.length}, member: ${memberLeagues.length})`)
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
    
    // Assign colors to leagues based on ID for consistency
    // This ensures the same league always gets the same color
    const defaultColors = [
      '#3B82F6', // Blue
      '#8B5CF6', // Purple
      '#10B981', // Emerald
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#EC4899', // Pink
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#6366F1', // Indigo
      '#F97316', // Orange
      '#14B8A6', // Teal
      '#A855F7', // Violet
      '#22C55E', // Green
      '#EAB308', // Yellow
      '#F43F5E', // Rose
      '#0EA5E9', // Sky
    ]
    
    const leaguesWithColors = leagues.map((league: any) => {
      // If league already has a color, use it; otherwise assign based on ID
      if (league.color) {
        return league
      }
      const colorIndex = parseInt(league.id.slice(-2), 16) % defaultColors.length
      return {
        ...league,
        color: defaultColors[colorIndex],
      }
    })
    
    return NextResponse.json({ leagues: leaguesWithColors })
  } catch (error: any) {
    // Handle ApiError instances (UnauthorizedError, ForbiddenError, etc.)
    if (error instanceof ApiError) {
      return handleApiError(error)
    }
    
    console.error('Error fetching private leagues:', error)
    const errorMessage = error?.message || String(error)
    
    // Check for authentication/authorization errors first
    if (errorMessage.includes('Unauthorized') || errorMessage === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }
    
    if (errorMessage.includes('Forbidden') || errorMessage.includes('Private leagues are only available')) {
      return NextResponse.json(
        { error: errorMessage || 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }
    
    // Check for database connection issues
    if (errorMessage.includes('DATABASE_URL') || errorMessage.includes('Environment variable not found')) {
      return NextResponse.json(
        { error: 'Database configuration required. Please set DATABASE_URL environment variable.' },
        { status: 503 }
      )
    }
    
    // Check for migration issues - return empty array instead of error for better UX
    if (errorMessage.includes('does not exist') || 
        errorMessage.includes('Unknown model') ||
        errorMessage.includes('private_league') ||
        errorMessage.includes('relation') ||
        errorMessage.includes('table')) {
      console.warn('Private leagues tables not found - migrations may need to be run. Returning empty array.')
      return NextResponse.json({ leagues: [] })
    }
    
    // Use handleApiError for any other errors
    return handleApiError(error)
  }
}

/**
 * POST /api/private-leagues
 * Create a new private league
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireApiAuth()
    
    // Check if user is premium
    const isPremium = user.tier === 'premium' || 
      user.subscriptionStatus === 'ACTIVE' ||
      user.subscriptionStatus === 'TRIALING' ||
      (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())
    
    if (!isPremium) {
      throw new ForbiddenError('Private leagues are only available to premium users')
    }
    
    let body: any
    try {
      body = await request.json()
    } catch (parseError: any) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid request body', details: parseError.message },
        { status: 400 }
      )
    }
    
    const { name, description, color, organisationId } = body
    
    // Get user's organization if organisationId not provided but user is in an org
    let finalOrganisationId = organisationId
    if (!finalOrganisationId) {
      try {
        const userWithOrg = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            organisationMembers: {
              where: { status: 'ACTIVE' },
              take: 1,
            },
          },
        })
        if (userWithOrg?.organisationMembers?.[0]) {
          finalOrganisationId = userWithOrg.organisationMembers[0].organisationId
        }
      } catch (orgError: any) {
        // If there's a schema error, just continue without org
        const errorMsg = orgError.message || String(orgError)
        if (errorMsg.includes('does not exist') || 
            errorMsg.includes('referralCount') ||
            errorMsg.includes('P2022') ||
            errorMsg.includes('column')) {
          console.warn('Schema error fetching user org, continuing without org:', errorMsg)
        } else {
          throw orgError
        }
      }
    }
    
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
      const members = new (globalThis.Set as any)([user.id])
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
      const errorMsg = dbError.message || String(dbError)
      if (errorMsg.includes('does not exist') || 
          errorMsg.includes('Unknown model') ||
          errorMsg.includes('private_league') ||
          errorMsg.includes('table') ||
          errorMsg.includes('relation')) {
        console.warn('Private leagues table not found:', errorMsg)
        return NextResponse.json(
          { error: 'Database migration required. Please run migration 005 in Supabase Dashboard.' },
          { status: 503 }
        )
      }
      throw dbError
    }
    
    // Create league
    let league: any
    try {
      // Build the include object conditionally
      const includeObj: any = {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                displayName: true,
              },
            },
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
                profile: {
                  select: {
                    displayName: true,
                  },
                },
              },
            },
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
      }
      
      // Only include organisation if organisationId is set
      if (finalOrganisationId) {
        includeObj.organisation = {
          select: {
            id: true,
            name: true,
          },
        }
      }
      
      // Build data object without color (field doesn't exist in schema)
      const leagueData: any = {
        name: name.trim(),
        description: description?.trim() || null,
        createdByUserId: user.id,
        inviteCode,
        organisationId: finalOrganisationId || null,
        members: {
          create: {
            userId: user.id,
            joinedAt: new Date(),
          },
        },
      }
      
      league = await (prisma as any).privateLeague.create({
        data: leagueData,
        include: includeObj,
      }) as any
    } catch (dbError: any) {
      // Only check for specific migration-related errors
      const errorMsg = dbError.message || String(dbError)
      console.error('Database error creating league:', {
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta,
        stack: dbError.stack,
      })
      
      // Check for schema mismatch errors (missing columns)
      if (errorMsg.includes('referralCount') ||
          errorMsg.includes('does not exist') ||
          errorMsg.includes('P2022') || // Column doesn't exist
          errorMsg.includes('column')) {
        return NextResponse.json(
          { 
            error: 'Database schema mismatch. Please run migrations 006 and 007 in Supabase Dashboard to update the referral system schema.',
            details: errorMsg,
            code: dbError.code 
          },
          { status: 503 }
        )
      }
      
      if (errorMsg.includes('Unknown model') ||
          errorMsg.includes('private_league_requests') ||
          errorMsg.includes('private_league') ||
          (errorMsg.includes('organisationId') && errorMsg.includes('does not exist'))) {
        return NextResponse.json(
          { error: 'Database migration required. Please run migration 005 in Supabase Dashboard.' },
          { status: 503 }
        )
      }
      
      // Return more detailed error for debugging
      const errorDetails = {
        error: 'Failed to create league',
        details: dbError.message || String(dbError),
        code: dbError.code,
        meta: dbError.meta,
      }
      console.error('Returning error response:', errorDetails)
      return NextResponse.json(errorDetails, { status: 500 })
    }
    
    return NextResponse.json({ league }, { status: 201 })
  } catch (error: any) {
    // Handle ApiError instances (UnauthorizedError, ForbiddenError, etc.)
    if (error instanceof ApiError) {
      return handleApiError(error)
    }
    
    console.error('Error creating private league:', {
      message: error?.message,
      stack: error?.stack,
      response: error?.response,
    })
    const errorMessage = error?.message || String(error)
    
    // Check for authentication/authorization errors first
    if (errorMessage.includes('Unauthorized') || errorMessage === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }
    
    if (errorMessage.includes('Forbidden') || errorMessage.includes('Private leagues are only available')) {
      return NextResponse.json(
        { error: errorMessage || 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }
    
    // Check for database connection issues
    if (errorMessage.includes('DATABASE_URL') || errorMessage.includes('Environment variable not found')) {
      return NextResponse.json(
        { error: 'Database configuration required. Please set DATABASE_URL environment variable.' },
        { status: 503 }
      )
    }
    
    // Check for migration issues (only specific ones)
    if (errorMessage.includes('Unknown model') ||
        errorMessage.includes('private_league_requests') ||
        (errorMessage.includes('organisationId') && errorMessage.includes('does not exist'))) {
      return NextResponse.json(
        { error: 'Database migration required. Please run: npx prisma migrate dev' },
        { status: 503 }
      )
    }
    
    // Use handleApiError for any other errors
    return handleApiError(error)
  }
}

