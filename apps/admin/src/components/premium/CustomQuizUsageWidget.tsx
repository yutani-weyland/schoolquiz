'use client'

import { motion } from 'framer-motion'
import { Sparkles, Users, HardDrive, TrendingUp, CheckCircle2 } from 'lucide-react'
import { ContentCard } from '@/components/layout/ContentCard'

interface UsageData {
  currentMonth: {
    quizzesCreated: number
    quizzesShared: number
    quizzesCreatedLimit: number
    quizzesSharedLimit: number
  }
  storage: {
    totalQuizzes: number
    maxQuizzes: number
  }
  canCreate: boolean
  canShare: boolean
}

interface CustomQuizUsageWidgetProps {
  usage: UsageData
  compact?: boolean
}

export function CustomQuizUsageWidget({ usage, compact = false }: CustomQuizUsageWidgetProps) {
  const createdPercent = (usage.currentMonth.quizzesCreated / usage.currentMonth.quizzesCreatedLimit) * 100
  const sharedPercent = (usage.currentMonth.quizzesShared / usage.currentMonth.quizzesSharedLimit) * 100
  const storagePercent = (usage.storage.totalQuizzes / usage.storage.maxQuizzes) * 100

  const getStatusColor = (percent: number) => {
    if (percent >= 90) return 'text-orange-600 dark:text-orange-400'
    if (percent >= 75) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  const getStatusBg = (percent: number) => {
    if (percent >= 90) return 'bg-orange-500'
    if (percent >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getMessage = (type: 'created' | 'shared' | 'storage') => {
    if (type === 'created') {
      const remaining = usage.currentMonth.quizzesCreatedLimit - usage.currentMonth.quizzesCreated
      if (remaining === 0) return "You've used all your monthly quizzes! 🎉"
      if (remaining <= 2) return `Only ${remaining} more quiz${remaining === 1 ? '' : 'es'} this month`
      if (usage.currentMonth.quizzesCreated === 0) return "Ready to create your first quiz!"
      return `You've created ${usage.currentMonth.quizzesCreated} amazing quiz${usage.currentMonth.quizzesCreated === 1 ? '' : 'es'}!`
    }
    if (type === 'shared') {
      const remaining = usage.currentMonth.quizzesSharedLimit - usage.currentMonth.quizzesShared
      if (remaining === 0) return "All shares used this month! 🎉"
      if (remaining <= 3) return `${remaining} share${remaining === 1 ? '' : 's'} remaining`
      if (usage.currentMonth.quizzesShared === 0) return "Ready to share with others!"
      return `Shared ${usage.currentMonth.quizzesShared} time${usage.currentMonth.quizzesShared === 1 ? '' : 's'} this month!`
    }
    if (type === 'storage') {
      const remaining = usage.storage.maxQuizzes - usage.storage.totalQuizzes
      if (remaining === 0) return "Storage full! Archive old quizzes to make room"
      if (remaining <= 5) return `${remaining} slot${remaining === 1 ? '' : 's'} remaining`
      if (usage.storage.totalQuizzes === 0) return "Plenty of space for your quizzes!"
      return `${usage.storage.totalQuizzes} quiz${usage.storage.totalQuizzes === 1 ? '' : 'es'} stored`
    }
    return ''
  }

  if (compact) {
    return (
      <ContentCard padding="md" rounded="xl" hoverAnimation={false}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Your Usage
            </h3>
          </div>
          
          <div className="space-y-2.5">
            {/* Created */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">Created this month</span>
                <span className={`text-xs font-medium ${getStatusColor(createdPercent)}`}>
                  {usage.currentMonth.quizzesCreated} / {usage.currentMonth.quizzesCreatedLimit}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(createdPercent, 100)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full ${getStatusBg(createdPercent)}`}
                />
              </div>
            </div>

            {/* Shared */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">Shared this month</span>
                <span className={`text-xs font-medium ${getStatusColor(sharedPercent)}`}>
                  {usage.currentMonth.quizzesShared} / {usage.currentMonth.quizzesSharedLimit}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(sharedPercent, 100)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                  className={`h-full ${getStatusBg(sharedPercent)}`}
                />
              </div>
            </div>

            {/* Storage */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">Stored quizzes</span>
                <span className={`text-xs font-medium ${getStatusColor(storagePercent)}`}>
                  {usage.storage.totalQuizzes} / {usage.storage.maxQuizzes}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(storagePercent, 100)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
                  className={`h-full ${getStatusBg(storagePercent)}`}
                />
              </div>
            </div>
          </div>
        </div>
      </ContentCard>
    )
  }

  return (
    <ContentCard padding="lg" rounded="3xl" hoverAnimation={false}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Your Custom Quiz Usage
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Track your progress and achievements
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Created */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Created
                </span>
              </div>
              {usage.currentMonth.quizzesCreated > 0 && (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div className="mb-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {usage.currentMonth.quizzesCreated}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  / {usage.currentMonth.quizzesCreatedLimit}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {getMessage('created')}
              </p>
            </div>
            <div className="w-full h-2 bg-blue-200 dark:bg-blue-900/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(createdPercent, 100)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-full ${getStatusBg(createdPercent)}`}
              />
            </div>
          </div>

          {/* Shared */}
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Shared
                </span>
              </div>
              {usage.currentMonth.quizzesShared > 0 && (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div className="mb-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {usage.currentMonth.quizzesShared}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  / {usage.currentMonth.quizzesSharedLimit}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {getMessage('shared')}
              </p>
            </div>
            <div className="w-full h-2 bg-purple-200 dark:bg-purple-900/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(sharedPercent, 100)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                className={`h-full ${getStatusBg(sharedPercent)}`}
              />
            </div>
          </div>

          {/* Storage */}
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-600 rounded-lg">
                  <HardDrive className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Storage
                </span>
              </div>
              {usage.storage.totalQuizzes > 0 && (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div className="mb-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {usage.storage.totalQuizzes}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  / {usage.storage.maxQuizzes}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {getMessage('storage')}
              </p>
            </div>
            <div className="w-full h-2 bg-green-200 dark:bg-green-900/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(storagePercent, 100)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                className={`h-full ${getStatusBg(storagePercent)}`}
              />
            </div>
          </div>
        </div>

        {/* Encouraging message */}
        {usage.currentMonth.quizzesCreated > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
              🎉 Great work! You're making excellent use of your custom quiz features.
            </p>
          </div>
        )}
      </div>
    </ContentCard>
  )
}

