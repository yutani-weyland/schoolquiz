/**
 * Caching helpers for frequently accessed data
 * Uses Next.js unstable_cache for server-side caching
 */

import { unstable_cache } from 'next/cache'
import { prisma } from '@schoolquiz/db'

/**
 * Get all categories (cached for 5 minutes)
 * Categories change infrequently, so we can cache them aggressively
 */
async function getCategoriesUncached() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      parentId: true,
      seasonalTag: true,
      difficultyMin: true,
      difficultyMax: true,
      usageCount: true,
    },
  })
}

export const getCategories = (() => {
  return unstable_cache(
    getCategoriesUncached,
    ['categories-active'],
    { revalidate: 300 } // 5 minutes
  )
})()

/**
 * Get category by name (cached for 5 minutes)
 */
async function getCategoryByNameUncached(name: string) {
  return prisma.category.findFirst({
    where: { name, isActive: true },
  })
}

export function getCategoryByName(name: string) {
  return unstable_cache(
    async () => getCategoryByNameUncached(name),
    [`category-${name}`],
    { revalidate: 300 } // 5 minutes
  )()
}

/**
 * Get all achievements (cached for 10 minutes)
 * Achievements change very infrequently
 */
async function getAllAchievementsUncached() {
  try {
    // Try direct Prisma query first
    let achievements: any[] = []
    
    // Check if achievement model exists in Prisma client
    if ('achievement' in prisma && typeof (prisma as any).achievement?.findMany === 'function') {
      achievements = await (prisma as any).achievement.findMany({
        where: { isActive: true },
        orderBy: [
          { rarity: 'asc' }, // Legendary first
          { name: 'asc' },
        ],
      })
    } else {
      // Fallback: Try raw SQL query if Prisma model not available
      console.warn('[cache-helpers] Achievement model not found in Prisma client, using raw SQL')
      const { Prisma } = await import('@prisma/client')
      const result = await prisma.$queryRaw<Array<{
        id: string
        slug: string
        name: string
        shortDescription: string
        longDescription: string | null
        category: string
        rarity: string
        isPremiumOnly: boolean
        seasonTag: string | null
        iconKey: string | null
        series: string | null
        cardVariant: string | null
      }>>(
        Prisma.sql`
          SELECT id, slug, name, "shortDescription", "longDescription", category, rarity, "isPremiumOnly", "seasonTag", "iconKey", series, "cardVariant"
          FROM achievements
          WHERE "isActive" = true
          ORDER BY rarity ASC, name ASC
        `
      )
      achievements = result || []
    }
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[cache-helpers] getAllAchievementsUncached:', {
        count: achievements?.length || 0,
        error: null,
        firstFew: achievements?.slice(0, 3).map((a: any) => ({ id: a.id, slug: a.slug, name: a.name })),
      })
    }
    
    return achievements || []
  } catch (error: any) {
    // If achievements table doesn't exist, return empty array
    const errorMsg = error.message || String(error)
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[cache-helpers] getAllAchievementsUncached error:', {
        message: errorMsg,
        name: error.name,
        code: (error as any).code,
        stack: error.stack,
      })
    }
    
    if (
      errorMsg.includes('does not exist') ||
      errorMsg.includes('Unknown model') ||
      errorMsg.includes('Unknown arg') ||
      errorMsg.includes('Cannot find') ||
      errorMsg.includes('is not a function') ||
      errorMsg.includes('relation') ||
      errorMsg.includes('table')
    ) {
      return []
    }
    throw error
  }
}

export const getAllAchievements = (() => {
  const cachedFn = unstable_cache(
    getAllAchievementsUncached,
    ['achievements-active'],
    { revalidate: 60 } // 1 minute (reduced from 10 minutes for faster updates after seeding)
  )
  return cachedFn
})()

