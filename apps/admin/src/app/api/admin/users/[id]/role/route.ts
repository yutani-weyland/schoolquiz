import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'

/**
 * PUT /api/admin/users/[id]/role
 * Update user's platform role (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production
    // const adminUser = await getCurrentUser()
    // if (!adminUser) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    const adminUser = { id: 'test-admin', email: 'test@admin.com' } // Mock admin user for testing

    // TODO: Add proper admin role check

    const { id } = await params
    const body = await request.json()
    const { platformRole } = body

    // Validate role
    const validRoles = ['PLATFORM_ADMIN', 'ORG_ADMIN', 'TEACHER', 'STUDENT', 'PARENT', null]
    if (platformRole !== null && !validRoles.includes(platformRole)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { platformRole },
      select: {
        id: true,
        email: true,
        name: true,
        platformRole: true,
      },
    })

    // Log the change (audit log)
    try {
      await prisma.organisationActivity.create({
        data: {
          organisationId: 'system', // System-level activity
          userId: adminUser.id,
          type: 'MEMBER_ROLE_CHANGED',
          metadata: JSON.stringify({
            targetUserId: id,
            targetUserEmail: updatedUser.email,
            oldRole: null, // We don't track old role in this simple implementation
            newRole: platformRole,
            changedBy: adminUser.id,
            changedByEmail: adminUser.email,
          }),
        },
      })
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to create audit log:', error)
    }

    return NextResponse.json({ user: updatedUser })
  } catch (error: any) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: 'Failed to update user role', details: error.message },
      { status: 500 }
    )
  }
}

