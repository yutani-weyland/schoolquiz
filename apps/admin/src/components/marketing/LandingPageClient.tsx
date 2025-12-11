"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SiteHeader } from "@/components/SiteHeader";
import NextQuizCountdown from "@/components/NextQuizCountdown";
import { RotatingText } from "@/components/RotatingText";
import HeroCTA from "@/components/HeroCTA";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useUserAccess } from "@/contexts/UserAccessContext";
import { Footer } from "@/components/Footer";
import { getQuizColor, getModernColor } from "@/lib/colors";
import { textOn } from "@/lib/contrast";
import type { Quiz } from "@/components/quiz/QuizCard";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import type { UserTier } from "@/lib/feature-gating";
import { Trophy, Users, Users2, TrendingUp, FileText, Download, RotateCcw, Sparkles, MessageSquare, Crown, School, ChevronLeft, ChevronRight, ChevronDown, FileEdit, Zap, Building2, BarChart3 } from "lucide-react";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { SnowOverlay } from "@/components/ui/snow-overlay";
import { cn } from "@/lib/utils";
import dynamic from 'next/dynamic';
import { ReasonsCarousel } from "@/components/marketing/ReasonsCarousel";

const QuizCardStack = dynamic(() => import("@/components/marketing/QuizCardStack").then(mod => mod.QuizCardStack));
const QuizSafariPreview = dynamic(() => import("@/components/QuizSafariPreview"));



// Sample quiz data for the card stack
const sampleQuizzes: Quiz[] = [
	{
		id: 12,
		slug: "12",
		title: "Shape Up, Pumpkins, Famous First Words, Crazes, and Next In Sequence.",
		blurb: "A weekly selection mixing patterns, pop culture and logic.",
		weekISO: "2024-01-15",
		colorHex: getQuizColor(12),
		status: "available",
		tags: ["Patterns", "Pop Culture", "Logic", "Famous Quotes", "Sequences"]
	},
	{
		id: 11,
		slug: "11",
		title: "Opposite Day, Lights, Common Ground, Robots Etc, and First Ladies.",
		blurb: "Wordplay meets trivia.",
		weekISO: "2024-01-08",
		colorHex: getQuizColor(11),
		status: "available",
		tags: ["Wordplay", "History", "Technology", "Politics", "General"]
	},
	{
		id: 10,
		slug: "10",
		title: "Back to the Past, Name That Nation, Name the Other, Analog Games, and What Does It Stand For?",
		blurb: "History, geography and acronyms.",
		weekISO: "2024-01-01",
		colorHex: getQuizColor(10),
		status: "available",
		tags: ["History", "Geography", "Games", "Acronyms", "Trivia"]
	},
	{
		id: 9,
		slug: "9",
		title: "Holiday Trivia, Winter Sports, Year End Review, and Festive Fun.",
		blurb: "Seasonal mixed bag.",
		weekISO: "2023-12-25",
		colorHex: getQuizColor(9),
		status: "available",
		tags: ["Seasonal", "Sports", "Holidays", "Year Review", "Winter"]
	},
	{
		id: 8,
		slug: "8",
		title: "Movie Magic, Tech Trends, Sports Moments, and Pop Culture.",
		blurb: "Headlines and highlights.",
		weekISO: "2023-12-18",
		colorHex: getQuizColor(8),
		status: "available",
		tags: ["Movies", "Technology", "Sports", "Pop Culture", "Entertainment"]
	},
	{
		id: 7,
		slug: "7",
		title: "World Wonders, Historical Events, Science Facts, and Geography.",
		blurb: "Curiosities around the world.",
		weekISO: "2023-12-11",
		colorHex: getQuizColor(7),
		status: "available",
		tags: ["Science", "Geography", "History", "World Facts", "Nature"]
	},
	{
		id: 6,
		slug: "6",
		title: "Literature Classics, Music Legends, Art Movements, and Cultural Icons.",
		blurb: "Explore the arts and humanities.",
		weekISO: "2023-12-04",
		colorHex: getQuizColor(6),
		status: "available",
		tags: ["Literature", "Music", "Art", "Culture", "Humanities"]
	},
	{
		id: 5,
		slug: "5",
		title: "Space Exploration, Ocean Depths, Animal Kingdom, and Natural Phenomena.",
		blurb: "Discover the wonders of nature.",
		weekISO: "2023-11-27",
		colorHex: getQuizColor(5),
		status: "available",
		tags: ["Space", "Ocean", "Animals", "Nature", "Science"]
	},
];

