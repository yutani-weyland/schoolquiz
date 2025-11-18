'use client'

import { useState } from 'react'
import { Eye, EyeOff, Monitor, Moon, Sun, Maximize2, X, Sparkles } from 'lucide-react'
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
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [triggerEntrance, setTriggerEntrance] = useState(false)

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

  // Fullscreen modal
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8">
        <div className="relative w-full max-w-2xl">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Close fullscreen"
          >
            <X className="w-6 h-6" />
          </button>
          <div className={`${backgroundStyles[previewBackground]} rounded-lg p-8 flex items-center justify-center`}>
            <div className="w-full max-w-md">
              <AchievementCard
                achievement={previewAchievement}
                status={previewStatus}
                unlockedAt={previewStatus === 'unlocked' ? previewDate : undefined}
                quizSlug={previewStatus === 'unlocked' ? '12' : null}
                tier="premium"
                isFlipped={previewVariant === 'detailed'}
                onFlipChange={() => {}}
                triggerEntrance={triggerEntrance}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 h-full flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
      {/* Minimal Header */}
      <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Preview
        </h3>
        <button
          onClick={() => setIsFullscreen(true)}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
          title="Fullscreen view"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Preview Area - Card First */}
      <div
        className={`flex-1 ${backgroundStyles[previewBackground]} transition-colors flex items-center justify-center px-4 py-4 overflow-auto`}
        style={{ minHeight: 0 }}
      >
        <div
          className={`transition-all cursor-pointer ${
            previewVariant === 'compact'
              ? 'w-full max-w-[500px]'
              : 'w-full max-w-[700px]'
          }`}
          onClick={() => setPreviewVariant(previewVariant === 'compact' ? 'detailed' : 'compact')}
        >
          <AchievementCard
            achievement={previewAchievement}
            status={previewStatus}
            unlockedAt={previewStatus === 'unlocked' ? previewDate : undefined}
            quizSlug={previewStatus === 'unlocked' ? '12' : null}
            tier="premium"
            isFlipped={previewVariant === 'detailed'}
            onFlipChange={(flipped) => setPreviewVariant(flipped ? 'detailed' : 'compact')}
            triggerEntrance={triggerEntrance}
          />
        </div>
      </div>

      {/* Controls Below Card */}
      <div className="px-6 py-3 border-t border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gradient-to-br from-gray-100 to-gray-50/50 dark:from-gray-700 dark:to-gray-700/50 rounded-xl p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">
            <button
              onClick={() => setPreviewVariant('compact')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                previewVariant === 'compact'
                  ? 'bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-600 dark:to-gray-600/50 text-gray-900 dark:text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Compact view"
            >
              Front
            </button>
            <button
              onClick={() => setPreviewVariant('detailed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                previewVariant === 'detailed'
                  ? 'bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-600 dark:to-gray-600/50 text-gray-900 dark:text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Detailed view"
            >
              Back
            </button>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center gap-1 bg-gradient-to-br from-gray-100 to-gray-50/50 dark:from-gray-700 dark:to-gray-700/50 rounded-xl p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">
            <button
              onClick={() => setPreviewStatus('unlocked')}
              className={`p-2 rounded-lg transition-all ${
                previewStatus === 'unlocked'
                  ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Unlocked"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewStatus('locked_free')}
              className={`p-2 rounded-lg transition-all ${
                previewStatus === 'locked_free'
                  ? 'bg-gradient-to-br from-gray-600 to-gray-700 text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Locked"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>

          {/* Background Selector */}
          <div className="flex items-center gap-1 bg-gradient-to-br from-gray-100 to-gray-50/50 dark:from-gray-700 dark:to-gray-700/50 rounded-xl p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">
            <button
              onClick={() => setPreviewBackground('neutral')}
              className={`p-2 rounded-lg transition-all ${
                previewBackground === 'neutral'
                  ? 'bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-600 dark:to-gray-600/50 text-gray-900 dark:text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Neutral"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewBackground('dark')}
              className={`p-2 rounded-lg transition-all ${
                previewBackground === 'dark'
                  ? 'bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-600 dark:to-gray-600/50 text-gray-900 dark:text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Dark"
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewBackground('light')}
              className={`p-2 rounded-lg transition-all ${
                previewBackground === 'light'
                  ? 'bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-600 dark:to-gray-600/50 text-gray-900 dark:text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Light"
            >
              <Sun className="w-4 h-4" />
            </button>
          </div>

          {/* Entrance Animation Trigger */}
          <button
            onClick={() => {
              setTriggerEntrance(true)
              setTimeout(() => setTriggerEntrance(false), 100)
            }}
            className="px-4 py-2 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl text-sm font-medium shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all flex items-center gap-2"
            title="Test entrance animation"
          >
            <Sparkles className="w-4 h-4" />
            Test Entrance
          </button>
        </div>
      </div>
    </div>
  )
}

