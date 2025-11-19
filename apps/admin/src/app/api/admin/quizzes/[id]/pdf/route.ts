import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { generateQuizPDF } from '@/lib/pdf-generator'
import { getDummyQuizDetail } from '@/lib/dummy-quiz-data'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@schoolquiz/db'
import { supabaseAdmin } from '@/lib/supabase'

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

    // Try to fetch quiz from database first, fall back to dummy data
    let quiz: any = null
    try {
      quiz = await prisma.quiz.findUnique({
        where: { id },
        include: {
          rounds: {
            include: {
              category: true,
              questions: {
                include: {
                  question: true,
                },
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { index: 'asc' },
          },
        },
      })
    } catch (dbError) {
      console.log('Database fetch failed, using dummy data:', dbError)
      // Fall back to dummy data for testing
      quiz = getDummyQuizDetail(id)
    }

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Transform quiz data for PDF
    const pdfData = {
      title: quiz.title,
      rounds: quiz.rounds.map((round: any) => ({
        title: round.title || round.category?.name || `Round ${round.index + 1}`,
        isPeoplesRound: round.isPeoplesRound || false,
        questions: round.questions?.map((qr: any) => ({
          text: qr.question?.text || qr.text,
          answer: qr.question?.answer || qr.answer,
          explanation: qr.question?.explanation || qr.explanation || undefined,
        })) || [],
      })),
    }

    // Generate PDF
    const pdfBuffer = await generateQuizPDF(pdfData)

    // Save PDF - try Supabase storage first, fall back to local filesystem
    const filename = `quiz-${id}-${Date.now()}.pdf`
    let pdfUrl: string

    // Try Supabase storage if available
    if (supabaseAdmin) {
      try {
        const filePath = `quiz-pdfs/${filename}`
        const { data, error } = await supabaseAdmin.storage
          .from('quiz-pdfs')
          .upload(filePath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: false,
          })

        if (error) {
          console.warn('Supabase storage upload failed, falling back to local:', error)
          throw error
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from('quiz-pdfs')
          .getPublicUrl(filePath)

        pdfUrl = urlData.publicUrl
        console.log('PDF uploaded to Supabase storage:', pdfUrl)
      } catch (storageError) {
        console.warn('Supabase storage failed, using local filesystem:', storageError)
        // Fall through to local storage
        const pdfsDir = join(process.cwd(), 'public', 'pdfs')
        try {
          await mkdir(pdfsDir, { recursive: true })
        } catch (err: any) {
          if (err.code !== 'EEXIST') throw err
        }

        const filepath = join(pdfsDir, filename)
        await writeFile(filepath, pdfBuffer)
        pdfUrl = `/pdfs/${filename}`
      }
    } else {
      // No Supabase configured, use local filesystem
      const pdfsDir = join(process.cwd(), 'public', 'pdfs')
      try {
        await mkdir(pdfsDir, { recursive: true })
      } catch (err: any) {
        if (err.code !== 'EEXIST') throw err
      }

      const filepath = join(pdfsDir, filename)
      await writeFile(filepath, pdfBuffer)
      pdfUrl = `/pdfs/${filename}`
    }

    // Update quiz.pdfUrl and pdfStatus in database
    try {
      await prisma.quiz.update({
        where: { id },
        data: {
          pdfUrl,
          pdfStatus: 'generated',
        },
      })
    } catch (dbError) {
      console.log('Database update failed, continuing with file save:', dbError)
      // Continue even if DB update fails - file is saved
    }

    return NextResponse.json({
      success: true,
      pdfUrl,
      pdfStatus: 'generated',
    })
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    )
  }
}

