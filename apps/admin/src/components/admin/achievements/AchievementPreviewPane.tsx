'use client'

import { useState } from 'react'
import { Eye, EyeOff, Monitor, Moon, Sun, Maximize2 } from 'lucide-react'
import { AchievementCard } from '@/components/achievements/AchievementCard'
import { useAchievementFormContext } from './AchievementFormContext'

export function AchievementPreviewPane() {
  const { formData } = useAchievementFormContext()
  
  // Default form data if not provided
  const defaultFormData = {
    slug: '',
    name: 'Achievement Name',
    shortDescription: 'Short description for compact card',
    longDescription: '',
    category: 'performance',
    rarity: 'common',
    isPremiumOnly: false,
    seasonTag: '',
    iconKey: '',
    series: '',
    cardVariant: 'standard',
  }
  
  const data = formData || defaultFormData
  const [previewVariant, setPreviewVariant] = useState<'compact' | 'detailed'>('compact')
  const [previewStatus, setPreviewStatus] = useState<'unlocked' | 'locked_free' | 'locked_premium'>('unlocked')
  const [previewBackground, setPreviewBackground] = useState<'neutral' | 'app' | 'dark' | 'light'>('neutral')

  // Format date in Australian format
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const previewDate = formatDate(new Date())

  // Build achievement object for preview - ensure appearance is properly structured
  const previewAchievement = {
    id: 'preview',
    slug: data.slug || 'preview-achievement',
    name: data.name || 'Achievement Name',
    shortDescription: data.shortDescription || 'Short description for compact card',
    longDescription: data.longDescription || data.shortDescription || 'Long description for detailed view',
    category: data.category || 'performance',
    rarity: data.rarity || 'common',
    isPremiumOnly: data.isPremiumOnly || false,
    seasonTag: data.seasonTag || null,
    iconKey: data.iconKey || null,
    series: data.series || null,
    cardVariant: (data.cardVariant || 'standard') as any,
    appearance: typeof data.appearance === 'object' && data.appearance !== null 
      ? data.appearance 
      : (typeof data.appearance === 'string' 
          ? (() => {
              try {
                return JSON.parse(data.appearance)
              } catch {
                return {}
              }
            })()
          : {}),
  }

  const backgroundStyles: Record<string, string> = {
    neutral: 'bg-gray-100 dark:bg-gray-800',
    app: 'bg-white dark:bg-gray-900',
    dark: 'bg-gray-900',
    light: 'bg-white',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      {/* Compact Header with Controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Live Preview
          </h3>
        </div>
        
        {/* Compact Controls Row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Toggle - Compact buttons */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setPreviewVariant('compact')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                previewVariant === 'compact'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Compact view"
            >
              Compact
            </button>
            <button
              onClick={() => setPreviewVariant('detailed')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                previewVariant === 'detailed'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Detailed view"
            >
              Detailed
            </button>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setPreviewStatus('unlocked')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                previewStatus === 'unlocked'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Unlocked state"
            >
              <Eye className="w-3 h-3" />
            </button>
            <button
              onClick={() => setPreviewStatus('locked_free')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                previewStatus === 'locked_free'
                  ? 'bg-gray-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Locked state"
            >
              <EyeOff className="w-3 h-3" />
            </button>
          </div>

          {/* Background Selector - Icon buttons */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setPreviewBackground('neutral')}
              className={`p-1.5 rounded transition-colors ${
                previewBackground === 'neutral'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Neutral background"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPreviewBackground('dark')}
              className={`p-1.5 rounded transition-colors ${
                previewBackground === 'dark'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Dark background"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPreviewBackground('light')}
              className={`p-1.5 rounded transition-colors ${
                previewBackground === 'light'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Light background"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Large Preview Area */}
      <div
        className={`flex-1 rounded-lg m-4 ${backgroundStyles[previewBackground]} transition-colors flex items-center justify-center`}
        style={{ minHeight: 0 }}
      >
        <div
          className={`transition-all ${
            previewVariant === 'compact'
              ? 'w-full max-w-[280px]'
              : 'w-full max-w-[420px]'
          }`}
        >
          <AchievementCard
            achievement={previewAchievement}
            status={previewStatus}
            unlockedAt={previewStatus === 'unlocked' ? previewDate : undefined}
            quizSlug={previewStatus === 'unlocked' ? '12' : null}
            tier="premium"
            isFlipped={previewVariant === 'detailed'}
            onFlipChange={() => {}} // Controlled, so this won't be called
          />
        </div>
      </div>

      {/* Minimal Footer */}
      <div className="px-4 pb-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {previewStatus === 'unlocked' ? `Unlocked ${previewDate}` : 'Updates in real-time'}
        </p>
      </div>
    </div>
  )
}

