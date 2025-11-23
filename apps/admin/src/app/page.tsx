"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SiteHeader } from "@/components/SiteHeader";
import NextQuizCountdown from "@/components/NextQuizCountdown";
import { RotatingText } from "@/components/RotatingText";
import HeroCTA from "@/components/HeroCTA";
import WhySection from "@/components/marketing/WhySection";
import QuizSafariPreview from "@/components/QuizSafariPreview";
import { QuizCardStack } from "@/components/marketing/QuizCardStack";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useUserAccess } from "@/contexts/UserAccessContext";
import { Footer } from "@/components/Footer";
import { getQuizColor } from "@/lib/colors";
import type { Quiz } from "@/components/quiz/QuizCard";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import type { UserTier } from "@/lib/feature-gating";
import { Trophy, Users, TrendingUp, FileText, Download, RotateCcw, Sparkles, MessageSquare, Crown, School, ChevronLeft, ChevronRight, FileEdit, Zap, Building2 } from "lucide-react";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { SnowOverlay } from "@/components/ui/snow-overlay";
import { cn } from "@/lib/utils";

// Reasons carousel component
function ReasonsCarousel() {
	const [currentIndex, setCurrentIndex] = useState(0);
	const videoVersion = "v3"; // Update this when video changes
	const [isAutoScrolling, setIsAutoScrolling] = useState(true);

	const reasons = [
		{
			title: "Born out of frustration",
			subline: "Designed by a teacher who wanted something better than the usual mix of clumsy Kahoots, generic quiz content, and weekly trivia that never seems to match what students actually know or care about.",
			pills: ["Teacher-built", "Carefully curated", "Well balanced", "No AI slop"],
		},
		{
			title: "Made for an Aussie classroom",
			subline: "Featuring Australian current affairs, local events, sport, and the things young people are talking about right now.",
			pills: ["Current events", "What's buzzing in Aus", "Headlines of the week", "Sport & big moments"],
			hasFlag: true,
		},
		{
			title: "Built for pastoral time",
			subline: "Works for tutor groups, quick check-ins, and everything in between. Flexible and low-pressure — start, pause, resume. Perfect for connection in short bursts.",
			pills: ["Flexible start/pause/resume", "Pastoral", "Short-window friendly", "Zero prep"],
		},
		{
			title: "Easy to run",
			subline: "Switch between presenter mode, Quick View, or a printable PDF. However you teach, it's ready to go with zero setup.",
			pills: ["Presenter mode", "Quick View", "Printable PDF", "Zero setup"],
		},
		{
			title: "Balanced for high school students",
			subline: "Designed for Aussie teenagers with a fair difficulty curve. Accessible, clever, and fun, with fresh topics and rotating categories each week to keep it engaging for everyone.",
			pills: ["Fair difficulty", "Not brutal", "Balanced for students", "Varied each week"],
		},
		{
			title: "Curriculum aware",
			subline: "Subject-based questions (history, geography, science, sport) reflect content students actually study across Australian secondary curriculums, not left-field trivia.",
			pills: ["History", "Geography", "Science", "Sport", "Culture", "English", "Maths"],
		},
		{
			title: "Cultural events",
			subline: "Celebrating the diversity of Australia — from Aboriginal and Torres Strait Islander culture and history to key cultural moments, festivals, and national observances across the year.",
			pills: ["Aboriginal culture", "Torres Strait Islander", "Cultural awareness"],
			aboriginalTheme: true,
		},
		{
			title: "Social, not silent",
			subline: "Built for real interaction. No heads in laptops — just conversation, teamwork, and a bit of fun that supports connection and wellbeing.",
			pills: ["Class connection", "Social", "Fun", "Wellbeing"],
		},
		{
			title: "Healthy competition",
			subline: "Use the public leaderboard or create your own leagues for houses, cohorts, or mentor groups. The overall goals are connection and engagement — competition that stays friendly.",
			pills: ["Public leaderboard", "Private leagues"],
		},
		{
			title: "Fresh every week",
			subline: "Topical, consistent, and reliable. A new quiz drops every Monday morning, so you're never scrambling for content mid-lesson. Replay past quizzes or dip back into older ones whenever you need.",
			pills: ["Topical", "Consistent", "Reliable", "Replayable"],
		},
		{
			title: "Classroom-safe content",
			subline: "Every question is written and curated with care. Clear, precise, and age-appropriate. No surprises, no awkward moments.",
			pills: ["Age-appropriate", "Checked", "Classroom-safe"],
		},
		{
			title: "Zero setup",
			subline: "No logins, no apps, no downloads. Just open and run it with your class.",
			pills: ["No logins", "No apps", "No downloads", "Instant start"],
		},
	];

	// Show 3 cards at a time on desktop, 1 on mobile
	const cardsToShow = 3;
	const maxIndex = Math.max(0, reasons.length - cardsToShow);

	const goToNext = () => {
		setIsAutoScrolling(false);
		setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
	};

	const goToPrevious = () => {
		setIsAutoScrolling(false);
		setCurrentIndex((prev) => Math.max(prev - 1, 0));
	};

	const goToIndex = (index: number) => {
		setIsAutoScrolling(false);
		// When clicking a dot, show that card as the first visible card
		const targetIndex = Math.min(index, maxIndex);
		setCurrentIndex(targetIndex);
	};

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowLeft") {
				goToPrevious();
			} else if (e.key === "ArrowRight") {
				goToNext();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [maxIndex]);

	// Get visible cards based on current index
	const visibleReasons = reasons.slice(currentIndex, currentIndex + cardsToShow);
	// On mobile, show only one card
	const mobileVisibleReasons = reasons.slice(currentIndex, currentIndex + 1);

	return (
		<motion.section
			className="w-full py-12 sm:py-16 md:py-20 px-6 sm:px-8 md:px-12 lg:px-16"
			initial={{ opacity: 0, y: 30 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-100px" }}
			transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
		>
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="text-center mb-10 sm:mb-12">
					<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
						The story behind The School Quiz
					</h2>
					<p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
						Created by a classroom teacher who saw a gap between what students enjoy and what most quizzes deliver.
					</p>
				</div>

				{/* Carousel Container */}
				<div className="relative">
					{/* Desktop: 3 cards */}
					<div className="hidden md:grid md:grid-cols-3 gap-6 md:gap-8 relative">
						{/* Navigation Arrows - Centered vertically relative to cards */}
						<button
							onClick={goToPrevious}
							disabled={currentIndex === 0}
							className={`absolute -left-4 sm:-left-6 md:-left-8 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 shadow-sm transition-all z-10 ${currentIndex === 0
								? "opacity-30 cursor-not-allowed"
								: "hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-md"
								}`}
							aria-label="Previous"
						>
							<ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300" />
						</button>
						<button
							onClick={goToNext}
							disabled={currentIndex >= maxIndex}
							className={`absolute -right-4 sm:-right-6 md:-right-8 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 shadow-sm transition-all z-10 ${currentIndex >= maxIndex
								? "opacity-30 cursor-not-allowed"
								: "hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-md"
								}`}
							aria-label="Next"
						>
							<ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300" />
						</button>
						<AnimatePresence mode="wait">
							{visibleReasons.map((reason, idx) => (
								<motion.div
									key={`${currentIndex}-${idx}`}
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -20 }}
									transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 }}
									style={{ transform: `rotate(${idx === 0 ? -0.75 : idx === 1 ? 0.75 : 0.5}deg)` }}
									className={cn(
										"flex flex-col p-6 rounded-2xl border backdrop-blur-sm relative overflow-hidden",
										reason.aboriginalTheme
											? "border-red-300/40 dark:border-red-700/40 bg-gradient-to-br from-red-50/40 via-yellow-50/30 to-black/5 dark:from-red-950/30 dark:via-yellow-950/20 dark:to-black/10"
											: "border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-br from-blue-50/30 to-purple-50/20 dark:from-blue-950/20 dark:to-purple-950/10"
									)}
								>
									{/* Australian video background for Aussie card */}
									{reason.hasFlag && (
										<>
											<video
												autoPlay
												loop
												muted
												playsInline
												className="absolute inset-0 w-full h-full object-cover opacity-30 dark:opacity-20"
												key={videoVersion}
											>
												<source src={`/australia.mp4?v=${videoVersion}`} type="video/mp4" />
											</video>
											{/* Dark overlay for better text visibility */}
											<div className="absolute inset-0 bg-black/20 dark:bg-black/40 pointer-events-none" />
										</>
									)}
									{/* Aboriginal flag colors background for cultural events card */}
									{reason.aboriginalTheme && (
										<div className="absolute inset-0 opacity-[0.08] dark:opacity-[0.12] pointer-events-none">
											<div className="absolute top-0 left-0 w-full h-1/2 bg-red-600" />
											<div className="absolute bottom-0 left-0 w-full h-1/2 bg-black" />
											<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-yellow-400" />
										</div>
									)}
									<div className="relative z-10">
										{/* Heading */}
										<h3 className={cn(
											"text-base md:text-lg font-semibold mb-3 leading-tight",
											reason.hasFlag
												? "text-white drop-shadow-lg"
												: "text-gray-900 dark:text-white"
										)}>
											{reason.title}
										</h3>

										{/* Subline */}
										<p className={cn(
											"text-sm mb-4 leading-relaxed",
											reason.hasFlag
												? "text-white/90 drop-shadow-md"
												: "text-gray-600 dark:text-gray-400"
										)}>
											{reason.subline}
										</p>

										{/* Pills */}
										<div className="mt-auto flex flex-wrap gap-1.5">
											{reason.pills.map((pill) => (
												<span
													key={pill}
													className={cn(
														"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
														reason.aboriginalTheme
															? "bg-red-600/20 text-red-900 dark:bg-red-500/30 dark:text-red-200 border border-red-300/30 dark:border-red-600/30"
															: reason.hasFlag
																? "bg-white/20 text-white border border-white/30 backdrop-blur-sm"
																: "bg-gray-900/10 text-gray-900 dark:bg-white/20 dark:text-white"
													)}
												>
													{pill}
												</span>
											))}
										</div>
									</div>
								</motion.div>
							))}
						</AnimatePresence>
					</div>

					{/* Mobile: 1 card */}
					<div className="md:hidden relative">
						{/* Navigation Arrows for Mobile */}
						<button
							onClick={goToPrevious}
							disabled={currentIndex === 0}
							className={`absolute -left-4 sm:-left-6 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 shadow-sm transition-all z-10 ${currentIndex === 0
								? "opacity-30 cursor-not-allowed"
								: "hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-md"
								}`}
							aria-label="Previous"
						>
							<ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300" />
						</button>
						<button
							onClick={goToNext}
							disabled={currentIndex >= maxIndex}
							className={`absolute -right-4 sm:-right-6 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 shadow-sm transition-all z-10 ${currentIndex >= maxIndex
								? "opacity-30 cursor-not-allowed"
								: "hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-md"
								}`}
							aria-label="Next"
						>
							<ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300" />
						</button>
						<AnimatePresence mode="wait">
							{mobileVisibleReasons.map((reason) => (
								<motion.div
									key={currentIndex}
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -20 }}
									transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
									style={{ transform: `rotate(0.5deg)` }}
									className={cn(
										"flex flex-col p-6 rounded-2xl border backdrop-blur-sm relative overflow-hidden",
										reason.aboriginalTheme
											? "border-red-300/40 dark:border-red-700/40 bg-gradient-to-br from-red-50/40 via-yellow-50/30 to-black/5 dark:from-red-950/30 dark:via-yellow-950/20 dark:to-black/10"
											: "border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-br from-blue-50/30 to-purple-50/20 dark:from-blue-950/20 dark:to-purple-950/10"
									)}
								>
									{/* Australian video background for Aussie card */}
									{reason.hasFlag && (
										<>
											<video
												autoPlay
												loop
												muted
												playsInline
												className="absolute inset-0 w-full h-full object-cover opacity-30 dark:opacity-20"
												key={videoVersion}
											>
												<source src={`/australia.mp4?v=${videoVersion}`} type="video/mp4" />
											</video>
											{/* Dark overlay for better text visibility */}
											<div className="absolute inset-0 bg-black/20 dark:bg-black/40 pointer-events-none" />
										</>
									)}
									{/* Aboriginal flag colors background for cultural events card */}
									{reason.aboriginalTheme && (
										<div className="absolute inset-0 opacity-[0.08] dark:opacity-[0.12] pointer-events-none">
											<div className="absolute top-0 left-0 w-full h-1/2 bg-red-600" />
											<div className="absolute bottom-0 left-0 w-full h-1/2 bg-black" />
											<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-yellow-400" />
										</div>
									)}
									<div className="relative z-10">
										{/* Heading */}
										<h3 className={cn(
											"text-base md:text-lg font-semibold mb-3 leading-tight",
											reason.hasFlag
												? "text-white drop-shadow-lg"
												: "text-gray-900 dark:text-white"
										)}>
											{reason.title}
										</h3>

										{/* Subline */}
										<p className={cn(
											"text-sm mb-4 leading-relaxed",
											reason.hasFlag
												? "text-white/90 drop-shadow-md"
												: "text-gray-600 dark:text-gray-400"
										)}>
											{reason.subline}
										</p>

										{/* Pills */}
										<div className="mt-auto flex flex-wrap gap-1.5">
											{reason.pills.map((pill) => (
												<span
													key={pill}
													className={cn(
														"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
														reason.aboriginalTheme
															? "bg-red-600/20 text-red-900 dark:bg-red-500/30 dark:text-red-200 border border-red-300/30 dark:border-red-600/30"
															: reason.hasFlag
																? "bg-white/20 text-white border border-white/30 backdrop-blur-sm"
																: "bg-gray-900/10 text-gray-900 dark:bg-white/20 dark:text-white"
													)}
												>
													{pill}
												</span>
											))}
										</div>
									</div>
								</motion.div>
							))}
						</AnimatePresence>
					</div>

					{/* Dot Indicators */}
					<div className="flex justify-center gap-2 mt-6 sm:mt-8">
						{reasons.map((_, index) => {
							// Highlight dot if it's in the visible range
							const isVisible = index >= currentIndex && index < currentIndex + cardsToShow;
							const isFirstVisible = index === currentIndex;

							return (
								<button
									key={index}
									onClick={() => goToIndex(index)}
									className={`h-2 rounded-full transition-all duration-200 ${isFirstVisible
										? "w-8 bg-gray-900 dark:bg-gray-100"
										: isVisible
											? "w-3 bg-gray-500 dark:bg-gray-400"
											: "w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
										}`}
									aria-label={`Go to reason ${index + 1}`}
								/>
							);
						})}
					</div>

					{/* Find out more button */}
					<div className="flex justify-center mt-8 sm:mt-10">
						<Link
							href="/about"
							className="inline-flex items-center justify-center h-12 px-4 sm:px-6 bg-[#3B82F6] text-white rounded-full text-sm sm:text-base font-medium hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
						>
							Find out more
						</Link>
					</div>
				</div>
			</div>
		</motion.section>
	);
}

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
	const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');

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
			<div id="header-section">
				<SiteHeader fadeLogo={true} />
			</div>
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
								<div className="w-full mb-4 h-[120px] bg-[hsl(var(--muted))] rounded-lg animate-pulse" />
								<div className="w-3/4 mx-auto h-[80px] bg-[hsl(var(--muted))] rounded-lg animate-pulse" />
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
								<div className="w-[180px] h-[48px] bg-[hsl(var(--muted))] rounded-full animate-pulse" />
								<div className="w-[180px] h-[48px] bg-[hsl(var(--muted))] rounded-full animate-pulse" />
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

					{/* Value Proposition Carousel */}
					{contentLoaded ? (
						<ReasonsCarousel />
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
								<div className="w-full h-[400px] bg-[hsl(var(--muted))] rounded-2xl animate-pulse" />
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
							<div className="max-w-6xl mx-auto text-center">
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
							<div className="max-w-7xl mx-auto flex flex-wrap justify-center items-center gap-3 sm:gap-4 md:gap-5">
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
											className="relative w-[140px] sm:w-[160px] md:w-[180px] flex-shrink-0"
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
							<div className="text-center mt-4 sm:mt-5">
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
					) : null}
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
								<div className="bg-gray-50 dark:bg-gray-800 px-4 py-6 border-b border-gray-200 dark:border-gray-700">
									{/* Form mockup with typing animation */}
									<div className="space-y-3">
										<div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
											<div className="space-y-2.5">
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
												<div className="grid grid-cols-2 gap-2">
													<div>
														<label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Teacher name</label>
														<div className="h-7 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 px-2 text-xs text-gray-600 dark:text-gray-400 flex items-center">Mr F</div>
													</div>
													<div>
														<label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">School</label>
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
												// Vary the animation slightly for each bar
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
										{/* Line graph preview - separate */}
										<div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700 h-16 relative overflow-hidden">
											<svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ padding: '12px' }}>
												<motion.path
													stroke="rgb(168, 85, 247)"
													strokeWidth="2"
													fill="none"
													opacity="0.6"
													initial={{ pathLength: 0, opacity: 0 }}
													animate={{
														pathLength: [0, 1, 1, 0],
														opacity: [0, 0.6, 0.6, 0],
														d: [
															"M 0 50 Q 30 45, 60 40 T 120 35 T 180 30 T 240 25",
															"M 0 48 Q 30 43, 60 38 T 120 33 T 180 28 T 240 23",
															"M 0 52 Q 30 47, 60 42 T 120 37 T 180 32 T 240 27",
															"M 0 50 Q 30 45, 60 40 T 120 35 T 180 30 T 240 25"
														]
													}}
													transition={{
														duration: 6,
														repeat: Infinity,
														repeatType: "loop",
														ease: "easeInOut"
													}}
												/>
											</svg>
										</div>
										<motion.div
											className="bg-white dark:bg-gray-900 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700"
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ duration: 0.3, delay: 0.5 }}
										>
											<div className="text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Compare performance</div>
											<div className="space-y-1.5">
												<motion.div
													className="flex items-center justify-between"
													initial={{ opacity: 0, x: -10 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{ duration: 0.3, delay: 0.6 }}
												>
													<div className="text-[10px] text-gray-500 dark:text-gray-400">vs National avg</div>
													<motion.div
														className="text-xs font-semibold text-green-600 dark:text-green-400"
														animate={{ scale: [1, 1.05, 1] }}
														transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
													>
														+8%
													</motion.div>
												</motion.div>
												<motion.div
													className="flex items-center justify-between"
													initial={{ opacity: 0, x: -10 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{ duration: 0.3, delay: 0.7 }}
												>
													<div className="text-[10px] text-gray-500 dark:text-gray-400">vs Your leaderboard</div>
													<div className="text-xs font-semibold text-blue-600 dark:text-blue-400">#3</div>
												</motion.div>
											</div>
										</motion.div>
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
								What teachers are saying
							</h2>
							<p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
								Teachers across Australia use The School Quiz to spark conversation, build routines, and make pastoral time a bit easier.
							</p>
						</div>

						{/* Testimonials Infinite Scroll Carousel */}
						<div className="relative overflow-visible pb-6 mb-12 group/testimonials">
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
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
						className="max-w-7xl mx-auto"
					>
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
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
							{/* Free Plan */}
							<motion.div
								initial={{ opacity: 0, y: 20, rotate: -0.5 }}
								whileInView={{ opacity: 1, y: 0, rotate: -0.5 }}
								viewport={{ once: true }}
								transition={{
									duration: 0.5,
									delay: 0.1,
									type: "spring",
									stiffness: 300,
									damping: 25
								}}
								whileHover={{ rotate: 0, scale: 1.02, y: -4 }}
								className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6 sm:p-8 flex flex-col hover:shadow-lg transition-all"
								style={{ transformOrigin: 'center' }}
							>
								<div className="mb-6">
									<h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1.5">Free</h3>
									<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-5">Trialling the quiz in class</p>
									<div className="mb-1">
										<span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">$0</span>
									</div>
								</div>

								<ul className="space-y-2.5 sm:space-y-3 flex-1 mb-6">
									<li className="flex items-start gap-2.5">
										<span className="text-blue-600 dark:text-blue-400 text-base font-semibold flex-shrink-0 leading-none mt-0.5">✓</span>
										<span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">3 free quizzes (lifetime)</span>
									</li>
									<li className="flex items-start gap-2.5">
										<span className="text-gray-300 dark:text-gray-600 text-base font-semibold flex-shrink-0 leading-none mt-0.5">✗</span>
										<span className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 leading-relaxed">No premium features</span>
									</li>
									<li className="flex items-start gap-2.5">
										<span className="text-gray-300 dark:text-gray-600 text-base font-semibold flex-shrink-0 leading-none mt-0.5">✗</span>
										<span className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 leading-relaxed">No printing, no past quizzes</span>
									</li>
									<li className="flex items-start gap-2.5">
										<span className="text-gray-300 dark:text-gray-600 text-base font-semibold flex-shrink-0 leading-none mt-0.5">✗</span>
										<span className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 leading-relaxed">No achievements, no leaderboards</span>
									</li>
								</ul>

								<p className="text-xs text-gray-500 dark:text-gray-500 mb-6 italic">About three weeks of Monday mornings</p>

								<Link
									href="/sign-up"
									className="w-full inline-flex items-center justify-center h-11 px-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
								>
									Get started
								</Link>
							</motion.div>

							{/* Premium Plan */}
							<motion.div
								initial={{ opacity: 0, y: 20, rotate: 0 }}
								whileInView={{ opacity: 1, y: 0, rotate: 0 }}
								viewport={{ once: true }}
								transition={{
									duration: 0.5,
									delay: 0.2,
									type: "spring",
									stiffness: 300,
									damping: 25
								}}
								whileHover={{ rotate: 0, scale: 1.02, y: -4 }}
								className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-blue-500 dark:border-blue-600 p-6 sm:p-8 flex flex-col relative hover:shadow-xl transition-all"
								style={{ transformOrigin: 'center' }}
							>
								{/* Glow effect */}
								<div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl opacity-20 dark:opacity-30 blur-xl -z-10"></div>
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
							</motion.div>

							{/* Organisation Plan */}
							<motion.div
								initial={{ opacity: 0, y: 20, rotate: 0.5 }}
								whileInView={{ opacity: 1, y: 0, rotate: 0.5 }}
								viewport={{ once: true }}
								transition={{
									duration: 0.5,
									delay: 0.3,
									type: "spring",
									stiffness: 300,
									damping: 25
								}}
								whileHover={{ rotate: 0, scale: 1.02, y: -4 }}
								className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6 sm:p-8 flex flex-col hover:shadow-lg transition-all"
								style={{ transformOrigin: 'center' }}
							>
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
							</motion.div>
						</div>

						{/* Custom Quizzes Section */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-50px" }}
							transition={{
								duration: 0.5,
								delay: 0.5,
								type: "spring",
								stiffness: 300,
								damping: 25
							}}
							className="mt-16 sm:mt-20"
						>
							<div className="text-center mb-8">
								<h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
									Interested in custom quizzes?
								</h3>
								<p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
									You aren't the only one, please get in touch for pricing.
								</p>
								<Link
									href="/contact"
									className="inline-flex items-center justify-center h-12 px-4 sm:px-6 bg-[#3B82F6] text-white rounded-full text-sm sm:text-base font-medium hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
								>
									Get in touch
								</Link>
							</div>
						</motion.div>
					</motion.div>
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

