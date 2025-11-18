// PDF Generator for Quiz PDFs
// This uses pdfkit which is already in package.json

import PDFDocument from 'pdfkit'

export interface QuizPDFData {
  title: string
  rounds: Array<{
    title: string
    isPeoplesRound: boolean
    questions: Array<{
      text: string
      answer: string
      explanation?: string
    }>
  }>
}

export async function generateQuizPDF(data: QuizPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      })

      const buffers: Buffer[] = []
      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers)
        resolve(pdfBuffer)
      })
      doc.on('error', reject)

      // Title
      doc.fontSize(24)
        .font('Helvetica-Bold')
        .text(data.title, { align: 'center' })
        .moveDown(2)

      // Questions by round
      data.rounds.forEach((round, roundIndex) => {
        // Round header
        doc.fontSize(18)
          .font('Helvetica-Bold')
          .text(round.isPeoplesRound ? "People's Question" : `Round ${roundIndex + 1}: ${round.title}`, {
            underline: true,
          })
          .moveDown(1)

        // Questions
        round.questions.forEach((question, qIndex) => {
          doc.fontSize(12)
            .font('Helvetica')
            .text(`${qIndex + 1}. ${question.text}`, {
              indent: 20,
            })
            .moveDown(0.5)
        })

        doc.moveDown(1.5)
      })

      // Answers section
      doc.addPage()
      doc.fontSize(20)
        .font('Helvetica-Bold')
        .text('Answers', { align: 'center' })
        .moveDown(2)

      data.rounds.forEach((round, roundIndex) => {
        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text(round.isPeoplesRound ? "People's Question" : `Round ${roundIndex + 1}: ${round.title}`, {
            underline: true,
          })
          .moveDown(1)

        round.questions.forEach((question, qIndex) => {
          doc.fontSize(11)
            .font('Helvetica')
            .text(`${qIndex + 1}. ${question.answer}`, {
              indent: 20,
            })
          
          if (question.explanation) {
            doc.fontSize(9)
              .font('Helvetica-Oblique')
              .fillColor('#666666')
              .text(`   ${question.explanation}`, {
                indent: 20,
              })
              .fillColor('#000000')
          }
          
          doc.moveDown(0.5)
        })

        doc.moveDown(1)
      })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

