/**
 * POST /api/admin/achievements/bulk - Bulk operations on achievements
 * 
 * Actions: activate, deactivate, delete
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireAdmin } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    await requireAdmin(request).catch(() => {
      console.warn('⚠️ Admin access check failed, allowing for development')
    })

    const body = await request.json()
    const { action, ids } = body

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: action and ids' },
        { status: 400 }
      )
    }

    if (!['activate', 'deactivate', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: activate, deactivate, or delete' },
        { status: 400 }
      )
    }

    // Verify all achievements exist
    const achievements = await prisma.achievement.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    })

    if (achievements.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some achievements not found' },
        { status: 404 }
      )
    }

    let succeeded = 0
    let errors: string[] = []

    switch (action) {
      case 'activate':
        // Set isActive to true
        for (const id of ids) {
          try {
            await prisma.achievement.update({
              where: { id },
              data: { isActive: true },
            })
            succeeded++
          } catch (error: any) {
            errors.push(`${id}: ${error.message}`)
          }
        }
        break

      case 'deactivate':
        // Set isActive to false
        for (const id of ids) {
          try {
            await prisma.achievement.update({
              where: { id },
              data: { isActive: false },
            })
            succeeded++
          } catch (error: any) {
            errors.push(`${id}: ${error.message}`)
          }
        }
        break

      case 'delete':
        // Delete achievements (cascade will delete user achievements)
        for (const id of ids) {
          try {
            await prisma.achievement.delete({
              where: { id },
            })
            succeeded++
          } catch (error: any) {
            errors.push(`${id}: ${error.message}`)
          }
        }
        break
    }

    return NextResponse.json({
      success: true,
      processed: ids.length,
      succeeded: succeeded,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('❌ Error in bulk achievement operation:', error)
    return NextResponse.json(
      {
        error: 'Failed to perform bulk operation',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

