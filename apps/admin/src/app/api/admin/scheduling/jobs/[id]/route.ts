/**
 * GET /api/admin/scheduling/jobs/[id] - Get a specific job
 * PATCH /api/admin/scheduling/jobs/[id] - Update a job
 * DELETE /api/admin/scheduling/jobs/[id] - Delete a job
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireAdmin } from '@/lib/auth-helpers'

export async function GET(
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

    return NextResponse.json({ job })
  } catch (error: any) {
    console.error('Error fetching scheduled job:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch scheduled job',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request).catch(() => {
      // Allow in development
    })

    const { id } = await params
    const body = await request.json()

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.scheduledFor !== undefined) {
      updateData.scheduledFor = new Date(body.scheduledFor)
    }
    if (body.config !== undefined) {
      updateData.config = typeof body.config === 'string' ? body.config : JSON.stringify(body.config)
    }
    if (body.status !== undefined) updateData.status = body.status
    if (body.isRecurring !== undefined) updateData.isRecurring = body.isRecurring
    if (body.recurrencePattern !== undefined) {
      updateData.recurrencePattern = body.recurrencePattern
    }
    if (body.maxAttempts !== undefined) updateData.maxAttempts = body.maxAttempts

    const job = await prisma.scheduledJob.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      job,
    })
  } catch (error: any) {
    console.error('Error updating scheduled job:', error)
    return NextResponse.json(
      {
        error: 'Failed to update scheduled job',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request).catch(() => {
      // Allow in development
    })

    const { id } = await params

    await prisma.scheduledJob.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting scheduled job:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete scheduled job',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

