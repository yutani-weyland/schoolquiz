'use client'

/**
 * OPTIMIZATION: Tab component for Custom Quizzes
 * Server-side filtering per tab for better performance
 */

import { useState } from 'react'
import type { TabType } from './custom-quizzes-summary-server'

export type CustomQuizTab = TabType

interface CustomQuizzesTabsProps {
	activeTab: CustomQuizTab
	onTabChange: (tab: CustomQuizTab) => void
	hasGroups: boolean
	hasOrganisation: boolean
}

export function CustomQuizzesTabs({ 
	activeTab, 
	onTabChange,
	hasGroups,
	hasOrganisation 
}: CustomQuizzesTabsProps) {
	const tabs: Array<{ id: CustomQuizTab; label: string; show: boolean }> = [
		{ id: 'all', label: 'All', show: true },
		{ id: 'mine', label: 'Mine', show: true },
		{ id: 'shared', label: 'Shared', show: true },
		{ id: 'groups', label: 'Groups', show: hasGroups },
		{ id: 'organisation', label: 'Organisation', show: hasOrganisation },
	]

	const visibleTabs = tabs.filter(t => t.show)

	return (
		<div className="mb-6 inline-flex rounded-full bg-gray-100 dark:bg-gray-800 p-1">
			{visibleTabs.map((tab) => (
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
				</button>
			))}
		</div>
	)
}

