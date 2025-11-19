import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'
import { getDummyOrganisationDetail, dummyOrganisations } from '@/lib/dummy-data'

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

    // For testing: Always use dummy data
    // TODO: Switch to database when ready
    console.log('Using dummy data for organisation detail')
    const organisation = getDummyOrganisationDetail(id)
    
    // If not found, return 404
    if (!organisation) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ organisation })
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

    // For testing: Update dummy data
    // TODO: Switch to database when ready
    console.log('Updating organisation with dummy data:', id, body)
    
    const orgIndex = dummyOrganisations.findIndex(o => o.id === id)
    if (orgIndex === -1) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      )
    }

    // Update organisation
    dummyOrganisations[orgIndex] = {
      ...dummyOrganisations[orgIndex],
      ...body,
    }

    return NextResponse.json({ organisation: dummyOrganisations[orgIndex] })
  } catch (error: any) {
    console.error('Error updating organisation:', error)
    return NextResponse.json(
      { error: 'Failed to update organisation', details: error.message },
      { status: 500 }
    )
  }
}

