'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Plus, Save, Eye, FileDown, ArrowLeft, Import, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

interface Question {
  id: string
  text: string
  answer: string
  explanation?: string
  categoryId: string
  categoryName?: string
  isImported?: boolean
  originalQuestionId?: string
}

interface Round {
  id: string
  index: number
  title: string
  categoryId: string
  categoryName?: string
  blurb?: string
  questions: Question[]
  isPeoplesRound: boolean
}

interface QuizBuilderData {
  id?: string
  title: string
  status: 'draft' | 'scheduled' | 'published'
  rounds: Round[]
}

const STANDARD_ROUNDS = 4
const QUESTIONS_PER_ROUND = 6
const PEOPLE_ROUND_INDEX = 4 // 5th round (0-indexed)

export default function QuizBuilderPage() {
  const router = useRouter()
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const editQuizId = searchParams?.get('edit')
  
  const [quiz, setQuiz] = useState<QuizBuilderData>({
    title: '',
    status: 'draft',
    rounds: Array.from({ length: STANDARD_ROUNDS + 1 }, (_, i) => ({
      id: `round-${i}`,
      index: i,
      title: '',
      categoryId: '',
      blurb: '',
      questions: Array.from({ length: i === PEOPLE_ROUND_INDEX ? 1 : QUESTIONS_PER_ROUND }, () => ({
        id: `q-${Date.now()}-${Math.random()}`,
        text: '',
        answer: '',
        explanation: '',
        categoryId: '',
      })),
      isPeoplesRound: i === PEOPLE_ROUND_INDEX,
    })),
  })

  const [categories, setCategories] = useState<Array<{ id: string; name: string; parentId?: string | null }>>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeRound, setActiveRound] = useState(0)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (editQuizId) {
      loadQuiz(editQuizId)
    }
  }, [editQuizId])

  const loadQuiz = async (quizId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}`)
      const data = await response.json()
      if (response.ok && data.quiz) {
        // Transform quiz data to builder format
        // TODO: Transform from API response format to builder format
        console.log('Loading quiz:', data.quiz)
        // For now, just set the ID and title
        setQuiz(prev => ({
          ...prev,
          id: data.quiz.id,
          title: data.quiz.title,
          status: data.quiz.status,
        }))
      }
    } catch (error) {
      console.error('Failed to load quiz:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Auto-generate title from round titles (only if not editing)
    if (!editQuizId) {
      const roundTitles = quiz.rounds
        .filter(r => !r.isPeoplesRound && r.title)
        .map(r => r.title)
        .filter(Boolean)
      
      if (roundTitles.length > 0) {
        setQuiz(prev => ({
          ...prev,
          title: roundTitles.join(', '),
        }))
      }
    }
  }, [quiz.rounds.map(r => r.title).join(','), editQuizId])

  const fetchCategories = async () => {
    // TODO: Fetch from API
    // For now, use dummy data
    setCategories([
      { id: 'cat-1', name: 'History', parentId: null },
      { id: 'cat-2', name: 'WW2 History', parentId: 'cat-1' },
      { id: 'cat-3', name: 'Australian History', parentId: 'cat-1' },
      { id: 'cat-4', name: 'Geography', parentId: null },
      { id: 'cat-5', name: 'Australian Culture', parentId: null },
      { id: 'cat-6', name: 'NAIDOC Week', parentId: 'cat-5' },
      { id: 'cat-7', name: 'Politics', parentId: null },
      { id: 'cat-8', name: 'US Politics', parentId: 'cat-7' },
    ])
  }

  const getCategoryDisplayName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    if (!category) return ''
    
    if (category.parentId) {
      const parent = categories.find(c => c.id === category.parentId)
      return parent ? `${parent.name} > ${category.name}` : category.name
    }
    return category.name
  }

  const updateRound = (roundIndex: number, updates: Partial<Round>) => {
    setQuiz(prev => ({
      ...prev,
      rounds: prev.rounds.map((r, i) => 
        i === roundIndex ? { ...r, ...updates } : r
      ),
    }))
  }

  const updateQuestion = (roundIndex: number, questionIndex: number, updates: Partial<Question>) => {
    setQuiz(prev => ({
      ...prev,
      rounds: prev.rounds.map((r, i) => 
        i === roundIndex 
          ? {
              ...r,
              questions: r.questions.map((q, qi) => 
                qi === questionIndex ? { ...q, ...updates } : q
              ),
            }
          : r
      ),
    }))
  }

  const addQuestion = (roundIndex: number) => {
    const round = quiz.rounds[roundIndex]
    if (round.isPeoplesRound && round.questions.length >= 1) return
    if (!round.isPeoplesRound && round.questions.length >= QUESTIONS_PER_ROUND) return

    setQuiz(prev => ({
      ...prev,
      rounds: prev.rounds.map((r, i) => 
        i === roundIndex 
          ? {
              ...r,
              questions: [
                ...r.questions,
                {
                  id: `q-${Date.now()}-${Math.random()}`,
                  text: '',
                  answer: '',
                  explanation: '',
                  categoryId: r.categoryId,
                },
              ],
            }
          : r
      ),
    }))
  }

  const removeQuestion = (roundIndex: number, questionIndex: number) => {
    setQuiz(prev => ({
      ...prev,
      rounds: prev.rounds.map((r, i) => 
        i === roundIndex 
          ? {
              ...r,
              questions: r.questions.filter((_, qi) => qi !== questionIndex),
            }
          : r
      ),
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/quizzes/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...quiz,
          createdBy: 'user-1', // TODO: Get from auth
        }),
      })
      
      const data = await response.json()
      if (response.ok) {
        setQuiz(prev => ({ ...prev, id: data.quiz.id }))
        alert('Quiz saved as draft!')
      } else {
        alert(data.error || 'Failed to save quiz')
      }
    } catch (error) {
      console.error('Failed to save quiz:', error)
      alert('Failed to save quiz')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = () => {
    // TODO: Open preview in presenter view
    router.push(`/admin/quizzes/builder/preview?quizId=${quiz.id || 'new'}`)
  }

  const handleGeneratePDF = async () => {
    if (!quiz.id) {
      alert('Please save the quiz first before generating PDF')
      return
    }
    
    try {
      const response = await fetch(`/api/admin/quizzes/${quiz.id}/pdf`, {
        method: 'POST',
      })
      
      const data = await response.json()
      if (response.ok) {
        // Open PDF in new tab
        window.open(data.pdfUrl, '_blank')
      } else {
        alert(data.error || 'Failed to generate PDF')
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate PDF')
    }
  }

  const canSave = quiz.rounds.every(r => 
    r.title && 
    r.categoryId && 
    r.questions.every(q => q.text && q.answer)
  )

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-500" />
              Quiz Builder
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Create a new quiz with 4 rounds of 6 questions + 1 people's question
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePreview}
            disabled={!canSave}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 border border-gray-300/50 dark:border-gray-700/50 rounded-xl hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100/50 dark:hover:from-gray-700 dark:hover:to-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.05)]"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={handleGeneratePDF}
            disabled={!canSave}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 border border-gray-300/50 dark:border-gray-700/50 rounded-xl hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100/50 dark:hover:from-gray-700 dark:hover:to-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.05)]"
          >
            <FileDown className="w-4 h-4" />
            Generate PDF
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(59,130,246,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </div>

      {/* Quiz Title (Auto-generated) */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quiz Title (Auto-generated from round titles)
        </label>
        <input
          type="text"
          value={quiz.title}
          onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
          className="w-full px-4 py-2 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., WW2 History, NAIDOC Week, US Politics, Geography"
        />
      </div>

      {/* Round Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {quiz.rounds.map((round, index) => (
          <button
            key={round.id}
            onClick={() => setActiveRound(index)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl font-medium transition-all ${
              activeRound === index
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {round.isPeoplesRound ? "People's Question" : `Round ${index + 1}`}
            {round.title && `: ${round.title}`}
          </button>
        ))}
      </div>

      {/* Active Round Editor */}
      {quiz.rounds[activeRound] && (
        <RoundEditor
          round={quiz.rounds[activeRound]}
          categories={categories}
          onUpdate={(updates) => updateRound(activeRound, updates)}
          onQuestionUpdate={(questionIndex, updates) => updateQuestion(activeRound, questionIndex, updates)}
          onAddQuestion={() => addQuestion(activeRound)}
          onRemoveQuestion={(questionIndex) => removeQuestion(activeRound, questionIndex)}
          onImportQuestion={(question) => {
            const emptySlot = quiz.rounds[activeRound].questions.findIndex(q => !q.text)
            if (emptySlot >= 0) {
              updateQuestion(activeRound, emptySlot, {
                ...question,
                isImported: true,
                originalQuestionId: question.id,
              })
            } else {
              // Add new question slot with imported question
              setQuiz(prev => ({
                ...prev,
                rounds: prev.rounds.map((r, i) => 
                  i === activeRound 
                    ? {
                        ...r,
                        questions: [
                          ...r.questions,
                          {
                            ...question,
                            id: `q-${Date.now()}-${Math.random()}`,
                            isImported: true,
                            originalQuestionId: question.id,
                          },
                        ],
                      }
                    : r
                ),
              }))
            }
          }}
          onImportRound={(roundData) => {
            updateRound(activeRound, {
              title: roundData.title,
              categoryId: roundData.categoryId,
              categoryName: roundData.categoryName,
              questions: roundData.questions.map((q: any) => ({
                ...q,
                id: `q-${Date.now()}-${Math.random()}`,
                isImported: true,
                originalQuestionId: q.id,
              })),
            })
          }}
          getCategoryDisplayName={getCategoryDisplayName}
        />
      )}
    </div>
  )
}

interface RoundEditorProps {
  round: Round
  categories: Array<{ id: string; name: string; parentId?: string | null }>
  onUpdate: (updates: Partial<Round>) => void
  onQuestionUpdate: (questionIndex: number, updates: Partial<Question>) => void
  onAddQuestion: () => void
  onRemoveQuestion: (questionIndex: number) => void
  onImportQuestion: (question: Question) => void
  onImportRound: (roundData: Partial<Round>) => void
  getCategoryDisplayName: (categoryId: string) => string
}

function RoundEditor({
  round,
  categories,
  onUpdate,
  onQuestionUpdate,
  onAddQuestion,
  onRemoveQuestion,
  onImportQuestion,
  onImportRound,
  getCategoryDisplayName,
}: RoundEditorProps) {
  const mainCategories = categories.filter(c => !c.parentId)
  const subCategories = categories.filter(c => c.parentId)
  const [showImportQuestionModal, setShowImportQuestionModal] = useState(false)
  const [showImportRoundModal, setShowImportRoundModal] = useState(false)
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [importSearch, setImportSearch] = useState('')
  const [importCategoryFilter, setImportCategoryFilter] = useState('')

  const fetchAvailableQuestions = () => {
    setIsLoadingQuestions(true)
    const params = new URLSearchParams()
    if (importCategoryFilter) params.append('categoryId', importCategoryFilter)
    if (importSearch) params.append('search', importSearch)

    fetch(`/api/admin/questions/available?${params}`)
      .then(res => res.json())
      .then(data => {
        setAvailableQuestions(data.questions || [])
        setIsLoadingQuestions(false)
      })
      .catch(err => {
        console.error('Failed to fetch questions:', err)
        setIsLoadingQuestions(false)
      })
  }

  useEffect(() => {
    if (showImportQuestionModal) {
      fetchAvailableQuestions()
    }
  }, [showImportQuestionModal])

  useEffect(() => {
    if (showImportQuestionModal && (importSearch || importCategoryFilter)) {
      const timeoutId = setTimeout(() => {
        fetchAvailableQuestions()
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [importSearch, importCategoryFilter, showImportQuestionModal])

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
      <div className="space-y-6">
        {/* Round Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Round Title {round.isPeoplesRound && "(People's Question)"}
            </label>
            <input
              type="text"
              value={round.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={round.isPeoplesRound ? "People's Question" : "e.g., WW2 History"}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={round.categoryId}
              onChange={(e) => onUpdate({ categoryId: e.target.value, categoryName: getCategoryDisplayName(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              {mainCategories.map(cat => (
                <optgroup key={cat.id} label={cat.name}>
                  <option value={cat.id}>{cat.name}</option>
                  {subCategories
                    .filter(sub => sub.parentId === cat.id)
                    .map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {cat.name} &gt; {sub.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Questions ({round.questions.length}/{round.isPeoplesRound ? 1 : QUESTIONS_PER_ROUND})
            </h3>
            {!round.isPeoplesRound && round.questions.length < QUESTIONS_PER_ROUND && (
              <button
                onClick={onAddQuestion}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            )}
          </div>

          {round.questions.map((question, qIndex) => (
            <div
              key={question.id}
              className={`p-4 bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800/30 dark:to-gray-800/20 rounded-xl border ${
                question.isImported 
                  ? 'border-purple-300 dark:border-purple-700' 
                  : 'border-gray-200/50 dark:border-gray-700/50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Question {qIndex + 1}
                  </span>
                  {question.isImported && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                      Imported
                    </span>
                  )}
                </div>
                {round.questions.length > (round.isPeoplesRound ? 1 : 1) && (
                  <button
                    onClick={() => onRemoveQuestion(qIndex)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Question
                  </label>
                  <textarea
                    value={question.text}
                    onChange={(e) => onQuestionUpdate(qIndex, { text: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300/50 dark:border-gray-700/50 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Enter question text..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Answer
                  </label>
                  <input
                    type="text"
                    value={question.answer}
                    onChange={(e) => onQuestionUpdate(qIndex, { answer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300/50 dark:border-gray-700/50 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter answer..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Explanation (optional)
                  </label>
                  <textarea
                    value={question.explanation || ''}
                    onChange={(e) => onQuestionUpdate(qIndex, { explanation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300/50 dark:border-gray-700/50 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Enter explanation..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Import Question Modal */}
      {showImportQuestionModal && (
        <ImportQuestionModal
          questions={availableQuestions}
          isLoading={isLoadingQuestions}
          search={importSearch}
          categoryFilter={importCategoryFilter}
          onSearchChange={(value) => {
            setImportSearch(value)
            // Debounce search
            setTimeout(() => fetchAvailableQuestions(), 300)
          }}
          onCategoryFilterChange={(value) => {
            setImportCategoryFilter(value)
            fetchAvailableQuestions()
          }}
          onSelectQuestion={(question) => {
            onImportQuestion(question)
            setShowImportQuestionModal(false)
          }}
          onClose={() => {
            setShowImportQuestionModal(false)
            setImportSearch('')
            setImportCategoryFilter('')
          }}
          categories={categories}
          getCategoryDisplayName={getCategoryDisplayName}
        />
      )}

      {/* Import Round Modal */}
      {showImportRoundModal && (
        <ImportRoundModal
          onImport={(roundData) => {
            onImportRound(roundData)
            setShowImportRoundModal(false)
          }}
          onClose={() => setShowImportRoundModal(false)}
          categories={categories}
          getCategoryDisplayName={getCategoryDisplayName}
        />
      )}
    </div>
  )
}

interface ImportQuestionModalProps {
  questions: Question[]
  isLoading: boolean
  search: string
  categoryFilter: string
  onSearchChange: (value: string) => void
  onCategoryFilterChange: (value: string) => void
  onSelectQuestion: (question: Question) => void
  onClose: () => void
  categories: Array<{ id: string; name: string; parentId?: string | null }>
  getCategoryDisplayName: (categoryId: string) => string
}

function ImportQuestionModal({
  questions,
  isLoading,
  search,
  categoryFilter,
  onSearchChange,
  onCategoryFilterChange,
  onSelectQuestion,
  onClose,
  categories,
  getCategoryDisplayName,
}: ImportQuestionModalProps) {
  const mainCategories = categories.filter(c => !c.parentId)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Import Question
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          <div className="flex gap-4">
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search questions..."
              className="flex-1 px-4 py-2 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="px-4 py-2 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {mainCategories.map(cat => (
                <optgroup key={cat.id} label={cat.name}>
                  <option value={cat.id}>{cat.name}</option>
                  {categories
                    .filter(sub => sub.parentId === cat.id)
                    .map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {cat.name} &gt; {sub.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No available questions found
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition-colors"
                  onClick={() => onSelectQuestion(question)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white flex-1">
                      {question.text}
                    </p>
                    <button className="ml-4 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                      Import
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Answer: {question.answer}
                  </p>
                  {question.categoryName && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Category: {question.categoryName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ImportRoundModalProps {
  onImport: (roundData: Partial<Round>) => void
  onClose: () => void
  categories: Array<{ id: string; name: string; parentId?: string | null }>
  getCategoryDisplayName: (categoryId: string) => string
}

function ImportRoundModal({
  onImport,
  onClose,
  categories,
  getCategoryDisplayName,
}: ImportRoundModalProps) {
  const [rounds, setRounds] = useState<Array<{
    id: string
    title: string
    categoryId: string
    categoryName: string
    blurb?: string
    questions: Array<{
      id: string
      text: string
      answer: string
      explanation?: string
      categoryId: string
    }>
  }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const fetchAvailableRounds = () => {
    setIsLoading(true)
    const params = new URLSearchParams()
    if (categoryFilter) params.append('categoryId', categoryFilter)
    if (search) params.append('search', search)

    fetch(`/api/admin/rounds/available?${params}`)
      .then(res => res.json())
      .then(data => {
        setRounds(data.rounds || [])
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch rounds:', err)
        setIsLoading(false)
      })
  }

  useEffect(() => {
    fetchAvailableRounds()
  }, [])

  useEffect(() => {
    if (search || categoryFilter) {
      const timeoutId = setTimeout(() => {
        fetchAvailableRounds()
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [search, categoryFilter])

  const mainCategories = categories.filter(c => !c.parentId)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Import Round
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          <div className="flex gap-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rounds..."
              className="flex-1 px-4 py-2 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {mainCategories.map(cat => (
                <optgroup key={cat.id} label={cat.name}>
                  <option value={cat.id}>{cat.name}</option>
                  {categories
                    .filter(sub => sub.parentId === cat.id)
                    .map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {cat.name} &gt; {sub.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : rounds.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No available rounds found
            </div>
          ) : (
            <div className="space-y-4">
              {rounds.map((round) => (
                <div
                  key={round.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {round.title}
                      </h3>
                      {round.blurb && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {round.blurb}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                        Category: {round.categoryName} • {round.questions.length} question{round.questions.length !== 1 ? 's' : ''}
                      </p>
                      <div className="space-y-2 mt-3">
                        {round.questions.slice(0, 3).map((q, idx) => (
                          <div key={q.id} className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Q{idx + 1}:</span> {q.text}
                          </div>
                        ))}
                        {round.questions.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            +{round.questions.length - 3} more question{round.questions.length - 3 !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onImport(round)}
                      className="ml-4 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      Import
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

