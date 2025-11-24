import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { requireAuth } from '@/lib/auth'
import { getOrganisationContext, requirePermission } from '@schoolquiz/db'
import { z } from 'zod'

const BrandingSchema = z.object({
  logoUrl: z.string().url().optional().nullable(),
  brandHeading: z.string().max(100).optional().nullable(),
  brandSubheading: z.string().max(200).optional().nullable(),
})

/**
 * GET /api/organisation/[id]/branding
 * Get organisation branding settings
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: organisationId } = await params

    const context = await getOrganisationContext(organisationId, user.id)
    requirePermission(context, 'org:view')

    const organisation = await prisma.organisation.findUnique({
      where: { id: organisationId },
      select: {
        id: true,
        logoUrl: true,
        brandHeading: true,
        brandSubheading: true,
      },
    })

    if (!organisation) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      branding: {
        logoUrl: organisation.logoUrl,
        brandHeading: organisation.brandHeading,
        brandSubheading: organisation.brandSubheading,
      },
    })
  } catch (error: any) {
    console.error('Error fetching organisation branding:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch branding' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    )
  }
}

/**
 * POST /api/organisation/[id]/branding
 * Update organisation branding (logo, heading, subheading)
 * Requires: org:admin permission OR premium user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: organisationId } = await params

    const context = await getOrganisationContext(organisationId, user.id)
    
    // Check if user is org admin OR premium user
    const isOrgAdmin = context?.role === 'OWNER' || context?.role === 'ADMIN'
    const isPremium = user.tier === 'premium' || 
      (user as any).subscriptionStatus === 'ACTIVE' ||
      (user as any).subscriptionStatus === 'TRIALING'
    
    if (!isOrgAdmin && !isPremium) {
      return NextResponse.json(
        { error: 'Only organisation admins or premium users can update branding' },
        { status: 403 }
      )
    }

    // Verify user is a member of the organisation
    requirePermission(context, 'org:view')

    const body = await request.json()
    
    // Validate input
    const validationResult = BrandingSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Update branding
    const updated = await prisma.organisation.update({
      where: { id: organisationId },
      data: {
        logoUrl: validationResult.data.logoUrl ?? null,
        brandHeading: validationResult.data.brandHeading ?? null,
        brandSubheading: validationResult.data.brandSubheading ?? null,
      },
      select: {
        logoUrl: true,
        brandHeading: true,
        brandSubheading: true,
      },
    })

    return NextResponse.json({
      success: true,
      branding: updated,
    })
  } catch (error: any) {
    console.error('Error updating organisation branding:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update branding' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    )
  }
}

