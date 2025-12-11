/**
 * Printable Quiz Page
 * 
 * This page renders a quiz in a printable format with answer lines.
 * It's designed to be rendered by Playwright for PDF generation.
 * 
 * Access: /printable/quizzes/[id]?pdf=1
 * 
 * This route:
 * - Fetches quiz data from the database
 * - Renders questions with answer lines (worksheet style)
 * - Uses the same fonts and styling as the live quiz
 * - Optimized for A4 printing - compact design to fit 2-3 pages
 * - Bypasses admin layout for clean PDF generation
 */

import { prisma } from '@schoolquiz/db'
import { notFound } from 'next/navigation'

// Mark as dynamic route since we're fetching data
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Round accent colors matching the example design
const ROUND_COLORS = [
  '#6FE8C8', // Round 1 - light teal/turquoise (hsl(165, 68%, 67%))
  '#F1983F', // Round 2 - orange (hsl(30, 80%, 60%))
  '#FACC15', // Round 3 - yellow
  '#8B5CF6', // Round 4 - purple
  '#C084FC', // Finale - lavender
]

function getRoundColor(roundIndex: number, isPeoplesRound: boolean): string {
  if (isPeoplesRound) {
    return ROUND_COLORS[ROUND_COLORS.length - 1] // Finale color
  }
  return ROUND_COLORS[roundIndex % ROUND_COLORS.length]
}

