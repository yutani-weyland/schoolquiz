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
import { unstable_cache } from 'next/cache'

// Mark as dynamic route since we're fetching data
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Round accent colors matching the grid mode design
const ROUND_COLORS = [
  '#2DD4BF', // Round 1 - teal
  '#F97316', // Round 2 - orange
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
  return unstable_cache(
    async () => getQuizForPrintable(id),
    [`quiz-printable-${id}`],
    { revalidate: 60 }
  )()
}

export default async function PrintableQuizPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  try {
    const { id } = await params
    
    if (!id) {
      console.error('[Printable Page] No quiz ID provided')
      notFound()
    }
    
    const quiz = await getQuiz(id)

    if (!quiz) {
      console.error('[Printable Page] Quiz not found:', id)
      notFound()
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

    // Format date - use same format as example (15 Jan 2024)
    const quizDate = quiz.publicationDate
      ? new Date(quiz.publicationDate).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null

    return (
      <div className="printable-quiz bg-white p-10 max-w-[210mm] mx-auto" style={{ fontFamily: "'Atkinson Hyperlegible', 'Inter', system-ui, sans-serif", minHeight: '100vh' }}>
        {/* Inline styles for print optimization */}
        <style dangerouslySetInnerHTML={{ __html: `
          @page {
            size: A4;
            margin: 0;
          }
          
          @media print {
            body { padding: 0; margin: 0; height: auto !important; }
            html { height: auto !important; }
            .printable-quiz { padding: 0; max-width: none; height: auto !important; min-height: auto !important; }
          }
          
          /* Ensure full height for PDF generation */
          body {
            height: auto !important;
            min-height: 100% !important;
          }
          html {
            height: auto !important;
          }
          .printable-quiz {
            height: auto !important;
          }
        ` }} />
        
        {/* Header */}
        <div className="mb-8">
          {/* Quiz title - large, bold, dark grey */}
          <h1 className="text-[38px] font-bold leading-tight mb-3 text-gray-900 tracking-tight">
            {quiz.title}
          </h1>
          
          {/* Quiz metadata - smaller, lighter grey */}
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
            {quiz.slug && <span>Quiz #{quiz.slug}</span>}
            {quiz.slug && quizDate && <span>•</span>}
            {quizDate && <span>{quizDate}</span>}
          </div>
          
          {/* Horizontal light grey line separator */}
          <div className="h-px bg-gray-300 mb-8"></div>
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
            
            const roundTitle = round.isPeoplesRound
              ? "People's Question"
              : `Round ${round.index + 1}${round.title ? `: ${round.title}` : ''}`
            
            return (
              <div key={round.id} className="mb-10">
                {/* Round Title - bold, colored */}
                <h2 
                  className="text-[32px] font-bold leading-tight mb-2"
                  style={{ color: roundColor }}
                >
                  {roundTitle}
                </h2>
                
                {/* Round description - standard dark grey */}
                {round.blurb && (
                  <p className="text-base text-gray-700 mb-3">
                    {round.blurb}
                  </p>
                )}
                
                {/* Horizontal colored line separator */}
                <div 
                  className="h-px mb-6"
                  style={{ backgroundColor: roundColor }}
                ></div>

                {/* Questions in this round */}
                {roundQuestions.map((qr) => {
                  return (
                    <div
                      key={qr.id}
                      className="mb-6"
                      style={{ pageBreakInside: 'avoid' }}
                    >
                      {/* Question - bold label */}
                      <div className="text-base font-bold text-gray-900 mb-2">
                        <strong>Question {qr.questionNumber}:</strong> {qr.question?.text}
                      </div>
                      
                      {/* Answer lines */}
                      <div className="mt-3 ml-4">
                        <div className="h-6 border-b border-gray-300 mb-2"></div>
                        <div className="h-6 border-b border-gray-300 mb-2"></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Answers Section */}
        <div className="answers-section mt-12 pt-8" style={{ pageBreakBefore: 'always' }}>
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
            
            const roundTitle = round.isPeoplesRound
              ? "People's Question"
              : `Round ${round.index + 1}${round.title ? `: ${round.title}` : ''}`
            
            return (
              <div key={`answers-${round.id}`} className="mb-8">
                {/* Round Title - bold, colored */}
                <h3 
                  className="text-[32px] font-bold mb-2"
                  style={{ color: roundColor }}
                >
                  {roundTitle}
                </h3>
                
                {/* Round description */}
                {round.blurb && (
                  <p className="text-base text-gray-700 mb-3">
                    {round.blurb}
                  </p>
                )}
                
                {/* Horizontal colored line separator */}
                <div 
                  className="h-px mb-4"
                  style={{ backgroundColor: roundColor }}
                ></div>
                
                {/* Answers with colored vertical line */}
                {roundQuestions.map((qr) => (
                  <div key={`answer-${qr.id}`} className="mb-4">
                    <div className="flex">
                      {/* Colored vertical line */}
                      <div 
                        className="w-0.5 mr-3 flex-shrink-0"
                        style={{ backgroundColor: roundColor }}
                      ></div>
                      
                      {/* Answer content */}
                      <div className="flex-1">
                        <div className="text-base">
                          <span className="font-bold">{qr.questionNumber}.</span>{' '}
                          <span>{qr.question?.answer || ''}</span>
                        </div>
                        {qr.question?.explanation && (
                          <div className="text-sm text-gray-600 italic mt-1 ml-6">
                            {qr.question.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
        
        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          Generated by The School Quiz
        </div>
      </div>
    )
  } catch (error: any) {
    console.error('[Printable Page] Error rendering page:', error)
    throw error
  }
}
