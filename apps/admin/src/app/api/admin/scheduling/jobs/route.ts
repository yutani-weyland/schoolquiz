import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'
import { dummyScheduledJobs } from '@/lib/dummy-quiz-data'

/**
 * GET /api/admin/scheduling/jobs
 * List all scheduled jobs (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production
    // const user = await getCurrentUser()
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // TODO: Add proper admin role check

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''

    // For testing: Always use dummy data
    // TODO: Switch to database when ready
    console.log('Using dummy data for scheduled jobs')
    let filtered = [...dummyScheduledJobs]
    
    if (type) {
      filtered = filtered.filter(job => job.type === type)
    }
    
    if (status) {
      filtered = filtered.filter(job => job.status === status)
    }

    return NextResponse.json({ jobs: filtered })
  } catch (error: any) {
    console.error('Error fetching scheduled jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled jobs', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/scheduling/jobs
 * Create a new scheduled job (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production
    // const user = await getCurrentUser()
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // TODO: Add proper admin role check

    const body = await request.json()
    
    // For testing: Just return success
    // TODO: Create job in database when ready
    console.log('Creating scheduled job:', body)

    return NextResponse.json({
      job: {
        id: `job-${Date.now()}`,
        ...body,
        status: 'SCHEDULED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Error creating scheduled job:', error)
    return NextResponse.json(
      { error: 'Failed to create scheduled job', details: error.message },
      { status: 500 }
    )
  }
}

