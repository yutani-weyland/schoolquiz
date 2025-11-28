import { NextRequest, NextResponse } from 'next/server'
import { validateRequest, validateParams } from '@/lib/api-validation'
import { CreateRoundSchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api-error'
import { z } from 'zod'

const ParamsSchema = z.object({ id: z.string().min(1) })

// Import the shared round templates storage
// In production, this would be a database
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

// Initialize with dummy data (same as in route.ts)
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
 * GET /api/admin/rounds/templates/[id]
 * Get a specific round template by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await validateParams(await params, ParamsSchema)
    const round = roundTemplates[id]

    if (!round) {
      return NextResponse.json(
        { error: 'Round template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ round })
  } catch (error: any) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/admin/rounds/templates/[id]
 * Update a round template
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await validateParams(await params, ParamsSchema)
    
    if (!roundTemplates[id]) {
      return NextResponse.json(
        { error: 'Round template not found' },
        { status: 404 }
      )
    }

    // Validate request body with Zod
    const body = await validateRequest(request, CreateRoundSchema)
    const { title, categoryId, blurb, questions } = body

    // Get category name
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

    const round = {
      ...roundTemplates[id],
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
      updatedAt: new Date().toISOString(),
    }

    roundTemplates[id] = round

    return NextResponse.json({ round })
  } catch (error: any) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/admin/rounds/templates/[id]
 * Delete a round template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await validateParams(await params, ParamsSchema)

    if (!roundTemplates[id]) {
      return NextResponse.json(
        { error: 'Round template not found' },
        { status: 404 }
      )
    }

    delete roundTemplates[id]

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return handleApiError(error)
  }
}

