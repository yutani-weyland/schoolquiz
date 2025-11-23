'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Trophy, Plus, Edit2, Copy, Trash2, Eye, Archive, Upload } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { AdminAchievementEditor } from '@/components/admin/achievements/AdminAchievementEditor'
import { AchievementPreviewPane } from '@/components/admin/achievements/AchievementPreviewPane'
import { AchievementFormProvider } from '@/components/admin/achievements/AchievementFormContext'
import { useAchievementForm } from '@/components/admin/achievements/useAchievementForm'
import { AchievementCard } from '@/components/achievements/AchievementCard'
import { useAutosave } from '@/hooks/useAutosave'
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning'
import { SaveIndicator } from '@/components/admin/SaveIndicator'
import { Button, Badge } from '@/components/admin/ui'

interface Achievement {
  id: string
  slug: string
  name: string
  shortDescription: string
  longDescription?: string | null
  category: string
  rarity: string
  isPremiumOnly: boolean
  seasonTag?: string | null
  iconKey?: string | null
  unlockConditionType: string
  unlockConditionConfig?: string | null
  appearance?: string | null
  isActive: boolean
  points?: number | null
  series?: string | null
  cardVariant?: string | null
  createdAt: string
  updatedAt: string
}

interface AchievementStats {
  totalUnlocked: number
  freeUnlocked: number
  premiumUnlocked: number
  percentOfUsers: number
  freePercent: number
  premiumPercent: number
}

