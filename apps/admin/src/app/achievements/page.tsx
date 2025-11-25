"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SiteHeader } from "@/components/SiteHeader";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { AchievementBrowserModal } from "@/components/achievements/AchievementBrowserModal";
import { useUserTier } from "@/hooks/useUserTier";
import { useUserAccess } from "@/contexts/UserAccessContext";
import type { UserTier } from "@/lib/feature-gating";
import { Trophy, Search, Filter, ChevronDown, Calendar, X } from "lucide-react";
import { Footer } from "@/components/Footer";

type AchievementStatus = "unlocked" | "locked_free" | "locked_premium";

interface Achievement {
	id: string;
	slug: string;
	name: string;
	shortDescription: string;
	longDescription?: string;
	category: string;
	rarity: string;
		isPremiumOnly: boolean;
		seasonTag?: string | null;
		iconKey?: string | null;
		series?: string | null; // Series/collection name (e.g., "Roman History", "Perfect Scores")
		cardVariant?: 'standard' | 'foil' | 'foilGold' | 'foilSilver' | 'shiny' | 'fullArt'; // Special card designs
		status: AchievementStatus;
	unlockedAt?: string;
	quizSlug?: string | null; // Which quiz it was earned in
	progressValue?: number;
	progressMax?: number;
}

// Mock achievements data
const MOCK_ACHIEVEMENTS: Achievement[] = [
	{
		id: "1",
		slug: "ace",
		name: "ACE",
		shortDescription: "Get a perfect score",
		category: "performance",
		rarity: "common",
		isPremiumOnly: false,
		iconKey: "/achievements/ace.png",
		series: "Roman History",
		cardVariant: "foil", // Special foil edition!
		status: "unlocked",
		unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
		quizSlug: "10",
	},
	{
		id: "1b",
		slug: "addicted-shiny",
		name: "Addicted",
		shortDescription: "Play 3 quizzes in a single day",
		category: "engagement",
		rarity: "uncommon",
		isPremiumOnly: false,
		cardVariant: "shiny", // Shiny variant!
		status: "unlocked",
		unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		quizSlug: null,
	},
	{
		id: "1c",
		slug: "perfect-fullart",
		name: "Perfect Quiz",
		shortDescription: "Get all questions correct",
		category: "performance",
		rarity: "epic",
		isPremiumOnly: false,
		cardVariant: "fullArt", // Full art variant!
		status: "unlocked",
		unlockedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
		quizSlug: "15",
	},
	{
		id: "2",
		slug: "addicted",
		name: "Addicted",
		shortDescription: "Play 3 quizzes in a single day",
		category: "engagement",
		rarity: "common",
		isPremiumOnly: false,
		status: "unlocked",
		unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		quizSlug: null, // Engagement achievements might not be tied to a specific quiz
	},
	{
		id: "test-foil-gold-1",
		slug: "golden-champion",
		name: "Golden Champion",
		shortDescription: "Achieve legendary status",
		longDescription: "Reach the pinnacle of achievement with this golden card",
		category: "performance",
		rarity: "legendary",
		isPremiumOnly: false,
		cardVariant: "foilGold", // Gold foil variant!
		status: "unlocked",
		unlockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
		quizSlug: null,
	},
	{
		id: "test-foil-silver-1",
		slug: "all-rounder",
		name: "All Rounder",
		shortDescription: "Get a perfect score in 4 or more round types",
		longDescription: "Achieve a perfect score in 4 or more different round types",
		category: "performance",
		rarity: "epic",
		isPremiumOnly: false,
		cardVariant: "fullArt",
		status: "unlocked",
		unlockedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
		quizSlug: null,
	},
	{
		id: "3",
		slug: "time-traveller",
		name: "Time Traveller",
		shortDescription: "Complete a quiz from 3+ weeks ago",
		category: "engagement",
		rarity: "common",
		isPremiumOnly: false,
		status: "locked_free",
	},
	{
		id: "4",
		slug: "deja-vu",
		name: "Déjà Vu",
		shortDescription: "Complete the same quiz twice",
		category: "engagement",
		rarity: "common",
		isPremiumOnly: false,
		status: "locked_free",
	},
	{
		id: "5",
		slug: "blitzkrieg",
		name: "Blitzkrieg!",
		shortDescription: "Get 5/5 in a History round under 2 minutes",
		category: "performance",
		rarity: "uncommon",
		isPremiumOnly: false,
		iconKey: "/achievements/blitzkreig.png",
		status: "unlocked",
		unlockedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
		quizSlug: "12",
	},
	{
		id: "5b",
		slug: "clutch",
		name: "Clutch",
		shortDescription: "Get the last question correct to beat the average",
		longDescription: "Get the final question right after previous mistakes, putting your score above the average public score for that round",
		category: "performance",
		rarity: "uncommon",
		isPremiumOnly: false,
		iconKey: "clutch",
		status: "unlocked",
		unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		quizSlug: "15",
	},
	{
		id: "6",
		slug: "routine-genius",
		name: "Routine Genius",
		shortDescription: "Play for 4 consecutive weeks",
		category: "engagement",
		rarity: "uncommon",
		isPremiumOnly: false,
		status: "locked_free",
	},
	{
		id: "7",
		slug: "hat-trick",
		name: "Hat Trick",
		shortDescription: "Win 3 sports rounds",
		category: "performance",
		rarity: "uncommon",
		isPremiumOnly: false,
		status: "locked_free",
	},
	{
		id: "8",
		slug: "ace",
		name: "Ace",
		shortDescription: "Get 5/5 in a sports-themed round",
		category: "performance",
		rarity: "rare",
		isPremiumOnly: true,
		status: "locked_premium",
	},
	{
		id: "9",
		slug: "olympiad",
		name: "Olympiad",
		shortDescription: "Get 5/5 in an Olympics round",
		category: "event",
		rarity: "rare",
		isPremiumOnly: true,
		seasonTag: "olympics-2026",
		status: "locked_premium",
	},
	{
		id: "10",
		slug: "torchbearer",
		name: "Torchbearer",
		shortDescription: "Play in a special Olympic event week",
		category: "event",
		rarity: "rare",
		isPremiumOnly: true,
		seasonTag: "olympics-2026",
		status: "locked_premium",
	},
	{
		id: "11",
		slug: "term-1-champion",
		name: "Term 1 Champion",
		shortDescription: "Complete all quizzes in Term 1",
		category: "engagement",
		rarity: "epic",
		isPremiumOnly: true,
		seasonTag: "2025-term-1",
		status: "locked_premium",
	},
	{
		id: "12",
		slug: "all-rounder-2025",
		name: "2025 All-Rounder",
		shortDescription: "Play at least once every term in 2025",
		category: "engagement",
		rarity: "epic",
		isPremiumOnly: true,
		seasonTag: "2025",
		status: "locked_premium",
	},
	{
		id: "13",
		slug: "iron-quizzer-2025",
		name: "2025 Iron Quizzer",
		shortDescription: "Maintain a streak through Term 4",
		category: "engagement",
		rarity: "legendary",
		isPremiumOnly: true,
		seasonTag: "2025-term-4",
		status: "locked_premium",
	},
	{
		id: "14",
		slug: "perfect-year",
		name: "Perfect Year",
		shortDescription: "Complete every quiz in a full school year",
		category: "engagement",
		rarity: "legendary",
		isPremiumOnly: true,
		status: "locked_premium",
	},
];

