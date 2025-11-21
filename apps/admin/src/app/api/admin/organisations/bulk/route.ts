/**
 * POST /api/admin/organisations/bulk - Bulk operations on organisations
 * 
 * Actions: delete, updateStatus
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

    // Verify all organisations exist
    const organisations = await prisma.organisation.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    })

    if (organisations.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some organisations not found' },
        { status: 404 }
      )
    }

    let succeeded = 0
    let errors: string[] = []

    switch (action) {
      case 'delete':
        // Delete organisations (cascade will handle related records)
        for (const id of ids) {
          try {
            await prisma.organisation.delete({
              where: { id },
            })
            succeeded++
          } catch (error: any) {
            errors.push(`${id}: ${error.message}`)
          }
        }
        break

      case 'updateStatus':
        if (!data?.status) {
          return NextResponse.json(
            { error: 'Missing status in data field' },
            { status: 400 }
          )
        }

        // Update status for all organisations
        for (const id of ids) {
          try {
            await prisma.organisation.update({
              where: { id },
              data: { status: data.status },
            })
            succeeded++
          } catch (error: any) {
            errors.push(`${id}: ${error.message}`)
          }
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: delete or updateStatus' },
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
    console.error('❌ Error in bulk organisation operation:', error)
    return NextResponse.json(
      {
        error: 'Failed to perform bulk operation',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

