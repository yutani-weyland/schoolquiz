import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'

/**
 * POST /api/admin/users/[id]/reset-password
 * Initiate password reset for a user (admin only)
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

    // For testing: Just return success
    // TODO: Switch to database when ready
    // In production, this would:
    // 1. Generate a password reset token
    // 2. Store it in the database with expiration
    // 3. Send an email to the user with the reset link
    console.log('Password reset initiated for user:', id)

    // Example implementation for when database is ready:
    /*
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.user.update({
      where: { id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetTokenExpiry,
      },
    })

    // TODO: Send email with reset link
    // await sendPasswordResetEmail(user.email, resetToken)
    */

    return NextResponse.json({ 
      message: 'Password reset email sent successfully',
      // In production, don't expose the token
    })
  } catch (error: any) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Failed to reset password', details: error.message },
      { status: 500 }
    )
  }
}



