'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BookOpen, ArrowLeft, FileText, BarChart3, Play, Calendar, Users, TrendingUp, Clock, Palette, Eye, FileDown, FileCheck, CheckCircle2, Loader2 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { quizColors } from '@/lib/colors'
import { QuizCardPreview } from '@/components/admin/quizzes/QuizCardPreview'

export interface Round {
  id: string
  index: number
  categoryId: string
  category: {
    id: string
    name: string
  }
  blurb?: string | null
  targetDifficulty?: number | null
  questions: Array<{
    id: string
    order: number
    question: {
      id: string
      text: string
      answer: string
      difficulty: number
    }
  }>
}

export interface Run {
  id: string
  startedAt: string
  finishedAt?: string | null
  audienceSize: number
  notes?: string | null
  source: string
  school: {
    id: string
    name: string
  }
  teacher: {
    id: string
    name: string
    email: string
  }
}

interface QuizDetail {
  id: string
  title: string
  blurb?: string | null
  audience?: string | null
  difficultyBand?: string | null
  theme?: string | null
  seasonalTag?: string | null
  publicationDate?: string | null
  status: string
  colorHex?: string | null
  pdfUrl?: string | null
  pdfStatus?: string | null
  createdAt: string
  updatedAt: string
  rounds: Round[]
  runs: Run[]
  analytics: {
    totalRuns: number
    totalParticipants: number
    averageAudienceSize: number
    completionRate: number
    averageScore: number
  }
  creator: {
    id: string
    name: string
    email: string
  }
}

interface AdminQuizDetailClientProps {
  initialQuiz: QuizDetail
  initialTab?: string
  quizId: string
}

