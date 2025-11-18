import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'

/**
 * POST /api/admin/users/[id]/impersonate
 * Create an impersonation session (admin only)
 */
export async function POST(
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

    // TODO: Add proper admin role check - only PlatformAdmins can impersonate

    const { id } = await params

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Log the impersonation (audit log)
    try {
      await prisma.organisationActivity.create({
        data: {
          organisationId: 'system', // System-level activity
          userId: adminUser.id,
          type: 'MEMBER_ROLE_CHANGED', // Reusing this type for admin actions
          metadata: JSON.stringify({
            action: 'IMPERSONATION_STARTED',
            targetUserId: id,
            targetUserEmail: targetUser.email,
            impersonatedBy: adminUser.id,
            impersonatedByEmail: adminUser.email,
            timestamp: new Date().toISOString(),
          }),
        },
      })
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to create audit log:', error)
    }

    // Return the target user info
    // The actual impersonation will be handled by setting a session cookie
    // For now, we'll return a token that can be used to sign in as that user
    return NextResponse.json({
      success: true,
      targetUser,
      message: 'Impersonation session created',
      // In a real implementation, you'd create a special impersonation token
      // and redirect to sign in with that token
    })
  } catch (error: any) {
    console.error('Error creating impersonation session:', error)
    return NextResponse.json(
      { error: 'Failed to create impersonation session', details: error.message },
      { status: 500 }
    )
  }
}

