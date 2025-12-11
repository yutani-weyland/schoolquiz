import { NextRequest, NextResponse } from 'next/server'
import { getStatsSummary } from '@/app/stats/stats-summary-server'
import { requireApiUserId } from '@/lib/api-auth'

/**
 * GET /api/stats
 * Get comprehensive stats for the current user (optimized with summary queries)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('[Stats API] Starting optimized stats fetch...')
    
    // Get user ID from NextAuth session
    const userId = await requireApiUserId()
    
    // Get optional teamId from query params
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId') || undefined
    
    // Use optimized summary queries with parallel execution
    const stats = await getStatsSummary(userId, teamId)
    
    const totalTime = Date.now() - startTime
    console.log(`[Stats API] Stats fetched successfully in ${totalTime}ms`)
    
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error: any) {
    console.error('[Stats API] Error fetching stats:', error)
    console.error('[Stats API] Error stack:', error.stack)
    console.error('[Stats API] Error name:', error.name)
    console.error('[Stats API] Error code:', error.code)
    console.error('[Stats API] Error meta:', error.meta)
    
    // Check if it's a Prisma error
    if (error.code === 'P2002' || error.code === 'P2025') {
      // Prisma unique constraint or record not found
      return NextResponse.json(
        { 
          error: 'Database error', 
          details: error.message,
        },
        { status: 500 }
      )
    }
    
    // Check if it's a connection error
    if (error.message?.includes('connect') || error.code === 'P1001') {
      return NextResponse.json(
        { 
          error: 'Database connection error', 
          details: 'Unable to connect to database. Please check your database connection.',
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch stats', 
        details: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        code: error.code,
      },
      { status: 500 }
    )
  }
}

