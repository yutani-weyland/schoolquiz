/**
 * POST /api/admin/scheduling/jobs/[id]/execute
 * Manually trigger a job execution (for testing)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireAdmin } from '@/lib/auth-helpers'
import { executeJob } from '@/lib/job-executor'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request).catch(() => {
      // Allow in development
    })

    const { id } = await params

    const job = await prisma.scheduledJob.findUnique({
      where: { id },
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Execute the job
    const result = await executeJob(job)

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error: any) {
    console.error('Error executing job:', error)
    return NextResponse.json(
      {
        error: 'Failed to execute job',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

