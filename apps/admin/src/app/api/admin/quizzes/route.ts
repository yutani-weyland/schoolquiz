import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'
import { dummyQuizzes } from '@/lib/dummy-quiz-data'

/**
 * GET /api/admin/quizzes
 * List all quizzes (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production
    // const user = await getCurrentUser()
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // TODO: Add proper admin role check

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // For testing: Always use dummy data
    // TODO: Switch to database when ready
    console.log('Using dummy data for quizzes')
    let filtered = [...dummyQuizzes]
    
    if (search) {
      filtered = filtered.filter(quiz => 
        quiz.title.toLowerCase().includes(search.toLowerCase()) ||
        quiz.blurb?.toLowerCase().includes(search.toLowerCase()) ||
        quiz.theme?.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    if (status) {
      filtered = filtered.filter(quiz => quiz.status === status)
    }
    
    const total = filtered.length
    const quizzes = filtered.slice(skip, skip + limit)

    return NextResponse.json({
      quizzes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching quizzes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quizzes', details: error.message },
      { status: 500 }
    )
  }
}

