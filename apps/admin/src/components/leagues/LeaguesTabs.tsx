'use client'

/**
 * Tab component for Private Leagues
 * Filters between created and joined leagues
 */

export type LeagueTab = 'created' | 'joined'

interface LeaguesTabsProps {
  activeTab: LeagueTab
  onTabChange: (tab: LeagueTab) => void
  createdCount: number
  joinedCount: number
}

export function LeaguesTabs({ 
  activeTab, 
  onTabChange,
  createdCount,
  joinedCount
}: LeaguesTabsProps) {
  const tabs: Array<{ id: LeagueTab; label: string; count: number }> = [
    { id: 'created', label: 'Created', count: createdCount },
    { id: 'joined', label: 'Joined', count: joinedCount },
  ]

  return (
    <div className="mb-6 inline-flex rounded-full bg-gray-100 dark:bg-gray-800 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activeTab === tab.id
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {tab.label}
          {tab.count > 0 && (
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
              activeTab === tab.id
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

