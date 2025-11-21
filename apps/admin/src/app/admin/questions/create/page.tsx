'use client'

import { useState, useEffect } from 'react'
import { Plus, Save, ArrowLeft, FileText, Layers } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'

interface Question {
  id: string
  text: string
  answer: string
  explanation?: string
  categoryId: string
}

interface Round {
  id: string
  title: string
  categoryId: string
  blurb?: string
  questions: Question[]
}

export default function CreateQuestionOrRoundPage() {
  const [mode, setMode] = useState<'question' | 'round'>('question')
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [isSaving, setIsSaving] = useState(false)

  // Question state
  const [question, setQuestion] = useState<Question>({
    id: `q-${Date.now()}`,
    text: '',
    answer: '',
    explanation: '',
    categoryId: '',
  })

  // Round state
  const [round, setRound] = useState<Round>({
    id: `r-${Date.now()}`,
    title: '',
    categoryId: '',
    blurb: '',
    questions: [],
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleSaveQuestion = async () => {
    if (!question.text || !question.answer || !question.categoryId) {
      alert('Please fill in all required fields')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: question.text,
          answer: question.answer,
          explanation: question.explanation || null,
          categoryId: question.categoryId,
          createdBy: 'user-1', // TODO: Get from auth
        }),
      })

      if (response.ok) {
        alert('Question saved successfully!')
        // Reset form
        setQuestion({
          id: `q-${Date.now()}`,
          text: '',
          answer: '',
          explanation: '',
          categoryId: '',
        })
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save question')
      }
    } catch (error) {
      console.error('Failed to save question:', error)
      alert('Failed to save question')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveRound = async () => {
    if (!round.title || !round.categoryId || round.questions.length === 0) {
      alert('Please fill in all required fields and add at least one question')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: round.title,
          categoryId: round.categoryId,
          blurb: round.blurb || null,
          questions: round.questions.map(q => ({
            text: q.text,
            answer: q.answer,
            explanation: q.explanation || null,
          })),
        }),
      })

      if (response.ok) {
        alert('Round saved successfully!')
        // Reset form
        setRound({
          id: `r-${Date.now()}`,
          title: '',
          categoryId: '',
          blurb: '',
          questions: [],
        })
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save round')
      }
    } catch (error) {
      console.error('Failed to save round:', error)
      alert('Failed to save round')
    } finally {
      setIsSaving(false)
    }
  }

  const addQuestionToRound = () => {
    setRound(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: `q-${Date.now()}-${Math.random()}`,
          text: '',
          answer: '',
          explanation: '',
          categoryId: prev.categoryId,
        },
      ],
    }))
  }

  const updateRoundQuestion = (index: number, field: keyof Question, value: string) => {
    setRound(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      ),
    }))
  }

  const removeRoundQuestion = (index: number) => {
    setRound(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/quizzes"
            className="p-2 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200/50 dark:hover:from-gray-700 dark:hover:to-gray-700/50 rounded-xl transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Create Question or Round
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Create standalone questions or rounds that can be imported into quizzes
            </p>
          </div>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('question')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              mode === 'question'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)]'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <FileText className="w-4 h-4" />
            Single Question
          </button>
          <button
            onClick={() => setMode('round')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              mode === 'round'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)]'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Layers className="w-4 h-4" />
            Round (Multiple Questions)
          </button>
        </div>
      </div>

      {/* Question Form */}
      {mode === 'question' && (
        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                value={question.categoryId}
                onChange={(e) => setQuestion(prev => ({ ...prev, categoryId: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Question *
              </label>
              <textarea
                value={question.text}
                onChange={(e) => setQuestion(prev => ({ ...prev, text: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the question..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Answer *
              </label>
              <input
                type="text"
                value={question.answer}
                onChange={(e) => setQuestion(prev => ({ ...prev, answer: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the answer..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Explanation (Optional)
              </label>
              <textarea
                value={question.explanation || ''}
                onChange={(e) => setQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional explanation..."
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveQuestion}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_2px_8px_rgba(59,130,246,0.3)]"
              >
                {isSaving ? (
                  <Spinner className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? 'Saving...' : 'Save Question'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Round Form */}
      {mode === 'round' && (
        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Round Title *
                </label>
                <input
                  type="text"
                  value={round.title}
                  onChange={(e) => setRound(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., WW2 History"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={round.categoryId}
                  onChange={(e) => setRound(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Round Description (Optional)
              </label>
              <textarea
                value={round.blurb || ''}
                onChange={(e) => setRound(prev => ({ ...prev, blurb: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description..."
              />
            </div>

            {/* Questions in Round */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Questions *
                </label>
                <button
                  onClick={addQuestionToRound}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Question
                </button>
              </div>

              <div className="space-y-4">
                {round.questions.map((q, index) => (
                  <div
                    key={q.id}
                    className="p-4 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-gray-50/50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Question {index + 1}
                      </span>
                      <button
                        onClick={() => removeRoundQuestion(index)}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="space-y-3">
                      <textarea
                        value={q.text}
                        onChange={(e) => updateRoundQuestion(index, 'text', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300/50 dark:border-gray-700/50 rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Question..."
                      />
                      <input
                        type="text"
                        value={q.answer}
                        onChange={(e) => updateRoundQuestion(index, 'answer', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300/50 dark:border-gray-700/50 rounded-lg bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Answer..."
                      />
                    </div>
                  </div>
                ))}
                {round.questions.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No questions yet. Click "Add Question" to get started.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveRound}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_2px_8px_rgba(59,130,246,0.3)]"
              >
                {isSaving ? (
                  <Spinner className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? 'Saving...' : 'Save Round'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

