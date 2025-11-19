'use client'

import { useState, useEffect } from 'react'
import { Flag, ToggleLeft, ToggleRight, Building2 } from 'lucide-react'

interface FeatureFlag {
  id: string
  key: string
  name: string
  description: string
  enabled: boolean
  enabledForOrgs: string[]
  createdAt: string
  updatedAt: string
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchFlags()
  }, [])

  const fetchFlags = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/system/feature-flags')
      const data = await response.json()
      console.log('Feature flags API response:', data)
      
      if (response.ok) {
        setFlags(data.flags || [])
      } else {
        console.error('API error:', data)
      }
    } catch (error) {
      console.error('Failed to fetch feature flags:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFlag = async (flagId: string, currentValue: boolean) => {
    // TODO: Implement API call to update flag
    console.log('Toggling flag:', flagId, !currentValue)
    setFlags(flags.map(flag => 
      flag.id === flagId ? { ...flag, enabled: !currentValue } : flag
    ))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Feature Flags
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage feature flags and enable/disable features for specific organisations
        </p>
      </div>

      {/* Feature Flags */}
      <div className="space-y-4">
        {flags.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
            <Flag className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No feature flags found</p>
          </div>
        ) : (
          flags.map((flag) => (
            <div
              key={flag.id}
              className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {flag.name}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      flag.enabled 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {flag.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <code className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mb-2 inline-block">
                    {flag.key}
                  </code>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {flag.description}
                  </p>
                  {flag.enabledForOrgs.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Building2 className="w-4 h-4" />
                      <span>Enabled for {flag.enabledForOrgs.length} organisation(s)</span>
                    </div>
                  )}
                  <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    Last updated: {formatDate(flag.updatedAt)}
                  </div>
                </div>
                <button
                  onClick={() => toggleFlag(flag.id, flag.enabled)}
                  className="ml-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {flag.enabled ? (
                    <ToggleRight className="w-8 h-8 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