export function AdminQuizDetailClient({ initialQuiz, initialTab = 'content', quizId }: AdminQuizDetailClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [quiz, setQuiz] = useState<QuizDetail | null>(initialQuiz)
  const [colorHex, setColorHex] = useState<string>(initialQuiz.colorHex || '')
  const [isSavingColor, setIsSavingColor] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [allQuizzes, setAllQuizzes] = useState<any[]>([])
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isApprovingPDF, setIsApprovingPDF] = useState(false)

  useEffect(() => {
    // Check for tab parameter in URL
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab) {
      setActiveTab(tab)
    }
  }, [])

  useEffect(() => {
    if (quiz) {
      setColorHex(quiz.colorHex || '')
    }
  }, [quiz])

  useEffect(() => {
    if (showPreview) {
      fetchAllQuizzes()
    }
  }, [showPreview])

  const refreshQuiz = async () => {
    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}`)
      const data = await response.json()
      if (response.ok) {
        setQuiz(data.quiz)
      }
    } catch (error) {
      console.error('Failed to refresh quiz:', error)
    }
  }

  const fetchAllQuizzes = async () => {
    setIsLoadingQuizzes(true)
    try {
      const response = await fetch('/api/admin/quizzes?status=published&limit=100')
      const data = await response.json()
      if (response.ok) {
        // Sort by publication date descending (newest first)
        const sorted = [...(data.quizzes || [])].sort((a, b) => {
          const dateA = a.publicationDate ? new Date(a.publicationDate).getTime() : 0
          const dateB = b.publicationDate ? new Date(b.publicationDate).getTime() : 0
          return dateB - dateA
        })
        setAllQuizzes(sorted)
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error)
    } finally {
      setIsLoadingQuizzes(false)
    }
  }

  const handleColorChange = async (newColor: string) => {
    setColorHex(newColor)
    setIsSavingColor(true)
    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colorHex: newColor || null }),
      })
      if (response.ok) {
        const data = await response.json()
        setQuiz(data.quiz)
        // Refresh preview if shown
        if (showPreview) {
          fetchAllQuizzes()
        }
        // Refresh the page data
        router.refresh()
      } else {
        const error = await response.json()
        console.error('Failed to update color:', error)
        // Revert on error
        if (quiz) setColorHex(quiz.colorHex || '')
      }
    } catch (error) {
      console.error('Failed to update color:', error)
      // Revert on error
      if (quiz) setColorHex(quiz.colorHex || '')
    } finally {
      setIsSavingColor(false)
    }
  }

  const handleGeneratePDF = async () => {
    if (!quiz) return
    
    setIsGeneratingPDF(true)
    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}/pdf`, {
        method: 'POST',
      })
      
      const data = await response.json()
      if (response.ok) {
        // Refresh quiz data
        await fetchQuiz()
        // Open PDF in new tab for review
        if (data.pdfUrl) {
          window.open(data.pdfUrl, '_blank')
        }
        alert('PDF generated successfully! Review it and approve when ready.')
      } else {
        alert(data.error || 'Failed to generate PDF')
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleApprovePDF = async () => {
    if (!quiz || !quiz.pdfUrl) return
    
    setIsApprovingPDF(true)
    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}/pdf/approve`, {
        method: 'POST',
      })
      
      const data = await response.json()
      if (response.ok) {
        // Refresh quiz data
        await refreshQuiz()
        router.refresh()
        alert('PDF approved! It will now appear on the quizzes page.')
      } else {
        alert(data.error || 'Failed to approve PDF')
      }
    } catch (error) {
      console.error('Failed to approve PDF:', error)
      alert('Failed to approve PDF')
    } finally {
      setIsApprovingPDF(false)
    }
  }

  const handleViewPDF = () => {
    if (quiz?.pdfUrl) {
      window.open(quiz.pdfUrl, '_blank')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { label: 'Draft', className: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]' },
      scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
      published: { label: 'Published', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    }
    return badges[status as keyof typeof badges] || badges.draft
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (start: string, end: string | null | undefined) => {
    if (!end) return 'In progress'
    const startDate = new Date(start)
    const endDate = new Date(end)
    const minutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000)
    return `${minutes} min`
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-[hsl(var(--muted-foreground))]">Quiz not found</p>
      </div>
    )
  }

  const statusBadge = getStatusBadge(quiz.status)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[hsl(var(--muted))] rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[hsl(var(--foreground))]" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] tracking-tight">
              {quiz.title}
            </h1>
            {quiz.blurb && (
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{quiz.blurb}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Rounds</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{quiz.rounds.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <Play className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Runs</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{quiz.analytics.totalRuns}</p>
            </div>
          </div>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Participants</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{quiz.analytics.totalParticipants}</p>
            </div>
          </div>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Avg Score</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{quiz.analytics.averageScore}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="inline-flex h-auto items-center justify-start rounded-none border-b border-[hsl(var(--border))] bg-transparent p-0 mb-6 w-full">
          <TabsTrigger
            value="content"
            className="px-6 py-3 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] data-[state=active]:text-[hsl(var(--primary))] data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--primary))] rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none -mb-px"
          >
            Content
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="px-6 py-3 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] data-[state=active]:text-[hsl(var(--primary))] data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--primary))] rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none -mb-px"
          >
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="runs"
            className="px-6 py-3 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] data-[state=active]:text-[hsl(var(--primary))] data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--primary))] rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none -mb-px"
          >
            Runs
          </TabsTrigger>
          <TabsTrigger
            value="pdf"
            className="px-6 py-3 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] data-[state=active]:text-[hsl(var(--primary))] data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--primary))] rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none -mb-px"
          >
            PDF Review
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="mt-0 space-y-6">
          <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6 shadow-sm">
            <div className="space-y-6">
              {/* Quiz Info */}
              <div>
                <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Quiz Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Title</p>
                    <p className="text-sm font-medium text-[hsl(var(--foreground))] mt-1">{quiz.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${statusBadge.className}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                    <div>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Theme</p>
                    <p className="text-sm font-medium text-[hsl(var(--foreground))] mt-1">{quiz.theme || 'N/A'}</p>
                    </div>
                    <div>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Audience</p>
                    <p className="text-sm font-medium text-[hsl(var(--foreground))] mt-1">{quiz.audience || 'N/A'}</p>
                    </div>
                  <div>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Publication Date</p>
                    <p className="text-sm font-medium text-[hsl(var(--foreground))] mt-1">{formatDate(quiz.publicationDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Created By</p>
                    <p className="text-sm font-medium text-[hsl(var(--foreground))] mt-1">{quiz.creator.name}</p>
                  </div>
                </div>
                  </div>

              {/* Quiz Card Color */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                    <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                      Quiz Card Color
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    {showPreview ? 'Hide' : 'Show'} Preview
                  </button>
                </div>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                  Choose a color for the quiz card. This color will appear on the user-facing quizzes page and in presentation mode.
                </p>
                
                {/* Color Palette */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Preset Colors
                  </label>
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                    {quizColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorChange(color)}
                        disabled={isSavingColor}
                        className={`
                          w-12 h-12 rounded-xl border-2 transition-all duration-200
                          ${colorHex === color
                            ? 'border-[hsl(var(--foreground))] scale-110 shadow-lg ring-2 ring-offset-2 ring-[hsl(var(--primary))]'
                            : 'border-[hsl(var(--border))] hover:scale-105 hover:border-[hsl(var(--foreground))]/50'
                          }
                          ${isSavingColor ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Custom Color Input */}
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Custom Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={colorHex || '#000000'}
                      onChange={(e) => handleColorChange(e.target.value)}
                      disabled={isSavingColor}
                      className="w-16 h-12 rounded-lg border border-[hsl(var(--border))] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <input
                      type="text"
                      value={colorHex || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        setColorHex(value)
                        // Validate and save on blur or Enter
                        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value) || value === '') {
                          handleColorChange(value || '')
                        }
                      }}
                      onBlur={(e) => {
                        if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(e.target.value) && e.target.value !== '') {
                          // Reset to current quiz color if invalid
                          if (quiz) setColorHex(quiz.colorHex || '')
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur()
                        }
                      }}
                      disabled={isSavingColor}
                      placeholder="#FFE135"
                      className="flex-1 px-3 py-2 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] placeholder:text-[hsl(var(--muted-foreground))] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {colorHex && (
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-[hsl(var(--border))]"
                        style={{ backgroundColor: colorHex }}
                        title={colorHex}
                      />
                    )}
                    {isSavingColor && (
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-[hsl(var(--primary))]"></div>
                    )}
                  </div>
                </div>

                {/* Preview */}
                {showPreview && quiz && (
                  <div className="mt-6 pt-6 border-t border-[hsl(var(--border))]">
                    <h4 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                      Preview - How Users See Quizzes (Chronological Order, Newest First)
                    </h4>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">
                      This shows how published quizzes appear on the user-facing quizzes page. The current quiz is highlighted.
                    </p>
                    {isLoadingQuizzes ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                        {allQuizzes.map((q, index) => {
                          const isCurrentQuiz = q.id === quizId
                          return (
                            <div
                              key={q.id}
                              className={`relative ${isCurrentQuiz ? 'ring-4 ring-[hsl(var(--primary))] rounded-3xl' : ''}`}
                            >
                              {isCurrentQuiz && (
                                <div className="absolute -top-2 -right-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-bold px-2 py-1 rounded-full z-10">
                                  This Quiz
                                </div>
                              )}
                              <QuizCardPreview
                                quiz={{
                                  id: parseInt(q.id.replace(/\D/g, '')) || index + 1,
                                  slug: q.id,
                                  title: q.title,
                                  blurb: q.blurb || '',
                                  weekISO: q.publicationDate ? new Date(q.publicationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                                  colorHex: q.colorHex || '#4FD1C7',
                                  status: q.status === 'published' ? 'available' as const : 'coming_soon' as const,
                                  tags: [],
                                }}
                                isNewest={index === 0}
                              />
                            </div>
                          )
                        })}
                        {allQuizzes.length === 0 && (
                          <div className="col-span-full text-center py-12 text-[hsl(var(--muted-foreground))]">
                            No published quizzes found. Publish some quizzes to see the preview.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Rounds */}
              <div>
                <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Rounds</h3>
                <div className="space-y-4">
                  {quiz.rounds.map((round, index) => (
                    <div
                      key={round.id}
                      className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                            Round {round.index}: {round.category.name}
                      </h4>
                          {round.blurb && (
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{round.blurb}</p>
                      )}
                    </div>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          {round.questions.length} questions
                          </span>
                      </div>
                      <div className="space-y-2">
                        {round.questions.map((q) => (
                          <div
                            key={q.id}
                            className="text-xs text-[hsl(var(--foreground))] bg-[hsl(var(--muted))] rounded-lg p-2"
                          >
                            <p className="font-medium">{q.question.text}</p>
                            <p className="text-[hsl(var(--muted-foreground))] mt-1">Answer: {q.question.answer}</p>
                  </div>
              ))}
            </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-0">
          <div className="space-y-6">
            <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Runs</p>
                  <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-1">{quiz.analytics.totalRuns}</p>
                </div>
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Participants</p>
                  <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-1">{quiz.analytics.totalParticipants}</p>
                </div>
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Avg Audience Size</p>
                  <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-1">
                    {Math.round(quiz.analytics.averageAudienceSize)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Average Score</p>
                  <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-1">{quiz.analytics.averageScore}%</p>
                </div>
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Completion Rate</p>
                  <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-1">
                    {Math.round(quiz.analytics.completionRate * 100)}%
                  </p>
            </div>
          </div>
        </div>
      </div>
        </TabsContent>

        {/* Runs Tab */}
        <TabsContent value="runs" className="mt-0">
          <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden shadow-sm">
            {quiz.runs.length === 0 ? (
              <div className="p-12 text-center">
                <Play className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />
                <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">No runs found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                          School
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                          Teacher
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                          Started
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                          Participants
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                          Source
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-[hsl(var(--card))] divide-y divide-[hsl(var(--border))]">
                      {quiz.runs.map((run) => (
                        <tr
                          key={run.id}
                          className="hover:bg-[hsl(var(--muted))] transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[hsl(var(--foreground))]">
                            {run.school.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                            {run.teacher.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                            {formatDate(run.startedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                            {formatDuration(run.startedAt, run.finishedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                            {run.audienceSize}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                            <span className="capitalize">{run.source}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* PDF Review Tab */}
        <TabsContent value="pdf" className="mt-0">
          <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6 shadow-sm">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">PDF Review & Approval</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
                  Generate a PDF for this quiz and review it before making it available on the quizzes page.
                </p>

                {!quiz.pdfStatus || quiz.pdfStatus === 'pending' ? (
                  <div className="border-2 border-dashed border-[hsl(var(--border))] rounded-xl p-8 text-center">
                    <FileDown className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))] mb-4" />
                    <p className="text-[hsl(var(--muted-foreground))] mb-4">No PDF has been generated yet.</p>
                    <button
                      onClick={handleGeneratePDF}
                      disabled={isGeneratingPDF}
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isGeneratingPDF ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <FileDown className="w-4 h-4" />
                          Generate PDF
                        </>
                      )}
                    </button>
                  </div>
                ) : quiz.pdfStatus === 'generated' ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                            PDF Generated Successfully
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-400">
                            Please review the PDF and approve it when you're ready to make it available on the quizzes page.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleViewPDF}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl hover:bg-[hsl(var(--muted))] transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View PDF
                      </button>
                      <button
                        onClick={handleApprovePDF}
                        disabled={isApprovingPDF}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isApprovingPDF ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <FileCheck className="w-4 h-4" />
                            Approve PDF
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleGeneratePDF}
                        disabled={isGeneratingPDF}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl hover:bg-[hsl(var(--muted))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isGeneratingPDF ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <FileDown className="w-4 h-4" />
                            Regenerate PDF
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : quiz.pdfStatus === 'approved' ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-900 dark:text-green-300 mb-1">
                            PDF Approved
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-400">
                            This PDF is now available on the quizzes page and ready for use.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleViewPDF}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl hover:bg-[hsl(var(--muted))] transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View PDF
                      </button>
                      <button
                        onClick={handleGeneratePDF}
                        disabled={isGeneratingPDF}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl hover:bg-[hsl(var(--muted))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isGeneratingPDF ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <FileDown className="w-4 h-4" />
                            Regenerate PDF
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
