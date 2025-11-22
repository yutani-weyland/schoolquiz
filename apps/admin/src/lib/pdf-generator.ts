// PDF Generator for Quiz PDFs
// This generates PDFs with logo, colored round pills, two-page layout, and branded footer
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
      
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 60, left: 50, right: 50 },
        info: {
          Title: data.title,
          Author: 'The School Quiz',
          Subject: 'Quiz',
        },
      })
      
      // Try to register fonts explicitly if needed
      try {
        const pdfkitPath = require.resolve('pdfkit')
        const fontDataPath = join(pdfkitPath.replace(/pdfkit[^/]*$/, ''), 'pdfkit', 'js', 'data')
        
        try {
          readFileSync(join(fontDataPath, 'Helvetica.afm'), 'utf8')
          console.log('[PDF Generator] Font files accessible')
        } catch (fontErr) {
          const altPaths = [
            join(process.cwd(), 'node_modules', 'pdfkit', 'js', 'data'),
            join(process.cwd(), 'apps', 'admin', 'node_modules', 'pdfkit', 'js', 'data'),
            join(process.cwd(), 'apps', 'admin', 'public', 'pdfkit-fonts'),
          ]
          
          let fontFound = false
          for (const altPath of altPaths) {
            try {
              readFileSync(join(altPath, 'Helvetica.afm'), 'utf8')
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
      const margin = 50
      const contentWidth = pageWidth - margin * 2

      // Helper function to draw footer with crown icon and thanks message
      const drawFooter = () => {
        const footerY = pageHeight - 40
        doc.fontSize(9)
          .font('Helvetica')
          .fillColor('#666666')
        
        // Crown icon (using text symbol) and website
        doc.text('👑 www.theschoolquiz.com.au', margin, footerY, {
          width: contentWidth,
          align: 'center',
        })
        
        // Thanks for supporting message
        doc.fontSize(8)
          .fillColor('#999999')
        doc.text('Thanks for supporting The School Quiz', margin, footerY + 12, {
          width: contentWidth,
          align: 'center',
        })
      }

      // Helper function to draw answer line
      const drawAnswerLine = (x: number, y: number, width: number) => {
        doc.moveTo(x, y)
          .lineTo(x + width, y)
          .strokeColor('#CCCCCC')
          .lineWidth(0.5)
          .stroke()
      }

      // PAGE 1: Logo, Title, and Rounds 1, 2, 3
      let currentY = margin

      // Logo at the top - "The School Quiz"
      doc.fontSize(28)
        .font('Helvetica-Bold')
        .fillColor('#000000')
      const logoHeight = doc.heightOfString('The School Quiz', {
        width: contentWidth,
        align: 'center',
      })
      doc.text('The School Quiz', margin, currentY, {
        width: contentWidth,
        align: 'center',
      })
      currentY += logoHeight + 15

      // Quiz number pill (small gray rounded rectangle)
      const quizLabel = data.slug ? `Quiz #${data.slug}` : ''
      if (quizLabel) {
        const pillHeight = 20
        const pillPadding = 10
        doc.fontSize(10)
          .font('Helvetica')
        const pillWidth = doc.widthOfString(quizLabel) + pillPadding * 2
        
        // Center the pill
        const pillX = margin + (contentWidth - pillWidth) / 2
        
        drawRoundedRect(doc, pillX, currentY, pillWidth, pillHeight, 10, '#F3F4F6', null, 0)
        doc.fillColor('#374151')
        doc.text(quizLabel, pillX + pillPadding, currentY + 5, {
          width: pillWidth - pillPadding * 2,
        })
        currentY += pillHeight + 10
      }

      // Quiz title
      doc.fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#000000')
      const titleHeight = doc.heightOfString(data.title, {
        width: contentWidth,
        align: 'center',
      })
      doc.text(data.title, margin, currentY, {
        width: contentWidth,
        align: 'center',
      })
      currentY += titleHeight + 30

      // Questions for Rounds 1, 2, 3
      let questionNumber = 1
      const roundsForPage1 = data.rounds.slice(0, 3).filter(r => r.questions && r.questions.length > 0)
      
      roundsForPage1.forEach((round, roundIndex) => {
        const roundColor = getRoundColor(roundIndex, round.isPeoplesRound)
        const rgb = hexToRgb(roundColor)

        // Round header - colored rounded rectangle
        const roundTitle = round.isPeoplesRound
          ? "PEOPLE'S ROUND"
          : `ROUND ${roundIndex + 1}: ${round.title.toUpperCase()}`
        
        const roundHeaderHeight = 30
        const roundHeaderPadding = 15
        
        doc.fontSize(12)
          .font('Helvetica-Bold')
        const roundHeaderWidth = contentWidth
        
        // Draw colored round header
        if (rgb) {
          drawRoundedRect(doc, margin, currentY, roundHeaderWidth, roundHeaderHeight, 8, roundColor, null, 0)
          doc.fillColor('#FFFFFF')
        } else {
          drawRoundedRect(doc, margin, currentY, roundHeaderWidth, roundHeaderHeight, 8, '#F3F4F6', null, 0)
          doc.fillColor('#000000')
        }
        
        doc.text(roundTitle, margin + roundHeaderPadding, currentY + 8, {
          width: roundHeaderWidth - roundHeaderPadding * 2,
        })
        
        currentY += roundHeaderHeight + 15

        // Questions in this round - simple list with answer lines
        round.questions.forEach((question) => {
          if (!question.text || question.text.trim() === '') {
            return
          }

          // Check if we need a new page (shouldn't happen on page 1, but safety check)
          if (currentY > pageHeight - 80) {
            doc.addPage()
            currentY = margin + 20
          }

          // Question number and text
          doc.fontSize(11)
            .font('Helvetica')
            .fillColor('#000000')
          
          const questionText = `${questionNumber}. ${question.text}`
          const questionHeight = doc.heightOfString(questionText, {
            width: contentWidth - 20,
          })
          
          doc.text(questionText, margin + 10, currentY, {
            width: contentWidth - 20,
          })
          
          currentY += questionHeight + 8
          
          // Answer line
          drawAnswerLine(margin + 10, currentY, contentWidth - 20)
          currentY += 15
          
          questionNumber++
        })

        currentY += 10
      })

      // Footer on page 1
      drawFooter()

      // PAGE 2: Rounds 4 and People's Round
      doc.addPage()
      currentY = margin + 20

      // Questions for Rounds 4 and People's Round
      const roundsForPage2 = data.rounds.slice(3).filter(r => r.questions && r.questions.length > 0)
      
      roundsForPage2.forEach((round, idx) => {
        const actualRoundIndex = 3 + idx
        const roundColor = getRoundColor(actualRoundIndex, round.isPeoplesRound)
        const rgb = hexToRgb(roundColor)

        // Round header - colored rounded rectangle
        const roundTitle = round.isPeoplesRound
          ? "PEOPLE'S ROUND"
          : `ROUND ${actualRoundIndex + 1}: ${round.title.toUpperCase()}`
        
        const roundHeaderHeight = 30
        const roundHeaderPadding = 15
        
        doc.fontSize(12)
          .font('Helvetica-Bold')
        const roundHeaderWidth = contentWidth
        
        // Draw colored round header
        if (rgb) {
          drawRoundedRect(doc, margin, currentY, roundHeaderWidth, roundHeaderHeight, 8, roundColor, null, 0)
          doc.fillColor('#FFFFFF')
        } else {
          drawRoundedRect(doc, margin, currentY, roundHeaderWidth, roundHeaderHeight, 8, '#F3F4F6', null, 0)
          doc.fillColor('#000000')
        }
        
        doc.text(roundTitle, margin + roundHeaderPadding, currentY + 8, {
          width: roundHeaderWidth - roundHeaderPadding * 2,
        })
        
        currentY += roundHeaderHeight + 15

        // Questions in this round - simple list with answer lines
        round.questions.forEach((question) => {
          if (!question.text || question.text.trim() === '') {
            return
          }

          // Check if we need a new page
          if (currentY > pageHeight - 80) {
            doc.addPage()
            currentY = margin + 20
          }

          // Question number and text
          doc.fontSize(11)
            .font('Helvetica')
            .fillColor('#000000')
          
          const questionText = `${questionNumber}. ${question.text}`
          const questionHeight = doc.heightOfString(questionText, {
            width: contentWidth - 20,
          })
          
          doc.text(questionText, margin + 10, currentY, {
            width: contentWidth - 20,
          })
          
          currentY += questionHeight + 8
          
          // Answer line
          drawAnswerLine(margin + 10, currentY, contentWidth - 20)
          currentY += 15
          
          questionNumber++
        })

        currentY += 10
      })

      // Footer on page 2
      drawFooter()

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}
