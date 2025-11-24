import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'

async function getUserFromToken(request: NextRequest): Promise<{ user: any; isDbError: boolean } | null> {
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

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organisationMembers: {
          where: { status: 'ACTIVE' },
          include: { organisation: true },
          take: 1,
        },
      },
    })

    return user ? { user, isDbError: false } : null
  } catch (error: any) {
    // If there's a database error, return it as a special case
    const errorMsg = error.message || String(error)
    if (errorMsg.includes('does not exist') || 
        errorMsg.includes('Unknown model') ||
        errorMsg.includes('P1001') || // Prisma connection error
        errorMsg.includes('connect') ||
        errorMsg.includes('P2002') || // Unique constraint (might be table issue)
        errorMsg.includes('relation') ||
        errorMsg.includes('table')) {
      console.warn('Database error fetching user for organisation:', errorMsg)
      return { user: null, isDbError: true }
    }
    // For other errors, return null (auth failure)
    console.warn('Error fetching user for organisation:', errorMsg)
    return null
  }
}

/**
 * GET /api/user/organisation
 * Get user's active organization
 */
export async function GET(request: NextRequest) {
  try {
    const result = await getUserFromToken(request)
    
    // If no result, it's an auth failure
    if (!result) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // If database error, return null organisation (graceful degradation)
    if (result.isDbError) {
      console.warn('Database error in organisation route, returning null organisation')
      return NextResponse.json({ organisation: null })
    }

    const user = result.user
    const orgMember = user.organisationMembers?.[0]
    
    if (!orgMember) {
      return NextResponse.json({ organisation: null })
    }

    return NextResponse.json({
      organisation: {
        id: orgMember.organisation.id,
        name: orgMember.organisation.name,
      },
    })
  } catch (error: any) {
    console.error('Error fetching user organisation:', error)
    
    // Check if it's a database/table error
    const errorMsg = error.message || String(error)
    if (errorMsg.includes('does not exist') || 
        errorMsg.includes('Unknown model') ||
        errorMsg.includes('P1001') || // Prisma connection error
        errorMsg.includes('connect') ||
        errorMsg.includes('relation') ||
        errorMsg.includes('table')) {
      console.warn('Database error in organisation route:', errorMsg)
      // Return null organisation instead of error
      return NextResponse.json({ organisation: null })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch organisation', details: error.message },
      { status: 500 }
    )
  }
}

