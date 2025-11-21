// PDF Generator for Quiz PDFs
// This generates PDFs faithful to the grid mode design with branding and colors
// Uses pdfkit which is already in package.json

import PDFDocument from 'pdfkit'
import { join } from 'path'
import { readFileSync } from 'fs'

export interface QuizPDFData {
  title: string
  slug?: string | null
  colorHex?: string | null
  weekISO?: string | null
  rounds: Array<{
    title: string
    isPeoplesRound: boolean
    blurb?: string | null
    questions: Array<{
      text: string
      answer: string
      explanation?: string
    }>
  }>
}

// Round accent colors matching the grid mode design
const ROUND_COLORS = [
  '#2DD4BF', // Round 1 - teal
  '#F97316', // Round 2 - orange
  '#FACC15', // Round 3 - yellow
  '#8B5CF6', // Round 4 - purple
  '#C084FC', // Finale - lavender
]

// Helper to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

// Helper to get round color
function getRoundColor(roundIndex: number, isPeoplesRound: boolean): string {
  if (isPeoplesRound) {
    return ROUND_COLORS[ROUND_COLORS.length - 1] // Finale color
  }
  return ROUND_COLORS[roundIndex % ROUND_COLORS.length]
}

// Helper to draw rounded rectangle (PDFKit doesn't have this built-in)
function drawRoundedRect(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string | null = null,
  stroke: string | null = null,
  lineWidth: number = 1
) {
  // Draw rounded rectangle using paths
  doc.save()
  
  // Create rounded rectangle path
  doc.path(`M ${x + radius} ${y}
    L ${x + width - radius} ${y}
    Q ${x + width} ${y} ${x + width} ${y + radius}
    L ${x + width} ${y + height - radius}
    Q ${x + width} ${y + height} ${x + width - radius} ${y + height}
    L ${x + radius} ${y + height}
    Q ${x} ${y + height} ${x} ${y + height - radius}
    L ${x} ${y + radius}
    Q ${x} ${y} ${x + radius} ${y}
    Z`)
  
  if (fill) {
    doc.fill(fill)
  }
  
  if (stroke) {
    doc.strokeColor(stroke)
    doc.lineWidth(lineWidth)
    doc.stroke()
  }
  
  doc.restore()
}

