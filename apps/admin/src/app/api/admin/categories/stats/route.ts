import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/categories/stats
 * Get category usage and performance statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production

    // TODO: Fetch from database
    // Calculate:
    // - usageCount: How many quizzes use this category
    // - averageSuccessRate: Average % correct for questions in this category
    // - totalQuestions: Total questions in this category
    // - totalRuns: Total quiz runs for quizzes using this category
    
    // For now, return dummy data
    const dummyStats = [
      {
        categoryId: 'cat-1',
        categoryName: 'History',
        usageCount: 12,
        averageSuccessRate: 0.72,
        totalQuestions: 45,
        totalRuns: 28,
      },
      {
        categoryId: 'cat-2',
        categoryName: 'WW2 History',
        usageCount: 8,
        averageSuccessRate: 0.78,
        totalQuestions: 32,
        totalRuns: 18,
      },
      {
        categoryId: 'cat-3',
        categoryName: 'Australian History',
        usageCount: 5,
        averageSuccessRate: 0.68,
        totalQuestions: 18,
        totalRuns: 12,
      },
      {
        categoryId: 'cat-4',
        categoryName: 'Geography',
        usageCount: 15,
        averageSuccessRate: 0.75,
        totalQuestions: 52,
        totalRuns: 35,
      },
      {
        categoryId: 'cat-5',
        categoryName: 'Australian Culture',
        usageCount: 6,
        averageSuccessRate: 0.70,
        totalQuestions: 24,
        totalRuns: 14,
      },
      {
        categoryId: 'cat-6',
        categoryName: 'NAIDOC Week',
        usageCount: 3,
        averageSuccessRate: 0.65,
        totalQuestions: 12,
        totalRuns: 8,
      },
      {
        categoryId: 'cat-7',
        categoryName: 'Politics',
        usageCount: 4,
        averageSuccessRate: 0.73,
        totalQuestions: 16,
        totalRuns: 10,
      },
      {
        categoryId: 'cat-8',
        categoryName: 'US Politics',
        usageCount: 2,
        averageSuccessRate: 0.71,
        totalQuestions: 8,
        totalRuns: 5,
      },
    ]

    return NextResponse.json({ stats: dummyStats })
  } catch (error: any) {
    console.error('Error fetching category stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category stats', details: error.message },
      { status: 500 }
    )
  }
}



