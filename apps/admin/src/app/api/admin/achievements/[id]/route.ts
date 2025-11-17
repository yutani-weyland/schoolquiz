import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'

/**
 * GET /api/admin/achievements/[id]
 * Get a single achievement by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const achievement = await prisma.achievement.findUnique({
      where: { id },
    })

    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 })
    }

    return NextResponse.json({ achievement })
  } catch (error: any) {
    console.error('Error fetching achievement:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievement', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/achievements/[id]
 * Update an achievement
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
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
      isPremiumOnly,
      seasonTag,
      iconKey,
      unlockConditionType,
      unlockConditionConfig,
      appearance,
      isActive,
      points,
      series,
      cardVariant,
    } = body

    // Check if achievement exists
    const existing = await prisma.achievement.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 })
    }

    // If slug is being changed, check for conflicts
    if (slug && slug !== existing.slug) {
      const slugConflict = await prisma.achievement.findUnique({
        where: { slug },
      })
      if (slugConflict) {
        return NextResponse.json(
          { error: 'Achievement with this slug already exists' },
          { status: 409 }
        )
      }
    }

    // Build update data
    const updateData: any = {}
    if (slug !== undefined) updateData.slug = slug
    if (name !== undefined) updateData.name = name
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription
    if (longDescription !== undefined) updateData.longDescription = longDescription
    if (category !== undefined) updateData.category = category
    if (rarity !== undefined) updateData.rarity = rarity
    if (isPremiumOnly !== undefined) updateData.isPremiumOnly = isPremiumOnly
    if (seasonTag !== undefined) updateData.seasonTag = seasonTag
    if (iconKey !== undefined) updateData.iconKey = iconKey
    if (unlockConditionType !== undefined) updateData.unlockConditionType = unlockConditionType
    if (unlockConditionConfig !== undefined) {
      try {
        updateData.unlockConditionConfig = typeof unlockConditionConfig === 'string' 
          ? unlockConditionConfig 
          : JSON.stringify(unlockConditionConfig || {})
      } catch (error) {
        console.error('Error stringifying unlockConditionConfig:', error)
        return NextResponse.json(
          { error: 'Invalid unlockConditionConfig format' },
          { status: 400 }
        )
      }
    }
    if (appearance !== undefined) {
      try {
        updateData.appearance = typeof appearance === 'string' 
          ? appearance 
          : JSON.stringify(appearance || {})
      } catch (error) {
        console.error('Error stringifying appearance:', error)
        return NextResponse.json(
          { error: 'Invalid appearance format' },
          { status: 400 }
        )
      }
    }
    if (isActive !== undefined) updateData.isActive = isActive
    if (points !== undefined) updateData.points = points
    if (series !== undefined) updateData.series = series
    if (cardVariant !== undefined) updateData.cardVariant = cardVariant

    const achievement = await prisma.achievement.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ achievement })
  } catch (error: any) {
    console.error('Error updating achievement:', error)
    return NextResponse.json(
      { error: 'Failed to update achievement', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/achievements/[id]
 * Soft delete an achievement (set isActive to false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Soft delete by setting isActive to false
    const achievement = await prisma.achievement.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ achievement })
  } catch (error: any) {
    console.error('Error deleting achievement:', error)
    return NextResponse.json(
      { error: 'Failed to delete achievement', details: error.message },
      { status: 500 }
    )
  }
}