export async function generateQuizPDF(data: QuizPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Validate input data
      if (!data || !data.title) {
        throw new Error('PDF data is invalid: missing title')
      }
      
      if (!data.rounds || data.rounds.length === 0) {
        throw new Error('PDF data is invalid: no rounds provided')
      }
      
      const roundsWithQuestions = data.rounds.filter(r => r.questions && r.questions.length > 0)
      if (roundsWithQuestions.length === 0) {
        throw new Error('PDF data is invalid: no rounds with questions found')
      }
      
      console.log('[PDF Generator] Starting PDF generation')
      console.log('[PDF Generator] Title:', data.title)
      console.log('[PDF Generator] Rounds:', data.rounds.length)
      console.log('[PDF Generator] Questions:', data.rounds.reduce((sum, r) => sum + (r.questions?.length || 0), 0))
      
      // Create PDF document
      // Workaround for Next.js: Register fonts explicitly if PDFKit can't find them
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        info: {
          Title: data.title,
          Author: 'The School Quiz',
          Subject: 'Quiz',
        },
      })
      
      // Try to register fonts explicitly if needed (workaround for Next.js font resolution)
      try {
        // Try to find PDFKit's font data directory
        const pdfkitPath = require.resolve('pdfkit')
        const fontDataPath = join(pdfkitPath.replace(/pdfkit[^/]*$/, ''), 'pdfkit', 'js', 'data')
        
        // Register Helvetica font explicitly if available
        try {
          const helveticaAfm = readFileSync(join(fontDataPath, 'Helvetica.afm'), 'utf8')
          // PDFKit should handle this automatically, but this ensures the file is accessible
          console.log('[PDF Generator] Font files accessible')
        } catch (fontErr) {
          // Try alternative paths
          const altPaths = [
            join(process.cwd(), 'node_modules', 'pdfkit', 'js', 'data'),
            join(process.cwd(), 'apps', 'admin', 'node_modules', 'pdfkit', 'js', 'data'),
            join(process.cwd(), 'apps', 'admin', 'public', 'pdfkit-fonts'),
          ]
          
          let fontFound = false
          for (const altPath of altPaths) {
            try {
              const testPath = join(altPath, 'Helvetica.afm')
              readFileSync(testPath, 'utf8')
              console.log('[PDF Generator] Found fonts at:', altPath)
              fontFound = true
              break
            } catch {
              // Continue searching
            }
          }
          
          if (!fontFound) {
            console.warn('[PDF Generator] Could not find font files, PDFKit may use fallbacks')
          }
        }
      } catch (err) {
        console.warn('[PDF Generator] Font registration skipped:', err)
      }

      const buffers: Buffer[] = []
      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers)
        resolve(pdfBuffer)
      })
      doc.on('error', reject)

      // Page dimensions
      const pageWidth = doc.page.width
      const pageHeight = doc.page.height
      const margin = 40
      const contentWidth = pageWidth - margin * 2

      // Start position - matching live spacing
      let currentY = margin + 20

      // Quiz number and date as pill badges (top left) - matching live exactly
      const quizLabel = data.slug ? `#${data.slug}` : ''
      const quizDate = data.weekISO
        ? new Date(data.weekISO).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : null

      if (quizLabel || quizDate) {
        const pillY = currentY
        const pillHeight = 32 // px-4 py-2 = 32px height
        const pillRadius = 999 // rounded-full
        
        // Draw pill badges
        let pillX = margin
        
        if (quizLabel) {
          // Quiz number pill - light gray background
          const pillWidth = 48
          drawRoundedRect(doc, pillX, pillY, pillWidth, pillHeight, pillRadius, '#F3F4F6', null, 0)
          doc.fontSize(12)
            .font('Helvetica-Bold') // font-semibold
            .fillColor('#374151')
          doc.text(quizLabel, pillX + 12, pillY + 9, {
            width: 24,
          })
          pillX += pillWidth + 12 // gap-3 = 12px
        }
        
        if (quizDate) {
          // Date pill
          const pillWidth = 100
          drawRoundedRect(doc, pillX, pillY, pillWidth, pillHeight, pillRadius, '#F3F4F6', null, 0)
          doc.fontSize(12)
            .font('Helvetica') // font-medium
            .fillColor('#374151')
          doc.text(quizDate, pillX + 12, pillY + 9, {
            width: 76,
          })
        }
        
        currentY += pillHeight + 24 // gap-6 = 24px
      } else {
        currentY += 20
      }

      // Quiz title - Large and extrabold (clamp(2.4rem, 2rem + 1.4vw, 3.2rem) = ~38-51px)
      doc.fontSize(44) // Matching clamp max
        .font('Helvetica-Bold')
        .fillColor('#000000')
      const titleHeight = doc.heightOfString(data.title, {
        width: contentWidth,
      })
      doc.text(data.title, margin, currentY, {
        width: contentWidth,
        lineGap: 4,
      })
      currentY += titleHeight + 20

      // Round tags/categories below title (if available) - matching live
      const roundTags = data.rounds
        .slice(0, 4)
        .map(r => r.title)
        .filter(Boolean)
      
      if (roundTags.length > 0) {
        let tagX = margin
        const tagHeight = 28 // py-1.5 = ~28px
        const tagPadding = 14 // px-3.5 = 14px
        
        doc.fontSize(14) // text-sm = 14px
        roundTags.forEach((tag, idx) => {
          const tagWidth = doc.widthOfString(tag) + tagPadding * 2
          
          // Check if we need to wrap to next line
          if (tagX + tagWidth > margin + contentWidth && tagX > margin) {
            tagX = margin
            currentY += tagHeight + 8
          }
          
          // Draw tag pill - matching live style
          drawRoundedRect(doc, tagX, currentY, tagWidth, tagHeight, 999, '#F3F4F6', null, 0)
          doc.font('Helvetica') // font-medium
            .fillColor('#374151')
          doc.text(tag, tagX + tagPadding, currentY + 7, {
            width: tagWidth - tagPadding * 2,
          })
          
          tagX += tagWidth + 8 // gap-2 = 8px
        })
        
        currentY += tagHeight + 32 // gap-6 after tags = 32px
      } else {
        currentY += 24
      }

      // Questions section
      let questionNumber = 1

      data.rounds.forEach((round, roundIndex) => {
        const roundColor = getRoundColor(roundIndex, round.isPeoplesRound)
        const rgb = hexToRgb(roundColor)

        // Skip rounds with no questions
        if (!round.questions || round.questions.length === 0) {
          return
        }

        // Check if we need a new page
        if (currentY > pageHeight - 220) {
          doc.addPage()
          currentY = margin + 20
        }

        // Round header with colored background - matching live design
        const roundTitle = round.isPeoplesRound
          ? "People's Question"
          : `Round ${roundIndex + 1}: ${round.title}`
        
        const roundPadding = 20
        const roundCornerRadius = 16 // Equivalent to rounded-[26px] scaled for PDF

        // Calculate round section height
        doc.fontSize(32)
          .font('Helvetica-Bold')
        const roundTitleHeight = doc.heightOfString(roundTitle, {
          width: contentWidth - roundPadding * 2,
        })
        
        let blurbHeight = 0
        if (round.blurb) {
          doc.fontSize(14)
            .font('Helvetica')
          blurbHeight = doc.heightOfString(round.blurb, {
            width: contentWidth - roundPadding * 2,
          })
        }
        
        const roundSectionHeight = roundTitleHeight + blurbHeight + roundPadding * 2 + (round.blurb ? 20 : 0)

        // Draw rounded colored background for round section
        if (rgb) {
          // Color mix: 25% accent, 75% white (matching live design)
          const mixedR = Math.round(rgb.r * 0.25 + 255 * 0.75)
          const mixedG = Math.round(rgb.g * 0.25 + 255 * 0.75)
          const mixedB = Math.round(rgb.b * 0.25 + 255 * 0.75)
          
          // Round background with rounded corners
          drawRoundedRect(
            doc,
            margin,
            currentY,
            contentWidth,
            roundSectionHeight,
            roundCornerRadius,
            `rgb(${mixedR}, ${mixedG}, ${mixedB})`,
            null,
            0
          )
          
          // Border with accent color (35% mix for border)
          const borderR = Math.round(rgb.r * 0.35 + 255 * 0.65)
          const borderG = Math.round(rgb.g * 0.35 + 255 * 0.65)
          const borderB = Math.round(rgb.b * 0.35 + 255 * 0.65)
          drawRoundedRect(
            doc,
            margin,
            currentY,
            contentWidth,
            roundSectionHeight,
            roundCornerRadius,
            null,
            `rgb(${borderR}, ${borderG}, ${borderB})`,
            2
          )
        }

        // Round title text - large bold (clamp(2.75rem, 7vw, 4.5rem) ≈ 44-72px)
        doc.fontSize(48)
          .font('Helvetica-Bold')
          .fillColor(rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '#000000')
        doc.text(roundTitle, margin + roundPadding, currentY + roundPadding, {
          width: contentWidth - roundPadding * 2,
        })

        // Round blurb if available
        if (round.blurb) {
          doc.fontSize(16)
            .font('Helvetica')
            .fillColor('#374151')
          doc.text(round.blurb, margin + roundPadding, currentY + roundTitleHeight + roundPadding + 15, {
            width: contentWidth - roundPadding * 2,
          })
        }

        currentY = currentY + roundSectionHeight + 20

        // Questions in this round
        round.questions.forEach((question) => {
          // Skip questions without text
          if (!question.text || question.text.trim() === '') {
            return
          }

          // Check if we need a new page
          if (currentY > pageHeight - 120) {
            doc.addPage()
            currentY = margin + 20
          }

          // Question card with rounded corners - matching live design
          const questionCardPadding = 24
          const questionCardY = currentY
          const questionCornerRadius = 16 // Rounded corners like live version
          
          // Calculate text height - matching live (clamp(1.5rem, 1.2rem + 2vw, 2.5rem) ≈ 24-40px)
          doc.fontSize(28)
            .font('Helvetica-Bold')
          const textHeight = doc.heightOfString(
            `${questionNumber}. ${question.text}`,
            {
              width: contentWidth - questionCardPadding * 2,
            }
          )
          const cardHeight = Math.max(70, textHeight + questionCardPadding * 2)

          // Draw question card with rounded corners and light background
          // Background: color-mix(92% white, 8% accent) - matching live design
          if (rgb) {
            const cardR = Math.round(255 * 0.92 + rgb.r * 0.08)
            const cardG = Math.round(255 * 0.92 + rgb.g * 0.08)
            const cardB = Math.round(255 * 0.92 + rgb.b * 0.08)
            drawRoundedRect(
              doc,
              margin,
              questionCardY,
              contentWidth,
              cardHeight,
              questionCornerRadius,
              `rgb(${cardR}, ${cardG}, ${cardB})`,
              null,
              0
            )
            
            // Border with accent color (15% mix)
            const borderR = Math.round(rgb.r * 0.15 + 255 * 0.85)
            const borderG = Math.round(rgb.g * 0.15 + 255 * 0.85)
            const borderB = Math.round(rgb.b * 0.15 + 255 * 0.85)
            drawRoundedRect(
              doc,
              margin,
              questionCardY,
              contentWidth,
              cardHeight,
              questionCornerRadius,
              null,
              `rgb(${borderR}, ${borderG}, ${borderB})`,
              2
            )
          } else {
            drawRoundedRect(
              doc,
              margin,
              questionCardY,
              contentWidth,
              cardHeight,
              questionCornerRadius,
              '#FFFFFF',
              null,
              0
            )
            drawRoundedRect(
              doc,
              margin,
              questionCardY,
              contentWidth,
              cardHeight,
              questionCornerRadius,
              null,
              '#E5E7EB',
              2
            )
          }

          // Question number and text - large bold
          doc.fontSize(28)
            .font('Helvetica-Bold')
            .fillColor('#000000')
            .text(
              `${questionNumber}. ${question.text}`,
              margin + questionCardPadding,
              questionCardY + questionCardPadding,
              {
                width: contentWidth - questionCardPadding * 2,
              }
            )

          currentY = questionCardY + cardHeight + 16
          questionNumber++
        })

        currentY += 10
      })

      // Answers section on new page
      doc.addPage()
      currentY = margin + 20

      // Answers header
      doc.fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#000000')
      const answersHeaderHeight = doc.heightOfString('Answers', {
        width: contentWidth,
        align: 'center',
      })
      doc.text('Answers', margin, currentY, {
        width: contentWidth,
        align: 'center',
      })
      currentY += answersHeaderHeight + 30

      // Answers by round
      questionNumber = 1

      data.rounds.forEach((round, roundIndex) => {
        // Skip rounds with no questions
        if (!round.questions || round.questions.length === 0) {
          return
        }

        const roundColor = getRoundColor(roundIndex, round.isPeoplesRound)
        const rgb = hexToRgb(roundColor)

        // Check if we need a new page
        if (currentY > pageHeight - 120) {
          doc.addPage()
          currentY = margin + 20
        }

        // Round header in answers section
        const roundTitle = round.isPeoplesRound
          ? "People's Question"
          : `Round ${roundIndex + 1}: ${round.title}`

        doc.fontSize(16)
          .font('Helvetica-Bold')
          .fillColor(rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '#000000')
        const answerRoundTitleHeight = doc.heightOfString(roundTitle, {
          underline: true,
        })
        doc.text(roundTitle, margin, currentY, {
          underline: true,
        })
        currentY += answerRoundTitleHeight + 15

        // Answers
        round.questions.forEach((question) => {
          // Skip questions without text
          if (!question.text || question.text.trim() === '') {
            return
          }

          // Check if we need a new page
          if (currentY > pageHeight - 80) {
            doc.addPage()
            currentY = margin + 20
          }

          doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#000000')
          
          const answerY = currentY
          const answerText = question.answer || ''
          
          // Draw question number
          doc.text(`${questionNumber}.`, margin, answerY, {
            width: 30,
          })

          // Calculate answer height
          doc.fontSize(12)
            .font('Helvetica')
          let answerHeight = doc.heightOfString(answerText, {
            width: contentWidth - 35,
          })
          
          // Draw answer text
          doc.text(answerText, margin + 35, answerY, {
            width: contentWidth - 35,
          })

          let explanationHeight = 0
          if (question.explanation) {
            doc.fontSize(10)
              .font('Helvetica-Oblique')
              .fillColor('#666666')
            explanationHeight = doc.heightOfString(question.explanation, {
              width: contentWidth - 35,
            })
            doc.text(`   ${question.explanation}`, margin + 35, answerY + answerHeight + 5, {
              width: contentWidth - 35,
            })
            .fillColor('#000000')
          }

          currentY = answerY + answerHeight + explanationHeight + 12
          questionNumber++
        })

        currentY += 15
      })

      // Footer on last page
      const footerY = pageHeight - 30
      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#999999')
        .text(
          'Generated by The School Quiz',
          margin,
          footerY,
          {
            width: contentWidth,
            align: 'center',
          }
        )

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

