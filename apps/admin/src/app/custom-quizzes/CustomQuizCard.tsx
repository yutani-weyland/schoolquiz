'use client'

/**
 * OPTIMIZATION: Individual quiz card component
 * Lazy-loaded with Framer Motion for animations
 */

import { motion } from 'framer-motion'
import { Edit, Share2, Trash2, FileText, Users, Building2 } from 'lucide-react'
import { ContentCard } from '@/components/layout/ContentCard'
import Link from 'next/link'
import type { CustomQuizV2 } from './custom-quizzes-server-v2'

interface CustomQuizCardProps {
	quiz: CustomQuizV2
	onDelete: (quizId: string) => void
	onShare: (quiz: CustomQuizV2) => void
	index: number
}

export function CustomQuizCard({ quiz, onDelete, onShare, index }: CustomQuizCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.05 }}
		>
			<ContentCard padding="lg" rounded="3xl" hoverAnimation={true}>
				{/* Quiz Header */}
				<div
					className="h-32 rounded-xl mb-4 flex items-center justify-center"
					style={{
						backgroundColor: quiz.colorHex || '#6366f1',
					}}
				>
					<h3 className="text-xl font-bold text-white text-center px-4 line-clamp-2">
						{quiz.title}
					</h3>
				</div>

				{/* Quiz Info */}
				<div className="mb-4">
					{quiz.blurb && (
						<p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2 mb-2">
							{quiz.blurb}
						</p>
					)}
					<div className="flex flex-wrap items-center gap-2 text-xs mb-2">
						{/* Status Badge */}
						<span className={`px-2 py-1 rounded-full ${
							quiz.status === 'published' 
								? 'bg-[#059669]/10 text-[#059669]'
								: quiz.status === 'draft'
									? 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
									: 'bg-primary/10 text-primary'
						}`}>
							{quiz.status === 'published' ? 'Published' : quiz.status === 'draft' ? 'Draft' : quiz.status}
						</span>
						{/* Round/Question Counts */}
						{(quiz.roundCount > 0 || quiz.questionCount > 0) && (
							<span className="px-2 py-1 bg-accent text-accent-foreground rounded-full">
								{quiz.roundCount} round{quiz.roundCount !== 1 ? 's' : ''} • {quiz.questionCount} question{quiz.questionCount !== 1 ? 's' : ''}
							</span>
						)}
					</div>
					{/* Sharing Indicators */}
					<div className="flex items-center gap-2 text-xs">
						{quiz.isOrgWide && (
							<span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full flex items-center gap-1">
								<Building2 className="w-3 h-3" />
								Org-wide
							</span>
						)}
						{quiz.isTemplate && (
							<span className="px-2 py-1 bg-purple-500/10 text-purple-500 rounded-full">
								Template
							</span>
						)}
						{quiz.hasUserShares && (
							<span className="px-2 py-1 bg-[#059669]/10 text-[#059669] rounded-full flex items-center gap-1">
								<Users className="w-3 h-3" />
								Users
							</span>
						)}
						{quiz.hasGroupShares && (
							<span className="px-2 py-1 bg-[#059669]/10 text-[#059669] rounded-full flex items-center gap-1">
								<Users className="w-3 h-3" />
								Groups
							</span>
						)}
						{quiz.isShared && quiz.sharedBy && (
							<span className="px-2 py-1 bg-accent text-accent-foreground rounded-full">
								Shared by {quiz.sharedBy.name || quiz.sharedBy.email.split('@')[0]}
							</span>
						)}
					</div>
				</div>

				{/* Actions */}
				<div className="flex gap-2">
					{!quiz.isShared && (
						<>
							<Link
								href={`/custom-quizzes/create?edit=${quiz.id}`}
								className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors text-sm font-medium"
							>
								<Edit className="w-4 h-4" />
								Edit
							</Link>
							<button
								onClick={() => onShare(quiz)}
								className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors text-sm font-medium"
							>
								<Share2 className="w-4 h-4" />
								Share
							</button>
							<button
								onClick={() => onDelete(quiz.id)}
								className="px-3 py-2 bg-destructive/10 text-destructive rounded-full hover:bg-destructive/20 transition-colors"
							>
								<Trash2 className="w-4 h-4" />
							</button>
						</>
					)}
					<Link
						href={`/custom-quizzes/${quiz.id}/play`}
						className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors text-sm font-medium"
					>
						<FileText className="w-4 h-4" />
						Play
					</Link>
				</div>
			</ContentCard>
		</motion.div>
	)
}

