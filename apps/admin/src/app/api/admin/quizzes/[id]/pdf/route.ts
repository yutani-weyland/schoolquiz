import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@schoolquiz/db'
import { supabaseAdmin } from '@/lib/supabase'
import { generateQuizPdf } from '@/lib/generateQuizPdf'

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

    // Fetch quiz from database
    const quiz = await prisma.quiz.findUnique({
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

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Validate quiz has rounds and questions
    if (!quiz.rounds || quiz.rounds.length === 0) {
      return NextResponse.json(
        { error: 'Quiz has no rounds. Please add rounds before generating PDF.' },
        { status: 400 }
      )
    }

    // Validate each round has questions
    const roundsWithQuestions = quiz.rounds.filter((round: any) => 
      round.questions && round.questions.length > 0
    )
    
    if (roundsWithQuestions.length === 0) {
      return NextResponse.json(
        { error: 'Quiz has no questions. Please add questions to rounds before generating PDF.' },
        { status: 400 }
      )
    }

    console.log('[PDF Generation] Starting PDF generation for quiz:', id)
    console.log('[PDF Generation] Quiz title:', quiz.title)
    console.log('[PDF Generation] Number of rounds:', quiz.rounds.length)
    console.log('[PDF Generation] Total questions:', quiz.rounds.reduce((sum: number, r: any) => sum + (r.questions?.length || 0), 0))

    // Generate PDF using Playwright
    let pdfBuffer: Buffer
    try {
      // Get base URL from request or environment
      // In development, derive from request URL to get correct port
      let baseUrl = process.env.NEXT_PUBLIC_APP_URL
      
      if (!baseUrl) {
        if (process.env.VERCEL_URL) {
          baseUrl = `https://${process.env.VERCEL_URL}`
        } else {
          // Derive from request URL to get correct port
          const url = new URL(request.url)
          baseUrl = `${url.protocol}//${url.host}`
        }
      }
      
      console.log('[PDF Generation] Using base URL:', baseUrl)
      pdfBuffer = await generateQuizPdf(id, baseUrl)
      console.log('[PDF Generation] PDF generated successfully, size:', pdfBuffer.length, 'bytes')
    } catch (pdfError: any) {
      console.error('[PDF Generation] PDF generation failed:', pdfError)
      console.error('[PDF Generation] Error message:', pdfError.message)
      console.error('[PDF Generation] Error stack:', pdfError.stack)
      return NextResponse.json(
        { 
          error: 'Failed to generate PDF', 
          details: pdfError.message || 'Unknown error',
          stack: process.env.NODE_ENV === 'development' ? pdfError.stack : undefined,
        },
        { status: 500 }
      )
    }

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
    console.error('[PDF Route] Error generating PDF:', error)
    console.error('[PDF Route] Error message:', error.message)
    console.error('[PDF Route] Error stack:', error.stack)
    console.error('[PDF Route] Error name:', error.name)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF', 
        details: error.message || 'Unknown error',
        type: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

