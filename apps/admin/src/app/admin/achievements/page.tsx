'use client'

import { useState, useEffect } from 'react'
import { Trophy, Plus, Edit2, Copy, Trash2, Eye } from 'lucide-react'
import { AdminAchievementEditor } from '@/components/admin/achievements/AdminAchievementEditor'
import { AchievementPreviewPane } from '@/components/admin/achievements/AchievementPreviewPane'
import { AchievementFormProvider } from '@/components/admin/achievements/AchievementFormContext'
import { useAchievementForm } from '@/components/admin/achievements/useAchievementForm'
import { DataTable, Column } from '@/components/admin/DataTable'
import { AchievementCard } from '@/components/achievements/AchievementCard'

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

export default function AdminAchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState<Record<string, AchievementStats>>({})
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredAchievementId, setHoveredAchievementId] = useState<string | null>(null)

  useEffect(() => {
    fetchAchievements()
    fetchStats()
  }, [])

  const fetchAchievements = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/achievements')
      if (response.ok) {
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
        const data = await response.json()
        setStats(data.stats || {})
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

  const handleSave = async () => {
    await fetchAchievements()
    setIsCreating(false)
    setSelectedAchievement(null)
  }

  // Create form hook at the top level to avoid conditional hook calls
  const formHook = useAchievementForm(selectedAchievement)
  const { formData, updateField, updateAppearance, isSaving, saveAchievement } = formHook

  const handleSaveClick = async () => {
    const success = await saveAchievement()
    if (success) {
      await handleSave()
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
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-xl font-medium hover:bg-[hsl(var(--primary))]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Achievement
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Loading achievements...</p>
          </div>
        ) : achievements.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />
            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">No achievements found</p>
            <button
              onClick={handleCreate}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-[0_2px_8px_rgba(59,130,246,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]"
            >
              <Plus className="w-4 h-4" />
              Create Your First Achievement
            </button>
          </div>
        ) : (
          <div className="relative">
            <DataTable
              data={achievements}
              columns={[
                {
                  key: 'preview',
                  label: 'Preview',
                  sortable: false,
                  render: (_, achievement: Achievement) => {
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
                      <div className="relative">
                        <button
                          onMouseEnter={() => setHoveredAchievementId(achievement.id)}
                          onMouseLeave={() => setHoveredAchievementId(null)}
                          className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))] rounded-lg transition-colors"
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
                    )
                  },
                },
                {
                  key: 'name',
                  label: 'Name',
                  sortable: true,
                  filterable: true,
                  render: (name) => (
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">{name}</span>
                  ),
                },
              {
                key: 'slug',
                label: 'Slug',
                sortable: true,
                filterable: true,
                render: (slug) => (
                  <code className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-1 rounded">
                    {slug}
                  </code>
                ),
              },
              {
                key: 'category',
                label: 'Category',
                sortable: true,
                filterable: true,
                filterType: 'select',
                filterOptions: [
                  { label: 'All Categories', value: '' },
                  ...Array.from(new Set(achievements.map(a => a.category))).map(cat => ({
                    label: cat,
                    value: cat,
                  })),
                ],
                render: (category) => (
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">{category}</span>
                ),
              },
              {
                key: 'rarity',
                label: 'Rarity',
                sortable: true,
                filterable: true,
                filterType: 'select',
                filterOptions: [
                  { label: 'All Rarities', value: '' },
                  { label: 'Common', value: 'common' },
                  { label: 'Uncommon', value: 'uncommon' },
                  { label: 'Rare', value: 'rare' },
                  { label: 'Epic', value: 'epic' },
                  { label: 'Legendary', value: 'legendary' },
                ],
                render: (rarity) => (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      rarity === 'legendary'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : rarity === 'epic'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                        : rarity === 'rare'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        : rarity === 'uncommon'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {rarity}
                  </span>
                ),
              },
              {
                key: 'stats',
                label: 'Stats',
                sortable: false,
                render: (_, achievement: Achievement) => {
                  const achievementStats = stats[achievement.id]
                  if (!achievementStats) {
                    return <span className="text-xs text-[hsl(var(--muted-foreground))]">-</span>
                  }

                  return (
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="text-[hsl(var(--foreground))] font-medium">
                        {achievementStats.percentOfUsers.toFixed(1)}% of users
                      </div>
                      <div className="text-[hsl(var(--muted-foreground))]">
                        {achievementStats.totalUnlocked} unlocked
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-blue-600 dark:text-blue-400">
                          {achievementStats.freePercent.toFixed(0)}% free
                        </span>
                        <span className="text-purple-600 dark:text-purple-400">
                          {achievementStats.premiumPercent.toFixed(0)}% premium
                        </span>
                      </div>
                    </div>
                  )
                },
              },
              {
                key: 'isActive',
                label: 'Status',
                sortable: true,
                filterable: true,
                filterType: 'select',
                filterOptions: [
                  { label: 'All Statuses', value: '' },
                  { label: 'Active', value: 'true' },
                  { label: 'Inactive', value: 'false' },
                ],
                render: (isActive) => (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                ),
              },
              {
                key: 'createdAt',
                label: 'Created',
                sortable: true,
                filterable: true,
                filterType: 'date',
                render: (date) => (
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">
                    {new Date(date).toLocaleDateString('en-AU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                ),
              },
              {
                key: 'actions',
                label: 'Actions',
                sortable: false,
                render: (_, achievement) => (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(achievement)
                      }}
                      className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))] rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDuplicate(achievement)
                      }}
                      className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))] rounded-lg transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(achievement.id)
                      }}
                      className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)] rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            defaultSort={{ key: 'createdAt', direction: 'desc' }}
          />
          </div>
        )}
      </div>
    </div>
  )
}

