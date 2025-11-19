import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'

/**
 * POST /api/admin/quizzes/[id]/pdf/approve
 * Approve a generated PDF, making it available on the quizzes page
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production
    // const user = await getCurrentUser()
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { id } = await params

    // Check if quiz exists and has a generated PDF, including rounds and questions
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: {
        id: true,
        pdfUrl: true,
        pdfStatus: true,
        createdBy: true,
        rounds: {
          include: {
            questions: {
              include: {
                question: true,
              },
            },
          },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    if (!quiz.pdfUrl) {
      return NextResponse.json(
        { error: 'No PDF generated for this quiz. Please generate PDF first.' },
        { status: 400 }
      )
    }

    if (quiz.pdfStatus !== 'generated') {
      return NextResponse.json(
        { error: `PDF status is "${quiz.pdfStatus}", expected "generated"` },
        { status: 400 }
      )
    }

    // Save all questions from the quiz to the question bank
    const questionsToSave: Array<{
      text: string
      answer: string
      explanation: string | null
      categoryId: string
      createdBy: string
      isPeopleQuestion: boolean
      status: string
    }> = []

    for (const round of quiz.rounds) {
      const isPeopleRound = round.isPeoplesRound
      
      for (const quizRoundQuestion of round.questions) {
        const question = quizRoundQuestion.question
        
        // Check if question already exists in question bank (by text and answer)
        const existingQuestion = await prisma.question.findFirst({
          where: {
            text: question.text,
            answer: question.answer,
            categoryId: round.categoryId,
          },
        })

        if (!existingQuestion) {
          // Create new question in question bank
          questionsToSave.push({
            text: question.text,
            answer: question.answer,
            explanation: question.explanation,
            categoryId: round.categoryId,
            createdBy: quiz.createdBy,
            isPeopleQuestion: isPeopleRound,
            status: 'published', // Questions from approved quizzes are published
          })
        } else {
          // Update existing question to mark as used and update people question flag
          await prisma.question.update({
            where: { id: existingQuestion.id },
            data: {
              isPeopleQuestion: isPeopleRound || existingQuestion.isPeopleQuestion,
              isUsed: true,
              lastUsedAt: new Date(),
              usageCount: { increment: 1 },
            },
          })
        }
      }
    }

    // Create all new questions in a transaction
    if (questionsToSave.length > 0) {
      await prisma.$transaction(
        questionsToSave.map((q) =>
          prisma.question.create({
            data: {
              ...q,
              difficulty: 0.5, // Default difficulty
              tags: '',
              usageCount: 1,
              isUsed: true,
              lastUsedAt: new Date(),
            },
          })
        )
      )
    }

    // Update PDF status to approved
    const updatedQuiz = await prisma.quiz.update({
      where: { id },
      data: {
        pdfStatus: 'approved',
      },
      select: {
        id: true,
        pdfUrl: true,
        pdfStatus: true,
      },
    })

    return NextResponse.json({
      success: true,
      quiz: updatedQuiz,
      questionsSaved: questionsToSave.length,
    })
  } catch (error: any) {
    console.error('Error approving PDF:', error)
    return NextResponse.json(
      { error: 'Failed to approve PDF', details: error.message },
      { status: 500 }
    )
  }
}