function AdminAchievementsPageContent() {
  const searchParams = useSearchParams()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState<Record<string, AchievementStats>>({})
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredAchievementId, setHoveredAchievementId] = useState<string | null>(null)
  const [selectedAchievementIds, setSelectedAchievementIds] = useState<Set<string>>(new Set())
  const [isBulkOperating, setIsBulkOperating] = useState(false)

  useEffect(() => {
    fetchAchievements()
    fetchStats()
  }, [])

  // Check URL params for create mode
  useEffect(() => {
    const createParam = searchParams?.get('create')
    if (createParam === 'true') {
      setIsCreating(true)
      setSelectedAchievement(null)
    }
  }, [searchParams])

  const fetchAchievements = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/achievements')
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Expected JSON but got:', contentType)
          return
        }
        try {
          const data = await response.json()
          const apiAchievements = data.achievements || []

          // Add example achievements for demonstration if none exist
          if (apiAchievements.length === 0) {
            const exampleAchievements: Achievement[] = [
              {
                id: 'example-1',
                slug: 'hail-caesar',
                name: 'HAIL, CAESAR!',
                shortDescription: 'Get 5/5 in a History round',
                longDescription: 'Achieve a perfect score in a round focused on historical topics',
                category: 'performance',
                rarity: 'common',
                isPremiumOnly: false,
                seasonTag: null,
                iconKey: '/achievements/hail-caesar.png',
                unlockConditionType: 'score_5_of_5',
                unlockConditionConfig: JSON.stringify({ category: 'history' }),
                appearance: JSON.stringify({ cardVariant: 'foil' }),
                isActive: true,
                points: 10,
                series: 'Roman History',
                cardVariant: 'foil',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: 'example-2',
                slug: 'blitzkrieg',
                name: 'Blitzkrieg!',
                shortDescription: 'Get 5/5 in a History round under 2 minutes',
                longDescription: 'Complete a history-themed round perfectly in less than 2 minutes - lightning fast!',
                category: 'performance',
                rarity: 'uncommon',
                isPremiumOnly: false,
                seasonTag: null,
                iconKey: '/achievements/blitzkreig.png',
                unlockConditionType: 'score_5_of_5_time',
                unlockConditionConfig: JSON.stringify({ category: 'history', timeLimit: 120 }),
                appearance: JSON.stringify({}),
                isActive: true,
                points: 25,
                series: null,
                cardVariant: 'standard',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: 'example-3',
                slug: 'perfect-quiz',
                name: 'Perfect Quiz',
                shortDescription: 'Get all questions correct',
                longDescription: 'Achieve perfection by answering every question correctly in a quiz',
                category: 'performance',
                rarity: 'epic',
                isPremiumOnly: false,
                seasonTag: null,
                iconKey: null,
                unlockConditionType: 'perfect_score',
                unlockConditionConfig: JSON.stringify({}),
                appearance: JSON.stringify({ cardVariant: 'fullArt' }),
                isActive: true,
                points: 100,
                series: null,
                cardVariant: 'fullArt',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: 'example-4',
                slug: 'addicted',
                name: 'Addicted',
                shortDescription: 'Play 3 quizzes in a single day',
                longDescription: 'Show your dedication by playing multiple quizzes in one day',
                category: 'engagement',
                rarity: 'uncommon',
                isPremiumOnly: false,
                seasonTag: null,
                iconKey: null,
                unlockConditionType: 'play_n_quizzes',
                unlockConditionConfig: JSON.stringify({ count: 3, timeframe: 'day' }),
                appearance: JSON.stringify({ cardVariant: 'shiny' }),
                isActive: true,
                points: 15,
                series: null,
                cardVariant: 'shiny',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: 'example-5',
                slug: 'ace',
                name: 'Ace',
                shortDescription: 'Get 5/5 in a sports-themed round',
                longDescription: 'Show your sports knowledge by achieving a perfect score',
                category: 'performance',
                rarity: 'rare',
                isPremiumOnly: true,
                seasonTag: null,
                iconKey: null,
                unlockConditionType: 'score_5_of_5',
                unlockConditionConfig: JSON.stringify({ category: 'sports' }),
                appearance: JSON.stringify({}),
                isActive: true,
                points: 50,
                series: null,
                cardVariant: 'standard',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ]
            setAchievements(exampleAchievements)
          } else {
            setAchievements(apiAchievements)
          }
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError)
        }
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error)
      // On error, still show example achievements
      const exampleAchievements: Achievement[] = [
        {
          id: 'example-1',
          slug: 'hail-caesar',
          name: 'HAIL, CAESAR!',
          shortDescription: 'Get 5/5 in a History round',
          longDescription: 'Achieve a perfect score in a round focused on historical topics',
          category: 'performance',
          rarity: 'common',
          isPremiumOnly: false,
          seasonTag: null,
          iconKey: '/achievements/hail-caesar.png',
          unlockConditionType: 'score_5_of_5',
          unlockConditionConfig: JSON.stringify({ category: 'history' }),
          appearance: JSON.stringify({ cardVariant: 'foil' }),
          isActive: true,
          points: 10,
          series: 'Roman History',
          cardVariant: 'foil',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'example-2',
          slug: 'blitzkrieg',
          name: 'Blitzkrieg!',
          shortDescription: 'Get 5/5 in a History round under 2 minutes',
          longDescription: 'Complete a history-themed round perfectly in less than 2 minutes',
          category: 'performance',
          rarity: 'uncommon',
          isPremiumOnly: false,
          seasonTag: null,
          iconKey: '/achievements/blitzkreig.png',
          unlockConditionType: 'score_5_of_5_time',
          unlockConditionConfig: JSON.stringify({ category: 'history', timeLimit: 120 }),
          appearance: JSON.stringify({}),
          isActive: true,
          points: 25,
          series: null,
          cardVariant: 'standard',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'example-3',
          slug: 'perfect-quiz',
          name: 'Perfect Quiz',
          shortDescription: 'Get all questions correct',
          longDescription: 'Achieve perfection by answering every question correctly',
          category: 'performance',
          rarity: 'epic',
          isPremiumOnly: false,
          seasonTag: null,
          iconKey: null,
          unlockConditionType: 'perfect_score',
          unlockConditionConfig: JSON.stringify({}),
          appearance: JSON.stringify({ cardVariant: 'fullArt' }),
          isActive: true,
          points: 100,
          series: null,
          cardVariant: 'fullArt',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      setAchievements(exampleAchievements)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/achievements/stats')
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Expected JSON but got:', contentType)
          return
        }
        try {
          const data = await response.json()
          setStats(data.stats || {})
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError)
        }
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
    }
  }

  const handleCreate = () => {
    setSelectedAchievement(null)
    setIsCreating(true)
  }

  const handleEdit = (achievement: Achievement) => {
    setSelectedAchievement(achievement)
    setIsCreating(false)
  }

  const handleDuplicate = async (achievement: Achievement) => {
    try {
      const duplicateData = {
        ...achievement,
        slug: `${achievement.slug}-copy`,
        name: `${achievement.name} (Copy)`,
      }
      delete (duplicateData as any).id
      delete (duplicateData as any).createdAt
      delete (duplicateData as any).updatedAt

      const response = await fetch('/api/admin/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...duplicateData,
          unlockConditionConfig: achievement.unlockConditionConfig
            ? JSON.parse(achievement.unlockConditionConfig)
            : {},
          appearance: achievement.appearance ? JSON.parse(achievement.appearance) : {},
        }),
      })

      if (response.ok) {
        await fetchAchievements()
      }
    } catch (error) {
      console.error('Failed to duplicate achievement:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this achievement?')) return

    try {
      const response = await fetch(`/api/admin/achievements/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchAchievements()
        if (selectedAchievement?.id === id) {
          setSelectedAchievement(null)
          setIsCreating(false)
        }
      }
    } catch (error) {
      console.error('Failed to delete achievement:', error)
    }
  }

  // Selection handlers
  const toggleSelectAchievement = (id: string) => {
    setSelectedAchievementIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedAchievementIds.size === achievements.length) {
      setSelectedAchievementIds(new Set())
    } else {
      setSelectedAchievementIds(new Set(achievements.map(a => a.id)))
    }
  }

  const isAllSelected = achievements.length > 0 && selectedAchievementIds.size === achievements.length
  const isIndeterminate = selectedAchievementIds.size > 0 && selectedAchievementIds.size < achievements.length

  // Bulk operations
  const handleBulkActivate = async () => {
    const ids = Array.from(selectedAchievementIds)
    if (ids.length === 0) return

    setIsBulkOperating(true)
    try {
      const response = await fetch('/api/admin/achievements/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', ids }),
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Expected JSON but got:', contentType)
        return
      }
      const data = await response.json()
      if (response.ok) {
        setSelectedAchievementIds(new Set())
        await fetchAchievements()
        alert(`Successfully activated ${data.succeeded || ids.length} achievement${ids.length > 1 ? 's' : ''}`)
      } else {
        alert(data.error || 'Failed to activate achievements')
      }
    } catch (error) {
      console.error('Failed to activate achievements:', error)
      alert('Failed to activate achievements')
    } finally {
      setIsBulkOperating(false)
    }
  }

  const handleBulkDeactivate = async () => {
    const ids = Array.from(selectedAchievementIds)
    if (ids.length === 0) return

    setIsBulkOperating(true)
    try {
      const response = await fetch('/api/admin/achievements/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivate', ids }),
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Expected JSON but got:', contentType)
        return
      }
      const data = await response.json()
      if (response.ok) {
        setSelectedAchievementIds(new Set())
        await fetchAchievements()
        alert(`Successfully deactivated ${data.succeeded || ids.length} achievement${ids.length > 1 ? 's' : ''}`)
      } else {
        alert(data.error || 'Failed to deactivate achievements')
      }
    } catch (error) {
      console.error('Failed to deactivate achievements:', error)
      alert('Failed to deactivate achievements')
    } finally {
      setIsBulkOperating(false)
    }
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedAchievementIds)
    if (ids.length === 0) return

    if (!confirm(`Delete ${ids.length} achievement${ids.length > 1 ? 's' : ''}? This action cannot be undone.`)) return

    setIsBulkOperating(true)
    try {
      const response = await fetch('/api/admin/achievements/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids }),
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Expected JSON but got:', contentType)
        return
      }
      const data = await response.json()
      if (response.ok) {
        setSelectedAchievementIds(new Set())
        await fetchAchievements()
        if (selectedAchievement && ids.includes(selectedAchievement.id)) {
          setSelectedAchievement(null)
          setIsCreating(false)
        }
        alert(`Successfully deleted ${data.succeeded || ids.length} achievement${ids.length > 1 ? 's' : ''}`)
      } else {
        alert(data.error || 'Failed to delete achievements')
      }
    } catch (error) {
      console.error('Failed to delete achievements:', error)
      alert('Failed to delete achievements')
    } finally {
      setIsBulkOperating(false)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        toggleSelectAll()
      }
      if (e.key === 'Escape') {
        setSelectedAchievementIds(new Set())
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [achievements, selectedAchievementIds.size])

  const handleSave = async () => {
    await fetchAchievements()
    setIsCreating(false)
    setSelectedAchievement(null)
  }

  // Create form hook at the top level to avoid conditional hook calls
  const formHook = useAchievementForm(selectedAchievement)
  const { formData, updateField, updateAppearance, saveAchievement } = formHook

  // Autosave hook
  // Note: saveAchievement doesn't take data param, it uses formData from the hook's closure
  const {
    isSaving: isAutosaving,
    hasUnsavedChanges,
    lastSaved,
    save: triggerAutosave,
  } = useAutosave({
    data: formData,
    onSave: async () => {
      // saveAchievement uses formData from the hook's closure, so we don't pass data
      const success = await saveAchievement()
      if (!success) {
        throw new Error('Failed to save achievement')
      }
    },
    delay: 10000, // 10 seconds
    enabled: (isCreating || !!selectedAchievement) && !!formData.name, // Only autosave if editing/creating and has name
    onSaveError: (error) => {
      console.error('Autosave failed:', error)
    },
  })

  // Warn before leaving with unsaved changes
  useUnsavedChangesWarning(hasUnsavedChanges)

  // Combine autosave state with manual save state from formHook
  const isSaving = isAutosaving || formHook.isSaving

  const handleSaveClick = async () => {
    const success = await saveAchievement()
    if (success) {
      await handleSave()
      // Clear unsaved changes after successful save
      triggerAutosave().catch(() => { })
    }
  }

  if (isCreating || selectedAchievement) {
    return (
      <AchievementFormProvider
        formData={formData}
        updateField={updateField as (field: string | keyof any, value: any) => void}
        updateAppearance={updateAppearance}
        onSave={handleSaveClick}
        isSaving={isSaving}
      >
        {/* Mobile/Tablet Message */}
        <div className="lg:hidden p-8 text-center">
          <Trophy className="w-16 h-16 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-2">
            Achievement Builder
          </h2>
          <p className="text-[hsl(var(--muted-foreground))]">
            The achievement builder is only available on desktop. Please use a larger screen to create and edit achievements.
          </p>
        </div>

        {/* Desktop View */}
        <div className="hidden lg:flex h-full flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <div>
              <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] tracking-tight">
                {selectedAchievement ? 'Edit Achievement' : 'New Achievement'}
              </h1>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                {selectedAchievement ? 'Update achievement details' : 'Create a new achievement card'}
              </p>
            </div>
            {/* Save Indicator */}
            <SaveIndicator
              isSaving={isSaving}
              hasUnsavedChanges={hasUnsavedChanges}
              lastSaved={lastSaved}
            />
          </div>

          {/* Preview at Top - Editable Card */}
          <div className="mb-6 flex-shrink-0">
            <AchievementPreviewPane />
          </div>

          {/* Editor Below Preview */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <AdminAchievementEditor
              achievement={selectedAchievement}
              onSave={handleSave}
              onCancel={() => {
                setIsCreating(false)
                setSelectedAchievement(null)
              }}
              formHook={formHook}
            />
          </div>
        </div>
      </AchievementFormProvider>
    )
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] tracking-tight">
            Achievements
          </h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Create and manage achievement cards
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Achievement
        </Button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedAchievementIds.size > 0 && (
        <div className="bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[hsl(var(--foreground))]">
              {selectedAchievementIds.size} achievement{selectedAchievementIds.size > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelectedAchievementIds(new Set())}
              className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] underline"
            >
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBulkActivate}
              disabled={isBulkOperating}
              className="gap-2"
            >
              {isBulkOperating ? (
                <Spinner className="size-3" />
              ) : (
                <Upload className="w-3 h-3" />
              )}
              Activate
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBulkDeactivate}
              disabled={isBulkOperating}
              className="gap-2"
            >
              {isBulkOperating ? (
                <Spinner className="size-3" />
              ) : (
                <Archive className="w-3 h-3" />
              )}
              Deactivate
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isBulkOperating}
              className="gap-2"
            >
              {isBulkOperating ? (
                <Spinner className="size-3" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 min-h-0 bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))]">
                  <div className="space-y-4">
                    <div className="h-32 w-full bg-[hsl(var(--muted))] animate-pulse rounded-xl" />
                    <div className="space-y-2">
                      <div className="h-5 w-3/4 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
                      <div className="h-4 w-full bg-[hsl(var(--muted))] animate-pulse rounded-md" />
                      <div className="h-4 w-5/6 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : achievements.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />
            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">No achievements found</p>
            <Button variant="primary" size="sm" onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Achievement
            </Button>
          </div>
        ) : (
          <div className="relative">
            {/* Custom table with checkboxes since DataTable doesn't support it natively */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-[hsl(var(--muted))]">
                  <tr>
                    <th className="px-6 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = isIndeterminate
                        }}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--ring))] cursor-pointer"
                        title="Select all"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Preview
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Rarity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[hsl(var(--card))]/50 divide-y divide-[hsl(var(--border))]">
                  {achievements.map((achievement) => {
                    const isSelected = selectedAchievementIds.has(achievement.id)
                    const achievementStats = stats[achievement.id]
                    const appearance = achievement.appearance
                      ? typeof achievement.appearance === 'string'
                        ? JSON.parse(achievement.appearance)
                        : achievement.appearance
                      : {}

                    const achievementForCard = {
                      id: achievement.id,
                      slug: achievement.slug,
                      name: achievement.name,
                      shortDescription: achievement.shortDescription,
                      longDescription: achievement.longDescription || undefined,
                      category: achievement.category,
                      rarity: achievement.rarity,
                      isPremiumOnly: achievement.isPremiumOnly,
                      seasonTag: achievement.seasonTag || undefined,
                      iconKey: achievement.iconKey || undefined,
                      series: achievement.series || undefined,
                      cardVariant: (achievement.cardVariant || 'standard') as any,
                      appearance,
                    }

                    return (
                      <tr
                        key={achievement.id}
                        className={`hover:bg-[hsl(var(--muted))] transition-colors ${isSelected ? 'bg-[hsl(var(--primary))]/5' : ''
                          }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectAchievement(achievement.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--ring))] cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative">
                            <button
                              onMouseEnter={() => setHoveredAchievementId(achievement.id)}
                              onMouseLeave={() => setHoveredAchievementId(null)}
                              className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10 rounded-lg transition-colors"
                              title="Preview achievement"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {hoveredAchievementId === achievement.id && (
                              <div className="absolute left-full top-0 ml-2 z-[9999] pointer-events-none">
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-[hsl(var(--border))] p-4 w-64">
                                  <AchievementCard
                                    achievement={achievementForCard}
                                    status="unlocked"
                                    tier="premium"
                                    unlockedAt={new Date().toISOString()}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[hsl(var(--foreground))]">
                          {achievement.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-1 rounded">
                            {achievement.slug}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                          {achievement.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              achievement.rarity === 'legendary' ? 'warning' :
                                achievement.rarity === 'epic' ? 'info' :
                                  achievement.rarity === 'rare' ? 'info' :
                                    achievement.rarity === 'uncommon' ? 'success' :
                                      'default'
                            }
                          >
                            {achievement.rarity}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={achievement.isActive ? 'success' : 'default'}>
                            {achievement.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                          {new Date(achievement.createdAt).toLocaleDateString('en-AU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEdit(achievement)
                              }}
                              className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDuplicate(achievement)
                              }}
                              className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10 rounded-lg transition-colors"
                              title="Duplicate"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(achievement.id)
                              }}
                              className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminAchievementsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
            <div className="h-4 w-96 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))]">
                <div className="space-y-4">
                  <div className="h-32 w-full bg-[hsl(var(--muted))] animate-pulse rounded-xl" />
                  <div className="space-y-2">
                    <div className="h-5 w-3/4 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
                    <div className="h-4 w-full bg-[hsl(var(--muted))] animate-pulse rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <AdminAchievementsPageContent />
    </Suspense>
  )
}

