/**
 * POST /api/admin/users/bulk - Bulk operations on users
 * 
 * Actions: delete, updateTier
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'

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
    const { action, ids, data } = body

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: action and ids' },
        { status: 400 }
      )
    }

    // Verify all users exist
    const users = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    })

    if (users.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some users not found' },
        { status: 404 }
      )
    }

    let succeeded = 0
    let errors: string[] = []

    switch (action) {
      case 'delete':
        // Delete users (cascade will handle related records)
        for (const id of ids) {
          try {
            await prisma.user.delete({
              where: { id },
            })
            succeeded++
          } catch (error: any) {
            errors.push(`${id}: ${error.message}`)
          }
        }
        break

      case 'updateTier':
        if (!data?.tier) {
          return NextResponse.json(
            { error: 'Missing tier in data field' },
            { status: 400 }
          )
        }

        // Update tier for all users
        for (const id of ids) {
          try {
            await prisma.user.update({
              where: { id },
              data: { tier: data.tier },
            })
            succeeded++
          } catch (error: any) {
            errors.push(`${id}: ${error.message}`)
          }
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: delete or updateTier' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      processed: ids.length,
      succeeded,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('❌ Error in bulk user operation:', error)
    return NextResponse.json(
      {
        error: 'Failed to perform bulk operation',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

