'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, CheckCircle2, XCircle, Clock, User, Filter } from 'lucide-react'

interface UserQuestionSubmission {
  id: string
  userId: string
  userName: string
  userEmail: string
  question: string
  answer: string
  explanation?: string | null
  category?: string | null
  status: string
  reviewedBy?: string | null
  reviewedAt?: string | null
  notes?: string | null
  teacherName?: string | null
  schoolName?: string | null
  consentForShoutout?: boolean
  createdAt: string
}

export default function UserQuestionSubmissionsPage() {
  const [submissions, setSubmissions] = useState<UserQuestionSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchSubmissions()
  }, [statusFilter])

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/admin/questions/submissions?${params}`)
      const data = await response.json()
      console.log('Submissions API response:', data)
      
      if (response.ok) {
        setSubmissions(data.submissions || [])
      } else {
        console.error('API error:', data)
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (submissionId: string) => {
    try {
      const response = await fetch(`/api/admin/questions/submissions/${submissionId}/approve`, {
        method: 'POST',
      })
      if (response.ok) {
        fetchSubmissions()
      }
    } catch (error) {
      console.error('Failed to approve submission:', error)
    }
  }

  const handleReject = async (submissionId: string) => {
    try {
      const response = await fetch(`/api/admin/questions/submissions/${submissionId}/reject`, {
        method: 'POST',
      })
      if (response.ok) {
        fetchSubmissions()
      }
    } catch (error) {
      console.error('Failed to reject submission:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Clock },
      APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle2 },
      REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
    }
    return badges[status as keyof typeof badges] || badges.PENDING
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-blue-500" />
          User-Submitted Questions
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Review and approve user-submitted quiz questions
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 z-10" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-white dark:bg-gray-800 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Submissions */}
      <div className="space-y-4">
        {submissions.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No submissions found</p>
          </div>
        ) : (
          submissions.map((submission) => {
            const statusBadge = getStatusBadge(submission.status)
            const StatusIcon = statusBadge.icon
            return (
              <div
                key={submission.id}
                className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusBadge.label}
                      </span>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <User className="w-4 h-4" />
                        <span>{submission.userName} ({submission.userEmail})</span>
                      </div>
                      {submission.teacherName && (
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Teacher:</span> {submission.teacherName}
                        </div>
                      )}
                      {submission.schoolName && (
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">School:</span> {submission.schoolName}
                        </div>
                      )}
                      {submission.consentForShoutout && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          ✓ Shoutout OK
                        </span>
                      )}
                    </div>
                    {submission.category && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Suggested category: {submission.category}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                    <p>{formatDate(submission.createdAt)}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Question</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{submission.question}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Answer</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{submission.answer}</p>
                  </div>
                  {submission.explanation && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Explanation</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{submission.explanation}</p>
                    </div>
                  )}
                </div>

                {submission.status === 'PENDING' && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleApprove(submission.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Create Question
                    </button>
                    <button
                      onClick={() => handleReject(submission.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