async function getQuizForPrintable(id: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      blurb: true,
      slug: true,
      publicationDate: true,
      colorHex: true,
      rounds: {
        select: {
          id: true,
          index: true,
          title: true,
          blurb: true,
          isPeoplesRound: true,
          questions: {
            select: {
              id: true,
              order: true,
              question: {
                select: {
                  id: true,
                  text: true,
                  answer: true,
                  explanation: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { index: 'asc' },
      },
    },
  })

  return quiz
}

async function getQuiz(id: string) {
  try {
    return await getQuizForPrintable(id)
  } catch (error: any) {
    console.error('[Printable Page] Error fetching quiz:', error)
    throw error
  }
}

export default async function PrintableQuizPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  let id: string = ''
  let quiz: Awaited<ReturnType<typeof getQuizForPrintable>> | null = null
  let error: Error | null = null

  try {
    const resolvedParams = await params
    id = resolvedParams.id

    if (!id) {
      console.error('[Printable Page] No quiz ID provided')
      error = new Error('No quiz ID provided')
    } else {
      console.log('[Printable Page] Fetching quiz:', id)
      quiz = await getQuiz(id)

      if (!quiz) {
        console.error('[Printable Page] Quiz not found:', id)
        error = new Error(`Quiz not found: ${id}`)
      } else {
        console.log('[Printable Page] Quiz found:', quiz.title, 'Rounds:', quiz.rounds.length)
      }
    }
  } catch (err: any) {
    console.error('[Printable Page] Error:', err)
    error = err instanceof Error ? err : new Error(String(err))
  }

  // If there's an error, render an error page that the PDF generator can detect
  if (error || !quiz) {
    return (
      <div className="printable-quiz bg-white p-10 max-w-[210mm] mx-auto" style={{ fontFamily: "'Atkinson Hyperlegible', 'Inter', system-ui, sans-serif", minHeight: '100vh' }}>
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Error Loading Quiz</h1>
          <p className="text-lg text-gray-700 mb-2">
            {error?.message || 'Quiz not found'}
          </p>
          {id && (
            <p className="text-sm text-gray-500">Quiz ID: {id}</p>
          )}
        </div>
      </div>
    )
  }

  // Flatten questions from rounds for numbering
  let questionNumber = 1
  const allQuestions: Array<{
    id: string
    number: number
  }> = []

  quiz.rounds.forEach((round) => {
    round.questions.forEach((qr) => {
      if (qr.question?.text) {
        allQuestions.push({
          id: qr.question.id,
          number: questionNumber++,
        })
      }
    })
  })

  // Check if we have any questions
  if (allQuestions.length === 0) {
    console.warn('[Printable Page] Quiz has no questions:', id)
    return (
      <div className="printable-quiz bg-white p-10 max-w-[210mm] mx-auto" style={{ fontFamily: "'Atkinson Hyperlegible', 'Inter', system-ui, sans-serif", minHeight: '100vh' }}>
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{quiz.title}</h1>
          <p className="text-lg text-gray-700">This quiz has no questions yet.</p>
        </div>
      </div>
    )
  }

  // Format date - use same format as example (15 Jan 2024)
  const quizDate = quiz.publicationDate
    ? new Date(quiz.publicationDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    : null

  // Extract quiz number from slug (e.g., "quiz-10" -> "10")
  const quizNumber = quiz.slug?.replace(/[^0-9]/g, '') || ''

  return (
    <div className="printable-quiz bg-white" style={{ fontFamily: "'Atkinson Hyperlegible', 'Inter', system-ui, sans-serif", minHeight: '100vh', padding: '50px 50px', maxWidth: '210mm', margin: '0 auto' }}>
      {/* Inline styles for print optimization */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @page {
            size: A4;
            margin: 0;
          }
          
          @media print {
            body { padding: 0; margin: 0; height: auto !important; }
            html { height: auto !important; }
            .printable-quiz { padding: 0 !important; max-width: none; height: auto !important; min-height: auto !important; }
            .page-content { padding: 50px 50px 70px 50px; }
            .questions-page { page-break-after: always; padding-top: 50px; }
            .answers-page { page-break-before: always; padding-top: 30px; }
          }
          
          /* Ensure full height for PDF generation */
          body {
            height: auto !important;
            min-height: 100% !important;
            margin: 0;
            padding: 0;
          }
          html {
            height: auto !important;
            margin: 0;
            padding: 0;
          }
          .printable-quiz {
            height: auto !important;
          }
        ` }} />

      {/* QUESTIONS PAGE */}
      <div className="questions-page page-content">
        {/* Header Section - Centered */}
        <div className="text-center mb-12">
          {/* Main Quiz Title - Smaller, Bold, Centered, Black */}
          <h1 className="text-black mb-4 leading-tight" style={{ fontSize: '32px', fontWeight: 700, fontFamily: "'Atkinson Hyperlegible', 'Inter', system-ui, sans-serif" }}>
            {quiz.title}
          </h1>

          {/* Quiz # Badge - Light Gray Rounded Badge with Border */}
          {quizNumber && (
            <div className="inline-block">
              <div className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-1.5" style={{ borderRadius: '8px' }}>
                <span className="text-sm font-medium text-black" style={{ fontSize: '13px', fontWeight: 500 }}>Quiz #{quizNumber}</span>
              </div>
            </div>
          )}
        </div>

        {/* Questions grouped by round */}
        <div className="questions">
          {quiz.rounds.map((round, roundIndex) => {
            const roundColor = getRoundColor(round.index, round.isPeoplesRound)

            const roundQuestions = round.questions
              .filter(qr => qr.question?.text)
              .map((qr) => {
                const qNum = allQuestions.find(q => q.id === qr.question?.id)?.number
                if (!qNum) return null
                return { ...qr, questionNumber: qNum }
              })
              .filter((qr): qr is NonNullable<typeof qr> => qr !== null)

            if (roundQuestions.length === 0) return null

            // Format round title: "ROUND 1: BACK TO THE PAST"
            const roundTitle = round.isPeoplesRound
              ? "PEOPLE'S QUESTION"
              : `ROUND ${round.index + 1}${round.title ? `: ${round.title.toUpperCase()}` : ''}`

            return (
              <div key={round.id} className="mb-10">
                {/* Round Title Badge - Left Aligned, Colored Background, White Text, Very Rounded Pills */}
                <div className="mb-6">
                  <div
                    className="inline-block px-6 py-2.5"
                    style={{
                      backgroundColor: roundColor,
                      borderRadius: '9999px'
                    }}
                  >
                    <h2 className="text-white font-bold uppercase tracking-wide" style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.3px' }}>
                      {roundTitle}
                    </h2>
                  </div>
                </div>

                {/* Questions in this round */}
                <div className="space-y-5">
                  {roundQuestions.map((qr) => {
                    return (
                      <div
                        key={qr.id}
                        className="mb-5"
                        style={{ pageBreakInside: 'avoid' }}
                      >
                        {/* Question - Numbered, Bold, Black */}
                        <div className="mb-2">
                          <span className="text-black font-bold" style={{ fontSize: '16px', fontWeight: 700, fontFamily: "'Atkinson Hyperlegible', 'Inter', system-ui, sans-serif" }}>
                            {qr.questionNumber}. {qr.question?.text}
                          </span>
                        </div>

                        {/* Single Answer Line - Thin, Light Gray Line (not a box) */}
                        <div className="mt-2">
                          <div className="border-b border-gray-300" style={{ borderWidth: '1px', borderColor: '#D1D5DB', height: '1px' }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer on questions page */}
        <div className="mt-12 pt-4 text-center" style={{ fontSize: '11px', color: '#6B7280', fontFamily: "'Atkinson Hyperlegible', 'Inter', system-ui, sans-serif" }}>
          theschoolquiz.com.au
        </div>
      </div>

      {/* ANSWERS PAGE */}
      <div className="answers-page page-content">
        {/* Header Section - Centered */}
        <div className="text-center mb-12">
          {/* Main Quiz Title - Smaller, Bold, Centered, Black */}
          <h1 className="text-black mb-4 leading-tight" style={{ fontSize: '32px', fontWeight: 700, fontFamily: "'Atkinson Hyperlegible', 'Inter', system-ui, sans-serif" }}>
            {quiz.title}
          </h1>

          {/* Quiz # Badge - Light Gray Rounded Badge with Border */}
          {quizNumber && (
            <div className="inline-block">
              <div className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-1.5" style={{ borderRadius: '8px' }}>
                <span className="text-sm font-medium text-black" style={{ fontSize: '13px', fontWeight: 500 }}>Quiz #{quizNumber}</span>
              </div>
            </div>
          )}

          {/* Answers Heading */}
          <div className="mt-8 mb-10">
            <h2 className="text-black font-bold" style={{ fontSize: '24px', fontWeight: 700 }}>Answers</h2>
          </div>
        </div>

        {/* Answers grouped by round */}
        <div className="answers">
          {quiz.rounds.map((round, roundIndex) => {
            const roundColor = getRoundColor(round.index, round.isPeoplesRound)
            const roundQuestions = round.questions
              .filter(qr => qr.question?.text)
              .map((qr) => {
                const qNum = allQuestions.find(q => q.id === qr.question?.id)?.number
                if (!qNum) return null
                return { ...qr, questionNumber: qNum }
              })
              .filter((qr): qr is NonNullable<typeof qr> => qr !== null)

            if (roundQuestions.length === 0) return null

            // Format round title: "ROUND 1: BACK TO THE PAST"
            const roundTitle = round.isPeoplesRound
              ? "PEOPLE'S QUESTION"
              : `ROUND ${round.index + 1}${round.title ? `: ${round.title.toUpperCase()}` : ''}`

            return (
              <div key={`answers-${round.id}`} className="mb-8">
                {/* Round Title Badge - Left Aligned, Colored Background, White Text, Very Rounded Pills */}
                <div className="mb-5">
                  <div
                    className="inline-block px-6 py-2.5"
                    style={{
                      backgroundColor: roundColor,
                      borderRadius: '9999px'
                    }}
                  >
                    <h2 className="text-white font-bold uppercase tracking-wide" style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.3px' }}>
                      {roundTitle}
                    </h2>
                  </div>
                </div>

                {/* Answers */}
                <div className="space-y-3">
                  {roundQuestions.map((qr) => (
                    <div key={`answer-${qr.id}`} className="mb-3">
                      <div className="text-base" style={{ fontSize: '16px', fontFamily: "'Atkinson Hyperlegible', 'Inter', system-ui, sans-serif" }}>
                        <span className="font-bold">{qr.questionNumber}.</span>{' '}
                        <span>{qr.question?.answer || ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer on answers page */}
        <div className="mt-12 pt-4 text-center" style={{ fontSize: '11px', color: '#6B7280', fontFamily: "'Atkinson Hyperlegible', 'Inter', system-ui, sans-serif" }}>
          theschoolquiz.com.au
        </div>
      </div>
    </div>
  )
}
