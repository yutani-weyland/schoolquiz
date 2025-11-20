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
    return await (prisma as any).achievement.findMany({
      where: { isActive: true },
      orderBy: [
        { rarity: 'asc' }, // Legendary first
        { name: 'asc' },
      ],
    })
  } catch (error: any) {
    // If achievements table doesn't exist, return empty array
    const errorMsg = error.message || String(error)
    if (
      errorMsg.includes('does not exist') ||
      errorMsg.includes('Unknown model') ||
      errorMsg.includes('Unknown arg') ||
      errorMsg.includes('Cannot find') ||
      errorMsg.includes('is not a function')
    ) {
      return []
    }
    throw error
  }
}

export const getAllAchievements = (() => {
  return unstable_cache(
    getAllAchievementsUncached,
    ['achievements-active'],
    { revalidate: 600 } // 10 minutes
  )
})()