export function LandingPageClient() {
	const { isVisitor, isFree, isPremium, userName, isLoading } = useUserAccess();
	const [mounted, setMounted] = useState(false);
	const [flippedCardIds, setFlippedCardIds] = useState<Set<string>>(new Set());
	const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

	useEffect(() => {
		setMounted(true);
	}, []);

	// Auto-flip cards in the preview to show the animation
	useEffect(() => {
		if (!mounted) return;

		let timeoutIds: NodeJS.Timeout[] = [];

		const startCycle = () => {
			// Clear any existing timeouts
			timeoutIds.forEach(id => clearTimeout(id));
			timeoutIds = [];

			// Flip first card after 2 seconds
			timeoutIds.push(setTimeout(() => {
				setFlippedCardIds(new Set(['preview-1']));
			}, 2000));

			// Flip second card after 4 seconds
			timeoutIds.push(setTimeout(() => {
				setFlippedCardIds(new Set(['preview-1', 'preview-3']));
			}, 4000));

			// Flip third card after 6 seconds
			timeoutIds.push(setTimeout(() => {
				setFlippedCardIds(new Set(['preview-1', 'preview-3', 'preview-5']));
			}, 6000));

			// Reset all flips after 8 seconds
			timeoutIds.push(setTimeout(() => {
				setFlippedCardIds(new Set());
			}, 8000));
		};

		// Start initial cycle
		startCycle();

		// Repeat the cycle every 10 seconds
		const interval = setInterval(() => {
			startCycle();
		}, 10000);

		return () => {
			timeoutIds.forEach(id => clearTimeout(id));
			clearInterval(interval);
		};
	}, [mounted]);

	// Redirect logged-in users to appropriate page
	useEffect(() => {
		if (!mounted) return;

		// Check localStorage as source of truth to avoid race conditions
		if (typeof window === 'undefined') return;

		// Check if we're coming from a sign out (check URL or session storage flag)
		const isSigningOut = sessionStorage.getItem('signingOut') === 'true';
		if (isSigningOut) {
			sessionStorage.removeItem('signingOut');
			return; // Don't redirect if user just signed out
		}

		const authToken = localStorage.getItem('authToken');
		const userId = localStorage.getItem('userId');
		const isActuallyLoggedIn = !!(authToken && userId);

		// If user is logged in, redirect based on role
		// Don't wait for isLoading - use localStorage as source of truth
		// Add a small delay to ensure page has rendered
		if (isActuallyLoggedIn) {
			const redirectTimer = setTimeout(() => {
				// Check if user is platform admin (stored in localStorage from sign-in)
				const platformRole = localStorage.getItem('platformRole');
				if (platformRole === 'PLATFORM_ADMIN') {
					window.location.href = '/admin';
				} else {
					window.location.href = '/quizzes';
				}
			}, 100);
			return () => clearTimeout(redirectTimer);
		}
	}, [mounted]);

	return (
		<>
			<div id="header-section">
				<SiteHeader fadeLogo={true} />
			</div>
			<main className="min-h-screen overflow-x-hidden">
				{/* Notch Component */}
				<NextQuizCountdown />

				{/* Hero Section */}
				<section className="min-h-screen flex flex-col items-center justify-center px-6 sm:px-8 md:px-4 pt-24 sm:pt-32 relative bg-gray-50 dark:bg-[#0F1419]">
					<div className="max-w-4xl mx-auto text-center mb-8 sm:mb-16 px-4 sm:px-6 md:px-0">
						<motion.h1
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
							className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 md:mb-10 pb-2 sm:pb-4 px-4 sm:px-6 md:px-8 lg:px-12 leading-[1.1] sm:leading-tight"
							id="headline"
						>
							A weekly quiz for<br />
							high school<br />
							<span className="text-blue-600 dark:text-blue-400 block min-h-[1.2em]">
								<RotatingText
									text={["students", "tutor groups", "homerooms"]}
									duration={3000}
									transition={{ duration: 0.5, ease: "easeInOut" }}
								/>
							</span>
						</motion.h1>

						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
							className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-[#DCDCDC] mb-8 sm:mb-12 max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 leading-relaxed"
							id="description"
						>
							{/* Desktop version */}
							<div className="hidden sm:block space-y-4">
								<p>
									A great quiz brings out shared laughs, inside jokes, and those easy moments that help you build stronger connections with your students.
								</p>
								<p>
									The School Quiz is built for exactly that.
								</p>
								<p>
									Each week it blends general knowledge with school-friendly fun — music, sport, movies, current affairs, pop culture, and whatever's actually trending with teenagers in Australia. No trick questions. No AI slop. Just a solid, reliable quiz landing every Monday morning.
								</p>
							</div>
							{/* Mobile version */}
							<div className="block sm:hidden space-y-3">
								<p>
									A great quiz brings out shared laughs, inside jokes, and those easy moments that help you build stronger connections with your students.
								</p>
								<p>
									The School Quiz is built for exactly that.
								</p>
								<p>
									Each week it blends general knowledge with school-friendly fun — music, sport, movies, current affairs, pop culture, and whatever's actually trending with teenagers in Australia. No trick questions. No AI slop. Just a solid, reliable quiz landing every Monday morning.
								</p>
							</div>
						</motion.div>

						<motion.div
							id="buttons"
							className="px-2 sm:px-0"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
						>
							<HeroCTA />
						</motion.div>
					</div>

					{/* A new quiz every week heading */}
					<motion.div
						className="w-full px-4 mt-16 mb-16"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
					>
						<div className="max-w-6xl mx-auto text-center">
							<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
								A new quiz every week
							</h2>
							<p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
								Balanced, teacher-written, and tailor made for Australian high school students.
							</p>
						</div>
					</motion.div>

					{/* Quiz Card Stack - Back Catalogue Preview */}
					<motion.div
						className="w-full mb-16"
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
					>
						<QuizCardStack quizzes={sampleQuizzes} />
					</motion.div>

					{/* Value Proposition Carousel */}
					<ReasonsCarousel />

					{/* Interactive Quiz Preview heading */}
					<motion.div
						className="w-full px-4 mb-16"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
					>
						<div className="max-w-4xl mx-auto text-center">
							<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
								Run the quiz your way
							</h2>
							<p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
								Use Presenter View for the screen or projector, Quick View for an at-a-glance overview, and Printable when you need a paper copy. Three simple, flexible ways to run the quiz your way.
							</p>
						</div>
					</motion.div>

					{/* Safari Preview Peeking from Bottom */}
					<motion.div
						className="w-full px-8 sm:px-12 md:px-16 lg:px-20 xl:px-24 mb-16"
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
					>
						<div className="max-w-5xl mx-auto">
							<QuizSafariPreview />
						</div>
					</motion.div>

					{/* Achievements Preview heading */}
					<motion.div
						className="w-full px-4 mt-8 mb-16"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
					>
						<div className="max-w-6xl mx-auto text-center">
							<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
								Earn achievements as you play
							</h2>
							<p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
								Unlock a growing library of achievement cards, including progress milestones, perfect scores, special editions, and fun one-offs.
							</p>
						</div>
					</motion.div>

					{/* Achievements Preview Cards */}
					<motion.div
						className="w-full px-4 mb-16"
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
					>
						<div className="w-full mx-auto flex flex-wrap justify-center items-center gap-2 sm:gap-3 md:gap-4">
							{[
								{
									id: "preview-1",
									slug: "ace",
									name: "HAIL, CAESAR!",
									shortDescription: "Get 5/5 in a History round",
									category: "performance",
									rarity: "common",
									isPremiumOnly: false,
									series: "Roman History",
									cardVariant: "foil" as const,
									status: "unlocked" as const,
									unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
								},
								{
									id: "preview-2",
									slug: "golden-champion",
									name: "Golden Champion",
									shortDescription: "Achieve legendary status",
									category: "performance",
									rarity: "legendary",
									isPremiumOnly: false,
									cardVariant: "foilGold" as const,
									status: "locked_free" as const,
								},
								{
									id: "preview-3",
									slug: "silver-star",
									name: "Silver Star",
									shortDescription: "Consistent excellence",
									category: "engagement",
									rarity: "rare",
									isPremiumOnly: false,
									cardVariant: "foilSilver" as const,
									status: "unlocked" as const,
									unlockedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
								},
								{
									id: "preview-4",
									slug: "perfect-quiz",
									name: "Perfect Quiz",
									shortDescription: "Get all questions correct",
									category: "performance",
									rarity: "epic",
									isPremiumOnly: false,
									cardVariant: "fullArt" as const,
									status: "locked_free" as const,
								},
								{
									id: "preview-5",
									slug: "addicted",
									name: "Addicted",
									shortDescription: "Play 3 quizzes in a single day",
									category: "engagement",
									rarity: "uncommon",
									isPremiumOnly: false,
									cardVariant: "shiny" as const,
									status: "unlocked" as const,
									unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
								},
								{
									id: "preview-6",
									slug: "first-blood",
									name: "First Blood",
									shortDescription: "Answer the first question correctly",
									category: "performance",
									rarity: "common",
									isPremiumOnly: false,
									cardVariant: "standard" as const,
									status: "unlocked" as const,
									unlockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
								},
								{
									id: "preview-7",
									slug: "streak-master",
									name: "Streak Master",
									shortDescription: "Play 10 quizzes in a row",
									category: "engagement",
									rarity: "epic",
									isPremiumOnly: false,
									cardVariant: "standard" as const,
									status: "locked_free" as const,
								},
							].map((achievement, index) => {
								const isFlipped = achievement.status === 'unlocked' && flippedCardIds.has(achievement.id);
								const isUnlocked = achievement.status === 'unlocked';
								// Subtle tilt: -1.5, -1, -0.5, 0, 0.5, 1, 1.5 degrees
								const rotation = (index % 7 - 3) * 0.5;

								return (
									<motion.div
										key={achievement.id}
										initial={{ opacity: 0, y: 20, scale: 0.9 }}
										animate={{
											opacity: 1,
											y: 0,
											scale: 1,
											rotate: isFlipped ? 0 : rotation,
										}}
										transition={{
											duration: 0.4,
											delay: 0.6 + (index * 0.05),
											ease: [0.22, 1, 0.36, 1]
										}}
										className="relative w-[140px] sm:w-[150px] md:w-[160px] flex-shrink-0"
										style={{
											zIndex: isFlipped ? 1000 : 5 - index,
										}}
										whileHover={{
											zIndex: 1000,
											scale: 1.05,
											rotate: 0,
											y: -4,
											transition: { duration: 0.2 }
										}}
									>
										<AchievementCard
											achievement={achievement}
											status={achievement.status}
											unlockedAt={achievement.status === 'unlocked' ? achievement.unlockedAt : undefined}
											tier={(isVisitor ? "visitor" : isFree ? "free" : "premium") as UserTier}
											isFlipped={isFlipped}
											onFlipChange={(flipped) => {
												if (achievement.status === 'unlocked') {
													if (flipped) {
														setFlippedCardIds(prev => new Set([...prev, achievement.id]));
													} else {
														setFlippedCardIds(prev => {
															const next = new Set(prev);
															next.delete(achievement.id);
															return next;
														});
													}
												}
											}}
										/>
									</motion.div>
								);
							})}
						</div>

						{/* Explore Achievements Button */}
						<div className="text-center mt-8 sm:mt-10 md:mt-12">
							<p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
								Fun, humorous and unique achievements added all the time.
							</p>
							<Link
								href="/achievements"
								className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
							>
								Explore the achievements
							</Link>
						</div>
					</motion.div>
				</section>

				{/* Premium Features - Mobbin Style */}
				<section className="w-full py-16 sm:py-20 md:py-24 px-6 sm:px-8 md:px-12 lg:px-16">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
						className="max-w-7xl mx-auto"
					>
						<div className="text-center mb-12">
							<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
								Do more with Premium
							</h2>
							<p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
								Subscribing to Premium makes you feel good about supporting a solo teacher–developer and helping keep the lights on. It also unlocks extra tools that turn a simple Monday quiz into something your students look forward to all term.
							</p>
						</div>

						{/* Premium Feature Cards - Mobbin Style (reordered by desirability, all same size) */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
							{/* 1. Replay Old Quizzes - Most desirable: immediate value */}
							<motion.div
								initial={{ opacity: 0, y: 20, rotate: -0.3 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								whileHover={{ rotate: 0.4, scale: 1.02, y: -4 }}
								transition={{
									duration: 0.5,
									delay: 0.1,
									type: "spring",
									stiffness: 300,
									damping: 20
								}}
								className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden group hover:shadow-lg transition-shadow"
								style={{ transformOrigin: 'center' }}
							>
								{/* UI Preview Area */}
								<div className="bg-gray-50 dark:bg-gray-800 px-4 py-6 border-b border-gray-200 dark:border-gray-700">
									{/* Quiz cards mockup - styled like actual quiz cards with rotation */}
									<div className="grid grid-cols-3 gap-2">
										{[...Array(6)].map((_, i) => {
											// Use different colors for variety
											const colors = [
												'rgb(59, 130, 246)', // blue
												'rgb(168, 85, 247)', // purple
												'rgb(236, 72, 153)', // pink
												'rgb(34, 197, 94)', // green
												'rgb(251, 146, 60)', // orange
												'rgb(99, 102, 241)', // indigo
											];
											const color = colors[i % colors.length];
											const textColor = i % 3 === 0 ? 'white' : 'gray-900';
											// Vary rotation angles for each card
											const rotations = [-1.5, 1.2, -1.8, 1.5, -1.2, 1.8];
											const rotation = rotations[i % rotations.length];
											return (
												<div
													key={i}
													className="aspect-[5/8] rounded-2xl p-2.5 flex flex-col justify-between shadow-sm"
													style={{
														backgroundColor: color,
														transform: `rotate(${rotation}deg)`,
														transformOrigin: 'center'
													}}
												>
													<div className="flex items-center gap-1">
														<span className={`text-xs font-bold ${textColor === 'white' ? 'text-white' : 'text-gray-900'} bg-black/10 px-2 py-0.5 rounded-full`}>
															#{i + 1}
														</span>
													</div>
													<div className={`text-sm font-extrabold ${textColor === 'white' ? 'text-white' : 'text-gray-900'} leading-tight line-clamp-2`}>
														Quiz {i + 1}
													</div>
												</div>
											);
										})}
									</div>
								</div>
								{/* Content */}
								<div className="p-5">
									<h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
										Replay Old Quizzes
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
										Access the full back catalogue and replay any quiz from the archives.
									</p>
								</div>
							</motion.div>

							{/* 2. Private Leaderboards - Social/competitive feature */}
							<motion.div
								initial={{ opacity: 0, y: 20, rotate: 0.4 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								whileHover={{ rotate: -0.4, scale: 1.02, y: -4 }}
								transition={{
									duration: 0.5,
									delay: 0.2,
									type: "spring",
									stiffness: 300,
									damping: 20
								}}
								className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden group hover:shadow-lg transition-shadow"
								style={{ transformOrigin: 'center' }}
							>
								{/* UI Preview Area */}
								<div className="bg-gray-50 dark:bg-gray-800 px-4 py-6 border-b border-gray-200 dark:border-gray-700">
									{/* Form mockup with typing animation */}
									<div className="space-y-3">
										<div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
											<div className="space-y-2.5">
												<div>
													<div className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Your question</div>
													<div className="min-h-[60px] bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-3 text-sm text-gray-700 dark:text-gray-300">
														<TypingAnimation
															text="What Australian city is known as the 'City of Churches'?"
															speed={40}
															delay={500}
															className="text-sm"
														/>
													</div>
												</div>
												<div className="grid grid-cols-2 gap-2">
													<div>
														<div className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Teacher name</div>
														<div className="h-7 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 px-2 text-xs text-gray-600 dark:text-gray-400 flex items-center">Mr F</div>
													</div>
													<div>
														<div className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">School</div>
														<div className="h-7 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 px-2 text-xs text-gray-600 dark:text-gray-400 flex items-center truncate">Stanton Road HS</div>
													</div>
												</div>
												<div className="flex items-center gap-2">
													<input type="checkbox" id="shoutout" className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" defaultChecked />
													<label htmlFor="shoutout" className="text-xs font-medium text-gray-700 dark:text-gray-300">Include shoutout in quiz</label>
												</div>
												<button className="w-full h-8 bg-purple-600 text-white rounded-full font-medium text-sm hover:bg-purple-700 transition-colors">Submit question</button>
											</div>
										</div>
									</div>
								</div>
								{/* Content below */}
								<div className="p-5">
									<h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
										Be featured in the quiz
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
										Submit to The People's Round and get a shoutout when your question appears. You and your school get a shoutout.
									</p>
								</div>
							</motion.div>

							{/* 3. Stats & Streaks - Gamification */}
							<motion.div
								initial={{ opacity: 0, y: 20, rotate: -0.4 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								whileHover={{ rotate: 0.5, scale: 1.02, y: -4 }}
								transition={{
									duration: 0.5,
									delay: 0.3,
									type: "spring",
									stiffness: 300,
									damping: 20
								}}
								className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden group hover:shadow-lg transition-shadow"
								style={{ transformOrigin: 'center' }}
							>
								{/* UI Preview Area */}
								<div className="bg-gray-50 dark:bg-gray-800 px-4 py-6 border-b border-gray-200 dark:border-gray-700">
									{/* Leaderboard mockup with multiple leagues */}
									<div className="space-y-3">
										{/* League 1 */}
										<div className="space-y-1.5">
											<div className="flex items-center gap-1.5 mb-1">
												<Trophy className="w-3 h-3 text-orange-500 dark:text-orange-400" />
												<div className="text-xs font-semibold text-gray-900 dark:text-white">School Houses</div>
											</div>
											<div className="space-y-1">
												<div className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
													<div className="flex items-center gap-2 flex-1">
														<div className="w-5 h-5 rounded-full bg-red-500 flex-shrink-0"></div>
														<div className="text-xs font-medium text-gray-900 dark:text-white">Red House</div>
													</div>
													<div className="text-xs font-semibold text-gray-900 dark:text-white">245</div>
												</div>
												<div className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
													<div className="flex items-center gap-2 flex-1">
														<div className="w-5 h-5 rounded-full bg-blue-500 flex-shrink-0"></div>
														<div className="text-xs font-medium text-gray-900 dark:text-white">Blue House</div>
													</div>
													<div className="text-xs font-semibold text-gray-900 dark:text-white">198</div>
												</div>
											</div>
										</div>
										{/* League 2 */}
										<div className="space-y-1.5">
											<div className="flex items-center gap-1.5 mb-1">
												<Users className="w-3 h-3 text-blue-500 dark:text-blue-400" />
												<div className="text-xs font-semibold text-gray-900 dark:text-white">Year 9 Teachers</div>
											</div>
											<div className="space-y-1">
												<div className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
													<div className="flex items-center gap-2 flex-1">
														<div className="w-5 h-5 rounded-full bg-green-500 flex-shrink-0"></div>
														<div className="text-xs font-medium text-gray-900 dark:text-white">Mr P</div>
													</div>
													<div className="text-xs font-semibold text-gray-900 dark:text-white">156</div>
												</div>
												<div className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
													<div className="flex items-center gap-2 flex-1">
														<div className="w-5 h-5 rounded-full bg-purple-500 flex-shrink-0"></div>
														<div className="text-xs font-medium text-gray-900 dark:text-white">Ms K</div>
													</div>
													<div className="text-xs font-semibold text-gray-900 dark:text-white">142</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								{/* Content */}
								<div className="p-5">
									<h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
										Private Leaderboards
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
										Create exclusive leaderboards for your class or school. Compete with colleagues and friends in private competitions.
									</p>
								</div>
							</motion.div>

							{/* 3. Stats & Streaks - Gamification */}
							<motion.div
								initial={{ opacity: 0, y: 20, rotate: -0.4 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								whileHover={{ rotate: 0.5, scale: 1.02, y: -4 }}
								transition={{
									duration: 0.5,
									delay: 0.3,
									type: "spring",
									stiffness: 300,
									damping: 20
								}}
								className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden group hover:shadow-lg transition-shadow"
								style={{ transformOrigin: 'center' }}
							>
								{/* UI Preview Area */}
								<div className="bg-gray-50 dark:bg-gray-800 px-4 py-6 border-b border-gray-200 dark:border-gray-700">
									{/* Stats mockup */}
									<div className="space-y-3">
										<div className="grid grid-cols-2 gap-2.5">
											<motion.div
												className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
												initial={{ opacity: 0, scale: 0.9 }}
												animate={{ opacity: 1, scale: 1 }}
												transition={{ duration: 0.3, delay: 0.1 }}
											>
												<motion.div
													className="text-xl font-bold text-gray-900 dark:text-white mb-0.5"
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													transition={{ duration: 0.5, delay: 0.2 }}
												>
													42
												</motion.div>
												<div className="text-xs text-gray-500 dark:text-gray-400">Perfect scores</div>
											</motion.div>
											<motion.div
												className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
												initial={{ opacity: 0, scale: 0.9 }}
												animate={{ opacity: 1, scale: 1 }}
												transition={{ duration: 0.3, delay: 0.2 }}
											>
												<motion.div
													className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-0.5"
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													transition={{ duration: 0.5, delay: 0.3 }}
												>
													12
												</motion.div>
												<div className="text-xs text-gray-500 dark:text-gray-400">Week streak</div>
											</motion.div>
										</div>
										{/* Bar chart preview */}
										<div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700 h-16 flex items-end justify-center gap-1 relative overflow-hidden">
											{[3, 5, 4, 6, 5, 7, 6, 8].map((baseHeight, i) => {
												const variation = 0.3;
												const minHeight = baseHeight - variation;
												const maxHeight = baseHeight + variation;
												return (
													<motion.div
														key={i}
														className="flex-1 bg-purple-500 rounded-t max-w-[8px]"
														initial={{ height: 0, opacity: 0 }}
														animate={{
															height: [
																`${Math.max(15, (minHeight / 8) * 100)}%`,
																`${Math.max(15, (maxHeight / 8) * 100)}%`,
																`${Math.max(15, (baseHeight / 8) * 100)}%`,
																`${Math.max(15, (minHeight / 8) * 100)}%`
															],
															opacity: 1
														}}
														transition={{
															duration: 6,
															delay: 0.4 + (i * 0.1),
															repeat: Infinity,
															repeatType: "loop",
															ease: "easeInOut"
														}}
													/>
												);
											})}
										</div>
									</div>
								</div>
								{/* Content */}
								<div className="p-5">
									<h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
										Stats & Streaks
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
										Track your performance with detailed analytics and build impressive streaks.
									</p>
								</div>
							</motion.div>

							{/* 4. One Account, Multiple Classes - Practical for teachers */}
							<motion.div
								initial={{ opacity: 0, y: 20, rotate: -0.2 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								whileHover={{ rotate: 0.3, scale: 1.02, y: -4 }}
								transition={{
									duration: 0.5,
									delay: 0.4,
									type: "spring",
									stiffness: 300,
									damping: 20
								}}
								className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden group hover:shadow-lg transition-shadow"
								style={{ transformOrigin: 'center' }}
							>
								{/* UI Preview Area */}
								<div className="bg-gray-50 dark:bg-gray-800 px-4 py-6 border-b border-gray-200 dark:border-gray-700">
									{/* Team selector and stats comparison mockup */}
									<div className="space-y-3">
										{/* Team selector dropdown */}
										<div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
											<div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Playing as:</div>
											<div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
												<div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
												<span className="text-xs font-medium text-gray-900 dark:text-white flex-1">Year 9A</span>
												<ChevronDown className="w-3 h-3 text-gray-400" />
											</div>
										</div>

										{/* Stats comparison - showing different teams */}
										<div className="space-y-2">
											{/* Team 1 */}
											<div className="bg-white dark:bg-gray-900 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700">
												<div className="flex items-center justify-between mb-2">
													<div className="flex items-center gap-2">
														<div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
														<span className="text-xs font-medium text-gray-900 dark:text-white">Year 9A</span>
													</div>
													<span className="text-xs font-semibold text-blue-600 dark:text-blue-400">85%</span>
												</div>
												<div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
													<motion.div
														className="h-full bg-blue-500 rounded-full"
														initial={{ width: 0 }}
														animate={{ width: '85%' }}
														transition={{ duration: 0.8, delay: 0.2 }}
													/>
												</div>
											</div>

											{/* Team 2 */}
											<div className="bg-white dark:bg-gray-900 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700">
												<div className="flex items-center justify-between mb-2">
													<div className="flex items-center gap-2">
														<div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
														<span className="text-xs font-medium text-gray-900 dark:text-white">Year 9B</span>
													</div>
													<span className="text-xs font-semibold text-green-600 dark:text-green-400">78%</span>
												</div>
												<div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
													<motion.div
														className="h-full bg-green-500 rounded-full"
														initial={{ width: 0 }}
														animate={{ width: '78%' }}
														transition={{ duration: 0.8, delay: 0.4 }}
													/>
												</div>
											</div>
										</div>
									</div>
								</div>
								{/* Content */}
								<div className="p-5">
									<h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
										One Account, Multiple Classes
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
										Replay quizzes with different classes and track stats separately. Compare performance across all your classes.
									</p>
								</div>
							</motion.div>

							{/* 5. Printable PDFs - Practical utility */}
							<motion.div
								initial={{ opacity: 0, y: 20, rotate: 0.3 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								whileHover={{ rotate: -0.5, scale: 1.02, y: -4 }}
								transition={{
									duration: 0.5,
									delay: 0.5,
									type: "spring",
									stiffness: 300,
									damping: 20
								}}
								className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden group hover:shadow-lg transition-shadow"
								style={{ transformOrigin: 'center' }}
							>
								{/* UI Preview Area */}
								<div className="bg-gray-50 dark:bg-gray-800 px-4 py-6 border-b border-gray-200 dark:border-gray-700">
									{/* PDF mockup - quiz layout */}
									<div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden text-left">
										{/* PDF header */}
										<div className="bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
											<div className="flex items-center gap-2">
												<FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
												<div className="text-xs font-semibold text-gray-900 dark:text-white">Quiz #12</div>
											</div>
											<Download className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
										</div>
										{/* PDF content - quiz preview */}
										<div className="p-3 space-y-3 text-left">
											{/* Title */}
											<div>
												<div className="h-3 bg-gray-800/80 dark:bg-gray-200/80 rounded w-3/4 mb-1"></div>
												<div className="h-2 bg-gray-400/60 dark:bg-gray-500/60 rounded w-1/4"></div>
											</div>
											{/* Round 1 */}
											<div className="space-y-1.5 pt-2 border-t border-gray-200 dark:border-gray-700">
												<div className="flex items-center gap-2">
													<div className="h-2.5 w-16 bg-teal-500/80 rounded"></div>
													<div className="h-1.5 w-20 bg-gray-300/70 dark:bg-gray-600/70 rounded"></div>
												</div>
												<div className="space-y-1 pl-2 border-l-2 border-teal-500/80">
													<div className="h-1.5 bg-gray-400/70 dark:bg-gray-500/70 rounded w-full"></div>
													<div className="h-1 bg-gray-500/60 dark:bg-gray-400/60 rounded w-3/4 ml-3"></div>
													<div className="h-1.5 bg-gray-400/70 dark:bg-gray-500/70 rounded w-full"></div>
													<div className="h-1 bg-gray-500/60 dark:bg-gray-400/60 rounded w-2/3 ml-3"></div>
												</div>
											</div>
											{/* Round 2 */}
											<div className="space-y-1.5 pt-2 border-t border-gray-200 dark:border-gray-700">
												<div className="flex items-center gap-2">
													<div className="h-2.5 w-16 bg-orange-500/80 rounded"></div>
													<div className="h-1.5 w-24 bg-gray-300/70 dark:bg-gray-600/70 rounded"></div>
												</div>
												<div className="space-y-1 pl-2 border-l-2 border-orange-500/80">
													<div className="h-1.5 bg-gray-400/70 dark:bg-gray-500/70 rounded w-full"></div>
													<div className="h-1 bg-gray-500/60 dark:bg-gray-400/60 rounded w-4/5 ml-3"></div>
												</div>
											</div>
										</div>
									</div>
								</div>
								{/* Content */}
								<div className="p-5">
									<h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
										Printable PDFs
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
										Download quizzes as clean PDFs for offline use or paper copies.
									</p>
								</div>
							</motion.div>

							{/* 6. Special Editions - Exclusive content */}
							<motion.div
								initial={{ opacity: 0, y: 20, rotate: 0.5 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								whileHover={{ rotate: -0.4, scale: 1.02, y: -4 }}
								transition={{
									duration: 0.5,
									delay: 0.6,
									type: "spring",
									stiffness: 300,
									damping: 20
								}}
								className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden group hover:shadow-lg transition-shadow"
								style={{ transformOrigin: 'center' }}
							>
								{/* UI Preview Area */}
								<div className="relative bg-gradient-to-br from-red-50 via-green-50 to-red-50 dark:from-red-950/20 dark:via-green-950/20 dark:to-red-950/20 px-4 py-6 border-b border-gray-200 dark:border-gray-700 overflow-hidden">
									{/* Snow overlay */}
									<SnowOverlay />

									{/* Christmas-themed quiz card */}
									<div className="relative z-20 flex items-center justify-center">
										<div
											className="aspect-[5/8] rounded-3xl shadow-lg flex flex-col relative overflow-hidden p-4 sm:p-5"
											style={{
												backgroundColor: '#dc2626', // Christmas red
												maxWidth: '200px',
												width: '100%'
											}}
										>
											{/* Snowflakes on card */}
											<div className="absolute inset-0 pointer-events-none">
												{Array.from({ length: 6 }).map((_, i) => (
													<div
														key={i}
														className="absolute text-white/30"
														style={{
															left: `${20 + i * 15}%`,
															top: `${15 + (i % 3) * 30}%`,
															fontSize: '12px',
														}}
													>
														❄
													</div>
												))}
											</div>

											{/* Card content */}
											<div className="relative z-10 flex flex-col h-full justify-between">
												<div className="flex items-center gap-2">
													<span className="text-xs font-bold text-white bg-white/20 px-2 py-1 rounded-full">
														#Special
													</span>
													<Sparkles className="w-3.5 h-3.5 text-white/90" />
												</div>

												<div className="flex-1 flex flex-col justify-center items-center gap-2">
													<div className="text-4xl mb-2">🎄</div>
													<div className="text-sm font-extrabold text-white text-center leading-tight">
														Christmas 2025
													</div>
													<div className="text-xs text-white/90 mt-1 text-center">
														Holiday Special Edition
													</div>
												</div>

												<div className="text-xs font-bold text-white/80 text-center">
													Dec 2025
												</div>
											</div>
										</div>
									</div>
								</div>
								{/* Content */}
								<div className="p-5">
									<h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
										Special Editions
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
										Access exclusive holiday and special edition quizzes throughout the year.
									</p>
								</div>
							</motion.div>

							{/* 7. Be featured in the quiz - Community participation */}
							<motion.div
								initial={{ opacity: 0, y: 20, rotate: -0.5 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								whileHover={{ rotate: 0.5, scale: 1.02, y: -4 }}
								transition={{
									duration: 0.5,
									delay: 0.7,
									type: "spring",
									stiffness: 300,
									damping: 20
								}}
								className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden group hover:shadow-lg transition-shadow"
								style={{ transformOrigin: 'center' }}
							>
								{/* UI Preview Area */}
								<div className="bg-gray-50 dark:bg-gray-800 px-4 py-6 border-b border-gray-200 dark:border-gray-700">
									{/* Form mockup with typing animation */}
									<div className="space-y-3">
										<div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
											<div className="space-y-2.5">
												<div>
													<div className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Your question</div>
													<div className="min-h-[60px] bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-3 text-sm text-gray-700 dark:text-gray-300">
														<TypingAnimation
															text="What Australian city is known as the 'City of Churches'?"
															speed={40}
															delay={500}
															className="text-sm"
														/>
													</div>
												</div>
												<div className="grid grid-cols-2 gap-2">
													<div>
														<div className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Teacher name</div>
														<div className="h-7 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 px-2 text-xs text-gray-600 dark:text-gray-400 flex items-center">Mr F</div>
													</div>
													<div>
														<div className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">School</div>
														<div className="h-7 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 px-2 text-xs text-gray-600 dark:text-gray-400 flex items-center truncate">Stanton Road HS</div>
													</div>
												</div>
												<div className="flex items-center gap-2">
													<input type="checkbox" id="shoutout" className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" defaultChecked />
													<label htmlFor="shoutout" className="text-xs font-medium text-gray-700 dark:text-gray-300">Include shoutout in quiz</label>
												</div>
												<button className="w-full h-8 bg-purple-600 text-white rounded-full font-medium text-sm hover:bg-purple-700 transition-colors">Submit question</button>
											</div>
										</div>
									</div>
								</div>
								{/* Content below */}
								<div className="p-5">
									<h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
										Be featured in the quiz
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
										Submit to The People's Round and get a shoutout when your question appears. You and your school get a shoutout.
									</p>
								</div>
							</motion.div>

							{/* 8. Create Custom Quizzes - Advanced feature */}
							<motion.div
								initial={{ opacity: 0, y: 20, rotate: 0.2 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								whileHover={{ rotate: -0.3, scale: 1.02, y: -4 }}
								transition={{
									duration: 0.5,
									delay: 0.8,
									type: "spring",
									stiffness: 300,
									damping: 20
								}}
								className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden group hover:shadow-lg transition-shadow"
								style={{ transformOrigin: 'center' }}
							>
								{/* UI Preview Area */}
								<div className="bg-gray-50 dark:bg-gray-800 px-4 py-6 border-b border-gray-200 dark:border-gray-700">
									{/* Simplified quiz builder preview */}
									<div className="space-y-3">
										<div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
											<div className="flex items-center gap-2 mb-3">
												<FileEdit className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
												<div className="text-xs font-semibold text-gray-900 dark:text-white">Create Your Own Quiz</div>
											</div>
											<div className="space-y-2">
												<div className="h-6 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 px-2 text-xs text-gray-600 dark:text-gray-400 flex items-center">
													Year 9 History Review
												</div>
												<div className="space-y-1.5 pl-2 border-l-2 border-indigo-500">
													<div className="text-xs text-gray-600 dark:text-gray-400">• Round 1: World War I (5 questions)</div>
													<div className="text-xs text-gray-600 dark:text-gray-400">• Round 2: Australian Federation</div>
												</div>
												<button className="w-full h-6 bg-indigo-600 text-white rounded-full font-medium text-xs hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1">
													<FileEdit className="w-3 h-3" />
													Add Round
												</button>
											</div>
										</div>
										{/* Example custom quiz cards */}
										<div className="grid grid-cols-3 gap-2">
											{[
												{ title: "History", color: '#6366f1' },
												{ title: "Science", color: '#10b981' },
												{ title: "Math", color: '#f59e0b' },
											].map((quiz, i) => (
												<div
													key={i}
													className="aspect-[5/8] rounded-xl p-2 flex flex-col justify-between shadow-sm"
													style={{
														backgroundColor: quiz.color,
														transform: `rotate(${i % 2 === 0 ? -1.5 : 1.2}deg)`,
													}}
												>
													<span className="text-[10px] font-bold text-white bg-white/20 px-1.5 py-0.5 rounded-full">Custom</span>
													<div className="text-xs font-extrabold text-white leading-tight line-clamp-2">{quiz.title}</div>
												</div>
											))}
										</div>
									</div>
								</div>
								{/* Content */}
								<div className="p-5">
									<h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
										Create Custom Quizzes
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
										Build your own quizzes tailored to your curriculum. Share them across your organisation.
									</p>
								</div>
							</motion.div>
						</div>


						{/* CTA Button */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5, delay: 0.7 }}
							className="text-center mt-12"
						>
							<a
								href="/premium"
								className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB] transition-colors"
							>
								<Crown className="w-4 h-4" />
								Upgrade to Premium
							</a>
						</motion.div>
					</motion.div>
				</section>

				{/* Testimonials Section - Mobbin Style */}
				<section className="w-full py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 overflow-x-hidden">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
						className="max-w-7xl mx-auto"
					>
						<div className="text-center mb-12">
							<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
								What teachers are saying
							</h2>
							<p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
								Teachers across Australia use The School Quiz to spark conversation, build routines, and make pastoral time a bit easier.
							</p>
						</div>

						{/* Testimonials Infinite Scroll Carousel */}
						<div className="relative overflow-x-hidden pb-6 mb-12 group/testimonials">
							{/* Fade gradients at edges */}
							<div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-50 dark:from-[#0F1419] to-transparent z-20 pointer-events-none"></div>
							<div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50 dark:from-[#0F1419] to-transparent z-20 pointer-events-none"></div>

							<div className="flex gap-6 animate-infinite-scroll group-hover/testimonials:pause-animation px-8 sm:px-12 md:px-16" style={{ width: 'max-content' }}>
								{/* First set of testimonials */}
								{[
									{ name: "Sarah L.", role: "Year 10 Adviser — NSW", quote: "Private leaderboards have created the healthiest bit of competition I've seen in pastoral time. The boys race to beat last week's score and actually cheer each other on.", rotate: -0.3 },
									{ name: "Tom B.", role: "Homeroom Teacher — VIC", quote: "It's refreshingly social. Kids aren't buried in laptops — they're talking, guessing, arguing, laughing. It feels like old-school trivia but sharper.", rotate: 0.4 },
									{ name: "Michelle R.", role: "Assistant Head of Wellbeing — QLD", quote: "The difficulty sits in a sweet spot. Easy wins early, a few curveballs later, and enough variety that everyone gets to feel clever at least once.", rotate: -0.4 },
									{ name: "Mark P.", role: "Digital Technologies Teacher — SA", quote: "Honestly, it's just simple. One quiz a week, well-written questions, no setup dramas, and the class actually looks forward to Monday mornings.", rotate: 0.3 },
								].map((testimonial, index) => (
									<motion.div
										key={`testimonial-1-${index}`}
										initial={{ opacity: 0, y: 20, rotate: testimonial.rotate }}
										whileInView={{ opacity: 1, y: 0 }}
										viewport={{ once: true }}
										whileHover={{ rotate: -testimonial.rotate, scale: 1.02, y: -4 }}
										transition={{
											duration: 0.5,
											delay: index * 0.1,
											type: "spring",
											stiffness: 300,
											damping: 20
										}}
										className="bg-white dark:bg-gray-800 rounded-2xl border-[1px] border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow flex-shrink-0"
										style={{
											transformOrigin: 'center',
											width: '320px',
											minWidth: '320px',
											borderWidth: '1px',
											borderStyle: 'solid'
										}}
									>
										<div className="mb-4">
											<div className="font-bold text-gray-900 dark:text-white mb-1">{testimonial.name}</div>
											<div className="text-xs text-gray-500 dark:text-gray-400">{testimonial.role}</div>
										</div>
										<p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
											{testimonial.quote}
										</p>
									</motion.div>
								))}
								{/* Duplicate set for infinite scroll */}
								{[
									{ name: "Sarah L.", role: "Year 10 Adviser — NSW", quote: "Private leaderboards have created the healthiest bit of competition I've seen in pastoral time. The boys race to beat last week's score and actually cheer each other on.", rotate: -0.3 },
									{ name: "Tom B.", role: "Homeroom Teacher — VIC", quote: "It's refreshingly social. Kids aren't buried in laptops — they're talking, guessing, arguing, laughing. It feels like old-school trivia but sharper.", rotate: 0.4 },
									{ name: "Michelle R.", role: "Assistant Head of Wellbeing — QLD", quote: "The difficulty sits in a sweet spot. Easy wins early, a few curveballs later, and enough variety that everyone gets to feel clever at least once.", rotate: -0.4 },
									{ name: "Mark P.", role: "Digital Technologies Teacher — SA", quote: "Honestly, it's just simple. One quiz a week, well-written questions, no setup dramas, and the class actually looks forward to Monday mornings.", rotate: 0.3 },
								].map((testimonial, index) => (
									<motion.div
										key={`testimonial-2-${index}`}
										initial={{ opacity: 0, y: 20, rotate: testimonial.rotate }}
										whileInView={{ opacity: 1, y: 0 }}
										viewport={{ once: true }}
										whileHover={{ rotate: -testimonial.rotate, scale: 1.02, y: -4 }}
										transition={{
											duration: 0.5,
											delay: index * 0.1,
											type: "spring",
											stiffness: 300,
											damping: 20
										}}
										className="bg-white dark:bg-gray-800 rounded-2xl border-[1px] border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow flex-shrink-0"
										style={{
											transformOrigin: 'center',
											width: '320px',
											minWidth: '320px',
											borderWidth: '1px',
											borderStyle: 'solid'
										}}
									>
										<div className="mb-4">
											<div className="font-bold text-gray-900 dark:text-white mb-1">{testimonial.name}</div>
											<div className="text-xs text-gray-500 dark:text-gray-400">{testimonial.role}</div>
										</div>
										<p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
											{testimonial.quote}
										</p>
									</motion.div>
								))}
							</div>
						</div>

						{/* CTA */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5, delay: 0.6 }}
							className="text-center"
						>
							<a
								href="/contact"
								className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB] transition-colors mb-2"
							>
								Submit a comment →
							</a>
							<p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
								Share your experience — you might even unlock an achievement 😉
							</p>
						</motion.div>
					</motion.div>
				</section>

				{/* Pricing Section */}
				<section className="w-full py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 bg-gray-50 dark:bg-[#0F1419]">
					<div className="max-w-7xl mx-auto">
						<div className="text-center mb-12">
							<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
								Simple, sensible pricing
							</h2>
							<p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
								Start free, upgrade when you're ready. Cancel anytime.
							</p>

							{/* Billing Period Toggle */}
							<div className="inline-flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
								<button
									onClick={() => setBillingPeriod('monthly')}
									className={cn(
										"px-4 py-2 rounded-full text-sm font-medium transition-all",
										billingPeriod === 'monthly'
											? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
											: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
									)}
								>
									Monthly
								</button>
								<button
									onClick={() => setBillingPeriod('yearly')}
									className={cn(
										"px-4 py-2 rounded-full text-sm font-medium transition-all",
										billingPeriod === 'yearly'
											? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
											: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
									)}
								>
									Yearly
								</button>
							</div>
							{billingPeriod === 'yearly' && (
								<p className="text-sm text-blue-600 dark:text-blue-400 mt-3 font-medium">
									Save 25% on yearly subscription
								</p>
							)}
						</div>

						{/* Pricing Cards */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
							{/* Premium Plan */}
							<div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-blue-500 dark:border-blue-600 p-6 sm:p-8 flex flex-col relative hover:shadow-xl transition-all">
								<div className="absolute top-4 right-4">
									<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
										Popular
									</span>
								</div>

								<div className="mb-6">
									<h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1.5">Premium</h3>
									<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-5">Individual teachers running weekly quizzes</p>
									<div className="mb-1">
										{billingPeriod === 'monthly' ? (
											<>
												<span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">$6</span>
												<span className="text-base sm:text-lg text-gray-600 dark:text-gray-400"> AUD</span>
											</>
										) : (
											<>
												<span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">$54</span>
												<span className="text-base sm:text-lg text-gray-600 dark:text-gray-400"> AUD</span>
											</>
										)}
									</div>
									<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
										per teacher / {billingPeriod === 'monthly' ? 'month' : 'year'}
									</p>
									{billingPeriod === 'monthly' ? (
										<p className="text-xs text-blue-600 dark:text-blue-400 font-medium">$1.50 per week</p>
									) : (
										<p className="text-xs text-blue-600 dark:text-blue-400 font-medium">$4.50 per month</p>
									)}
								</div>

								<ul className="space-y-2.5 sm:space-y-3 flex-1 mb-6">
									<li className="flex items-start gap-2.5">
										<span className="text-blue-600 dark:text-blue-400 text-base font-semibold flex-shrink-0 leading-none mt-0.5">✓</span>
										<span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">Every weekly quiz, instantly on Monday mornings</span>
									</li>
									<li className="flex items-start gap-2.5">
										<span className="text-blue-600 dark:text-blue-400 text-base font-semibold flex-shrink-0 leading-none mt-0.5">✓</span>
										<span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">Replay any quiz (past quizzes library)</span>
									</li>
									<li className="flex items-start gap-2.5">
										<span className="text-blue-600 dark:text-blue-400 text-base font-semibold flex-shrink-0 leading-none mt-0.5">✓</span>
										<span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">Printable PDF packs</span>
									</li>
									<li className="flex items-start gap-2.5">
										<span className="text-blue-600 dark:text-blue-400 text-base font-semibold flex-shrink-0 leading-none mt-0.5">✓</span>
										<span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">Achievements, streak tracking</span>
									</li>
									<li className="flex items-start gap-2.5">
										<span className="text-blue-600 dark:text-blue-400 text-base font-semibold flex-shrink-0 leading-none mt-0.5">✓</span>
										<span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">Private leaderboards</span>
									</li>
									<li className="flex items-start gap-2.5">
										<span className="text-blue-600 dark:text-blue-400 text-base font-semibold flex-shrink-0 leading-none mt-0.5">✓</span>
										<span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">The People's Round submissions</span>
									</li>
									<li className="flex items-start gap-2.5">
										<span className="text-blue-600 dark:text-blue-400 text-base font-semibold flex-shrink-0 leading-none mt-0.5">✓</span>
										<span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">Early access to special editions</span>
									</li>
								</ul>

								<p className="text-xs text-gray-500 dark:text-gray-500 mb-6 italic">Cancel anytime, no lock-in</p>

								<Link
									href="/sign-up"
									className="w-full inline-flex items-center justify-center h-11 px-4 bg-[#3B82F6] text-white rounded-full text-sm font-medium hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
								>
									Get started
								</Link>
							</div>

							{/* Organisation Plan */}
							<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6 sm:p-8 flex flex-col hover:shadow-lg transition-all">
								<div className="mb-6">
									<h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1.5">Organisation</h3>
									<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-5">Departments, faculties, whole schools</p>
									<div className="mb-1">
										{billingPeriod === 'monthly' ? (
											<>
												<span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">$4.50</span>
												<span className="text-base sm:text-lg text-gray-600 dark:text-gray-400"> AUD</span>
											</>
										) : (
											<>
												<span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">$40.50</span>
												<span className="text-base sm:text-lg text-gray-600 dark:text-gray-400"> AUD</span>
											</>
										)}
									</div>
									<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
										per teacher / {billingPeriod === 'monthly' ? 'month' : 'year'}
									</p>
									<p className="text-xs text-green-600 dark:text-green-400 font-medium">25% off (minimum 5 teachers)</p>
								</div>

								<ul className="space-y-2.5 sm:space-y-3 flex-1 mb-6">
									<li className="flex items-start gap-2.5">
										<span className="text-blue-600 dark:text-blue-400 text-base font-semibold flex-shrink-0 leading-none mt-0.5">✓</span>
										<span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed"><strong>All Premium features</strong></span>
									</li>
									<li className="flex items-start gap-2.5">
										<span className="text-blue-600 dark:text-blue-400 text-base font-semibold flex-shrink-0 leading-none mt-0.5">✓</span>
										<span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">Central billing</span>
									</li>
									<li className="flex items-start gap-2.5">
										<span className="text-blue-600 dark:text-blue-400 text-base font-semibold flex-shrink-0 leading-none mt-0.5">✓</span>
										<span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">Shared private leagues (houses, mentor groups, year groups)</span>
									</li>
									<li className="flex items-start gap-2.5">
										<span className="text-blue-600 dark:text-blue-400 text-base font-semibold flex-shrink-0 leading-none mt-0.5">✓</span>
										<span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">School-wide data snapshots</span>
									</li>
									<li className="flex items-start gap-2.5">
										<span className="text-blue-600 dark:text-blue-400 text-base font-semibold flex-shrink-0 leading-none mt-0.5">✓</span>
										<span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">Priority support</span>
									</li>
								</ul>

								<p className="text-xs text-gray-500 dark:text-gray-500 mb-6">
									{billingPeriod === 'monthly' ? 'From $270/year for 5 teachers' : 'From $202.50/year for 5 teachers'}
								</p>

								<Link
									href="/sign-up"
									className="w-full inline-flex items-center justify-center h-11 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
								>
									Get started
								</Link>
							</div>
						</div>

					</div>
				</section>

				{/* Footer */}
				<Footer />
			</main>

			<style jsx>{`
				@keyframes fadeIn {
					from {
						opacity: 0;
						transform: translateY(10px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				.animate-fadeIn {
					animation: fadeIn 0.3s ease-out;
				}
			`}</style>
		</>
	);
}

