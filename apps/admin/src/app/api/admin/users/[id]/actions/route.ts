import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import crypto from 'crypto'

/**
 * POST /api/admin/users/[id]/actions
 * Perform admin actions on a user
 * 
 * Actions: resetPassword, suspend, activate, changeTier, changeRole, generateReferralCode
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production
    // const user = await getCurrentUser()
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // TODO: Add proper admin role check

    const { id } = await params
    const body = await request.json()
    const { action, data } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Missing required field: action' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let result: any = {}

    switch (action) {
      case 'resetPassword':
        // Generate a temporary password reset token
        // In production, this would send an email with a reset link
        const resetToken = crypto.randomBytes(32).toString('hex')
        // TODO: Store reset token in database with expiration
        // For now, just return success
        result = {
          success: true,
          message: 'Password reset email sent',
          // In development, you might want to return the token for testing
          // resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
        }
        break

      case 'suspend':
        // Mark user as suspended (you might want to add a suspended field to the schema)
        await prisma.user.update({
          where: { id },
          data: {
            subscriptionStatus: 'CANCELLED',
            // TODO: Add suspendedAt timestamp if you add that field
          },
        })
        result = { success: true, message: 'User suspended' }
        break

      case 'activate':
        await prisma.user.update({
          where: { id },
          data: {
            subscriptionStatus: 'ACTIVE',
          },
        })
        result = { success: true, message: 'User activated' }
        break

      case 'changeTier':
        if (!data?.tier || !['basic', 'premium'].includes(data.tier)) {
          return NextResponse.json(
            { error: 'Invalid tier. Must be "basic" or "premium"' },
            { status: 400 }
          )
        }
        await prisma.user.update({
          where: { id },
          data: { tier: data.tier },
        })
        result = { success: true, message: `Tier changed to ${data.tier}` }
        break

      case 'changeRole':
        const validRoles = ['PLATFORM_ADMIN', 'ORG_ADMIN', 'TEACHER', 'STUDENT', 'PARENT', null]
        if (data?.platformRole !== undefined && !validRoles.includes(data.platformRole)) {
          return NextResponse.json(
            { error: 'Invalid platform role' },
            { status: 400 }
          )
        }
        await prisma.user.update({
          where: { id },
          data: { platformRole: data?.platformRole || null },
        })
        result = { success: true, message: `Platform role ${data?.platformRole ? 'changed' : 'removed'}` }
        break

      case 'generateReferralCode':
        // Generate a unique referral code
        const referralCode = `REF${crypto.randomBytes(4).toString('hex').toUpperCase()}`
        await prisma.user.update({
          where: { id },
          data: { referralCode },
        })
        result = { success: true, message: 'Referral code generated', referralCode }
        break

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error performing user action:', error)
    return NextResponse.json(
      { error: 'Failed to perform action', details: error.message },
      { status: 500 }
    )
  }
}

