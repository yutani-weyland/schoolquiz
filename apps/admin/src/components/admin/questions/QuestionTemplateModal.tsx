/**
 * Question Template Modal
 * Select and fill in a question template
 */

'use client'

import { useState } from 'react'
import { FileText, X, Sparkles } from 'lucide-react'
import { QUESTION_TEMPLATES, fillTemplate, type QuestionTemplate } from '@/lib/question-templates'
import { QuestionPreview } from './QuestionPreview'
import type { Question } from '@/lib/question-validation'

interface QuestionTemplateModalProps {
  onSelect: (question: Question) => void
  onClose: () => void
}

export function QuestionTemplateModal({ onSelect, onClose }: QuestionTemplateModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<QuestionTemplate | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [filledQuestion, setFilledQuestion] = useState<Question | null>(null)

  const handleTemplateSelect = (template: QuestionTemplate) => {
    setSelectedTemplate(template)
    // Initialize values with empty strings
    const initialValues: Record<string, string> = {}
    if (template.template.variables) {
      Object.keys(template.template.variables).forEach(key => {
        initialValues[key] = ''
      })
    }
    setValues(initialValues)
    setFilledQuestion(null)
  }

  const handleValueChange = (key: string, value: string) => {
    const newValues = { ...values, [key]: value }
    setValues(newValues)

    // Auto-fill template as user types
    if (selectedTemplate) {
      const filled = fillTemplate(selectedTemplate, newValues)
      setFilledQuestion(filled)
    }
  }

  const handleUse = () => {
    if (filledQuestion && selectedTemplate) {
      const finalQuestion = fillTemplate(selectedTemplate, values)
      onSelect(finalQuestion)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[hsl(var(--border))]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-[hsl(var(--primary))]" />
              <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                Question Templates
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!selectedTemplate ? (
            // Template Selection
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {QUESTION_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="p-4 text-left border-2 border-[hsl(var(--border))] rounded-xl hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/5 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <FileText className="w-5 h-5 text-[hsl(var(--primary))] mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-[hsl(var(--foreground))] mb-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
                        {template.description}
                      </p>
                      {template.example && (
                        <div className="bg-[hsl(var(--muted))] rounded-lg p-3 space-y-2 text-xs">
                          <div>
                            <span className="font-medium text-[hsl(var(--muted-foreground))]">Q:</span>{' '}
                            <span className="text-[hsl(var(--foreground))]">{template.example.text}</span>
                          </div>
                          <div>
                            <span className="font-medium text-green-600 dark:text-green-400">A:</span>{' '}
                            <span className="text-green-600 dark:text-green-400">{template.example.answer}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // Template Form
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <button
                  onClick={() => {
                    setSelectedTemplate(null)
                    setValues({})
                    setFilledQuestion(null)
                  }}
                  className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-4"
                >
                  ← Back to templates
                </button>
                <div className="bg-[hsl(var(--muted))] rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-[hsl(var(--foreground))] mb-1">
                    {selectedTemplate.name}
                  </h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {selectedTemplate.description}
                  </p>
                </div>
              </div>

              {/* Template Form Fields */}
              <div className="space-y-4">
                {selectedTemplate.template.variables &&
                  Object.entries(selectedTemplate.template.variables).map(([key, variable]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                        {variable.label}
                        {!selectedTemplate.template.text.includes(`{{${key}}}`) &&
                          !selectedTemplate.template.answer.includes(`{{${key}}}`) && (
                            <span className="text-[hsl(var(--muted-foreground))] ml-2">(optional)</span>
                          )}
                      </label>
                      {variable.type === 'option' && variable.options ? (
                        <select
                          value={values[key] || ''}
                          onChange={(e) => handleValueChange(key, e.target.value)}
                          className="w-full px-4 py-2 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                        >
                          <option value="">Select {variable.label}</option>
                          {variable.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={variable.type === 'number' ? 'number' : 'text'}
                          value={values[key] || ''}
                          onChange={(e) => handleValueChange(key, e.target.value)}
                          placeholder={variable.placeholder}
                          className="w-full px-4 py-2 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] placeholder:text-[hsl(var(--muted-foreground))]"
                        />
                      )}
                    </div>
                  ))}
              </div>

              {/* Preview */}
              {filledQuestion && (
                <div className="mt-6">
                  <QuestionPreview
                    question={filledQuestion}
                    onConfirm={handleUse}
                    onCancel={() => {
                      setSelectedTemplate(null)
                      setValues({})
                      setFilledQuestion(null)
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

