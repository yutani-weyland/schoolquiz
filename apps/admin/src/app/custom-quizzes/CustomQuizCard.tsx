'use client'

/**
 * OPTIMIZATION: Individual quiz card component
 * Lazy-loaded with Framer Motion for animations
 * 
 * Design Philosophy:
 * - Clean, consistent visual hierarchy
 * - Cohesive button styling
 * - Reduced cognitive load
 * - Professional SaaS-quality UX
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Edit, Share2, Trash2, Play, Users, Building2, MoreVertical, User, Calendar, Clock, Activity } from 'lucide-react'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import * as Tooltip from '@radix-ui/react-tooltip'
import { formatDateTooltip, formatDate } from '@/lib/dateUtils'
import type { CustomQuizV2 } from './custom-quizzes-server-v2'

interface CustomQuizCardProps {
	quiz: CustomQuizV2
	onDelete: (quizId: string) => void
	onShare: (quiz: CustomQuizV2) => void
	index: number
}

export function CustomQuizCard({ quiz, onDelete, onShare, index }: CustomQuizCardProps) {
	const [showMenu, setShowMenu] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)

	// Set mounted flag for portal
	useEffect(() => {
		setMounted(true)
	}, [])

	// Calculate dropdown position and close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setShowMenu(false)
			}
		}

		if (showMenu && menuRef.current) {
			// Calculate position for dropdown
			const rect = menuRef.current.getBoundingClientRect()
			setDropdownPosition({
				top: rect.bottom + 8,
				right: window.innerWidth - rect.right,
			})
			document.addEventListener('mousedown', handleClickOutside)
		} else {
			setDropdownPosition(null)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [showMenu])

	const handleDelete = () => {
		setShowMenu(false)
		onDelete(quiz.id)
	}

	const handleShare = () => {
		setShowMenu(false)
		onShare(quiz)
	}

	// Random tilt angles for hover effect (subtle - reduced severity)
	const hoverTilts = [-0.8, 0.6, -0.9, 0.7, -0.6, 0.9, -0.8, 0.6, -0.9, 0.7, -0.6, 0.9];
	const hoverTilt = hoverTilts[index % hoverTilts.length] || 0;
	const [isHovered, setIsHovered] = useState(false);
	const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
	const [mounted, setMounted] = useState(false);
	const [showTooltip, setShowTooltip] = useState(false);

	// Check if updated date is significantly different from created date
	const createdAt = quiz.createdAt ? new Date(quiz.createdAt) : null
	const updatedAt = quiz.updatedAt ? new Date(quiz.updatedAt) : null
	const wasUpdated = createdAt && updatedAt && 
		Math.abs(updatedAt.getTime() - createdAt.getTime()) > 60000 // More than 1 minute difference

	return (
		<Tooltip.Provider delayDuration={300}>
			<Tooltip.Root open={showTooltip} onOpenChange={setShowTooltip}>
				<Tooltip.Trigger asChild>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.05 }}
						className="group"
						onMouseEnter={() => {
							setIsHovered(true)
							setShowTooltip(true)
						}}
						onMouseLeave={() => {
							setIsHovered(false)
							setShowTooltip(false)
						}}
					>
						{/* Single Container Card - No Nested Rounded Corners */}
						<motion.div 
							className="rounded-3xl bg-white dark:bg-gray-800 shadow-md hover:shadow-lg overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700 relative cursor-pointer transition-shadow duration-200"
							whileHover={{
								rotate: hoverTilt,
								scale: 1.01,
								y: -2,
							}}
							whileTap={{ scale: 0.98 }}
							transition={{
								type: "spring",
								stiffness: 300,
								damping: 20
							}}
							style={{ transformOrigin: 'center' }}
						>
				<div className="relative z-10">
					{/* Header - Solid Color (No Gradients) */}
					<div
						className="px-6 py-5 flex items-center justify-center relative"
						style={{
							backgroundColor: quiz.colorHex || '#14b8a6',
						}}
					>
						<h3 className="text-lg font-semibold tracking-normal text-white text-center line-clamp-2 relative z-10 px-2">
							{quiz.title}
						</h3>
					</div>

				{/* Body Section - Clean Vertical Rhythm - Reduced spacing */}
				<div className="px-6 pt-4 pb-6 space-y-3">
					{/* Description */}
					{quiz.blurb && (
						<p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
							{quiz.blurb}
						</p>
					)}

					{/* Metadata Pills - Toned down with unified styling */}
					<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
						{/* Status Badge */}
						<span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400">
							{quiz.status === 'published' ? 'Published' : quiz.status === 'draft' ? 'Draft' : quiz.status}
						</span>
						
						{/* Round/Question Counts */}
						{(quiz.roundCount > 0 || quiz.questionCount > 0) && (
							<span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-slate-600 dark:text-gray-400">
								{quiz.roundCount} round{quiz.roundCount !== 1 ? 's' : ''} • {quiz.questionCount} question{quiz.questionCount !== 1 ? 's' : ''}
							</span>
						)}

						{/* Creator Indicator - Show creator info for all quizzes */}
						{quiz.creator && (
							<span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400">
								<User className="w-3 h-3" />
								{quiz.isShared ? 'Created by' : 'By'} {quiz.creator.name || quiz.creator.email.split('@')[0]}
								{quiz.isCreatorInSameOrg && (
									<span className="inline-flex items-center gap-1 ml-1.5 pl-1.5 border-l border-slate-300 dark:border-gray-600">
										<Building2 className="w-3 h-3 text-slate-600 dark:text-gray-400" />
										<span className="text-slate-600 dark:text-gray-400">Same org</span>
									</span>
								)}
							</span>
						)}

						{/* Sharing Indicators */}
						{quiz.isOrgWide && (
							<span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 px-3 py-1 text-xs font-medium">
								<Building2 className="w-3 h-3" />
								Org-wide
							</span>
						)}
						{quiz.isTemplate && (
							<span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 px-3 py-1 text-xs font-medium">
								Template
							</span>
						)}
						{quiz.hasUserShares && (
							<span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 px-3 py-1 text-xs font-medium">
								<Users className="w-3 h-3" />
								Shared
							</span>
						)}
						{quiz.hasGroupShares && (
							<span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 px-3 py-1 text-xs font-medium">
								<Users className="w-3 h-3" />
								Groups
							</span>
						)}
						{quiz.isShared && quiz.sharedBy && (
							<span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 px-3 py-1 text-xs font-medium">
								By {quiz.sharedBy.name || quiz.sharedBy.email.split('@')[0]}
							</span>
						)}
					</div>
				</div>

				{/* Divider - More visible */}
				<div className="border-t border-slate-200 dark:border-gray-700" />

				{/* Footer - Clear Button Hierarchy, Centered - Tighter spacing */}
				<div className="px-6 py-4 flex items-center justify-center gap-2 flex-wrap">
					{/* Button Group - Centered - Consistent padding */}
					<div className="flex items-center gap-2">
						{/* Primary Action - Play */}
						<Link
							href={`/custom-quizzes/${quiz.id}/play`}
							className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
						>
							<Play className="w-4 h-4" />
							Play
						</Link>

						{/* Secondary Actions - Only show if user owns the quiz */}
						{!quiz.isShared && (
							<>
								<Link
									href={`/custom-quizzes/create?edit=${quiz.id}`}
									className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
									title="Edit quiz"
								>
									<Edit className="w-4 h-4" />
									<span className="hidden sm:inline">Edit</span>
								</Link>
								
								<button
									onClick={handleShare}
									className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
									title="Share quiz"
								>
									<Share2 className="w-4 h-4" />
									<span className="hidden sm:inline">Share</span>
								</button>

								{/* Delete Action - In dropdown menu */}
								<div className="relative" ref={menuRef}>
									<button
										onClick={() => setShowMenu(!showMenu)}
										className="inline-flex items-center justify-center rounded-full px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
										title="More options"
									>
										<MoreVertical className="w-4 h-4" />
									</button>

									{/* Dropdown Menu - Portal to avoid overflow clipping */}
									{mounted && showMenu && dropdownPosition && createPortal(
										<>
											{/* Backdrop overlay */}
											<div 
												className="fixed inset-0 z-[100]"
												onClick={() => setShowMenu(false)}
											/>
											<motion.div
												initial={{ opacity: 0, y: -10 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -10 }}
												className="fixed z-[101] w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1"
												style={{
													top: `${dropdownPosition.top}px`,
													right: `${dropdownPosition.right}px`,
												}}
											>
												<button
													onClick={handleDelete}
													className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-sm font-medium"
												>
													<Trash2 className="w-4 h-4" />
													Delete Quiz
												</button>
											</motion.div>
										</>,
										document.body
									)}
								</div>
							</>
						)}
					</div>
					</div>
				</div>
						</motion.div>
					</motion.div>
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						className="z-[200] rounded-lg bg-gray-900 dark:bg-gray-800 px-4 py-3 text-sm text-white shadow-lg border border-gray-700 dark:border-gray-600 max-w-xs"
						sideOffset={8}
						side="top"
					>
						<div className="space-y-2">
							{/* Created Date */}
							{createdAt && (
								<div className="flex items-start gap-2">
									<Calendar className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
									<div>
										<div className="text-xs text-gray-400 mb-0.5">Created</div>
										<div className="text-white font-medium">{formatDateTooltip(quiz.createdAt)}</div>
									</div>
								</div>
							)}
							
							{/* Updated Date - Only show if significantly different from created */}
							{wasUpdated && updatedAt && (
								<div className="flex items-start gap-2">
									<Clock className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
									<div>
										<div className="text-xs text-gray-400 mb-0.5">Last updated</div>
										<div className="text-white font-medium">{formatDateTooltip(quiz.updatedAt)}</div>
									</div>
								</div>
							)}

							{/* Creator Info */}
							{quiz.creator && (
								<div className="flex items-start gap-2 pt-1 border-t border-gray-700 dark:border-gray-600">
									<User className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
									<div>
										<div className="text-xs text-gray-400 mb-0.5">Creator</div>
										<div className="text-white font-medium">
											{quiz.creator.name || quiz.creator.email}
											{quiz.isCreatorInSameOrg && (
												<span className="ml-2 inline-flex items-center gap-1 text-blue-400">
													<Building2 className="w-3 h-3" />
													<span className="text-xs">Same org</span>
												</span>
											)}
										</div>
									</div>
								</div>
							)}

							{/* Play Count */}
							{quiz.playCount !== undefined && quiz.playCount > 0 && (
								<div className="flex items-start gap-2 pt-1 border-t border-gray-700 dark:border-gray-600">
									<Activity className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
									<div>
										<div className="text-xs text-gray-400 mb-0.5">Plays</div>
										<div className="text-white font-medium">
											{quiz.playCount} {quiz.playCount === 1 ? 'play' : 'plays'}
										</div>
									</div>
								</div>
							)}

							{/* Share Count */}
							{quiz.shareCount > 0 && (
								<div className="flex items-start gap-2 pt-1 border-t border-gray-700 dark:border-gray-600">
									<Share2 className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
									<div>
										<div className="text-xs text-gray-400 mb-0.5">Shared</div>
										<div className="text-white font-medium">
											{quiz.shareCount} {quiz.shareCount === 1 ? 'time' : 'times'}
											{quiz.hasUserShares && quiz.hasGroupShares && ' • Users & Groups'}
											{quiz.hasUserShares && !quiz.hasGroupShares && ' • Users'}
											{!quiz.hasUserShares && quiz.hasGroupShares && ' • Groups'}
										</div>
									</div>
								</div>
							)}
						</div>
						<Tooltip.Arrow className="fill-gray-900 dark:fill-gray-800" />
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>
		</Tooltip.Provider>
	)
}