export default function AchievementsPage() {
	const { tier: hookTier, isPremium: hookIsPremium } = useUserTier();
	const { isVisitor, isPremium: contextIsPremium, tier: contextTier } = useUserAccess();

	const [achievements, setAchievements] = useState<Achievement[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isBrowserOpen, setIsBrowserOpen] = useState(false);
	const [localStoragePremium, setLocalStoragePremium] = useState(false);
	const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
	
	// Filter and sort state
	const [searchQuery, setSearchQuery] = useState('');
	const [categoryFilter, setCategoryFilter] = useState<string>('all');
	const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'in-progress' | 'yet-to-earn'>('all');
	const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
	const [showHidden, setShowHidden] = useState(false);

	// Use localStorage first (most immediate), then context, then hook
	// This ensures premium status is detected even if API calls fail
	const isPremium = localStoragePremium || contextIsPremium || hookIsPremium || contextTier === 'premium';
	const tier: UserTier = hookTier === "basic" ? "free" : (hookTier as UserTier);

	// Check localStorage for premium status immediately
	useEffect(() => {
		if (typeof window !== 'undefined') {
			const storedTier = localStorage.getItem('userTier');
			const isPremiumFromStorage = storedTier === 'premium';
			setLocalStoragePremium(isPremiumFromStorage);
		}
	}, []);

	// Fetch achievements from API
	useEffect(() => {
		const fetchAchievements = async () => {
			if (isVisitor) {
				setIsLoading(false);
				return;
			}

			try {
				const token = localStorage.getItem('authToken');
				const userId = localStorage.getItem('userId');
				
				const headers: HeadersInit = {};
				if (token) {
					headers['Authorization'] = `Bearer ${token}`;
				}
				if (userId) {
					headers['X-User-Id'] = userId;
				}

				const response = await fetch('/api/achievements', { headers });
				let apiAchievements: Achievement[] = [];
				if (response.ok) {
					const data = await response.json();
					apiAchievements = data.achievements || [];
				}
				
				// Always include test achievements for prototyping (special variants)
				// These are hardcoded test achievements that should always appear for logged-in users
				const testAchievements: Achievement[] = [
					{
						id: "test-doppelganger-1",
						slug: "doppelganger",
						name: "Doppelganger",
						shortDescription: "Get the same score 2 weeks in a row",
						longDescription: "Achieve the exact same score in consecutive weeks - a true doppelganger performance!",
						category: "performance",
						rarity: "rare",
						isPremiumOnly: false,
						iconKey: "/achievements/doppelganger.png",
						status: "unlocked",
						unlockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
						quizSlug: null,
					},
					{
						id: "test-blitzkrieg-1",
						slug: "blitzkrieg",
						name: "Blitzkrieg!",
						shortDescription: "Get 5/5 in a History round under 2 minutes",
						longDescription: "Complete a history-themed round perfectly in less than 2 minutes - lightning fast!",
						category: "performance",
						rarity: "uncommon",
						isPremiumOnly: false,
						iconKey: "/achievements/blitzkreig.png",
						status: "unlocked",
						unlockedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
						quizSlug: "12",
					},
					{
						id: "test-clutch-1",
						slug: "clutch",
						name: "Clutch",
						shortDescription: "Get the last question correct to beat the average",
						longDescription: "Get the final question right after previous mistakes, putting your score above the average public score for that round",
						category: "performance",
						rarity: "uncommon",
						isPremiumOnly: false,
						iconKey: "clutch",
						status: "unlocked",
						unlockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
						quizSlug: "15",
					},
					{
						id: "test-ace-1",
						slug: "ace",
						name: "ACE",
						shortDescription: "Get 5/5 in a History round",
						longDescription: "Achieve a perfect score in a round focused on historical topics",
						category: "performance",
						rarity: "common",
						isPremiumOnly: false,
						iconKey: "/achievements/hail-caesar.png",
						series: "Roman History",
						cardVariant: "foil",
						status: "unlocked",
						unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
						quizSlug: "10",
					},
					{
						id: "test-foil-gold-1",
						slug: "golden-champion",
						name: "Golden Champion",
						shortDescription: "Achieve legendary status",
						longDescription: "Reach the pinnacle of achievement with this golden card",
						category: "performance",
						rarity: "legendary",
						isPremiumOnly: false,
						cardVariant: "foilGold",
						status: "unlocked",
						unlockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
						quizSlug: null,
					},
					{
						id: "test-foil-silver-1",
						slug: "silver-star",
						name: "Silver Star",
						shortDescription: "Consistent excellence",
						longDescription: "Show consistent excellence across multiple quizzes",
						category: "engagement",
						rarity: "rare",
						isPremiumOnly: false,
						cardVariant: "foilSilver",
						status: "unlocked",
						unlockedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
						quizSlug: null,
					},
					{
						id: "test-shiny-1",
						slug: "shining-star",
						name: "Shining Star",
						shortDescription: "Complete 10 quizzes",
						longDescription: "Show your dedication by completing 10 quizzes",
						category: "engagement",
						rarity: "uncommon",
						isPremiumOnly: false,
						cardVariant: "shiny",
						status: "unlocked",
						unlockedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
						quizSlug: null,
					},
					{
						id: "test-fullart-1",
						slug: "master-mind",
						name: "95.5 ATAR",
						shortDescription: "Perfect score on 3 quizzes",
						longDescription: "Achieve perfection across multiple quizzes",
						category: "performance",
						rarity: "epic",
						isPremiumOnly: false,
						cardVariant: "fullArt",
						status: "unlocked",
						unlockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
						quizSlug: null,
					},
					{
						id: "test-standard-1",
						slug: "quick-thinker",
						name: "Quick Thinker",
						shortDescription: "Answer 5 questions in under 30 seconds",
						longDescription: "Show your quick thinking skills",
						category: "performance",
						rarity: "common",
						isPremiumOnly: false,
						cardVariant: "standard",
						status: "unlocked",
						unlockedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
						quizSlug: null,
					},
					{
						id: "test-standard-2",
						slug: "night-owl",
						name: "Night Owl",
						shortDescription: "Complete a quiz after midnight",
						longDescription: "Show your dedication by playing late at night",
						category: "engagement",
						rarity: "uncommon",
						isPremiumOnly: false,
						cardVariant: "standard",
						status: "unlocked",
						unlockedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
						quizSlug: null,
					},
				];
				
				// Add test achievement with progress bar
				const progressTestAchievement: Achievement = {
					id: "test-progress-1",
					slug: "quiz-master-progress",
					name: "Quiz Master",
					shortDescription: "Complete 10 quizzes",
					longDescription: "Show your dedication by completing 10 quizzes. You're making great progress!",
					category: "engagement",
					rarity: "uncommon",
					isPremiumOnly: false,
					cardVariant: "standard",
					status: "locked_free",
					progressValue: 7,
					progressMax: 10,
				};
				
				// Remove duplicates by ID, keeping test achievements if they exist
				const existingIds = new Set(apiAchievements.map(a => a.id));
				const uniqueTestAchievements = testAchievements.filter(a => !existingIds.has(a.id));
				
				setAchievements([...apiAchievements, ...uniqueTestAchievements, progressTestAchievement]);
			} catch (error) {
				console.error('Failed to fetch achievements:', error);
				// Fallback to mock data
				setAchievements(MOCK_ACHIEVEMENTS);
			} finally {
				setIsLoading(false);
			}
		};

		fetchAchievements();
	}, [isVisitor]);

	const unlockedCount = achievements.filter((a) => a.status === "unlocked").length;
	const totalCount = achievements.length;

	// Get all unique categories
	const categories = Array.from(new Set(achievements.map(a => a.category)));

	// Filter and sort achievements
	const filteredAndSortedAchievements = React.useMemo(() => {
		let filtered = achievements.filter((a) => {
			// Search filter
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				if (!a.name.toLowerCase().includes(query) && 
					!a.shortDescription.toLowerCase().includes(query)) {
					return false;
				}
			}

			// Category filter
			if (categoryFilter !== 'all' && a.category !== categoryFilter) {
				return false;
			}

			// Status filter
			if (statusFilter === 'unlocked' && a.status !== 'unlocked') return false;
			if (statusFilter === 'in-progress' && (a.status === 'unlocked' || !a.progressValue || a.progressValue === 0)) return false;
			if (statusFilter === 'yet-to-earn' && (a.status === 'unlocked' || (a.progressValue && a.progressValue > 0))) return false;

			// Hidden filter (locked premium achievements)
			if (!showHidden && a.status === 'locked_premium') return false;

			return true;
		});

		// Sort by date earned
		filtered = filtered.sort((a, b) => {
			const dateA = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
			const dateB = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
			
			if (dateA === 0 && dateB === 0) return 0;
			if (dateA === 0) return 1; // Items without dates go to end
			if (dateB === 0) return -1;
			
			return dateSort === 'newest' ? dateB - dateA : dateA - dateB;
		});

		return filtered;
	}, [achievements, searchQuery, categoryFilter, statusFilter, dateSort, showHidden]);

	// Separate into groups for display
	const earnedAchievements = filteredAndSortedAchievements.filter((a) => a.status === "unlocked");
	const inProgressAchievements = filteredAndSortedAchievements.filter(
		(a) => a.status !== "unlocked" && a.progressValue !== undefined && a.progressValue > 0
	);
	const yetToEarnAchievements = filteredAndSortedAchievements.filter(
		(a) => a.status !== "unlocked" && (a.progressValue === undefined || a.progressValue === 0)
	);

	// Visitor state - redirect to sign in
	if (isVisitor) {
		return (
			<>
				<SiteHeader />
				<main className="min-h-screen">
					<section className="min-h-screen flex flex-col items-center justify-center px-6 sm:px-8 md:px-4 pt-24 sm:pt-32">
						<div className="max-w-4xl mx-auto text-center mb-12">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
							>
						<h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[hsl(var(--foreground))] mb-4">
							Achievement Collection
						</h1>
								<p className="text-lg text-[hsl(var(--muted-foreground))] mb-8 max-w-2xl mx-auto">
									Create a free account to start tracking your quiz progress and earning achievements.
								</p>
							</motion.div>
						</div>

						{/* Teaser grid - all locked */}
						<div className="max-w-7xl mx-auto w-full px-4">
							<div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 opacity-50">
								{(() => {
									const teaserAchievements = (achievements.length > 0 ? achievements : MOCK_ACHIEVEMENTS).slice(0, 5);
									// Add a foil card variant to the teaser
									const foilTeaser: Achievement = {
										...teaserAchievements[0],
										id: 'teaser-foil',
										cardVariant: 'foil',
									};
									return [...teaserAchievements, foilTeaser].map((achievement, index) => (
										<div 
											key={achievement.id} 
											className="relative"
											style={{
												width: 'clamp(120px, 25vw, 200px)',
												maxWidth: '200px',
												flexShrink: 0,
												marginLeft: index > 0 ? '-10px' : '0',
												zIndex: 6 - index,
												transform: `rotate(${(index % 3 - 1) * 0.5}deg)`,
											}}
										>
											<AchievementCard
												achievement={achievement}
												status="locked_free"
												tier="visitor"
											/>
										</div>
									));
								})()}
							</div>
						</div>
					</section>
					<Footer />
				</main>
			</>
		);
	}

	return (
		<>
			<SiteHeader />
			<main className="min-h-screen">
				<section className="min-h-screen flex flex-col items-center px-6 sm:px-8 md:px-4 pt-24 sm:pt-32 pb-16">
					{/* Header */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
						className="max-w-4xl mx-auto text-center mb-8"
					>
						<h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[hsl(var(--foreground))] mb-4">
							Your Achievements
						</h1>
						<p className="text-lg text-[hsl(var(--muted-foreground))] mb-6">
							{isLoading ? 'Loading...' : `${unlockedCount} of ${totalCount} unlocked`}
						</p>
					</motion.div>

					{/* Subtle Filters */}
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, delay: 0.1 }}
						className="max-w-4xl mx-auto mb-8 px-4"
					>
						<div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
							{/* Search */}
							<div className="relative flex-1 max-w-md w-full">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
								<input
									type="text"
									placeholder="Search achievements..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full pl-10 pr-4 py-2 text-sm bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))] rounded-full text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all"
								/>
								{searchQuery && (
									<button
										onClick={() => setSearchQuery('')}
										className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[hsl(var(--muted))] rounded-full transition-colors"
									>
										<X className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
									</button>
								)}
							</div>

							{/* Category Filter */}
							<select
								value={categoryFilter}
								onChange={(e) => setCategoryFilter(e.target.value)}
								className="px-4 py-2 text-sm bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))] rounded-full text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all cursor-pointer"
							>
								<option value="all">All Categories</option>
								{categories.map(cat => (
									<option key={cat} value={cat}>
										{cat.charAt(0).toUpperCase() + cat.slice(1)}
									</option>
								))}
							</select>

							{/* Status Filter */}
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
								className="px-4 py-2 text-sm bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))] rounded-full text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all cursor-pointer"
							>
								<option value="all">All Status</option>
								<option value="unlocked">Unlocked</option>
								<option value="in-progress">In Progress</option>
								<option value="yet-to-earn">Yet to Earn</option>
							</select>

							{/* Date Sort */}
							<button
								onClick={() => setDateSort(dateSort === 'newest' ? 'oldest' : 'newest')}
								className="px-4 py-2 text-sm bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))] rounded-full text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all flex items-center gap-2"
								title={`Sort by date: ${dateSort === 'newest' ? 'Newest first' : 'Oldest first'}`}
							>
								<Calendar className="w-4 h-4" />
								{dateSort === 'newest' ? 'Newest' : 'Oldest'}
							</button>

							{/* Show Hidden Toggle */}
							{isPremium && (
								<button
									onClick={() => setShowHidden(!showHidden)}
									className={`px-4 py-2 text-sm border rounded-full transition-all flex items-center gap-2 ${
										showHidden
											? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))]'
											: 'bg-[hsl(var(--muted))]/50 border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
									}`}
									title={showHidden ? 'Hide premium locked' : 'Show premium locked'}
								>
									<Filter className="w-4 h-4" />
									Hidden
								</button>
							)}
						</div>
					</motion.div>

				{/* Unlocked Achievements */}
				{earnedAchievements.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
						className="max-w-7xl mx-auto w-full px-4 mb-16"
					>
						{(statusFilter === 'all' || statusFilter === 'unlocked') && (
							<div className="mb-6 text-center">
								<h2 className="text-2xl md:text-3xl font-bold text-[hsl(var(--foreground))] mb-2">
									Unlocked
								</h2>
								{statusFilter === 'all' && (
									<p className="text-sm text-[hsl(var(--muted-foreground))]">
										{earnedAchievements.length} achievement{earnedAchievements.length !== 1 ? 's' : ''} earned
									</p>
								)}
							</div>
						)}
						<div className="flex flex-wrap justify-center gap-4">
							<AnimatePresence mode="popLayout">
								{earnedAchievements.map((achievement, index) => {
								const isFlipped = flippedCardId === achievement.id
								const rotation = (index % 5 - 2) * 1 // Subtle angles: -2, -1, 0, 1, 2 degrees
								
								return (
									<motion.div
										key={achievement.id}
										layout
										initial={{ opacity: 0, y: 20, scale: 0.9 }}
										animate={{ 
											opacity: 1, 
											y: 0, 
											scale: 1,
											rotate: isFlipped ? 0 : rotation,
										}}
										exit={{ opacity: 0, scale: 0.8, y: -10 }}
										transition={{ 
											duration: 0.3, 
											delay: index * 0.02,
											ease: [0.22, 1, 0.36, 1],
											layout: { duration: 0.4 }
										}}
										className="relative"
										style={{
											width: 'clamp(120px, 25vw, 200px)',
											maxWidth: '200px',
											flexShrink: 0,
											zIndex: isFlipped ? 50 : 10 + earnedAchievements.length - index,
											transform: `rotate(${isFlipped ? 0 : rotation}deg)`,
										}}
										whileHover={{ 
											zIndex: 50,
											scale: 1.1,
											rotate: 0,
											y: -8,
											transition: { duration: 0.2 }
										}}
									>
										<AchievementCard
											achievement={achievement}
											status={achievement.status}
											unlockedAt={achievement.unlockedAt}
											quizSlug={achievement.quizSlug}
											progressValue={achievement.progressValue}
											progressMax={achievement.progressMax}
											tier={tier}
											isFlipped={isFlipped}
											onFlipChange={(flipped) => {
												setFlippedCardId(flipped ? achievement.id : null)
											}}
										/>
									</motion.div>
								)
							})}
							</AnimatePresence>
						</div>
					</motion.div>
				)}

				{/* No results message */}
				{filteredAndSortedAchievements.length === 0 && !isLoading && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="text-center py-16"
					>
						<p className="text-[hsl(var(--muted-foreground))] mb-4">
							{searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' 
								? 'No achievements match your filters'
								: 'Start playing quizzes to earn achievements'}
						</p>
						{(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all') && (
							<button
								onClick={() => {
									setSearchQuery('')
									setCategoryFilter('all')
									setStatusFilter('all')
								}}
								className="text-sm text-[hsl(var(--primary))] hover:underline"
							>
								Clear filters
							</button>
						)}
					</motion.div>
				)}

				{/* In Progress Achievements */}
				{inProgressAchievements.length > 0 && (statusFilter === 'all' || statusFilter === 'in-progress') && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
						className="max-w-7xl mx-auto w-full px-4 mb-16"
					>
						<div className="mb-6 text-center">
							<h2 className="text-2xl md:text-3xl font-bold text-[hsl(var(--foreground))] mb-2">
								In Progress
							</h2>
							<p className="text-sm text-[hsl(var(--muted-foreground))]">
								Keep going! You're making progress on these achievements
							</p>
						</div>
							<div className="flex flex-wrap justify-center gap-4">
							<AnimatePresence mode="popLayout">
								{inProgressAchievements.map((achievement, index) => {
								const isFlipped = flippedCardId === achievement.id
								const rotation = (index % 5 - 2) * 1 // Subtle angles: -2, -1, 0, 1, 2 degrees
								
								return (
									<motion.div
										key={achievement.id}
										layout
										initial={{ opacity: 0, y: 20, scale: 0.9 }}
										animate={{ 
											opacity: 1, 
											y: 0, 
											scale: 1,
											rotate: isFlipped ? 0 : rotation,
										}}
										exit={{ opacity: 0, scale: 0.8, y: -10 }}
										transition={{ 
											duration: 0.3, 
											delay: index * 0.02,
											ease: [0.22, 1, 0.36, 1],
											layout: { duration: 0.4 }
										}}
										className="relative"
										style={{
											width: 'clamp(120px, 25vw, 200px)',
											maxWidth: '200px',
											flexShrink: 0,
											zIndex: isFlipped ? 50 : 10 + inProgressAchievements.length - index,
											transform: `rotate(${isFlipped ? 0 : rotation}deg)`,
										}}
										whileHover={{ 
											zIndex: 50,
											scale: 1.1,
											rotate: 0,
											y: -8,
											transition: { duration: 0.2 }
										}}
										>
											<AchievementCard
												achievement={achievement}
												status={achievement.status}
												unlockedAt={achievement.unlockedAt}
												quizSlug={achievement.quizSlug}
												progressValue={achievement.progressValue}
												progressMax={achievement.progressMax}
												tier={tier}
												isFlipped={isFlipped}
												onFlipChange={(flipped) => {
													setFlippedCardId(flipped ? achievement.id : null)
												}}
											/>
										</motion.div>
									)
								})}
							</AnimatePresence>
							</div>
						</motion.div>
					)}

					{/* Yet to Earn Achievements */}
					{yetToEarnAchievements.length > 0 && (statusFilter === 'all' || statusFilter === 'yet-to-earn') && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
							className="max-w-7xl mx-auto w-full px-4 mb-16"
						>
							<div className="mb-6 text-center">
								<h2 className="text-2xl md:text-3xl font-bold text-[hsl(var(--foreground))] mb-2">
									Yet to Earn
								</h2>
								<p className="text-sm text-[hsl(var(--muted-foreground))]">
									Start working towards these achievements
								</p>
							</div>
							<div className="flex flex-wrap justify-center gap-4">
								<AnimatePresence mode="popLayout">
									{yetToEarnAchievements.map((achievement, index) => {
									const isFlipped = flippedCardId === achievement.id
									const rotation = (index % 5 - 2) * 1 // Subtle angles: -2, -1, 0, 1, 2 degrees
									
									return (
										<motion.div
											key={achievement.id}
											layout
											initial={{ opacity: 0, y: 20, scale: 0.9 }}
											animate={{ 
												opacity: 1, 
												y: 0, 
												scale: 1,
												rotate: isFlipped ? 0 : rotation,
											}}
											exit={{ opacity: 0, scale: 0.8, y: -10 }}
											transition={{ 
												duration: 0.3, 
												delay: index * 0.02,
												ease: [0.22, 1, 0.36, 1],
												layout: { duration: 0.4 }
											}}
											className="relative"
											style={{
												width: 'clamp(120px, 25vw, 200px)',
												maxWidth: '200px',
												flexShrink: 0,
												zIndex: isFlipped ? 50 : 10 + yetToEarnAchievements.length - index,
												transform: `rotate(${isFlipped ? 0 : rotation}deg)`,
											}}
											whileHover={{ 
												zIndex: 50,
												scale: 1.1,
												rotate: 0,
												y: -8,
												transition: { duration: 0.2 }
											}}
										>
											<AchievementCard
												achievement={achievement}
												status={achievement.status}
												unlockedAt={achievement.unlockedAt}
												quizSlug={achievement.quizSlug}
												progressValue={achievement.progressValue}
												progressMax={achievement.progressMax}
												tier={tier}
												isFlipped={isFlipped}
												onFlipChange={(flipped) => {
													setFlippedCardId(flipped ? achievement.id : null)
												}}
											/>
										</motion.div>
									)
								})}
								</AnimatePresence>
							</div>
						</motion.div>
					)}

					{/* Achievement Browser Link - Only show if premium */}
					{isPremium && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
							className="max-w-6xl mx-auto w-full px-4"
						>
							<div className="text-center">
								<button
									onClick={() => setIsBrowserOpen(true)}
									className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-base font-medium bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors shadow-sm hover:shadow-md"
								>
									<Search className="w-4 h-4" />
									Explore All Achievements
								</button>
							</div>
						</motion.div>
					)}

				</section>
				<Footer />
			</main>

			{/* Achievement Browser Modal */}
			{isPremium && (
				<AchievementBrowserModal
					isOpen={isBrowserOpen}
					onClose={() => setIsBrowserOpen(false)}
					achievements={achievements}
					tier={tier}
				/>
			)}
		</>
	);
}
