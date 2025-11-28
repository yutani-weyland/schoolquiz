import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'
import { validateRequest, validateQuery } from '@/lib/api-validation'
import { CreateAchievementSchema, AchievementQuerySchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api-error'

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

    // Validate query parameters
    const query = await validateQuery(request, AchievementQuerySchema)
    const search = query.search || ''
    const limit = query.limit || 100

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
    return handleApiError(error)
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

    // Validate request body with Zod
    const body = await validateRequest(request, CreateAchievementSchema)
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
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Achievement with this slug already exists' },
        { status: 409 }
      )
    }
    
    // Use centralized error handling (handles ValidationError automatically)
    return handleApiError(error)
  }
}

