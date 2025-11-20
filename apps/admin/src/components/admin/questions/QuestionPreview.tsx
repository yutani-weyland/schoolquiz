/**
 * Question Preview Component
 * Shows how a question will render before adding to quiz
 */

'use client'

import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { validateQuestion, type Question, type ValidationResult } from '@/lib/question-validation'

interface QuestionPreviewProps {
  question: Question
  onConfirm?: () => void
  onCancel?: () => void
  showActions?: boolean
}

export function QuestionPreview({
  question,
  onConfirm,
  onCancel,
  showActions = true,
}: QuestionPreviewProps) {
  const validation: ValidationResult = validateQuestion(question)

  return (
    <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6 space-y-4">
      {/* Validation Status */}
      {validation.valid ? (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">Question is valid</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <XCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Question has errors</span>
        </div>
      )}

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">Errors:</h4>
          <ul className="space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index} className="text-sm text-red-700 dark:text-red-400">
                <strong>{error.field}:</strong> {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Validation Warnings */}
      {validation.warnings.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Warnings:
          </h4>
          <ul className="space-y-1">
            {validation.warnings.map((warning, index) => (
              <li key={index} className="text-sm text-amber-700 dark:text-amber-400">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview */}
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
            Question
          </h4>
          <div className="bg-[hsl(var(--muted))] rounded-lg p-4">
            <p className="text-[hsl(var(--foreground))] font-medium">
              {question.text || <span className="text-[hsl(var(--muted-foreground))] italic">(No question text)</span>}
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
            Answer
          </h4>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-lg p-4">
            <p className="text-green-800 dark:text-green-300 font-medium">
              {question.answer || <span className="text-[hsl(var(--muted-foreground))] italic">(No answer)</span>}
            </p>
          </div>
        </div>

        {question.explanation && (
          <div>
            <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
              Explanation
            </h4>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4">
              <p className="text-blue-800 dark:text-blue-300 text-sm">
                {question.explanation}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (onConfirm || onCancel) && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
          {onConfirm && (
            <button
              onClick={onConfirm}
              disabled={!validation.valid}
              className="px-4 py-2 text-sm font-medium text-white bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Add to Quiz
            </button>
          )}
        </div>
      )}
    </div>
  )
}

