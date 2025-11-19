'use client'

import { useState } from 'react'
import { Eye, EyeOff, Monitor, Moon, Sun, Maximize2, X, Sparkles, Type, Image as ImageIcon, BarChart3, Lock as LockIcon, Unlock, Zap, Layers, Sliders, Save } from 'lucide-react'
import { AchievementCard } from '@/components/achievements/AchievementCard'
import { useAchievementFormContext } from './AchievementFormContext'
import { FileUpload } from './FileUpload'
import { FontSelect } from './FontSelect'

export function AchievementPreviewPane() {
  const { formData, updateField, updateAppearance, onSave, isSaving } = useAchievementFormContext()
  
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
  const appearance = data?.appearance || {}
  const [previewVariant, setPreviewVariant] = useState<'compact' | 'detailed'>('compact')
  const [previewStatus, setPreviewStatus] = useState<'unlocked' | 'locked_free' | 'locked_premium'>('unlocked')
  const [previewBackground, setPreviewBackground] = useState<'neutral' | 'app' | 'dark' | 'light'>('neutral')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [triggerEntrance, setTriggerEntrance] = useState(false)
  const [showProgressBar, setShowProgressBar] = useState(false)
  const [progressValue, setProgressValue] = useState(0)
  const [progressMax, setProgressMax] = useState(10)
  const [isCardLocked, setIsCardLocked] = useState(false)
  
  const currentTitleFont = appearance.titleFontFamily || 'system-ui'
  const currentBodyFont = appearance.bodyFontFamily || 'system-ui'

  // Special effects (card variants) options
  const specialEffectsOptions = [
    { value: 'standard', label: 'Standard', icon: '🎴' },
    { value: 'foil', label: 'Foil', icon: '✨' },
    { value: 'foilGold', label: 'Gold Foil', icon: '🥇' },
    { value: 'foilSilver', label: 'Silver Foil', icon: '🥈' },
    { value: 'prismatic', label: 'Prismatic', icon: '🌈' },
    { value: 'neon', label: 'Neon', icon: '💡' },
    { value: 'shiny', label: 'Shiny', icon: '💎' },
    { value: 'fullArt', label: 'Full Art', icon: '🖼️' },
  ]

  // Material options
  const materialOptions = [
    { value: 'standard', label: 'Standard', icon: '🎨' },
    { value: 'wood', label: 'Wood', icon: '🪵' },
    { value: 'stone', label: 'Stone', icon: '🪨' },
    { value: 'steel', label: 'Steel', icon: '⚙️' },
    { value: 'glass', label: 'Glass', icon: '🔮' },
    { value: 'paper', label: 'Paper', icon: '📄' },
    { value: 'parchment', label: 'Parchment', icon: '📜' },
  ]

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
    rarity: 'common', // Rarity removed - using foil/special effects instead
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
  
  // Ensure previewBackground is valid, fallback to 'neutral'
  const safePreviewBackground = previewBackground in backgroundStyles ? previewBackground : 'neutral'

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
          <div className={`${backgroundStyles[safePreviewBackground]} rounded-lg p-8 flex items-center justify-center`}>
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
                isEditable={true}
                onTitleChange={(title) => updateField?.('name', title)}
                onDescriptionChange={(description) => updateField?.('shortDescription', description)}
                progressValue={showProgressBar ? progressValue : undefined}
                progressMax={showProgressBar ? progressMax : undefined}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
            Achievement Preview
        </h3>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Edit directly on the card below
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(true)}
            className="p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] rounded-xl transition-colors"
            title="Fullscreen view"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          {onSave && (
            <button
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_2px_8px_rgba(59,130,246,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:shadow-[0_4px_12px_rgba(59,130,246,0.4),inset_0_1px_0_0_rgba(255,255,255,0.2)]"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </div>

      {/* Preview Area - Card Centered with Floating Toggles */}
      <div
        className={`${backgroundStyles[safePreviewBackground]} transition-colors flex items-center justify-center px-6 py-12 relative min-h-[600px]`}
      >
        {/* Card Preview */}
        <div className="w-full max-w-md relative z-0">
          <AchievementCard
            achievement={previewAchievement}
            status={previewStatus}
            unlockedAt={previewStatus === 'unlocked' ? previewDate : undefined}
            quizSlug={previewStatus === 'unlocked' ? '12' : null}
            tier="premium"
            isFlipped={previewVariant === 'detailed'}
            onFlipChange={(flipped) => !isCardLocked && setPreviewVariant(flipped ? 'detailed' : 'compact')}
            triggerEntrance={triggerEntrance}
            isEditable={true}
            onTitleChange={(title) => updateField?.('name', title)}
            onDescriptionChange={(description) => updateField?.('shortDescription', description)}
            progressValue={showProgressBar ? progressValue : undefined}
            progressMax={showProgressBar ? progressMax : undefined}
            disableFlip={isCardLocked}
            forceShowProgress={showProgressBar}
          />
        </div>

        {/* Floating Toggles - Left Side */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
          {/* Filter Group - Combined Effects and Materials */}
          <div className="bg-[hsl(var(--card))]/95 backdrop-blur-sm rounded-xl border border-[hsl(var(--border))] shadow-lg p-3 flex flex-col gap-2 max-w-[200px]">
            <div className="flex items-center gap-1.5 px-1 pb-2 border-b border-[hsl(var(--border))]">
              <Sliders className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Filter</span>
            </div>
            
            {/* Combined Effects and Materials - Wrapping Grid */}
            <div className="flex flex-wrap gap-1.5">
              {specialEffectsOptions.map((effect) => {
                const isSelected = (data.cardVariant || 'standard') === effect.value
                return (
                  <button
                    key={effect.value}
                    type="button"
                    onClick={() => updateField?.('cardVariant', effect.value)}
                    className={`
                      w-10 h-10 rounded-lg text-sm transition-all flex items-center justify-center
                      ${isSelected
                        ? 'bg-[hsl(var(--primary))] text-white shadow-sm scale-105'
                        : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:scale-105'
                      }
                    `}
                    title={effect.label}
                  >
                    <span>{effect.icon}</span>
                  </button>
                )
              })}
              {materialOptions.map((material) => {
                const isSelected = (appearance.material || 'standard') === material.value
                return (
                  <button
                    key={material.value}
                    type="button"
                    onClick={() => updateAppearance?.('material', material.value)}
                    className={`
                      w-10 h-10 rounded-lg text-sm transition-all flex items-center justify-center
                      ${isSelected
                        ? 'bg-[hsl(var(--primary))] text-white shadow-sm scale-105'
                        : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:scale-105'
                      }
                    `}
                    title={material.label}
                  >
                    <span>{material.icon}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Floating Toggles - Right Side */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
          {/* Fonts Toggle Group */}
          <div className="bg-[hsl(var(--card))]/95 backdrop-blur-sm rounded-xl border border-[hsl(var(--border))] shadow-lg p-2 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 px-1 pb-1 border-b border-[hsl(var(--border))]">
              <Type className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
              <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Fonts</span>
            </div>
            <FontSelect
              value={currentTitleFont}
              onChange={(font) => updateAppearance?.('titleFontFamily', font)}
              label="Title"
              className="w-40"
            />
            <FontSelect
              value={currentBodyFont}
              onChange={(font) => updateAppearance?.('bodyFontFamily', font)}
              label="Body"
              className="w-40"
            />
          </div>

          {/* Images Toggle Group */}
          <div className="bg-[hsl(var(--card))]/95 backdrop-blur-sm rounded-xl border border-[hsl(var(--border))] shadow-lg p-2 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 px-1 pb-1 border-b border-[hsl(var(--border))]">
              <ImageIcon className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
              <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Images</span>
            </div>
            <FileUpload
              label="Sticker"
              value={data.iconKey || ''}
              onChange={(url) => updateField?.('iconKey', url)}
              type="sticker"
              compact={true}
            />
            <FileUpload
              label="Background"
              value={appearance.backgroundImage || ''}
              onChange={(url) => updateAppearance?.('backgroundImage', url)}
              type="background"
              compact={true}
            />
          </div>

          {/* Progress Toggle Group */}
          <div className="bg-[hsl(var(--card))]/95 backdrop-blur-sm rounded-xl border border-[hsl(var(--border))] shadow-lg p-2 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 px-1 pb-1 border-b border-[hsl(var(--border))]">
              <BarChart3 className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
              <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Progress</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showProgressBar}
                onChange={(e) => {
                  setShowProgressBar(e.target.checked)
                  if (!e.target.checked) {
                    setProgressValue(0)
                  } else {
                    setProgressValue(progressValue > 0 ? Math.min(progressValue, progressMax) : 1)
                  }
                }}
                className="w-4 h-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--ring))]"
              />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Show Progress</span>
            </label>
            {showProgressBar && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max={progressMax}
                  value={progressValue}
                  onChange={(e) => setProgressValue(Math.max(0, Math.min(Number(e.target.value), progressMax)))}
                  className="w-16 px-2 py-1 text-xs border border-[hsl(var(--border))] rounded bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
                />
                <span className="text-xs text-[hsl(var(--muted-foreground))]">/</span>
                <input
                  type="number"
                  min="1"
                  value={progressMax}
                  onChange={(e) => {
                    const newMax = Math.max(1, Number(e.target.value))
                    setProgressMax(newMax)
                    setProgressValue(Math.min(progressValue, newMax))
                  }}
                  className="w-16 px-2 py-1 text-xs border border-[hsl(var(--border))] rounded bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Floating Toggles - Top */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
          {/* View Toggle */}
          <div className="bg-[hsl(var(--card))]/95 backdrop-blur-sm rounded-xl border border-[hsl(var(--border))] shadow-lg p-1 flex items-center gap-1">
            <button
              onClick={() => setPreviewVariant('compact')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                previewVariant === 'compact'
                  ? 'bg-[hsl(var(--primary))] text-white shadow-sm'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
              }`}
              title="Front view"
            >
              Front
            </button>
            <button
              onClick={() => setPreviewVariant('detailed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                previewVariant === 'detailed'
                  ? 'bg-[hsl(var(--primary))] text-white shadow-sm'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
              }`}
              title="Back view"
            >
              Back
            </button>
          </div>

          {/* Status Toggle */}
          <div className="bg-[hsl(var(--card))]/95 backdrop-blur-sm rounded-xl border border-[hsl(var(--border))] shadow-lg p-1 flex items-center gap-1">
            <button
              onClick={() => setPreviewStatus('unlocked')}
              className={`p-1.5 rounded-lg transition-all ${
                previewStatus === 'unlocked'
                  ? 'bg-green-500 text-white'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
              }`}
              title="Unlocked"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewStatus('locked_free')}
              className={`p-1.5 rounded-lg transition-all ${
                previewStatus === 'locked_free'
                  ? 'bg-gray-600 text-white'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
              }`}
              title="Locked"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>

          {/* Background Selector */}
          <div className="bg-[hsl(var(--card))]/95 backdrop-blur-sm rounded-xl border border-[hsl(var(--border))] shadow-lg p-1 flex items-center gap-1">
            <button
              onClick={() => setPreviewBackground('neutral')}
              className={`p-1.5 rounded-lg transition-all ${
                previewBackground === 'neutral'
                  ? 'bg-[hsl(var(--primary))] text-white'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
              }`}
              title="Neutral background"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewBackground('dark')}
              className={`p-1.5 rounded-lg transition-all ${
                previewBackground === 'dark'
                  ? 'bg-[hsl(var(--primary))] text-white'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
              }`}
              title="Dark background"
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewBackground('light')}
              className={`p-1.5 rounded-lg transition-all ${
                previewBackground === 'light'
                  ? 'bg-[hsl(var(--primary))] text-white'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
              }`}
              title="Light background"
            >
              <Sun className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Floating Toggles - Bottom */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
          {/* Card Lock Toggle */}
          <button
            onClick={() => setIsCardLocked(!isCardLocked)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-2 bg-[hsl(var(--card))]/95 backdrop-blur-sm border border-[hsl(var(--border))] shadow-lg ${
              isCardLocked
                ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
            }`}
            title={isCardLocked ? 'Unlock card (allow flipping)' : 'Lock card (prevent flipping)'}
          >
            {isCardLocked ? (
              <>
                <LockIcon className="w-4 h-4" />
                Locked
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                Unlocked
              </>
            )}
          </button>

          {/* Entrance Animation Trigger */}
          <button
            onClick={() => {
              setTriggerEntrance(true)
              setTimeout(() => setTriggerEntrance(false), 100)
            }}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-2 bg-[hsl(var(--card))]/95 backdrop-blur-sm border border-purple-600 shadow-lg"
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

