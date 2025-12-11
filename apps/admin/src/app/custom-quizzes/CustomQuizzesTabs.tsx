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
}

export function CustomQuizzesTabs({ 
	activeTab, 
	onTabChange
}: CustomQuizzesTabsProps) {
	const tabs: Array<{ id: CustomQuizTab; label: string }> = [
		{ id: 'all', label: 'All' },
		{ id: 'recent', label: 'Recent' },
		{ id: 'shared', label: 'Shared with Me' },
		{ id: 'drafts', label: 'Drafts' },
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
				</button>
			))}
		</div>
	)
}

