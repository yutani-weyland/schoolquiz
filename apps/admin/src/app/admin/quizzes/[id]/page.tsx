'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BookOpen, ArrowLeft, FileText, BarChart3, Play, Calendar, Users, TrendingUp, Clock } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface Round {
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

interface Run {
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

export default function AdminQuizDetailPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string
  const [activeTab, setActiveTab] = useState('content')
  const [quiz, setQuiz] = useState<QuizDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchQuiz()
  }, [quizId])

  const fetchQuiz = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/quizzes/${quizId}`)
      const data = await response.json()
      console.log('Quiz detail API response:', data)
      
      if (response.ok) {
        setQuiz(data.quiz)
      } else {
        console.error('API error:', data)
      }
    } catch (error) {
      console.error('Failed to fetch quiz:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Quiz not found</p>
      </div>
    )
  }

  const statusBadge = getStatusBadge(quiz.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200/50 dark:hover:from-gray-700 dark:hover:to-gray-700/50 rounded-xl transition-all duration-200 hover:shadow-[0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:hover:shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.05)]"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-500" />
              {quiz.title}
            </h1>
            {quiz.blurb && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{quiz.blurb}</p>
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
        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Rounds</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.rounds.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <Play className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Runs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.analytics.totalRuns}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Participants</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.analytics.totalParticipants}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.analytics.averageScore}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex border-b border-gray-200/50 dark:border-gray-700/50 mb-6 bg-transparent p-0 h-auto">
          <TabsTrigger
            value="content"
            className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
          >
            Content
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
          >
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="runs"
            className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 rounded-none bg-transparent"
          >
            Runs
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="mt-0">
          <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
            <div className="space-y-6">
              {/* Quiz Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quiz Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Title</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{quiz.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${statusBadge.className}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                    <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Theme</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{quiz.theme || 'N/A'}</p>
                    </div>
                    <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Audience</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{quiz.audience || 'N/A'}</p>
                    </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Publication Date</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{formatDate(quiz.publicationDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Created By</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{quiz.creator.name}</p>
                  </div>
                </div>
                  </div>

              {/* Rounds */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rounds</h3>
                <div className="space-y-4">
                  {quiz.rounds.map((round, index) => (
                    <div
                      key={round.id}
                      className="bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800/30 dark:to-gray-800/20 rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Round {round.index}: {round.category.name}
                      </h4>
                          {round.blurb && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{round.blurb}</p>
                      )}
                    </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {round.questions.length} questions
                          </span>
                      </div>
                      <div className="space-y-2">
                        {round.questions.map((q) => (
                          <div
                            key={q.id}
                            className="text-xs text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 rounded-lg p-2"
                          >
                            <p className="font-medium">{q.question.text}</p>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Answer: {q.question.answer}</p>
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
            <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Runs</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{quiz.analytics.totalRuns}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Participants</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{quiz.analytics.totalParticipants}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Avg Audience Size</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {Math.round(quiz.analytics.averageAudienceSize)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{quiz.analytics.averageScore}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {Math.round(quiz.analytics.completionRate * 100)}%
                  </p>
            </div>
          </div>
        </div>
      </div>
        </TabsContent>

        {/* Runs Tab */}
        <TabsContent value="runs" className="mt-0">
          <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
            {quiz.runs.length === 0 ? (
              <div className="p-12 text-center">
                <Play className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No runs found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-900/50 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          School
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Teacher
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Started
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Participants
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Source
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/50 dark:bg-gray-800/50 divide-y divide-gray-200/50 dark:divide-gray-700/50">
                      {quiz.runs.map((run) => (
                        <tr
                          key={run.id}
                          className="hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-gray-100/40 dark:hover:from-gray-700/30 dark:hover:to-gray-700/20 transition-all duration-200 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {run.school.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {run.teacher.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(run.startedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDuration(run.startedAt, run.finishedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {run.audienceSize}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
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
      </Tabs>
    </div>
  )
}
