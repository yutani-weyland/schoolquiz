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
import { LockedFeature } from "@/components/access/LockedFeature";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { useUserAccess } from "@/contexts/UserAccessContext";
import { Footer } from "@/components/Footer";
import { getQuizColor } from "@/lib/colors";
import type { Quiz } from "@/components/quiz/QuizCard";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import type { UserTier } from "@/lib/feature-gating";

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
		if (isActuallyLoggedIn && !isLoading) {
			window.location.href = '/quizzes';
		}
	}, [isLoading, mounted]);
	
	return (
		<>
			<SiteHeader fadeLogo={true} />
			<main className="min-h-screen">
				{/* Notch Component */}
				<NextQuizCountdown />

				{/* Hero Section */}
				<section className="min-h-screen flex flex-col items-center justify-center px-6 sm:px-8 md:px-4 pt-24 sm:pt-32 relative">
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
							<motion.p
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
								className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-[#DCDCDC] mb-8 sm:mb-12 max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 leading-relaxed"
								id="description"
							>
								The School Quiz blends general knowledge, educational content, and entertainment - covering music, sport, movies, current affairs, pop culture, and topics relevant to high school students. No insanely hard questions, no AI slop. Just a solid quiz that drops every Monday morning.
							</motion.p>
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
									Explore our back catalogue of weekly quizzes and discover past challenges
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
									Interactive quiz experience
								</h2>
								<p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
									Switch between presenter and grid views. Navigate questions, reveal answers, and track your score in real-time.
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
									Unlock collectible cards by completing quizzes, getting perfect scores, and reaching milestones
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
							<div className="max-w-7xl mx-auto flex flex-wrap justify-center" style={{ gap: 0 }}>
								{[
									{
										id: "preview-1",
										slug: "hail-caesar",
										name: "Hail Caesar",
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
									const overlap = index > 0 ? '-10px' : '0'; // Less overlap, smaller on mobile
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
												marginLeft: overlap,
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

				{/* Premium Preview Section for Free Users */}
				{(isFree || isVisitor) && (
					<section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
						<div className="max-w-6xl mx-auto">
							<h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
								{isVisitor ? 'Unlock More Features' : 'Upgrade to Premium'}
							</h2>
							<div className="grid md:grid-cols-2 gap-6">
								<LockedFeature
									tierRequired="free"
									tooltipText="Join your school, class or mates"
									className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
								>
									<div className="text-center">
										<div className="text-4xl mb-4">👥</div>
										<h3 className="text-xl font-semibold mb-2">Private Leagues</h3>
										<p className="text-gray-600 dark:text-gray-400">
											Join your school, class or mates
										</p>
									</div>
								</LockedFeature>
								<LockedFeature
									tierRequired="premium"
									tooltipText="View advanced analytics and insights"
									className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
								>
									<div className="text-center">
										<div className="text-4xl mb-4">📈</div>
										<h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
										<p className="text-gray-600 dark:text-gray-400">
											Category accuracy, streaks, performance over time
										</p>
									</div>
								</LockedFeature>
							</div>
						</div>
					</section>
				)}

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
