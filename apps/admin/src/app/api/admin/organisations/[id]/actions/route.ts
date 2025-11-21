import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'

/**
 * POST /api/admin/organisations/[id]/actions
 * Perform admin actions on an organisation
 * 
 * Actions: suspend, activate, changePlan, changeMaxSeats, transferOwnership
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

    // Verify organisation exists
    const organisation = await prisma.organisation.findUnique({
      where: { id },
      select: { id: true, ownerUserId: true },
    })

    if (!organisation) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      )
    }

    let result: any = {}

    switch (action) {
      case 'suspend':
        await prisma.organisation.update({
          where: { id },
          data: { status: 'CANCELLED' },
        })
        result = { success: true, message: 'Organisation suspended' }
        break

      case 'activate':
        await prisma.organisation.update({
          where: { id },
          data: { status: 'ACTIVE' },
        })
        result = { success: true, message: 'Organisation activated' }
        break

      case 'changePlan':
        if (!data?.plan) {
          return NextResponse.json(
            { error: 'Missing required field: plan' },
            { status: 400 }
          )
        }
        const validPlans = ['INDIVIDUAL', 'ORG_MONTHLY', 'ORG_ANNUAL']
        if (!validPlans.includes(data.plan)) {
          return NextResponse.json(
            { error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` },
            { status: 400 }
          )
        }
        await prisma.organisation.update({
          where: { id },
          data: { plan: data.plan },
        })
        result = { success: true, message: `Plan changed to ${data.plan}` }
        break

      case 'changeMaxSeats':
        if (data?.maxSeats === undefined || typeof data.maxSeats !== 'number' || data.maxSeats < 0) {
          return NextResponse.json(
            { error: 'Invalid maxSeats. Must be a non-negative number' },
            { status: 400 }
          )
        }
        await prisma.organisation.update({
          where: { id },
          data: { maxSeats: data.maxSeats },
        })
        result = { success: true, message: `Max seats changed to ${data.maxSeats}` }
        break

      case 'transferOwnership':
        if (!data?.newOwnerId) {
          return NextResponse.json(
            { error: 'Missing required field: newOwnerId' },
            { status: 400 }
          )
        }
        // Verify new owner exists
        const newOwner = await prisma.user.findUnique({
          where: { id: data.newOwnerId },
          select: { id: true },
        })
        if (!newOwner) {
          return NextResponse.json(
            { error: 'New owner not found' },
            { status: 404 }
          )
        }
        // Update organisation owner
        await prisma.organisation.update({
          where: { id },
          data: { ownerUserId: data.newOwnerId },
        })
        // Update organisation member roles if needed
        // Make old owner a regular member if they're still a member
        await prisma.organisationMember.updateMany({
          where: {
            organisationId: id,
            userId: organisation.ownerUserId,
            role: 'OWNER',
          },
          data: { role: 'ADMIN' },
        })
        // Make new owner the owner if they're already a member
        await prisma.organisationMember.updateMany({
          where: {
            organisationId: id,
            userId: data.newOwnerId,
          },
          data: { role: 'OWNER' },
        })
        result = { success: true, message: 'Ownership transferred' }
        break

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error performing organisation action:', error)
    return NextResponse.json(
      { error: 'Failed to perform action', details: error.message },
      { status: 500 }
    )
  }
}

