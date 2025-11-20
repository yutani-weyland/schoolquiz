'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Clock, Loader2, AlertCircle } from 'lucide-react'

interface Quiz {
  id: string
  title: string
  status: string
}

interface CreateJobModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const JOB_TYPES = [
  { value: 'PUBLISH_QUIZ', label: 'Publish Quiz' },
  { value: 'OPEN_QUIZ_RUN', label: 'Open Quiz Run' },
  { value: 'CLOSE_QUIZ_RUN', label: 'Close Quiz Run' },
  { value: 'MAINTENANCE_WINDOW', label: 'Maintenance Window' },
  { value: 'SEND_NOTIFICATION', label: 'Send Notification' },
  { value: 'CUSTOM', label: 'Custom' },
]

export function CreateJobModal({ isOpen, onClose, onSuccess }: CreateJobModalProps) {
  const [formData, setFormData] = useState({
    type: 'PUBLISH_QUIZ',
    name: '',
    description: '',
    scheduledFor: '',
    scheduledTime: '',
    isRecurring: false,
    recurrencePattern: 'weekly',
    maxAttempts: 3,
    // Job-specific config
    quizId: '',
    schoolId: '',
    runId: '',
    message: '',
    recipients: '',
    subject: '',
    body: '',
  })

  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch quizzes when modal opens and type is PUBLISH_QUIZ or OPEN_QUIZ_RUN or CLOSE_QUIZ_RUN
  useEffect(() => {
    if (isOpen && (formData.type === 'PUBLISH_QUIZ' || formData.type === 'OPEN_QUIZ_RUN' || formData.type === 'CLOSE_QUIZ_RUN')) {
      fetchQuizzes()
    }
  }, [isOpen, formData.type])

  const fetchQuizzes = async () => {
    setIsLoadingQuizzes(true)
    try {
      const response = await fetch('/api/admin/quizzes?status=draft&limit=100')
      const data = await response.json()
      if (response.ok) {
        setQuizzes(data.quizzes || [])
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error)
    } finally {
      setIsLoadingQuizzes(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Combine date and time (use local timezone, then convert to ISO)
      let scheduledFor = ''
      if (formData.scheduledFor && formData.scheduledTime) {
        // Create date in local timezone
        const [year, month, day] = formData.scheduledFor.split('-')
        const [hours, minutes] = formData.scheduledTime.split(':')
        const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes))
        scheduledFor = localDate.toISOString()
      } else if (formData.scheduledFor) {
        // If no time specified, use midnight local time
        const [year, month, day] = formData.scheduledFor.split('-')
        const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0)
        scheduledFor = localDate.toISOString()
      }

      if (!scheduledFor) {
        setError('Please select a date and time')
        setIsSubmitting(false)
        return
      }

      // Validate scheduledFor is in the future
      if (new Date(scheduledFor) <= new Date()) {
        setError('Scheduled time must be in the future')
        setIsSubmitting(false)
        return
      }

      // Build config based on job type
      let config: any = {}
      switch (formData.type) {
        case 'PUBLISH_QUIZ':
          if (!formData.quizId) {
            setError('Please select a quiz')
            setIsSubmitting(false)
            return
          }
          config = { quizId: formData.quizId }
          break
        case 'OPEN_QUIZ_RUN':
          if (!formData.quizId) {
            setError('Please select a quiz')
            setIsSubmitting(false)
            return
          }
          config = { quizId: formData.quizId }
          if (formData.schoolId) config.schoolId = formData.schoolId
          break
        case 'CLOSE_QUIZ_RUN':
          if (!formData.quizId && !formData.runId) {
            setError('Please select a quiz or enter a run ID')
            setIsSubmitting(false)
            return
          }
          config = {}
          if (formData.quizId) config.quizId = formData.quizId
          if (formData.runId) config.runId = formData.runId
          break
        case 'MAINTENANCE_WINDOW':
          config = { message: formData.message || 'Scheduled maintenance' }
          if (formData.scheduledTime) {
            // Calculate duration from scheduled time (simplified)
            config.duration = 60 // minutes
          }
          break
        case 'SEND_NOTIFICATION':
          if (!formData.recipients || !formData.subject || !formData.body) {
            setError('Please fill in all notification fields')
            setIsSubmitting(false)
            return
          }
          config = {
            recipients: formData.recipients.split(',').map(r => r.trim()),
            subject: formData.subject,
            body: formData.body,
          }
          break
      }

      const response = await fetch('/api/admin/scheduling/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          name: formData.name || `${JOB_TYPES.find(t => t.value === formData.type)?.label} - ${new Date(scheduledFor).toLocaleDateString()}`,
          description: formData.description || null,
          scheduledFor,
          config,
          isRecurring: formData.isRecurring,
          recurrencePattern: formData.isRecurring ? formData.recurrencePattern : null,
          maxAttempts: formData.maxAttempts,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
        onClose()
        // Reset form
        setFormData({
          type: 'PUBLISH_QUIZ',
          name: '',
          description: '',
          scheduledFor: '',
          scheduledTime: '',
          isRecurring: false,
          recurrencePattern: 'weekly',
          maxAttempts: 3,
          quizId: '',
          schoolId: '',
          runId: '',
          message: '',
          recipients: '',
          subject: '',
          body: '',
        })
      } else {
        setError(data.error || 'Failed to create job')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create job')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  // Get minimum date/time (now)
  const now = new Date()
  const minDate = now.toISOString().split('T')[0]
  const minTime = now.toTimeString().slice(0, 5)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Create Scheduled Job
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Schedule automated tasks and quiz publications
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                  </div>
                )}

                {/* Job Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Job Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {JOB_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Job Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Job Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Publish Weekly Quiz #12"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description..."
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Scheduling */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.scheduledFor}
                      onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                      min={minDate}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Time *
                    </label>
                    <input
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Job-specific fields */}
                {formData.type === 'PUBLISH_QUIZ' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quiz *
                    </label>
                    {isLoadingQuizzes ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading quizzes...
                      </div>
                    ) : (
                      <select
                        value={formData.quizId}
                        onChange={(e) => setFormData({ ...formData, quizId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select a quiz...</option>
                        {quizzes.map((quiz) => (
                          <option key={quiz.id} value={quiz.id}>
                            {quiz.title}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {formData.type === 'OPEN_QUIZ_RUN' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Quiz *
                      </label>
                      {isLoadingQuizzes ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading quizzes...
                        </div>
                      ) : (
                        <select
                          value={formData.quizId}
                          onChange={(e) => setFormData({ ...formData, quizId: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select a quiz...</option>
                          {quizzes.map((quiz) => (
                            <option key={quiz.id} value={quiz.id}>
                              {quiz.title}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        School ID (optional)
                      </label>
                      <input
                        type="text"
                        value={formData.schoolId}
                        onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                        placeholder="Leave empty for all schools"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {formData.type === 'CLOSE_QUIZ_RUN' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Quiz ID (optional)
                      </label>
                      {isLoadingQuizzes ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading quizzes...
                        </div>
                      ) : (
                        <select
                          value={formData.quizId}
                          onChange={(e) => setFormData({ ...formData, quizId: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select a quiz...</option>
                          {quizzes.map((quiz) => (
                            <option key={quiz.id} value={quiz.id}>
                              {quiz.title}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Run ID (optional)
                      </label>
                      <input
                        type="text"
                        value={formData.runId}
                        onChange={(e) => setFormData({ ...formData, runId: e.target.value })}
                        placeholder="Specific run ID to close"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {formData.type === 'MAINTENANCE_WINDOW' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Maintenance Message
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Message to display during maintenance..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {formData.type === 'SEND_NOTIFICATION' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Recipients * (comma-separated emails)
                      </label>
                      <input
                        type="text"
                        value={formData.recipients}
                        onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                        placeholder="user1@example.com, user2@example.com"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Notification subject"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Body *
                      </label>
                      <textarea
                        value={formData.body}
                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                        placeholder="Notification body"
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </>
                )}

                {/* Recurring */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Recurring job
                  </label>
                </div>

                {formData.isRecurring && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Recurrence Pattern
                    </label>
                    <select
                      value={formData.recurrencePattern}
                      onChange={(e) => setFormData({ ...formData, recurrencePattern: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="daily">Daily</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                )}

                {/* Max Attempts */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Attempts
                  </label>
                  <input
                    type="number"
                    value={formData.maxAttempts}
                    onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || 3 })}
                    min={1}
                    max={10}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Job'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

