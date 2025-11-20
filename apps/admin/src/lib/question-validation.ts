/**
 * Question Validation Utilities
 * Validates questions before adding them to quizzes
 */

export interface Question {
  text: string
  answer: string
  explanation?: string
  categoryId?: string
}

export interface ValidationError {
  field: 'text' | 'answer' | 'explanation' | 'general'
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: string[]
}

/**
 * Validate a single question
 */
export function validateQuestion(question: Question): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  // Required fields
  if (!question.text || question.text.trim().length === 0) {
    errors.push({
      field: 'text',
      message: 'Question text is required',
    })
  } else if (question.text.trim().length < 10) {
    warnings.push('Question text is very short (less than 10 characters)')
  } else if (question.text.trim().length > 500) {
    warnings.push('Question text is very long (over 500 characters)')
  }

  if (!question.answer || question.answer.trim().length === 0) {
    errors.push({
      field: 'answer',
      message: 'Answer is required',
    })
  } else if (question.answer.trim().length > 200) {
    warnings.push('Answer is very long (over 200 characters)')
  }

  // Format checks
  if (question.text && question.text.includes('{{')) {
    warnings.push('Question contains unprocessed template variables')
  }

  if (question.answer && question.answer.includes('{{')) {
    warnings.push('Answer contains unprocessed template variables')
  }

  // Duplicate check (basic - check if question and answer are identical)
  if (
    question.text &&
    question.answer &&
    question.text.trim().toLowerCase() === question.answer.trim().toLowerCase()
  ) {
    warnings.push('Question and answer are identical - this may be an error')
  }

  // Check for common formatting issues
  if (question.text && !question.text.endsWith('?') && !question.text.endsWith('.')) {
    warnings.push('Question text should end with a question mark (?) or period (.)')
  }

  // Check for excessive punctuation
  const punctuationCount = (question.text?.match(/[!?.]/g) || []).length
  if (punctuationCount > 3) {
    warnings.push('Question contains multiple punctuation marks')
  }

  // Explanation validation (optional field)
  if (question.explanation && question.explanation.trim().length > 500) {
    warnings.push('Explanation is very long (over 500 characters)')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate multiple questions (for bulk import)
 */
export function validateQuestions(questions: Question[]): {
  valid: boolean
  results: Array<{ question: Question; validation: ValidationResult; index: number }>
  summary: {
    total: number
    valid: number
    invalid: number
    warnings: number
  }
} {
  const results = questions.map((question, index) => ({
    question,
    validation: validateQuestion(question),
    index: index + 1,
  }))

  const summary = {
    total: questions.length,
    valid: results.filter(r => r.validation.valid).length,
    invalid: results.filter(r => !r.validation.valid).length,
    warnings: results.filter(r => r.validation.warnings.length > 0).length,
  }

  return {
    valid: results.every(r => r.validation.valid),
    results,
    summary,
  }
}

/**
 * Check for duplicate questions in a list
 */
export function findDuplicates(questions: Question[]): Array<{
  indices: number[]
  question: Question
}> {
  const seen = new Map<string, number[]>()
  const duplicates: Array<{ indices: number[]; question: Question }> = []

  questions.forEach((question, index) => {
    const key = question.text.trim().toLowerCase()
    if (seen.has(key)) {
      seen.get(key)!.push(index + 1)
    } else {
      seen.set(key, [index + 1])
    }
  })

  seen.forEach((indices, key) => {
    if (indices.length > 1) {
      const question = questions[indices[0] - 1]
      duplicates.push({ indices, question })
    }
  })

  return duplicates
}

/**
 * Normalize question text (remove extra whitespace, etc.)
 */
export function normalizeQuestion(question: Question): Question {
  return {
    ...question,
    text: question.text?.trim().replace(/\s+/g, ' ') || '',
    answer: question.answer?.trim().replace(/\s+/g, ' ') || '',
    explanation: question.explanation?.trim().replace(/\s+/g, ' ') || undefined,
  }
}

