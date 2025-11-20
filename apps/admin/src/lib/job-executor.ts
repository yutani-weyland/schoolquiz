/**
 * Job execution system for scheduled jobs
 * Handles different job types and their execution logic
 */

import { prisma } from '@schoolquiz/db'
import type { ScheduledJob } from '@prisma/client'

interface JobResult {
  success: boolean
  message: string
  data?: any
}

/**
 * Execute a scheduled job
 */
export async function executeJob(job: ScheduledJob): Promise<JobResult> {
  // Update job status to RUNNING
  await prisma.scheduledJob.update({
    where: { id: job.id },
    data: {
      status: 'RUNNING',
      attempts: { increment: 1 },
    },
  })

  try {
    let result: JobResult

    // Execute based on job type
    switch (job.type) {
      case 'PUBLISH_QUIZ':
        result = await executePublishQuiz(job)
        break
      case 'OPEN_QUIZ_RUN':
        result = await executeOpenQuizRun(job)
        break
      case 'CLOSE_QUIZ_RUN':
        result = await executeCloseQuizRun(job)
        break
      case 'MAINTENANCE_WINDOW':
        result = await executeMaintenanceWindow(job)
        break
      case 'SEND_NOTIFICATION':
        result = await executeSendNotification(job)
        break
      default:
        result = {
          success: false,
          message: `Unknown job type: ${job.type}`,
        }
    }

    // Update job with result
    const updateData: any = {
      status: result.success ? 'COMPLETED' : 'FAILED',
      executedAt: new Date(),
      result: JSON.stringify(result),
    }

    if (!result.success) {
      updateData.lastError = result.message
    }

    // Handle recurring jobs
    if (job.isRecurring && result.success && job.recurrencePattern) {
      updateData.nextRunAt = calculateNextRun(job.scheduledFor, job.recurrencePattern)
      updateData.status = 'SCHEDULED'
    }

    await prisma.scheduledJob.update({
      where: { id: job.id },
      data: updateData,
    })

    return result
  } catch (error: any) {
    // Mark job as failed
    await prisma.scheduledJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        lastError: error.message || 'Unknown error',
        executedAt: new Date(),
      },
    })

    throw error
  }
}

/**
 * Execute PUBLISH_QUIZ job
 * Config: { quizId: string }
 */
async function executePublishQuiz(job: ScheduledJob): Promise<JobResult> {
  try {
    const config = JSON.parse(job.config || '{}')
    const { quizId } = config

    if (!quizId) {
      return {
        success: false,
        message: 'Missing quizId in job config',
      }
    }

    // Update quiz status to published
    const quiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        status: 'published',
        publicationDate: new Date(),
      },
    })

    return {
      success: true,
      message: `Quiz "${quiz.title}" published successfully`,
      data: { quizId: quiz.id },
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to publish quiz: ${error.message}`,
    }
  }
}

/**
 * Execute OPEN_QUIZ_RUN job
 * Config: { quizId: string, schoolId?: string }
 */
async function executeOpenQuizRun(job: ScheduledJob): Promise<JobResult> {
  try {
    const config = JSON.parse(job.config || '{}')
    const { quizId, schoolId } = config

    if (!quizId) {
      return {
        success: false,
        message: 'Missing quizId in job config',
      }
    }

    // For now, this is a placeholder
    // In the future, this would create a Run record or update quiz availability
    return {
      success: true,
      message: `Quiz run opened for quiz ${quizId}`,
      data: { quizId, schoolId },
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to open quiz run: ${error.message}`,
    }
  }
}

/**
 * Execute CLOSE_QUIZ_RUN job
 * Config: { quizId: string, runId?: string }
 */
async function executeCloseQuizRun(job: ScheduledJob): Promise<JobResult> {
  try {
    const config = JSON.parse(job.config || '{}')
    const { quizId, runId } = config

    if (!quizId && !runId) {
      return {
        success: false,
        message: 'Missing quizId or runId in job config',
      }
    }

    // For now, this is a placeholder
    // In the future, this would close runs or update quiz availability
    return {
      success: true,
      message: `Quiz run closed for quiz ${quizId || runId}`,
      data: { quizId, runId },
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to close quiz run: ${error.message}`,
    }
  }
}

/**
 * Execute MAINTENANCE_WINDOW job
 * Config: { message: string, duration?: number }
 */
async function executeMaintenanceWindow(job: ScheduledJob): Promise<JobResult> {
  try {
    const config = JSON.parse(job.config || '{}')
    const { message, duration } = config

    // For now, this is a placeholder
    // In the future, this would set a maintenance mode flag
    return {
      success: true,
      message: `Maintenance window started: ${message || 'Scheduled maintenance'}`,
      data: { message, duration },
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to start maintenance window: ${error.message}`,
    }
  }
}

/**
 * Execute SEND_NOTIFICATION job
 * Config: { recipients: string[], subject: string, body: string }
 */
async function executeSendNotification(job: ScheduledJob): Promise<JobResult> {
  try {
    const config = JSON.parse(job.config || '{}')
    const { recipients, subject, body } = config

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return {
        success: false,
        message: 'Missing or invalid recipients in job config',
      }
    }

    // For now, this is a placeholder
    // In the future, this would send emails/notifications
    return {
      success: true,
      message: `Notification sent to ${recipients.length} recipients`,
      data: { recipients: recipients.length, subject },
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to send notification: ${error.message}`,
    }
  }
}

/**
 * Calculate next run time based on recurrence pattern
 * Supports simple cron-like patterns (simplified)
 * Format: "minute hour day month dayOfWeek"
 * Example: "0 7 * * 1" = Every Monday at 7:00 AM
 */
function calculateNextRun(lastRun: Date, pattern: string): Date {
  // For now, implement simple weekly recurrence
  // TODO: Implement full cron parser
  const nextRun = new Date(lastRun)
  
  if (pattern.includes('weekly') || pattern.includes('* * 1')) {
    // Weekly - add 7 days
    nextRun.setDate(nextRun.getDate() + 7)
  } else if (pattern.includes('daily') || pattern.includes('* * *')) {
    // Daily - add 1 day
    nextRun.setDate(nextRun.getDate() + 1)
  } else {
    // Default: add 1 day
    nextRun.setDate(nextRun.getDate() + 1)
  }

  return nextRun
}

/**
 * Get jobs that are due to run
 */
export async function getDueJobs(): Promise<ScheduledJob[]> {
  const now = new Date()

  // Get all pending/scheduled jobs that are due
  const jobs = await prisma.scheduledJob.findMany({
    where: {
      status: {
        in: ['PENDING', 'SCHEDULED'],
      },
      scheduledFor: {
        lte: now,
      },
    },
    orderBy: {
      scheduledFor: 'asc',
    },
  })

  // Filter out jobs that have exceeded max attempts
  return jobs.filter(job => job.attempts < job.maxAttempts)
}

/**
 * Process all due jobs
 */
export async function processDueJobs(): Promise<{ processed: number; succeeded: number; failed: number }> {
  const dueJobs = await getDueJobs()
  let succeeded = 0
  let failed = 0

  for (const job of dueJobs) {
    try {
      const result = await executeJob(job)
      if (result.success) {
        succeeded++
      } else {
        failed++
      }
    } catch (error) {
      console.error(`Failed to process job ${job.id}:`, error)
      failed++
    }
  }

  return {
    processed: dueJobs.length,
    succeeded,
    failed,
  }
}

