/**
 * Bulk Import Modal
 * Import questions from CSV or JSON files
 */

'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, X, AlertCircle, CheckCircle2, FileJson, FileSpreadsheet } from 'lucide-react'
import { validateQuestions, normalizeQuestion, findDuplicates, type Question } from '@/lib/question-validation'

interface BulkImportModalProps {
  onImport: (questions: Question[]) => void
  onClose: () => void
}

type ImportFormat = 'csv' | 'json' | null

export function BulkImportModal({ onImport, onClose }: BulkImportModalProps) {
  const [format, setFormat] = useState<ImportFormat>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [rawContent, setRawContent] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [validation, setValidation] = useState<ReturnType<typeof validateQuestions> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)

    try {
      const text = await file.text()
      setRawContent(text)

      // Determine format from file extension
      if (file.name.endsWith('.csv')) {
        setFormat('csv')
        parseCSV(text)
      } else if (file.name.endsWith('.json')) {
        setFormat('json')
        parseJSON(text)
      } else {
        alert('Unsupported file format. Please use CSV or JSON.')
        setIsProcessing(false)
      }
    } catch (error: any) {
      console.error('Error reading file:', error)
      alert(`Failed to read file: ${error.message}`)
      setIsProcessing(false)
    }
  }

  const parseCSV = (csvText: string) => {
    try {
      const lines = csvText.split('\n').filter(line => line.trim())
      if (lines.length === 0) {
        alert('CSV file is empty')
        setIsProcessing(false)
        return
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const textIndex = headers.findIndex(h => h === 'text' || h === 'question')
      const answerIndex = headers.findIndex(h => h === 'answer')
      const explanationIndex = headers.findIndex(h => h === 'explanation' || h === 'note')

      if (textIndex === -1 || answerIndex === -1) {
        alert('CSV must have "text" (or "question") and "answer" columns')
        setIsProcessing(false)
        return
      }

      // Parse rows
      const parsed: Question[] = []
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i])
        if (values[textIndex] && values[answerIndex]) {
          parsed.push({
            text: values[textIndex] || '',
            answer: values[answerIndex] || '',
            explanation: explanationIndex >= 0 ? values[explanationIndex] : undefined,
          })
        }
      }

      const normalized = parsed.map(normalizeQuestion)
      setQuestions(normalized)
      validateImportedQuestions(normalized)
    } catch (error: any) {
      console.error('Error parsing CSV:', error)
      alert(`Failed to parse CSV: ${error.message}`)
      setIsProcessing(false)
    }
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const parseJSON = (jsonText: string) => {
    try {
      const data = JSON.parse(jsonText)
      
      // Handle array of questions
      if (Array.isArray(data)) {
        const parsed: Question[] = data.map((item: any) => ({
          text: item.text || item.question || '',
          answer: item.answer || '',
          explanation: item.explanation || item.note || undefined,
          categoryId: item.categoryId || undefined,
        }))
        const normalized = parsed.map(normalizeQuestion)
        setQuestions(normalized)
        validateImportedQuestions(normalized)
      } else if (data.questions && Array.isArray(data.questions)) {
        // Handle object with questions array
        const parsed: Question[] = data.questions.map((item: any) => ({
          text: item.text || item.question || '',
          answer: item.answer || '',
          explanation: item.explanation || item.note || undefined,
          categoryId: item.categoryId || undefined,
        }))
        const normalized = parsed.map(normalizeQuestion)
        setQuestions(normalized)
        validateImportedQuestions(normalized)
      } else {
        alert('JSON must be an array of questions or an object with a "questions" array')
        setIsProcessing(false)
      }
    } catch (error: any) {
      console.error('Error parsing JSON:', error)
      alert(`Failed to parse JSON: ${error.message}`)
      setIsProcessing(false)
    }
  }

  const validateImportedQuestions = (questionsToValidate: Question[]) => {
    const result = validateQuestions(questionsToValidate)
    setValidation(result)
    setIsProcessing(false)
  }

  const handlePaste = () => {
    const textarea = document.createElement('textarea')
    textarea.value = rawContent
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('paste')
    const pasted = textarea.value
    document.body.removeChild(textarea)

    if (pasted.trim()) {
      setRawContent(pasted)
      // Try to detect format
      try {
        JSON.parse(pasted)
        setFormat('json')
        parseJSON(pasted)
      } catch {
        setFormat('csv')
        parseCSV(pasted)
      }
    }
  }

  const handleImport = () => {
    if (!validation || !validation.valid) {
      alert('Please fix validation errors before importing')
      return
    }

    const validQuestions = validation.results
      .filter(r => r.validation.valid)
      .map(r => r.question)

    if (validQuestions.length === 0) {
      alert('No valid questions to import')
      return
    }

    onImport(validQuestions)
    onClose()
  }

  const duplicates = questions.length > 0 ? findDuplicates(questions) : []

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[hsl(var(--border))]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
              Bulk Import Questions
            </h2>
            <button
              onClick={onClose}
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Format Selection */}
          {!format && (
            <div className="flex gap-3">
              <button
                onClick={() => setFormat('csv')}
                className="flex-1 flex flex-col items-center gap-2 px-4 py-6 border-2 border-dashed border-[hsl(var(--border))] rounded-xl hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/5 transition-colors"
              >
                <FileSpreadsheet className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
                <span className="text-sm font-medium text-[hsl(var(--foreground))]">CSV Format</span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">text,answer,explanation</span>
              </button>
              <button
                onClick={() => setFormat('json')}
                className="flex-1 flex flex-col items-center gap-2 px-4 py-6 border-2 border-dashed border-[hsl(var(--border))] rounded-xl hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/5 transition-colors"
              >
                <FileJson className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
                <span className="text-sm font-medium text-[hsl(var(--foreground))]">JSON Format</span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Array of question objects</span>
              </button>
            </div>
          )}

          {/* File Upload */}
          {format && questions.length === 0 && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept={format === 'csv' ? '.csv' : '.json'}
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full px-4 py-3 border-2 border-dashed border-[hsl(var(--border))] rounded-xl hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                  {isProcessing ? 'Processing...' : `Upload ${format.toUpperCase()} File`}
                </span>
              </button>
              <p className="mt-2 text-xs text-center text-[hsl(var(--muted-foreground))]">
                Or <button onClick={handlePaste} className="text-[hsl(var(--primary))] hover:underline">paste content</button>
              </p>
            </div>
          )}
        </div>

        {/* Results */}
        {validation && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Summary */}
            <div className="bg-[hsl(var(--muted))] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2">Import Summary</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-[hsl(var(--muted-foreground))]">Total</div>
                  <div className="text-lg font-semibold text-[hsl(var(--foreground))]">{validation.summary.total}</div>
                </div>
                <div>
                  <div className="text-green-600 dark:text-green-400">Valid</div>
                  <div className="text-lg font-semibold text-green-600 dark:text-green-400">{validation.summary.valid}</div>
                </div>
                <div>
                  <div className="text-red-600 dark:text-red-400">Invalid</div>
                  <div className="text-lg font-semibold text-red-600 dark:text-red-400">{validation.summary.invalid}</div>
                </div>
                <div>
                  <div className="text-amber-600 dark:text-amber-400">Warnings</div>
                  <div className="text-lg font-semibold text-amber-600 dark:text-amber-400">{validation.summary.warnings}</div>
                </div>
              </div>
            </div>

            {/* Duplicates */}
            {duplicates.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-semibold">Found {duplicates.length} duplicate question{duplicates.length > 1 ? 's' : ''}</span>
                </div>
                <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
                  {duplicates.map((dup, i) => (
                    <li key={i}>
                      Row{dup.indices.length > 1 ? 's' : ''} {dup.indices.join(', ')}: "{dup.question.text.substring(0, 50)}..."
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Question List */}
            <div className="space-y-2">
              {validation.results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.validation.valid
                      ? 'border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-900/10'
                      : 'border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {result.validation.valid ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[hsl(var(--foreground))] mb-1">
                        Row {result.index}: {result.question.text || '(No question text)'}
                      </div>
                      {result.validation.errors.length > 0 && (
                        <div className="text-xs text-red-600 dark:text-red-400 space-y-0.5">
                          {result.validation.errors.map((error, i) => (
                            <div key={i}>• {error.message}</div>
                          ))}
                        </div>
                      )}
                      {result.validation.warnings.length > 0 && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 space-y-0.5 mt-1">
                          {result.validation.warnings.map((warning, i) => (
                            <div key={i}>⚠ {warning}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        {validation && (
          <div className="p-6 border-t border-[hsl(var(--border))] flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!validation.valid || validation.summary.valid === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Import {validation.summary.valid} Question{validation.summary.valid !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

