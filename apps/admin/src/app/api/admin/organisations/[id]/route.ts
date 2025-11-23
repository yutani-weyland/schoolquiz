import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'


/**
 * GET /api/admin/organisations/[id]
 * Get organisation details (admin only)
 */
export async function GET(
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

    try {
      const organisation = await prisma.organisation.findUnique({
        where: { id },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          members: {
            where: { deletedAt: null },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  tier: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          groups: {
            where: { deletedAt: null },
            include: {
              _count: {
                select: {
                  members: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          leaderboards: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
          },
          activity: {
            include: {
              actor: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
          _count: {
            select: {
              members: true,
              groups: true,
              leaderboards: true,
            },
          },
        },
      })

      if (!organisation) {
        return NextResponse.json(
          { error: 'Organisation not found' },
          { status: 404 }
        )
      }

      // Transform to match expected format
      const formattedOrganisation = {
        id: organisation.id,
        name: organisation.name,
        emailDomain: organisation.emailDomain,
        status: organisation.status,
        plan: organisation.plan,
        maxSeats: organisation.maxSeats,
        currentPeriodStart: organisation.currentPeriodStart?.toISOString() || null,
        currentPeriodEnd: organisation.currentPeriodEnd?.toISOString() || null,
        gracePeriodEnd: organisation.gracePeriodEnd?.toISOString() || null,
        stripeCustomerId: organisation.stripeCustomerId,
        stripeSubscriptionId: organisation.stripeSubscriptionId,
        owner: {
          id: organisation.owner.id,
          name: organisation.owner.name,
          email: organisation.owner.email,
        },
        members: organisation.members.map(m => ({
          id: m.id,
          role: m.role,
          status: m.status,
          user: {
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            tier: m.user.tier,
          },
          seatAssignedAt: m.seatAssignedAt?.toISOString() || null,
          createdAt: m.createdAt.toISOString(),
        })),
        groups: organisation.groups.map(g => ({
          id: g.id,
          name: g.name,
          type: g.type,
          description: g.description,
          _count: {
            members: g._count.members,
          },
          createdAt: g.createdAt.toISOString(),
        })),
        leaderboards: organisation.leaderboards.map(l => ({
          id: l.id,
          name: l.name,
          description: l.description,
          createdAt: l.createdAt.toISOString(),
        })),
        activity: organisation.activity.map(a => ({
          id: a.id,
          type: a.type,
          metadata: a.metadata,
          actor: {
            id: a.actor.id,
            name: a.actor.name,
            email: a.actor.email,
          },
          createdAt: a.createdAt.toISOString(),
        })),
        _count: {
          members: organisation._count.members,
          groups: organisation._count.groups,
          leaderboards: organisation._count.leaderboards,
        },
        createdAt: organisation.createdAt.toISOString(),
        updatedAt: organisation.updatedAt.toISOString(),
      }

      return NextResponse.json({ organisation: formattedOrganisation })
    } catch (dbError: any) {
      // Log the actual database error for debugging
      console.error('❌ Database query failed:', dbError)
      console.error('Error message:', dbError.message)
      console.error('Error code:', dbError.code)

      return NextResponse.json(
        { error: 'Failed to fetch organisation', details: dbError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error fetching organisation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organisation', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/organisations/[id]
 * Update organisation (admin only)
 */
export async function PATCH(
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

    // Validate allowed fields
    const allowedFields = [
      'name',
      'emailDomain',
      'status',
      'plan',
      'maxSeats',
      'currentPeriodStart',
      'currentPeriodEnd',
      'gracePeriodEnd',
    ]
    const updateData: any = {}

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    // Handle date fields
    if (body.currentPeriodStart) {
      updateData.currentPeriodStart = new Date(body.currentPeriodStart)
    }
    if (body.currentPeriodEnd) {
      updateData.currentPeriodEnd = new Date(body.currentPeriodEnd)
    }
    if (body.gracePeriodEnd) {
      updateData.gracePeriodEnd = new Date(body.gracePeriodEnd)
    }

    const organisation = await prisma.organisation.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
            groups: true,
          },
        },
      },
    })

    return NextResponse.json({
      organisation: {
        id: organisation.id,
        name: organisation.name,
        emailDomain: organisation.emailDomain,
        status: organisation.status,
        plan: organisation.plan,
        maxSeats: organisation.maxSeats,
        currentPeriodEnd: organisation.currentPeriodEnd?.toISOString() || null,
        owner: {
          id: organisation.owner.id,
          name: organisation.owner.name,
          email: organisation.owner.email,
        },
        _count: {
          members: organisation._count.members,
          groups: organisation._count.groups,
        },
        createdAt: organisation.createdAt.toISOString(),
      },
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      )
    }
    console.error('Error updating organisation:', error)
    return NextResponse.json(
      { error: 'Failed to update organisation', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/organisations/[id]
 * Delete organisation (admin only)
 */
export async function DELETE(
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

    await prisma.organisation.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      )
    }
    console.error('Error deleting organisation:', error)
    return NextResponse.json(
      { error: 'Failed to delete organisation', details: error.message },
      { status: 500 }
    )
  }
}

