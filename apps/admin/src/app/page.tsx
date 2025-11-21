"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/SiteHeader";
import NextQuizCountdown from "@/components/NextQuizCountdown";
import { RotatingText } from "@/components/RotatingText";
import HeroCTA from "@/components/HeroCTA";
import WhySection from "@/components/marketing/WhySection";
import QuizSafariPreview from "@/components/QuizSafariPreview";
import { QuizCardStack } from "@/components/marketing/QuizCardStack";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { useUserAccess } from "@/contexts/UserAccessContext";
import { Footer } from "@/components/Footer";
import { getQuizColor } from "@/lib/colors";
import type { Quiz } from "@/components/quiz/QuizCard";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import type { UserTier } from "@/lib/feature-gating";
import { Trophy, Users, TrendingUp, FileText, Download, RotateCcw, Sparkles, MessageSquare, Crown } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
import { TypingAnimation } from "@/components/ui/typing-animation";

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

export default function HomePage() {
	const { isVisitor, isFree, isPremium, userName, isLoading } = useUserAccess();
	const [mounted, setMounted] = useState(false);
	const [contentLoaded, setContentLoaded] = useState(false);
	const [flippedCardIds, setFlippedCardIds] = useState<Set<string>>(new Set());

	useEffect(() => {
		setMounted(true);
		// Simulate progressive loading
		const timer = setTimeout(() => setContentLoaded(true), 100);
		return () => clearTimeout(timer);
	}, []);

	// Auto-flip cards in the preview to show the animation
	useEffect(() => {
		if (!contentLoaded) return;

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
	}, [contentLoaded]);

	// Redirect logged-in users to quizzes page (free users should go to quizzes, not home)
	useEffect(() => {
		if (!mounted) return;
		
		// Check localStorage as source of truth to avoid race conditions
		if (typeof window === 'undefined') return;
		
		const authToken = localStorage.getItem('authToken');
		const userId = localStorage.getItem('userId');
		const isActuallyLoggedIn = !!(authToken && userId);
		
		// If user is logged in, redirect to quizzes (regardless of tier)
		// Don't wait for isLoading - use localStorage as source of truth
		// Add a small delay to ensure page has rendered
		if (isActuallyLoggedIn) {
			const redirectTimer = setTimeout(() => {
				window.location.href = '/quizzes';
			}, 100);
			return () => clearTimeout(redirectTimer);
		}
	}, [mounted]);
	
	return (
		<>
			<SiteHeader fadeLogo={true} />
			<main className="min-h-screen">
				{/* Notch Component */}
				<NextQuizCountdown />

				{/* Hero Section */}
				<section className="min-h-screen flex flex-col items-center justify-center px-6 sm:px-8 md:px-4 pt-24 sm:pt-32 relative bg-gray-50 dark:bg-[#0F1419]">
					<div className="max-w-4xl mx-auto text-center mb-8 sm:mb-16 px-4 sm:px-6 md:px-0">
						{contentLoaded ? (
							<motion.h1
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
								className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 md:mb-10 pb-2 sm:pb-4 px-4 sm:px-6 md:px-8 lg:px-12 leading-[1.1] sm:leading-tight"
								id="headline"
							>
								A weekly quiz for<br />
								high school{" "}
								<span className="text-blue-600 dark:text-blue-400 inline-block min-h-[1.2em]">
									<RotatingText
										text={["students", "tutor groups", "homerooms"]}
										duration={3000}
										transition={{ duration: 0.5, ease: "easeInOut" }}
									/>
								</span>
							</motion.h1>
						) : (
							<div className="mb-6 sm:mb-8 md:mb-10 pb-2 sm:pb-4 px-4 sm:px-6 md:px-8 lg:px-12">
								<Skeleton variant="text" height={120} className="w-full mb-4" />
								<Skeleton variant="text" height={80} className="w-3/4 mx-auto" />
							</div>
						)}

					{contentLoaded ? (
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
						) : (
							<div className="mb-8 sm:mb-12 max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
								<SkeletonText lines={3} />
							</div>
						)}

					{contentLoaded ? (
						<motion.div 
							id="buttons" 
							className="px-2 sm:px-0"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
						>
							<HeroCTA />
						</motion.div>
					) : (
						<div className="px-2 sm:px-0 flex justify-center gap-4">
							<Skeleton variant="rectangular" width={180} height={48} className="rounded-full" />
							<Skeleton variant="rectangular" width={180} height={48} className="rounded-full" />
						</div>
					)}
				</div>

					{/* A new quiz every week heading */}
					{contentLoaded ? (
						<motion.div 
							className="w-full px-4 mt-8 mb-4"
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
					) : null}

					{/* Quiz Card Stack - Back Catalogue Preview */}
					{contentLoaded ? (
						<motion.div
							className="w-full"
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
						>
							<QuizCardStack quizzes={sampleQuizzes} />
						</motion.div>
					) : null}

					{/* Interactive Quiz Preview heading */}
					{contentLoaded ? (
						<motion.div 
							className="w-full px-4 mt-12 mb-6"
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
					) : null}

					{/* Safari Preview Peeking from Bottom */}
					{contentLoaded ? (
						<motion.div 
							className="w-full px-8 sm:px-12 md:px-16 lg:px-20 xl:px-24 mt-4 mb-8"
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
						>
							<div className="max-w-5xl mx-auto">
								<QuizSafariPreview />
							</div>
						</motion.div>
					) : (
						<div className="w-full px-8 sm:px-12 md:px-16 lg:px-20 xl:px-24 mt-4 mb-8">
							<div className="max-w-5xl mx-auto">
								<Skeleton variant="rectangular" height={400} className="w-full rounded-2xl" />
							</div>
						</div>
					)}

					{/* Achievements Preview heading */}
					{contentLoaded ? (
						<motion.div 
							className="w-full px-4 mt-16 mb-6"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
						>
							<div className="max-w-4xl mx-auto text-center">
								<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
									Earn achievements as you play
								</h2>
								<p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
									Unlock a growing library of achievement cards, including progress milestones, perfect scores, special editions, and fun one-offs.
								</p>
							</div>
						</motion.div>
					) : null}

					{/* Achievements Preview Cards */}
					{contentLoaded ? (
						<motion.div 
							className="w-full px-4 mt-6 mb-12"
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
						>
							<div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-4">
								{[
									{
										id: "preview-1",
										slug: "hail-caesar",
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
								].map((achievement, index) => {
									const rotation = (index % 5 - 2) * 3; // Subtle angles: -6, -3, 0, 3, 6 degrees
									const isFlipped = achievement.status === 'unlocked' && flippedCardIds.has(achievement.id);
									const isUnlocked = achievement.status === 'unlocked';
									
									return (
										<motion.div
											key={achievement.id}
											initial={{ opacity: 0, y: 20, scale: 0.9 }}
											animate={{ 
												opacity: 1, 
												y: 0, 
												scale: 1,
												rotate: isUnlocked ? 0 : rotation, // No rotation for unlocked cards
											}}
											transition={{ 
												duration: 0.4, 
												delay: 0.6 + (index * 0.05),
												ease: [0.22, 1, 0.36, 1]
											}}
											className="relative"
											style={{
												width: 'clamp(120px, 25vw, 200px)',
												maxWidth: '200px',
												flexShrink: 0,
												zIndex: isFlipped ? 1000 : 5 - index,
											}}
											whileHover={{ 
												zIndex: 1000,
												scale: 1.1,
												rotate: 0,
												y: -8,
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
						</motion.div>
				) : null}
			</section>

			{/* Premium Features - Mobbin Style */}
			<section className="w-full py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8">
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
							Premium adds the tools that turn a good Monday quiz into a term-long routine students actually look forward to.
						</p>
					</div>

					{/* Premium Feature Cards - Mobbin Style (2 rows, 3 columns) */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
						{/* The People's Round - with spotlight and typing animation */}
						<motion.div
							initial={{ opacity: 0, y: 20, rotate: -0.5 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							whileHover={{ rotate: 0.5, scale: 1.02, y: -4 }}
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
							<div className="relative bg-gray-50 dark:bg-gray-800 px-4 py-6 border-b border-gray-200 dark:border-gray-700">
								<Spotlight className="-top-20 left-20" fill="#9333EA" />
								{/* Form mockup with typing animation */}
								<div className="relative z-10 space-y-3">
									<div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
										<div className="space-y-3">
											<div>
												<label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Your question</label>
												<div className="min-h-[60px] bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-3 text-sm text-gray-700 dark:text-gray-300">
													<TypingAnimation 
														text="What Australian city is known as the 'City of Churches'?"
														speed={40}
														delay={500}
														className="text-sm"
													/>
												</div>
											</div>
											<div>
												<label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
												<div className="h-8 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"></div>
											</div>
											<button className="w-full h-8 bg-purple-600 text-white rounded-md font-medium text-sm">Submit question</button>
										</div>
									</div>
								</div>
							</div>
							{/* Content below */}
							<div className="p-5">
								<h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
									The People's Round
								</h3>
								<p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
									Submit your question and get featured in an upcoming quiz. Your name, teacher, and school get a shoutout when your question appears.
								</p>
								<p className="text-xs text-gray-500 dark:text-gray-500 mt-2 italic">
									Example: "Submitted by Miss O from Stanton Road High School"
								</p>
							</div>
						</motion.div>

						{/* Private Leaderboards */}
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
								{/* Leaderboard mockup */}
								<div className="space-y-2">
									<div className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
										<div className="flex items-center gap-2.5">
											<div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
												<span className="text-xs font-semibold text-blue-600 dark:text-blue-400">1</span>
											</div>
											<div>
												<div className="h-2.5 w-20 bg-gray-300 dark:bg-gray-600 rounded mb-1"></div>
												<div className="h-2 w-14 bg-gray-200 dark:bg-gray-700 rounded"></div>
											</div>
										</div>
										<div className="text-xs font-semibold text-gray-900 dark:text-white">245</div>
									</div>
									<div className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
										<div className="flex items-center gap-2.5">
											<div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
												<span className="text-xs font-semibold text-purple-600 dark:text-purple-400">2</span>
											</div>
											<div>
												<div className="h-2.5 w-18 bg-gray-300 dark:bg-gray-600 rounded mb-1"></div>
												<div className="h-2 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
											</div>
										</div>
										<div className="text-xs font-semibold text-gray-900 dark:text-white">198</div>
									</div>
									<div className="flex items-center justify-between p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
										<div className="flex items-center gap-2.5">
											<div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
												<span className="text-xs font-semibold text-white">3</span>
											</div>
											<div>
												<div className="h-2.5 w-24 bg-blue-200 dark:bg-blue-700 rounded mb-1"></div>
												<div className="h-2 w-16 bg-blue-100 dark:bg-blue-800 rounded"></div>
											</div>
										</div>
										<div className="text-xs font-semibold text-blue-600 dark:text-blue-400">156</div>
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

						{/* Stats & Streaks */}
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
										<div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
											<div className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">42</div>
											<div className="text-xs text-gray-500 dark:text-gray-400">Perfect scores</div>
										</div>
										<div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
											<div className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-0.5">12</div>
											<div className="text-xs text-gray-500 dark:text-gray-400">Week streak</div>
										</div>
									</div>
									<div className="h-16 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
										<div className="flex items-end gap-1 justify-center h-full pb-2">
											{[2, 4, 3, 5, 4, 6, 5].map((height, i) => (
												<div
													key={i}
													className="w-3 bg-purple-500 rounded-t"
													style={{ height: `${height * 8}px` }}
												></div>
											))}
										</div>
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

						{/* Printable PDFs */}
						<motion.div
							initial={{ opacity: 0, y: 20, rotate: 0.3 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							whileHover={{ rotate: -0.5, scale: 1.02, y: -4 }}
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
								{/* PDF mockup */}
								<div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
									<div className="bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
										<div className="flex items-center gap-2">
											<FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
											<div className="h-2.5 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
										</div>
										<Download className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
									</div>
									<div className="p-3 space-y-1.5">
										<div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-full"></div>
										<div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-3/4"></div>
										<div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-full"></div>
										<div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-5/6"></div>
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

						{/* Replay Old Quizzes */}
						<motion.div
							initial={{ opacity: 0, y: 20, rotate: -0.3 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							whileHover={{ rotate: 0.4, scale: 1.02, y: -4 }}
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
								{/* Quiz grid mockup */}
								<div className="grid grid-cols-3 gap-1.5">
									{[...Array(6)].map((_, i) => (
										<div key={i} className="aspect-square rounded-lg bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 flex items-center justify-center">
											<span className="text-xs font-semibold text-orange-600 dark:text-orange-400">#{i + 1}</span>
										</div>
									))}
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

						{/* Special Editions */}
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
							<div className="bg-gray-50 dark:bg-gray-800 px-4 py-6 border-b border-gray-200 dark:border-gray-700">
								{/* Special edition card mockup */}
								<div className="space-y-2">
									<div className="h-7 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center px-2.5">
										<Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 mr-2" />
										<div className="h-2.5 w-24 bg-indigo-200 dark:bg-indigo-700 rounded"></div>
									</div>
									<div className="h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center justify-center">
										<div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Holiday Special</div>
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
			<section className="w-full py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 bg-white dark:bg-gray-900">
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

					{/* Testimonials Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">
						{/* Sarah L. */}
						<motion.div
							initial={{ opacity: 0, y: 20, rotate: -0.3 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							whileHover={{ rotate: 0.3, scale: 1.02, y: -4 }}
							transition={{ 
								duration: 0.5, 
								delay: 0.1,
								type: "spring",
								stiffness: 300,
								damping: 20
							}}
							className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
							style={{ transformOrigin: 'center' }}
						>
							<div className="mb-4">
								<div className="font-bold text-gray-900 dark:text-white mb-1">Sarah L.</div>
								<div className="text-xs text-gray-500 dark:text-gray-400">Year 10 Adviser — NSW</div>
							</div>
							<p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
								Private leaderboards have created the healthiest bit of competition I've seen in pastoral time. The boys race to beat last week's score and actually cheer each other on.
							</p>
						</motion.div>

						{/* Tom B. */}
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
							className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
							style={{ transformOrigin: 'center' }}
						>
							<div className="mb-4">
								<div className="font-bold text-gray-900 dark:text-white mb-1">Tom B.</div>
								<div className="text-xs text-gray-500 dark:text-gray-400">Homeroom Teacher — VIC</div>
							</div>
							<p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
								It's refreshingly social. Kids aren't buried in laptops — they're talking, guessing, arguing, laughing. It feels like old-school trivia but sharper.
							</p>
						</motion.div>

						{/* Michelle R. */}
						<motion.div
							initial={{ opacity: 0, y: 20, rotate: -0.4 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							whileHover={{ rotate: 0.3, scale: 1.02, y: -4 }}
							transition={{ 
								duration: 0.5, 
								delay: 0.3,
								type: "spring",
								stiffness: 300,
								damping: 20
							}}
							className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
							style={{ transformOrigin: 'center' }}
						>
							<div className="mb-4">
								<div className="font-bold text-gray-900 dark:text-white mb-1">Michelle R.</div>
								<div className="text-xs text-gray-500 dark:text-gray-400">Assistant Head of Wellbeing — QLD</div>
							</div>
							<p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
								The difficulty sits in a sweet spot. Easy wins early, a few curveballs later, and enough variety that everyone gets to feel clever at least once.
							</p>
						</motion.div>

						{/* Mark P. */}
						<motion.div
							initial={{ opacity: 0, y: 20, rotate: 0.3 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							whileHover={{ rotate: -0.3, scale: 1.02, y: -4 }}
							transition={{ 
								duration: 0.5, 
								delay: 0.4,
								type: "spring",
								stiffness: 300,
								damping: 20
							}}
							className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
							style={{ transformOrigin: 'center' }}
						>
							<div className="mb-4">
								<div className="font-bold text-gray-900 dark:text-white mb-1">Mark P.</div>
								<div className="text-xs text-gray-500 dark:text-gray-400">Digital Technologies Teacher — SA</div>
							</div>
							<p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
								Honestly, it's just simple. One quiz a week, well-written questions, no setup dramas, and the class actually looks forward to Monday mornings.
							</p>
						</motion.div>
					</div>

					{/* Angie D. - Full width card */}
					<motion.div
						initial={{ opacity: 0, y: 20, rotate: -0.2 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						whileHover={{ rotate: 0.2, scale: 1.02, y: -4 }}
						transition={{ 
							duration: 0.5, 
							delay: 0.5,
							type: "spring",
							stiffness: 300,
							damping: 20
						}}
						className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow max-w-3xl mx-auto mb-12"
						style={{ transformOrigin: 'center' }}
					>
						<div className="mb-4">
							<div className="font-bold text-gray-900 dark:text-white mb-1">Angie D.</div>
							<div className="text-xs text-gray-500 dark:text-gray-400">PDHPE Teacher — NSW</div>
						</div>
						<p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
							The categories keep it interesting — sport, music, trends, news. There's always at least one round that hooks the whole room.
						</p>
					</motion.div>

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
							Share your experience — you might even unlock a tiny achievement 😉
						</p>
					</motion.div>
				</motion.div>
			</section>

			{/* Why The School Quiz Section */}
				<WhySection />

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
