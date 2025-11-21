import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'

/**
 * GET /api/admin/categories
 * Get all categories
 */
export async function GET(request: NextRequest) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production

    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          parentId: true,
          description: true,
          seasonalTag: true,
          isActive: true,
        },
        orderBy: [
          { parentId: 'asc' },
          { name: 'asc' },
        ],
      })

      console.log(`✅ Fetched ${categories.length} categories from database`)

      return NextResponse.json({ categories })
    } catch (dbError: any) {
      // Fallback to dummy data if database is not available
      console.log('Database not available, using dummy data for categories')
      
      const categories = [
        { id: 'cat-1', name: 'History', parentId: null },
        { id: 'cat-2', name: 'WW2 History', parentId: 'cat-1' },
        { id: 'cat-3', name: 'Australian History', parentId: 'cat-1' },
        { id: 'cat-4', name: 'Geography', parentId: null },
        { id: 'cat-5', name: 'Australian Culture', parentId: null },
        { id: 'cat-6', name: 'NAIDOC Week', parentId: 'cat-5' },
        { id: 'cat-7', name: 'Politics', parentId: null },
        { id: 'cat-8', name: 'US Politics', parentId: 'cat-7' },
      ]

      return NextResponse.json({ categories })
    }
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error.message },
      { status: 500 }
    )
  }
}

