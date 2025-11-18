'use client'

import { useState, useEffect } from 'react'
import { Trophy, Plus, Edit2, Copy, Trash2 } from 'lucide-react'
import { AdminAchievementEditor } from '@/components/admin/achievements/AdminAchievementEditor'
import { AchievementPreviewPane } from '@/components/admin/achievements/AchievementPreviewPane'
import { AchievementFormProvider } from '@/components/admin/achievements/AchievementFormContext'
import { useAchievementForm } from '@/components/admin/achievements/useAchievementForm'
import { DataTable, Column } from '@/components/admin/DataTable'

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

export default function AdminAchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchAchievements()
  }, [])

  const fetchAchievements = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/achievements')
      if (response.ok) {
        const data = await response.json()
        setAchievements(data.achievements || [])
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error)
    } finally {
      setIsLoading(false)
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
  const { formData } = formHook

  if (isCreating || selectedAchievement) {
    return (
      <AchievementFormProvider formData={formData}>
        <div className="h-full flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                <Trophy className="w-8 h-8 text-blue-500" />
                {selectedAchievement ? 'Edit Achievement' : 'New Achievement'}
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {selectedAchievement ? 'Update achievement details' : 'Create a new achievement card'}
              </p>
            </div>
          </div>

          {/* Editor and Preview Grid */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr,1.2fr] gap-6 min-h-0 overflow-hidden">
            {/* Editor - Left Panel */}
            <div className="min-h-0 overflow-hidden flex flex-col">
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

            {/* Preview - Right Panel */}
            <div className="min-h-0 overflow-hidden flex flex-col">
              <AchievementPreviewPane />
            </div>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-blue-500" />
            Achievements
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Create and manage achievement cards
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-[0_2px_8px_rgba(59,130,246,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:shadow-[0_4px_12px_rgba(59,130,246,0.4),inset_0_1px_0_0_rgba(255,255,255,0.2)]"
        >
          <Plus className="w-4 h-4" />
          New Achievement
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading achievements...</p>
          </div>
        ) : achievements.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No achievements found</p>
            <button
              onClick={handleCreate}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-[0_2px_8px_rgba(59,130,246,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]"
            >
              <Plus className="w-4 h-4" />
              Create Your First Achievement
            </button>
          </div>
        ) : (
          <DataTable
            data={achievements}
            columns={[
              {
                key: 'name',
                label: 'Name',
                sortable: true,
                filterable: true,
                render: (name) => (
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{name}</span>
                ),
              },
              {
                key: 'slug',
                label: 'Slug',
                sortable: true,
                filterable: true,
                render: (slug) => (
                  <code className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">{category}</span>
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
                  <span className="text-sm text-gray-500 dark:text-gray-400">
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
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDuplicate(achievement)
                      }}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(achievement.id)
                      }}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
        )}
      </div>
    </div>
  )
}

