import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { generateQuizPDF } from '@/lib/pdf-generator'
import { getDummyQuizDetail } from '@/lib/dummy-quiz-data'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

/**
 * POST /api/admin/quizzes/[id]/pdf
 * Generate PDF for a quiz
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

    // TODO: Fetch quiz from database
    // For now, use dummy data
    const quiz = getDummyQuizDetail(id)
    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Transform quiz data for PDF
    const pdfData = {
      title: quiz.title,
      rounds: quiz.rounds.map(round => ({
        title: round.category.name,
        isPeoplesRound: false,
        questions: round.questions.map(qr => ({
          text: qr.question.text,
          answer: qr.question.answer,
          explanation: qr.question.explanation || undefined,
        })),
      })),
    }

    // Generate PDF
    const pdfBuffer = await generateQuizPDF(pdfData)

    // Save to public/pdfs directory
    const pdfsDir = join(process.cwd(), 'public', 'pdfs')
    try {
      await mkdir(pdfsDir, { recursive: true })
    } catch (err: any) {
      if (err.code !== 'EEXIST') throw err
    }

    const filename = `quiz-${id}-${Date.now()}.pdf`
    const filepath = join(pdfsDir, filename)
    await writeFile(filepath, pdfBuffer)

    const pdfUrl = `/pdfs/${filename}`

    // TODO: Update quiz.pdfUrl in database

    return NextResponse.json({
      success: true,
      pdfUrl,
    })
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    )
  }
}

