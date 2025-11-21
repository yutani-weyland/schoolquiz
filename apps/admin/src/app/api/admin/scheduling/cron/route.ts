/**
 * POST /api/admin/scheduling/cron
 * 
 * Cron endpoint to process due jobs
 * This should be called by a cron service (e.g., Vercel Cron, GitHub Actions, etc.)
 * 
 * To use with Vercel Cron, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/admin/scheduling/cron",
 *     "schedule": "*\/5 * * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { processDueJobs } from '@/lib/job-executor'

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization
    // For Vercel Cron, you can check for a secret header
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await processDueJobs()

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error processing due jobs:', error)
    return NextResponse.json(
      {
        error: 'Failed to process due jobs',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// Also support GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request)
}

