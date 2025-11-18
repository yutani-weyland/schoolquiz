import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'

/**
 * PUT /api/admin/organisations/[id]/members/[memberId]/role
 * Update organisation member role (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
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

    const { id: organisationId, memberId } = await params
    const body = await request.json()
    const { role } = body

    // Validate role
    const validRoles = ['OWNER', 'ADMIN', 'TEACHER', 'BILLING_ADMIN']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Get current member to log old role
    const currentMember = await prisma.organisationMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    if (!currentMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Update member role
    const updatedMember = await prisma.organisationMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    // Log the change (audit log)
    try {
      await prisma.organisationActivity.create({
        data: {
          organisationId,
          userId: adminUser.id,
          type: 'MEMBER_ROLE_CHANGED',
          metadata: JSON.stringify({
            memberId,
            targetUserId: currentMember.user.id,
            targetUserEmail: currentMember.user.email,
            oldRole: currentMember.role,
            newRole: role,
            changedBy: adminUser.id,
            changedByEmail: adminUser.email,
          }),
        },
      })
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to create audit log:', error)
    }

    return NextResponse.json({ member: updatedMember })
  } catch (error: any) {
    console.error('Error updating member role:', error)
    return NextResponse.json(
      { error: 'Failed to update member role', details: error.message },
      { status: 500 }
    )
  }
}

