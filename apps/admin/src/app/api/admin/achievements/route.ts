import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'

/**
 * GET /api/admin/achievements
 * List all achievements (admin only)
 * Supports search query parameter for filtering
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add proper admin role check
    // For now, allow any authenticated user (can be tightened later)

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    // Build where clause for search
    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ]
    }

    const achievements = await prisma.achievement.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        name: true,
        shortDescription: true,
        category: true,
        rarity: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ achievements })
  } catch (error: any) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievements', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/achievements
 * Create a new achievement
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add proper admin role check

    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const {
      slug,
      name,
      shortDescription,
      longDescription,
      category,
      rarity,
      isPremiumOnly = false,
      seasonTag,
      iconKey,
      unlockConditionType,
      unlockConditionConfig = {},
      appearance = {},
      isActive = true,
      points,
      series,
      cardVariant,
    } = body

    // Validation
    if (!slug || !name || !shortDescription || !category || !rarity || !unlockConditionType) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, name, shortDescription, category, rarity, unlockConditionType' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existing = await prisma.achievement.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Achievement with this slug already exists' },
        { status: 409 }
      )
    }

    // Safely stringify JSON fields
    let unlockConditionConfigStr = '{}'
    let appearanceStr = '{}'
    
    try {
      unlockConditionConfigStr = typeof unlockConditionConfig === 'string' 
        ? unlockConditionConfig 
        : JSON.stringify(unlockConditionConfig || {})
    } catch (error) {
      console.error('Error stringifying unlockConditionConfig:', error)
    }
    
    try {
      appearanceStr = typeof appearance === 'string' 
        ? appearance 
        : JSON.stringify(appearance || {})
    } catch (error) {
      console.error('Error stringifying appearance:', error)
    }

    const achievement = await prisma.achievement.create({
      data: {
        slug,
        name,
        shortDescription,
        longDescription,
        category,
        rarity,
        isPremiumOnly,
        seasonTag,
        iconKey,
        unlockConditionType,
        unlockConditionConfig: unlockConditionConfigStr,
        appearance: appearanceStr,
        isActive,
        points,
        series,
        cardVariant,
      },
    })

    return NextResponse.json({ achievement }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating achievement:', error)
    return NextResponse.json(
      { error: 'Failed to create achievement', details: error.message },
      { status: 500 }
    )
  }
}

