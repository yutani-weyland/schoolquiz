import { NextRequest, NextResponse } from 'next/server'

// TODO: Create a RoundTemplate model in the database schema
// Currently using in-memory storage because there's no RoundTemplate model.
// The existing Round model requires a quizId, so it can't be used for templates.
// Suggested schema:
// model RoundTemplate {
//   id         String   @id @default(cuid())
//   title      String
//   categoryId String
//   blurb      String?
//   questions  Json     // Array of { text, answer, explanation }
//   createdAt  DateTime @default(now())
//   updatedAt  DateTime @updatedAt
//   category   Category @relation(fields: [categoryId], references: [id])
// }

// In-memory storage for round templates (replace with database later)
let roundTemplates: Record<string, {
  id: string
  title: string
  categoryId: string
  categoryName?: string
  blurb?: string
  questions: Array<{
    id: string
    text: string
    answer: string
    explanation?: string
  }>
  createdAt: string
  updatedAt: string
}> = {}

// Initialize with some dummy data
if (Object.keys(roundTemplates).length === 0) {
  const dummyRounds = [
    {
      id: 'r1',
      title: 'WW2 History',
      categoryId: 'cat-2',
      categoryName: 'WW2 History',
      blurb: 'Test your knowledge of World War II',
      questions: [
        {
          id: 'q1',
          text: 'What year did World War II end?',
          answer: '1945',
          explanation: 'World War II ended in 1945 with the surrender of Japan.',
        },
        {
          id: 'q2',
          text: 'Which country was invaded by Germany in 1939, starting the war?',
          answer: 'Poland',
          explanation: 'Germany invaded Poland on September 1, 1939.',
        },
        {
          id: 'q3',
          text: 'What was the code name for the D-Day landings?',
          answer: 'Operation Overlord',
          explanation: 'Operation Overlord was the code name for the Battle of Normandy.',
        },
        {
          id: 'q4',
          text: 'Which two cities were hit by atomic bombs?',
          answer: 'Hiroshima and Nagasaki',
          explanation: 'The United States dropped atomic bombs on Hiroshima and Nagasaki in August 1945.',
        },
        {
          id: 'q5',
          text: 'Who was the leader of Nazi Germany?',
          answer: 'Adolf Hitler',
          explanation: 'Adolf Hitler was the Führer of Nazi Germany from 1934 to 1945.',
        },
        {
          id: 'q6',
          text: 'What was the name of the German air force?',
          answer: 'Luftwaffe',
          explanation: 'The Luftwaffe was the aerial warfare branch of the Wehrmacht.',
        },
      ],
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'r2',
      title: 'Australian Geography',
      categoryId: 'cat-4',
      categoryName: 'Geography',
      blurb: 'Explore the geography of Australia',
      questions: [
        {
          id: 'q1',
          text: 'What is the capital of Western Australia?',
          answer: 'Perth',
          explanation: 'Perth is the capital and largest city of Western Australia.',
        },
        {
          id: 'q2',
          text: 'What is the largest state in Australia by area?',
          answer: 'Western Australia',
          explanation: 'Western Australia covers about one-third of the Australian continent.',
        },
        {
          id: 'q3',
          text: 'What is the longest river in Australia?',
          answer: 'Murray River',
          explanation: 'The Murray River is Australia\'s longest river at 2,508 km.',
        },
        {
          id: 'q4',
          text: 'What is the highest mountain in Australia?',
          answer: 'Mount Kosciuszko',
          explanation: 'Mount Kosciuszko is the highest peak in Australia at 2,228 metres.',
        },
        {
          id: 'q5',
          text: 'Which Australian state is known as the "Sunshine State"?',
          answer: 'Queensland',
          explanation: 'Queensland is known for its sunny weather and beautiful beaches.',
        },
        {
          id: 'q6',
          text: 'What is the capital of the Northern Territory?',
          answer: 'Darwin',
          explanation: 'Darwin is the capital city of the Northern Territory.',
        },
      ],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]
  
  dummyRounds.forEach(r => {
    roundTemplates[r.id] = r
  })
}

/**
 * GET /api/admin/rounds/templates
 * List round templates with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId') || ''

    let rounds = Object.values(roundTemplates)

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase()
      rounds = rounds.filter(r =>
        r.title.toLowerCase().includes(searchLower) ||
        (r.blurb && r.blurb.toLowerCase().includes(searchLower)) ||
        r.questions.some(q =>
          q.text.toLowerCase().includes(searchLower) ||
          q.answer.toLowerCase().includes(searchLower)
        )
      )
    }

    if (categoryId) {
      rounds = rounds.filter(r => r.categoryId === categoryId)
    }

    // Sort by updatedAt descending (most recent first)
    rounds.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )

    return NextResponse.json({ rounds })
  } catch (error: any) {
    console.error('Error fetching round templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch round templates', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/rounds/templates
 * Create a new round template
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, categoryId, blurb, questions } = body

    if (!title || !categoryId || !questions || questions.length !== 6) {
      return NextResponse.json(
        { error: 'Missing required fields: title, categoryId, and exactly 6 questions' },
        { status: 400 }
      )
    }

    // Validate all questions have text and answer
    const incompleteQuestions = questions.filter(
      (q: any) => !q.text?.trim() || !q.answer?.trim()
    )

    if (incompleteQuestions.length > 0) {
      return NextResponse.json(
        { error: 'All questions must have text and answer' },
        { status: 400 }
      )
    }

    // Get category name (would fetch from database in production)
    const categories: Record<string, string> = {
      'cat-1': 'History',
      'cat-2': 'WW2 History',
      'cat-3': 'Australian History',
      'cat-4': 'Geography',
      'cat-5': 'Australian Culture',
      'cat-6': 'NAIDOC Week',
      'cat-7': 'Politics',
      'cat-8': 'US Politics',
    }

    const id = `r-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    const round = {
      id,
      title: title.trim(),
      categoryId,
      categoryName: categories[categoryId] || 'Unknown',
      blurb: blurb?.trim() || undefined,
      questions: questions.map((q: any, index: number) => ({
        id: q.id || `q-${index}`,
        text: q.text.trim(),
        answer: q.answer.trim(),
        explanation: q.explanation?.trim() || undefined,
      })),
      createdAt: now,
      updatedAt: now,
    }

    roundTemplates[id] = round

    return NextResponse.json({ round }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating round template:', error)
    return NextResponse.json(
      { error: 'Failed to create round template', details: error.message },
      { status: 500 }
    )
  }
}

