'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Clock, User, Filter, ChevronDown, ChevronUp, Mail, School, UserCircle, Tag } from 'lucide-react'

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
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

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

  const toggleCardExpansion = (submissionId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev)
      if (next.has(submissionId)) {
        next.delete(submissionId)
      } else {
        next.add(submissionId)
      }
      return next
    })
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
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] tracking-tight">
          User-Submitted Questions
        </h1>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          Review and approve user-submitted quiz questions
        </p>
      </div>

      {/* Filters */}
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-4 shadow-sm">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))] z-10" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--input))] backdrop-blur-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:shadow-[0_0_0_3px_hsl(var(--ring)/0.1)]"
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
          <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-12 text-center shadow-sm">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No submissions found</p>
          </div>
        ) : (
          submissions.map((submission) => {
            const statusBadge = getStatusBadge(submission.status)
            const StatusIcon = statusBadge.icon
            const isExpanded = expandedCards.has(submission.id)
            const hasMetadata = submission.teacherName || submission.schoolName || submission.consentForShoutout || submission.category
            
            return (
              <div
                key={submission.id}
                className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden"
              >
                {/* Header - Always Visible */}
                <div className="p-6 border-b border-[hsl(var(--border))]">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.className} flex-shrink-0`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusBadge.label}
                        </span>
                        <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] min-w-0">
                          <UserCircle className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium text-[hsl(var(--foreground))] truncate">{submission.userName}</span>
                        </div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))] flex-shrink-0">
                          {formatDate(submission.createdAt)}
                        </div>
                      </div>
                      
                      {/* Question - Prominent */}
                      <div className="mb-3">
                        <p className="text-base font-semibold text-[hsl(var(--foreground))] leading-relaxed">
                          {submission.question}
                        </p>
                      </div>
                      
                      {/* Answer - Prominent */}
                      <div className="bg-[hsl(var(--muted))]/50 rounded-lg p-3 mb-3">
                        <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Answer</p>
                        <p className="text-base font-medium text-[hsl(var(--foreground))]">
                          {submission.answer}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Metadata Toggle */}
                  {hasMetadata && (
                    <button
                      onClick={() => toggleCardExpansion(submission.id)}
                      className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Show details
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Expandable Metadata Section */}
                {isExpanded && hasMetadata && (
                  <div className="p-6 bg-[hsl(var(--muted))]/30 border-b border-[hsl(var(--border))] space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-start gap-2">
                        <Mail className="w-4 h-4 text-[hsl(var(--muted-foreground))] mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-0.5">Email</p>
                          <p className="text-sm text-[hsl(var(--foreground))] break-all">{submission.userEmail}</p>
                        </div>
                      </div>
                      
                      {submission.teacherName && (
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-[hsl(var(--muted-foreground))] mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-0.5">Teacher</p>
                            <p className="text-sm text-[hsl(var(--foreground))]">{submission.teacherName}</p>
                          </div>
                        </div>
                      )}
                      
                      {submission.schoolName && (
                        <div className="flex items-start gap-2">
                          <School className="w-4 h-4 text-[hsl(var(--muted-foreground))] mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-0.5">School</p>
                            <p className="text-sm text-[hsl(var(--foreground))]">{submission.schoolName}</p>
                          </div>
                        </div>
                      )}
                      
                      {submission.category && (
                        <div className="flex items-start gap-2">
                          <Tag className="w-4 h-4 text-[hsl(var(--muted-foreground))] mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-0.5">Suggested Category</p>
                            <p className="text-sm text-[hsl(var(--foreground))]">{submission.category}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {submission.consentForShoutout && (
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          ✓ Consent for shoutout
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation - Always visible if exists */}
                {submission.explanation && (
                  <div className="p-6 bg-[hsl(var(--muted))]/30 border-b border-[hsl(var(--border))]">
                    <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2">Explanation</p>
                    <p className="text-sm text-[hsl(var(--foreground))] leading-relaxed">{submission.explanation}</p>
                  </div>
                )}

                {/* Actions - Only for PENDING */}
                {submission.status === 'PENDING' && (
                  <div className="p-6 flex items-center gap-3">
                    <button
                      onClick={() => handleApprove(submission.id)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors shadow-sm hover:shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Create Question
                    </button>
                    <button
                      onClick={() => handleReject(submission.id)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-sm hover:shadow-md"
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

