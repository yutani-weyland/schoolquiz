import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

// Dummy data for offer codes
const dummyOfferCodes = [
  {
    id: 'code-1',
    code: 'SCHOOL2025',
    description: '20% off for schools in 2025',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    maxUses: 100,
    currentUses: 15,
    validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(),
    applicablePlans: JSON.stringify(['ORG_MONTHLY', 'ORG_ANNUAL']),
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'code-2',
    code: 'FREETRIAL30',
    description: '30 day free trial extension',
    discountType: 'FREE_TRIAL_EXTENSION',
    discountValue: 30,
    maxUses: null,
    currentUses: 45,
    validFrom: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: null,
    applicablePlans: null,
    isActive: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'code-3',
    code: 'EARLYBIRD',
    description: '$50 off annual plan',
    discountType: 'FIXED_AMOUNT',
    discountValue: 5000, // $50 in cents
    maxUses: 50,
    currentUses: 12,
    validFrom: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    applicablePlans: JSON.stringify(['ORG_ANNUAL']),
    isActive: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

/**
 * GET /api/admin/billing/offer-codes
 * List all offer codes
 */
export async function GET(request: NextRequest) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production
    // const user = await getCurrentUser()
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // For testing: Always use dummy data
    console.log('Using dummy data for offer codes')

    return NextResponse.json({ codes: dummyOfferCodes })
  } catch (error: any) {
    console.error('Error fetching offer codes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch offer codes', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/billing/offer-codes
 * Create a new offer code
 */
export async function POST(request: NextRequest) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production
    // const user = await getCurrentUser()
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { code, description, discountType, discountValue, maxUses, validFrom, validUntil, applicablePlans } = body

    // TODO: Create offer code in database
    console.log('Creating offer code:', body)

    return NextResponse.json({
      code: {
        id: `code-${Date.now()}`,
        code,
        description,
        discountType,
        discountValue,
        maxUses,
        currentUses: 0,
        validFrom,
        validUntil,
        applicablePlans,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Error creating offer code:', error)
    return NextResponse.json(
      { error: 'Failed to create offer code', details: error.message },
      { status: 500 }
    )
  }
}

