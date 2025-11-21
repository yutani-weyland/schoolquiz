'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Plus, Save, Eye, FileDown, ArrowLeft, Import, CheckCircle2, XCircle, Sparkles, Upload } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select'
import Link from 'next/link'
import { useAutosave } from '@/hooks/useAutosave'
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning'
import { SaveIndicator } from '@/components/admin/SaveIndicator'
import { useDraft } from '@/hooks/useDraft'
import { DraftRecoveryModal } from '@/components/admin/DraftRecoveryModal'
import { QuestionTemplateModal } from '@/components/admin/questions/QuestionTemplateModal'
import { BulkImportModal } from '@/components/admin/questions/BulkImportModal'
import { QuestionPreview } from '@/components/admin/questions/QuestionPreview'
import { validateQuestion, normalizeQuestion, type Question as QuestionValidation } from '@/lib/question-validation'
import { Card } from '@/components/admin/ui/Card'

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
  const [isLoading, setIsLoading] = useState(false)
  const [activeRound, setActiveRound] = useState(0)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [draftChecked, setDraftChecked] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    // Check for draft to restore from sessionStorage (from drafts page)
    const restoreDraftStr = sessionStorage.getItem('restore_draft')
    if (restoreDraftStr) {
      try {
        const savedDraft = JSON.parse(restoreDraftStr)
        if (savedDraft && savedDraft.type === 'quiz') {
          setQuiz(savedDraft.data)
          sessionStorage.removeItem('restore_draft')
        }
      } catch (error) {
        console.error('Error restoring draft:', error)
      }
    } else if (editQuizId) {
      loadQuiz(editQuizId)
    }
  }, [editQuizId])

  const loadQuiz = async (quizId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}`)
      const data = await response.json()
      if (response.ok && data.quiz) {
        const quizData = data.quiz
        
        // Transform database format to builder format
        const transformedRounds: Round[] = (quizData.rounds || []).map((round: any) => {
          const isPeoplesRound = round.isPeoplesRound || false
          
          // Transform questions
          const transformedQuestions: Question[] = (round.questions || []).map((rq: any) => ({
            id: rq.question?.id || `q-${Date.now()}-${Math.random()}`,
            text: rq.question?.text || '',
            answer: rq.question?.answer || '',
            explanation: rq.question?.explanation || '',
            categoryId: round.categoryId || round.category?.id || '',
            categoryName: round.category?.name || '',
          }))
          
          // Ensure correct number of questions for each round
          const expectedQuestionCount = isPeoplesRound ? 1 : QUESTIONS_PER_ROUND
          while (transformedQuestions.length < expectedQuestionCount) {
            transformedQuestions.push({
              id: `q-${Date.now()}-${Math.random()}`,
              text: '',
              answer: '',
              explanation: '',
              categoryId: round.categoryId || round.category?.id || '',
              categoryName: round.category?.name || '',
            })
          }
          
          return {
            id: round.id || `round-${round.index}`,
            index: round.index,
            title: round.title || round.category?.name || `Round ${round.index + 1}`,
            categoryId: round.categoryId || round.category?.id || '',
            categoryName: round.category?.name || '',
            blurb: round.blurb || '',
            questions: transformedQuestions,
            isPeoplesRound,
          }
        })
        
        // Ensure we have the correct number of rounds (4 standard + 1 peoples)
        const standardRounds = transformedRounds.filter(r => !r.isPeoplesRound)
        const peoplesRounds = transformedRounds.filter(r => r.isPeoplesRound)
        
        // Fill in missing standard rounds
        while (standardRounds.length < STANDARD_ROUNDS) {
          const nextIndex = standardRounds.length
          standardRounds.push({
            id: `round-${nextIndex}`,
            index: nextIndex,
            title: '',
            categoryId: '',
            blurb: '',
            questions: Array.from({ length: QUESTIONS_PER_ROUND }, () => ({
              id: `q-${Date.now()}-${Math.random()}`,
              text: '',
              answer: '',
              explanation: '',
              categoryId: '',
            })),
            isPeoplesRound: false,
          })
        }
        
        // Ensure we have exactly one peoples round
        if (peoplesRounds.length === 0) {
          peoplesRounds.push({
            id: `round-${PEOPLE_ROUND_INDEX}`,
            index: PEOPLE_ROUND_INDEX,
            title: '',
            categoryId: '',
            blurb: '',
            questions: [{
              id: `q-${Date.now()}-${Math.random()}`,
              text: '',
              answer: '',
              explanation: '',
              categoryId: '',
            }],
            isPeoplesRound: true,
          })
        }
        
        // Combine rounds in correct order
        const allRounds = [...standardRounds, ...peoplesRounds].sort((a, b) => a.index - b.index)
        
        setQuiz({
          id: quizData.id,
          title: quizData.title,
          status: quizData.status,
          rounds: allRounds,
        })
      }
    } catch (error) {
      console.error('Failed to load quiz:', error)
      alert('Failed to load quiz. Please try again.')
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

  // Save function for autosave
  const performSave = useCallback(async (data: QuizBuilderData) => {
    // Skip autosave for new quizzes without title - they need manual save first
    if (!data.id && !data.title?.trim()) {
      throw new Error('Cannot autosave: Quiz needs a title first')
    }
    
    // For new quizzes, skip autosave - require manual save first to get an ID
    // This prevents issues with quiz number conflicts
    if (!data.id) {
      // Silently skip autosave for new quizzes
      return { skipped: true, reason: 'New quiz needs manual save first' }
    }
    
    const isUpdate = !!data.id
    const url = `/api/admin/quizzes/${data.id}`
    
    // For updates, use PATCH instead of PUT to avoid recreating rounds
    // Transform builder format to API format
    const apiData = {
      title: data.title || '',
      blurb: data.title || '', // Use title as blurb for now
      status: data.status,
      // Only include rounds if they have valid data
      rounds: data.rounds
        .filter(round => {
          // Include round if it has a category and at least one valid question
          const hasCategory = round.categoryId || round.categoryName
          const hasValidQuestions = round.questions.some(q => q.text?.trim() && q.answer?.trim())
          return hasCategory && hasValidQuestions
        })
        .map(round => {
          // Get category name from categoryId
          const category = categories.find(c => c.id === round.categoryId)
          const categoryName = category?.name || round.categoryName || 'General Knowledge'
          
          return {
            id: round.id,
            category: categoryName,
            title: round.title || categoryName,
            blurb: round.blurb || '',
            kind: round.isPeoplesRound ? 'finale' : 'standard',
            questions: round.questions
              .filter(q => q.text?.trim() && q.answer?.trim()) // Only include filled questions
              .map(q => ({
                id: q.id,
                question: q.text,
                answer: q.answer,
                explanation: q.explanation || '',
                category: categoryName,
              })),
          }
        }),
    }
    
    // Use PUT for full update (includes rounds)
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiData),
    })
    
    const responseData = await response.json()
    if (!response.ok) {
      // Log the error for debugging
      console.error('Autosave failed:', {
        status: response.status,
        error: responseData.error,
        details: responseData.details,
      })
      throw new Error(responseData.error || responseData.details || 'Failed to save quiz')
    }
    
    return responseData
  }, [categories])

  // Draft management
  const {
    hasDraft,
    draft,
    loadDraft,
    clearDraft,
    checkDraft,
  } = useDraft({
    type: 'quiz',
    id: quiz.id || null,
    data: quiz,
    getTitle: (data) => data.title || 'Untitled Quiz',
    getPreview: (data) => {
      const roundCount = data.rounds?.length || 0
      const questionCount = data.rounds?.reduce((sum, r) => sum + (r.questions?.length || 0), 0) || 0
      return `${roundCount} rounds, ${questionCount} questions`
    },
    enabled: !isLoading, // Only save drafts when not loading
  })

  // Check for draft on mount
  useEffect(() => {
    if (!draftChecked && !editQuizId) {
      const hasExistingDraft = checkDraft()
      if (hasExistingDraft) {
        setShowDraftModal(true)
      }
      setDraftChecked(true)
    }
  }, [checkDraft, draftChecked, editQuizId])

  // Autosave hook
  // Only enable autosave for existing quizzes (with ID) and when there's content
  const {
    isSaving,
    hasUnsavedChanges,
    lastSaved,
    save: triggerSave,
    clearUnsavedChanges,
  } = useAutosave({
    data: quiz,
    onSave: performSave,
    delay: 10000, // 10 seconds
    enabled: !!quiz.id && (!!quiz.title || quiz.rounds.some(r => r.title || r.questions.some(q => q.text))),
    onSaveError: (error) => {
      // Only show error if it's not a "skip" error
      if (!error.message.includes('skipped') && !error.message.includes('manual save first')) {
        setSaveError(error.message)
        console.error('Autosave failed:', error)
      }
    },
    onSaveComplete: () => {
      setSaveError(null)
    },
  })

  // Clear draft after successful save
  useEffect(() => {
    if (lastSaved && !hasUnsavedChanges) {
      clearDraft()
    }
  }, [lastSaved, hasUnsavedChanges, clearDraft])

  // Warn before leaving with unsaved changes
  useUnsavedChangesWarning(hasUnsavedChanges)

  // Handle draft recovery
  const handleRestoreDraft = useCallback(() => {
    const savedDraft = loadDraft()
    if (savedDraft) {
      setQuiz(savedDraft.data)
      clearDraft() // Clear after loading to avoid showing modal again
    }
    setShowDraftModal(false)
  }, [loadDraft, clearDraft])

  const handleDiscardDraft = useCallback(() => {
    clearDraft()
    setShowDraftModal(false)
  }, [clearDraft])

  // Manual save handler - works for both new and existing quizzes
  const handleSave = useCallback(async () => {
    try {
      const isUpdate = !!quiz.id
      const url = isUpdate 
        ? `/api/admin/quizzes/${quiz.id}`
        : '/api/admin/quizzes'
      
      // Transform builder format to API format
      const apiData = {
        number: isUpdate ? undefined : 0, // For new quizzes, use 0 (will be auto-generated)
        title: quiz.title || 'Untitled Quiz',
        description: '', // Can be added later
        status: quiz.status,
        rounds: quiz.rounds.map(round => {
          // Get category name from categoryId
          const category = categories.find(c => c.id === round.categoryId)
          const categoryName = category?.name || round.categoryName || 'General Knowledge'
          
          return {
            id: round.id,
            category: categoryName,
            title: round.title || categoryName,
            blurb: round.blurb || '',
            kind: round.isPeoplesRound ? 'finale' : 'standard',
            questions: round.questions
              .filter(q => q.text && q.answer) // Only include filled questions
              .map(q => ({
                id: q.id,
                question: q.text,
                answer: q.answer,
                explanation: q.explanation || '',
                category: categoryName,
              })),
          }
        }),
      }
      
      const response = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to save quiz')
      }
      
      // Update quiz ID if this is a new quiz
      if (!isUpdate && data.quiz?.id) {
        setQuiz(prev => ({ ...prev, id: data.quiz.id }))
        // Clear unsaved changes after successful save
        clearUnsavedChanges()
      } else if (isUpdate) {
        // Clear unsaved changes after successful update
        clearUnsavedChanges()
      }
      
      // Show success message (but not via alert - use a toast or notification system if available)
      console.log('Quiz saved successfully')
    } catch (error: any) {
      setSaveError(error.message || 'Failed to save quiz')
      console.error('Manual save failed:', error)
      throw error // Re-throw so caller can handle it
    }
  }, [quiz, categories, clearUnsavedChanges])

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
      {/* Draft Recovery Modal */}
      {showDraftModal && draft && (
        <DraftRecoveryModal
          draft={draft}
          onRestore={handleRestoreDraft}
          onDiscard={handleDiscardDraft}
          open={showDraftModal}
          onClose={() => setShowDraftModal(false)}
        />
      )}

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
              Quiz Builder
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Create a new quiz with 4 rounds of 6 questions + 1 people's question
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Save Indicator */}
          <SaveIndicator
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
            lastSaved={lastSaved}
            error={saveError}
          />
          
          <button
            onClick={handlePreview}
            disabled={!canSave}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 sm:px-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 border border-gray-300/50 dark:border-gray-700/50 rounded-xl hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100/50 dark:hover:from-gray-700 dark:hover:to-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            title="Preview"
          >
            <Eye className="w-4 h-4 flex-shrink-0" />
            <span className="hidden lg:inline">Preview</span>
          </button>
          <button
            onClick={handleGeneratePDF}
            disabled={!canSave}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 sm:px-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 border border-gray-300/50 dark:border-gray-700/50 rounded-xl hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100/50 dark:hover:from-gray-700 dark:hover:to-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            title="Generate PDF"
          >
            <FileDown className="w-4 h-4 flex-shrink-0" />
            <span className="hidden lg:inline">Generate PDF</span>
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 sm:px-4 text-sm font-medium text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            title={isSaving ? 'Saving...' : 'Save Now'}
          >
            {isSaving ? (
              <Spinner className="w-4 h-4 flex-shrink-0" />
            ) : (
              <Save className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="hidden lg:inline">{isSaving ? 'Saving...' : 'Save Now'}</span>
          </button>
        </div>
      </div>

      {/* Quiz Title (Auto-generated) */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4">
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
      <Card padding="sm">
        <div className="flex gap-2 overflow-x-auto">
          {quiz.rounds.map((round, index) => (
            <button
              key={round.id}
              onClick={() => setActiveRound(index)}
              className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeRound === index
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/80'
              }`}
            >
              {round.isPeoplesRound ? "People's Question" : `Round ${index + 1}`}
              {round.title && `: ${round.title}`}
            </button>
          ))}
        </div>
      </Card>

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
              questions: (roundData.questions || []).map((q: any) => ({
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
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showBulkImportModal, setShowBulkImportModal] = useState(false)
  const [previewQuestion, setPreviewQuestion] = useState<QuestionValidation | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
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
    <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-6">
      <div className="space-y-6">
        {/* Round Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
              Round Title {round.isPeoplesRound && "(People's Question)"}
            </label>
            <input
              type="text"
              value={round.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              placeholder={round.isPeoplesRound ? "People's Question" : "e.g., WW2 History"}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
              Category
            </label>
            <select
              value={round.categoryId}
              onChange={(e) => onUpdate({ categoryId: e.target.value, categoryName: getCategoryDisplayName(e.target.value) })}
              className="w-full px-3 py-1.5 text-sm border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
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
            <h3 className="text-base font-semibold text-[hsl(var(--foreground))]">
              Questions ({round.questions.length}/{round.isPeoplesRound ? 1 : QUESTIONS_PER_ROUND})
            </h3>
            {!round.isPeoplesRound && round.questions.length < QUESTIONS_PER_ROUND && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
                  title="Use question template"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Template
                </button>
                <button
                  onClick={() => setShowBulkImportModal(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                  title="Bulk import from CSV/JSON"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import
                </button>
                <button
                  onClick={() => setShowImportQuestionModal(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10 rounded-md transition-colors"
                  title="Import from question bank"
                >
                  <Import className="w-3.5 h-3.5" />
                  From Bank
                </button>
                <button
                  onClick={onAddQuestion}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10 rounded-md transition-colors"
                  title="Add empty question"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Question
                </button>
              </div>
            )}
          </div>

          {round.questions.map((question, qIndex) => (
            <div
              key={question.id}
              className={`p-4 bg-[hsl(var(--card))] rounded-lg border ${
                question.isImported 
                  ? 'border-purple-300 dark:border-purple-700' 
                  : 'border-[hsl(var(--border))]'
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
                {/* Validation & Preview */}
                {(() => {
                  const validation = validateQuestion(normalizeQuestion({
                    text: question.text,
                    answer: question.answer,
                    explanation: question.explanation,
                  }))
                  
                  return (
                    <>
                      {!validation.valid && validation.errors.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-2 text-xs text-red-700 dark:text-red-400">
                          {validation.errors.map((err, i) => (
                            <div key={i}>• {err.message}</div>
                          ))}
                        </div>
                      )}
                      {validation.warnings.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-lg p-2 text-xs text-amber-700 dark:text-amber-400">
                          {validation.warnings.map((warn, i) => (
                            <div key={i}>⚠ {warn}</div>
                          ))}
                        </div>
                      )}
                      {validation.valid && question.text && question.answer && (
                        <button
                          onClick={() => {
                            setPreviewQuestion({
                              text: question.text,
                              answer: question.answer,
                              explanation: question.explanation,
                            })
                            setPreviewIndex(qIndex)
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Preview
                        </button>
                      )}
                    </>
                  )
                })()}
                
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Question
                  </label>
                  <textarea
                    value={question.text}
                    onChange={(e) => onQuestionUpdate(qIndex, { text: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                    rows={2}
                    placeholder="Enter question text..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">
                    Answer
                  </label>
                  <input
                    type="text"
                    value={question.answer}
                    onChange={(e) => onQuestionUpdate(qIndex, { answer: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                    placeholder="Enter answer..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">
                    Explanation (optional)
                  </label>
                  <textarea
                    value={question.explanation || ''}
                    onChange={(e) => onQuestionUpdate(qIndex, { explanation: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                    rows={2}
                    placeholder="Enter explanation..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Question Template Modal */}
      {showTemplateModal && (
        <QuestionTemplateModal
          onSelect={(question) => {
            const normalized = normalizeQuestion(question)
            const validation = validateQuestion(normalized)
            
            if (validation.valid) {
              const emptySlot = round.questions.findIndex(q => !q.text)
              if (emptySlot >= 0) {
                onQuestionUpdate(emptySlot, {
                  text: normalized.text,
                  answer: normalized.answer,
                  explanation: normalized.explanation,
                })
              } else {
                onImportQuestion({
                  id: `q-${Date.now()}-${Math.random()}`,
                  text: normalized.text,
                  answer: normalized.answer,
                  explanation: normalized.explanation,
                  categoryId: round.categoryId,
                })
              }
            } else {
              alert(`Question has validation errors:\n${validation.errors.map(e => e.message).join('\n')}`)
              return
            }
            
            setShowTemplateModal(false)
          }}
          onClose={() => setShowTemplateModal(false)}
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <BulkImportModal
          onImport={(questions) => {
            const normalized = questions.map(normalizeQuestion)
            const validated = normalized.filter(q => validateQuestion(q).valid)
            
            if (validated.length === 0) {
              alert('No valid questions to import')
              return
            }
            
            // Add all validated questions
            validated.forEach((question) => {
              const emptySlot = round.questions.findIndex(q => !q.text)
              if (emptySlot >= 0) {
                onQuestionUpdate(emptySlot, {
                  text: question.text,
                  answer: question.answer,
                  explanation: question.explanation,
                })
              } else if (round.questions.length < (round.isPeoplesRound ? 1 : QUESTIONS_PER_ROUND)) {
                onImportQuestion({
                  id: `q-${Date.now()}-${Math.random()}`,
                  text: question.text,
                  answer: question.answer,
                  explanation: question.explanation,
                  categoryId: round.categoryId,
                })
              }
            })
            
            setShowBulkImportModal(false)
            alert(`Imported ${validated.length} question${validated.length > 1 ? 's' : ''}`)
          }}
          onClose={() => setShowBulkImportModal(false)}
        />
      )}

      {/* Question Preview Modal */}
      {previewQuestion && previewIndex !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                  Question Preview
                </h2>
                <button
                  onClick={() => {
                    setPreviewQuestion(null)
                    setPreviewIndex(null)
                  }}
                  className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <QuestionPreview
                question={previewQuestion}
                showActions={false}
              />
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setPreviewQuestion(null)
                    setPreviewIndex(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 max-w-4xl w-full max-h-[80vh] flex flex-col">
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
            <Select
              value={categoryFilter || "all"}
              onValueChange={(value) => onCategoryFilterChange(value === "all" ? "" : value)}
            >
              <SelectTrigger className="px-4 py-2 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {mainCategories.map(cat => (
                  <SelectGroup key={cat.id}>
                    <SelectLabel>{cat.name}</SelectLabel>
                    <SelectItem value={cat.id}>{cat.name}</SelectItem>
                    {categories
                      .filter(sub => sub.parentId === cat.id)
                      .map(sub => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {cat.name} &gt; {sub.name}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <Spinner className="size-8" />
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 max-w-4xl w-full max-h-[80vh] flex flex-col">
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
              <Spinner className="size-8" />
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

