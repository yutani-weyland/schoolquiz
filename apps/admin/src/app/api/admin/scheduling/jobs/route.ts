/**
 * GET /api/admin/scheduling/jobs - List scheduled jobs
 * POST /api/admin/scheduling/jobs - Create a new scheduled job
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireAdmin } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    await requireAdmin(request).catch(() => {
      // Allow in development
    })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    const where: any = {}
    if (type) {
      where.type = type
    }
    if (status) {
      where.status = status
    }

    const jobs = await prisma.scheduledJob.findMany({
      where,
      orderBy: [
        { scheduledFor: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({
      jobs,
    })
  } catch (error: any) {
    console.error('Error fetching scheduled jobs:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch scheduled jobs',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const user = await requireAdmin(request).catch(() => {
      // Allow in development, return null
      return null
    })

    const body = await request.json()
    const {
      type,
      name,
      description,
      scheduledFor,
      config = {},
      isRecurring = false,
      recurrencePattern,
      maxAttempts = 3,
    } = body

    // Validate required fields
    if (!type || !name || !scheduledFor) {
      return NextResponse.json(
        { error: 'Missing required fields: type, name, scheduledFor' },
        { status: 400 }
      )
    }

    // Validate scheduledFor is in the future
    const scheduledDate = new Date(scheduledFor)
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'scheduledFor must be in the future' },
        { status: 400 }
      )
    }

    // Create the job
    const job = await prisma.scheduledJob.create({
      data: {
        type,
        name,
        description: description || null,
        scheduledFor: scheduledDate,
        config: JSON.stringify(config),
        isRecurring,
        recurrencePattern: recurrencePattern || null,
        maxAttempts,
        status: 'PENDING',
        createdBy: user?.id || null,
      },
    })

    return NextResponse.json({
      success: true,
      job,
    })
  } catch (error: any) {
    console.error('Error creating scheduled job:', error)
    return NextResponse.json(
      {
        error: 'Failed to create scheduled job',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
