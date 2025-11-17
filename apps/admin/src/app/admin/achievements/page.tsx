'use client'

import { useState, useEffect } from 'react'
import { Trophy, Plus, Edit2, Copy, Trash2, Search } from 'lucide-react'
import { AdminAchievementEditor } from '@/components/admin/achievements/AdminAchievementEditor'
import { AchievementPreviewPane } from '@/components/admin/achievements/AchievementPreviewPane'
import { AchievementFormProvider } from '@/components/admin/achievements/AchievementFormContext'
import { useAchievementForm } from '@/components/admin/achievements/useAchievementForm'

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

  const filteredAchievements = achievements.filter((a) => {
    const query = searchQuery.toLowerCase()
    return (
      a.name.toLowerCase().includes(query) ||
      a.slug.toLowerCase().includes(query) ||
      a.category.toLowerCase().includes(query) ||
      a.rarity.toLowerCase().includes(query)
    )
  })

  if (isCreating || selectedAchievement) {
    // We need to create the form hook here to share state
    const EditorWrapper = () => {
      const formHook = useAchievementForm(selectedAchievement)
      const { formData } = formHook
      
      return (
        <AchievementFormProvider formData={formData}>
          <div className="h-[calc(100vh-8rem)]">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.2fr] gap-6 h-full">
              {/* Editor - Left Panel */}
              <div className="min-w-0">
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

              {/* Preview - Right Panel (Larger) */}
              <div className="min-w-0">
                <AchievementPreviewPane />
              </div>
            </div>
          </div>
        </AchievementFormProvider>
      )
    }
    
    return <EditorWrapper />
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            Achievement Builder
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage achievement cards
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Achievement
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search achievements..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
          Loading achievements...
        </div>
      ) : filteredAchievements.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery ? 'No achievements found' : 'No achievements yet'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Your First Achievement
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                  Slug
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                  Category
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                  Rarity
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAchievements.map((achievement) => (
                <tr
                  key={achievement.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                    {achievement.name}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {achievement.slug}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {achievement.category}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        achievement.rarity === 'legendary'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : achievement.rarity === 'epic'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                          : achievement.rarity === 'rare'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : achievement.rarity === 'uncommon'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {achievement.rarity}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        achievement.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {achievement.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(achievement)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(achievement)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(achievement.id)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

