import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireAuth } from '@/lib/auth'

/**
 * GET /api/user/organisation
 * Get the current user's primary organisation (if any) with branding info
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Get user's active organisation membership
    const membership = await prisma.organisationMember.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            brandHeading: true,
            brandSubheading: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Get first/primary organisation
      },
    })

    if (!membership) {
      return NextResponse.json({
        organisation: null,
      })
    }

    return NextResponse.json({
      organisation: {
        id: membership.organisation.id,
        name: membership.organisation.name,
        logoUrl: membership.organisation.logoUrl,
        brandHeading: membership.organisation.brandHeading,
        brandSubheading: membership.organisation.brandSubheading,
        role: membership.role,
      },
    })
  } catch (error: any) {
    console.error('Error fetching user organisation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch organisation' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    )
  }
}
