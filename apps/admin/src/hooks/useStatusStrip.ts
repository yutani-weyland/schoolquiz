/**
 * Hook for managing contextual status strips
 * Provides utilities for common status strip scenarios
 */

import { useState, useEffect } from 'react'

interface BackgroundJob {
  id: string
  type: string
  status: 'running' | 'completed' | 'failed'
  progress?: number
  message: string
}

/**
 * Hook to track background jobs and return status strip props
 */
export function useBackgroundJobs() {
  const [jobs, setJobs] = useState<BackgroundJob[]>([])

  useEffect(() => {
    // Poll for active jobs
    const checkJobs = async () => {
      try {
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/admin/jobs/active')
        // const data = await response.json()
        // setJobs(data.jobs || [])
      } catch (error) {
        console.error('Failed to fetch background jobs:', error)
      }
    }

    checkJobs()
    const interval = setInterval(checkJobs, 2000) // Poll every 2 seconds
    return () => clearInterval(interval)
  }, [])

  const activeJob = jobs.find(j => j.status === 'running')

  return {
    activeJob,
    hasActiveJob: !!activeJob,
    allJobs: jobs,
  }
}

/**
 * Hook to check for billing issues
 */
export function useBillingAlerts() {
  const [pastDueCount, setPastDueCount] = useState(0)
  const [overdueCount, setOverdueCount] = useState(0)

  useEffect(() => {
    const checkBilling = async () => {
      try {
        const [subsRes, invRes] = await Promise.all([
          fetch('/api/admin/billing/subscriptions?status=PAST_DUE'),
          fetch('/api/admin/billing/invoices?status=OVERDUE'),
        ])

        const subsData = await subsRes.json()
        const invData = await invRes.json()

        setPastDueCount(subsData.subscriptions?.length || 0)
        setOverdueCount(invData.invoices?.length || 0)
      } catch (error) {
        console.error('Failed to check billing alerts:', error)
      }
    }

    checkBilling()
    const interval = setInterval(checkBilling, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  return {
    pastDueCount,
    overdueCount,
    hasBillingIssues: pastDueCount > 0 || overdueCount > 0,
  }
}

