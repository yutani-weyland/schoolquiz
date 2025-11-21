import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'

/**
 * GET /api/admin/questions/submissions
 * List user question submissions with pagination, search, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const skip = (page - 1) * limit
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    try {
      // Build where clause
      const where: any = {}
      
      if (status) {
        where.status = status
      }
      
      if (search) {
        where.OR = [
          { question: { contains: search, mode: 'insensitive' } },
          { answer: { contains: search, mode: 'insensitive' } },
          { schoolName: { contains: search, mode: 'insensitive' } },
          { teacherName: { contains: search, mode: 'insensitive' } },
          { user: { 
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ]
          }},
        ]
      }

      // Build orderBy clause
      const orderBy: any = {}
      switch (sortBy) {
        case 'question':
          orderBy.question = sortOrder
          break
        case 'status':
          orderBy.status = sortOrder
          break
        case 'createdAt':
        default:
          orderBy.createdAt = sortOrder === 'asc' ? 'asc' : 'desc'
          break
      }

      // Fetch submissions from database
      const [submissions, total] = await Promise.all([
        prisma.userQuestionSubmission.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.userQuestionSubmission.count({ where }),
      ])

      // Transform to match expected format
      const formattedSubmissions = submissions.map(sub => ({
        id: sub.id,
        userId: sub.userId,
        userName: sub.user.name || sub.user.email,
        userEmail: sub.user.email,
        question: sub.question,
        answer: sub.answer,
        explanation: sub.explanation,
        category: sub.category,
        status: sub.status,
        reviewedBy: sub.reviewedBy,
        reviewedAt: sub.reviewedAt?.toISOString() || null,
        notes: sub.notes,
        teacherName: sub.teacherName,
        schoolName: sub.schoolName,
        consentForShoutout: sub.consentForShoutout,
        createdAt: sub.createdAt.toISOString(),
      }))

      console.log(`✅ Fetched ${submissions.length} submissions from database (total: ${total})`)

      return NextResponse.json({ 
        submissions: formattedSubmissions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      })
    } catch (dbError: any) {
      // Log the actual database error for debugging
      console.error('❌ Database query failed:', dbError)
      console.error('Error message:', dbError.message)
      console.error('Error code:', dbError.code)
      
      // Fallback to dummy data if database is not available
      console.log('⚠️  Falling back to dummy data for question submissions')
      
      // Generate dummy data for fallback
      const statuses = ['PENDING', 'APPROVED', 'REJECTED']
      const categories = ['Australian History', 'Geography', 'Australian Politics', 'Science', 'Mathematics', 'Literature']
      const schools = ['Melbourne High School', 'Sydney Grammar School', 'Scotch College', 'Wesley College', 'Geelong Grammar']
      const teachers = ['Mrs K', 'Mr Smith', 'Ms Wilson', 'Dr Brown', 'Prof White']
      
      const firstNames = ['Sarah', 'John', 'Emma', 'Michael', 'Olivia', 'James', 'Sophia', 'William', 'Isabella', 'Benjamin']
      const lastNames = ['Johnson', 'Doe', 'Wilson', 'Brown', 'Smith', 'Davis', 'Miller', 'Garcia', 'Martinez', 'Anderson']
      
      const questions = [
        'What year did the Australian Constitution come into effect?',
        'Which Australian state is known as the "Sunshine State"?',
        'Who was the first female Prime Minister of Australia?',
        'What is the capital city of Western Australia?',
        'Which Australian animal is known for carrying its young in a pouch?',
        'What is the largest desert in Australia?',
        'Who painted "Blue Poles"?',
        'What is the highest mountain in Australia?',
        'Which Australian city hosted the 2000 Summer Olympics?',
        'What is the name of Australia\'s national anthem?',
      ]
      
      const answers = [
        '1901',
        'Queensland',
        'Julia Gillard',
        'Perth',
        'Kangaroo',
        'Great Victoria Desert',
        'Jackson Pollock',
        'Mount Kosciuszko',
        'Sydney',
        'Advance Australia Fair',
      ]

      const dummySubmissions = []
      for (let i = 0; i < 150; i++) {
        const firstName = firstNames[i % firstNames.length]
        const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length]
        const questionIndex = i % questions.length
        
        dummySubmissions.push({
          id: `sub-${i + 1}`,
          userId: `user-${i + 1}`,
          userName: `${firstName} ${lastName}`,
          userEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
          question: questions[questionIndex],
          answer: answers[questionIndex],
          explanation: i % 3 === 0 ? `This is an explanation for question ${i + 1}.` : null,
          category: categories[i % categories.length],
          status: statuses[i % statuses.length],
          reviewedBy: i % 3 !== 0 ? 'admin-1' : null,
          reviewedAt: i % 3 !== 0 ? new Date(Date.now() - (i % 7) * 24 * 60 * 60 * 1000).toISOString() : null,
          notes: i % 3 !== 0 ? `Review notes for submission ${i + 1}.` : null,
          teacherName: teachers[i % teachers.length],
          schoolName: schools[i % schools.length],
          consentForShoutout: i % 2 === 0,
          createdAt: new Date(Date.now() - (i % 30) * 24 * 60 * 60 * 1000).toISOString(),
        })
      }

      let filtered = [...dummySubmissions]

      // Apply status filter
      if (status) {
        filtered = filtered.filter(sub => sub.status === status)
      }

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase()
        filtered = filtered.filter(sub => 
          sub.question.toLowerCase().includes(searchLower) ||
          sub.answer.toLowerCase().includes(searchLower) ||
          sub.userName.toLowerCase().includes(searchLower) ||
          sub.userEmail.toLowerCase().includes(searchLower) ||
          (sub.schoolName && sub.schoolName.toLowerCase().includes(searchLower)) ||
          (sub.category && sub.category.toLowerCase().includes(searchLower))
        )
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let aVal: any = a[sortBy as keyof typeof a]
        let bVal: any = b[sortBy as keyof typeof b]

        // Handle date strings
        if (sortBy === 'createdAt') {
          aVal = new Date(aVal).getTime()
          bVal = new Date(bVal).getTime()
        } else if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase()
          bVal = (bVal || '').toLowerCase()
        }

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
        return 0
      })

      // Calculate pagination
      const total = filtered.length
      const totalPages = Math.ceil(total / limit)
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginated = filtered.slice(startIndex, endIndex)

      return NextResponse.json({ 
        submissions: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        }
      })
    }
  } catch (error: any) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions', details: error.message },
      { status: 500 }
    )
  }
}

