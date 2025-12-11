'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Achievement } from './achievements-server'
import type { UserTier } from '@/lib/feature-gating'
import dynamic from 'next/dynamic'

// OPTIMIZATION: @tanstack/react-virtual is already code-split since this component
// is only used on achievements page (not in initial bundle)

const LazyAchievementCard = dynamic(() => import("@/components/achievements/AchievementCard").then(mod => ({ default: mod.AchievementCard })), {
	ssr: false,
	loading: () => <div className="w-[200px] h-[280px] bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
})

interface VirtualizedAchievementGridProps {
	achievements: Achievement[]
	tier: UserTier
	flippedCardId: string | null
	onFlipChange: (id: string | null) => void
}

/**
 * OPTIMIZATION: Virtualized grid for achievements
 * Only renders visible cards + buffer, dramatically improving performance for large lists
 * Uses @tanstack/react-virtual for efficient rendering
 * 
 * For flex-wrap layouts, we virtualize by rows (grouping cards into rows)
 */
export function VirtualizedAchievementGrid({
	achievements,
	tier,
	flippedCardId,
	onFlipChange,
}: VirtualizedAchievementGridProps) {
	const parentRef = useRef<HTMLDivElement>(null)
	const [cardsPerRow, setCardsPerRow] = useState(4)

	// Calculate cards per row based on viewport width
	useEffect(() => {
		const calculateCardsPerRow = () => {
			if (typeof window === 'undefined') return
			const cardWidth = Math.min(200, Math.max(120, window.innerWidth * 0.25))
			const gap = 16
			const containerWidth = window.innerWidth - 96 // padding (48px each side)
			const perRow = Math.max(1, Math.floor(containerWidth / (cardWidth + gap)))
			setCardsPerRow(perRow)
		}

		calculateCardsPerRow()
		window.addEventListener('resize', calculateCardsPerRow)
		return () => window.removeEventListener('resize', calculateCardsPerRow)
	}, [])

	// Create rows of cards
	const rows = useMemo(() => {
		const result: Achievement[][] = []
		for (let i = 0; i < achievements.length; i += cardsPerRow) {
			result.push(achievements.slice(i, i + cardsPerRow))
		}
		return result
	}, [achievements, cardsPerRow])

	const rowVirtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 320, // Estimated row height (card ~280px + gap)
		overscan: 2, // Render 2 extra rows above/below viewport for smooth scrolling
	})

	return (
		<div
			ref={parentRef}
			className="w-full overflow-auto"
			style={{
				scrollBehavior: 'smooth',
				maxHeight: '70vh', // Limit height to prevent excessive scrolling
			}}
		>
			<div
				style={{
					height: `${rowVirtualizer.getTotalSize()}px`,
					width: '100%',
					position: 'relative',
				}}
			>
				{rowVirtualizer.getVirtualItems().map((virtualRow) => {
					const row = rows[virtualRow.index]
					if (!row) return null

					return (
						<div
							key={String(virtualRow.key)}
							data-index={virtualRow.index}
							ref={rowVirtualizer.measureElement}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								transform: `translateY(${virtualRow.start}px)`,
							}}
						>
							<div className="flex flex-wrap justify-center gap-4 px-4">
								{row.map((achievement, cardIndex) => {
									const globalIndex = virtualRow.index * cardsPerRow + cardIndex
									const isFlipped = flippedCardId === achievement.id
									const rotation = (globalIndex % 5 - 2) * 1 // Subtle angles: -2, -1, 0, 1, 2 degrees

									return (
										<div
											key={achievement.id}
											className="relative"
											style={{
												width: 'clamp(120px, 25vw, 200px)',
												maxWidth: '200px',
												flexShrink: 0,
												zIndex: isFlipped ? 50 : 10 + achievements.length - globalIndex,
												transform: `rotate(${isFlipped ? 0 : rotation}deg)`,
												transition: 'transform 0.2s ease-out',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.transform = 'rotate(0deg) scale(1.1) translateY(-8px)'
												e.currentTarget.style.zIndex = '50'
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.transform = `rotate(${rotation}deg)`
												e.currentTarget.style.zIndex = `${10 + achievements.length - globalIndex}`
											}}
										>
											<LazyAchievementCard
												achievement={achievement}
												status={achievement.status}
												unlockedAt={achievement.unlockedAt}
												quizSlug={achievement.quizSlug}
												progressValue={achievement.progressValue}
												progressMax={achievement.progressMax}
												tier={tier}
												isFlipped={isFlipped}
												onFlipChange={(flipped) => {
													onFlipChange(flipped ? achievement.id : null)
												}}
											/>
										</div>
									)
								})}
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}

