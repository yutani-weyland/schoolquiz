"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SiteHeader } from "@/components/SiteHeader";
import { QuizCard, Quiz } from "@/components/quiz/QuizCard";
import { NextQuizTeaser } from "@/components/quiz/NextQuizTeaser";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { Footer } from "@/components/Footer";
import { usePathname } from "next/navigation";
import { getQuizColor } from '@/lib/colors';
import { storage, getUserName } from '@/lib/storage';
import { logger } from '@/lib/logger';

const quizzes: Quiz[] = [
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
    tags: ["Wordplay", "History", "Technology", "Politics", "General Knowledge"]
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
    tags: ["Seasonal", "Sports", "Year Review", "Holidays", "Winter"]
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
  {
    id: 4,
    slug: "4",
    title: "Food & Drink, Cooking Techniques, World Cuisines, and Culinary History.",
    blurb: "A feast for the mind.",
    weekISO: "2023-11-20",
    colorHex: getQuizColor(4),
    status: "available",
    tags: ["Food", "Cooking", "Cuisine", "History", "Culture"]
  },
  {
    id: 3,
    slug: "3",
    title: "Sports Legends, Olympic Moments, World Records, and Athletic Achievements.",
    blurb: "Celebrate sporting excellence.",
    weekISO: "2023-11-13",
    colorHex: getQuizColor(3),
    status: "available",
    tags: ["Sports", "Olympics", "Records", "Athletics", "Achievement"]
  },
  {
    id: 2,
    slug: "2",
    title: "Mathematics Puzzles, Logic Problems, Number Patterns, and Brain Teasers.",
    blurb: "Exercise your logical mind.",
    weekISO: "2023-11-06",
    colorHex: getQuizColor(2),
    status: "available",
    tags: ["Math", "Logic", "Puzzles", "Patterns", "Brain Teasers"]
  },
  {
    id: 1,
    slug: "1",
    title: "Famous Inventions, Scientific Discoveries, Medical Breakthroughs, and Innovation.",
    blurb: "Celebrate human ingenuity.",
    weekISO: "2023-10-30",
    colorHex: getQuizColor(1),
    status: "available",
    tags: ["Inventions", "Science", "Medicine", "Innovation", "Discovery"]
  }
];

export default function QuizzesPage() {
	const [userName, setUserName] = useState<string | null>(null);
	const [mounted, setMounted] = useState(false);
	const [pageAnimationKey, setPageAnimationKey] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const pathname = usePathname();

	// Check authentication and get user name on client only to avoid hydration errors
	useEffect(() => {
		setMounted(true);
		
		if (typeof window !== 'undefined') {
			// Simulate loading delay for skeleton effect
			const loadingTimer = setTimeout(() => {
				// Check if user is logged in and get their name
				const isLoggedIn = storage.get('isLoggedIn', false);
				const name = getUserName();
				if (isLoggedIn && name) {
					setUserName(name);
				}
				
				setIsLoading(false);
				
				// Redirect logged-out users to latest quiz intro page
				if (!isLoggedIn) {
					// Redirect to latest quiz intro page (quiz #12)
					window.location.href = '/quizzes/12/intro';
				}
			}, 300); // Small delay to show skeleton
			
			return () => clearTimeout(loadingTimer);
		}
	}, []);

	// Force re-animation whenever the page is navigated to (including via menu)
	useEffect(() => {
		// Increment animation key whenever pathname changes to /quizzes
		if (pathname === '/quizzes') {
			setPageAnimationKey(prev => prev + 1);
		}
	}, [pathname]);

	return (
		<>
			<SiteHeader fadeLogo={true} />
			<main className="min-h-screen pt-24 pb-0">
				<div className="max-w-[1600px] mx-auto px-6 sm:px-6 lg:px-8 xl:px-12">
					{/* Page Title */}
					<div className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white text-center mb-16 min-h-[1.2em] flex items-center justify-center">
						<AnimatePresence mode="wait">
							{isLoading || !mounted ? (
								<motion.div
									key="skeleton-title"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="w-full max-w-md mx-auto"
								>
									<Skeleton variant="text" height={80} className="w-full" />
								</motion.div>
							) : (
								<motion.h1
									key={userName ? `greeting-${userName}` : 'default-title'}
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: 10 }}
									transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
									className="w-full"
								>
									{userName ? `G'day ${userName}!` : "Your Quizzes"}
								</motion.h1>
							)}
						</AnimatePresence>
					</div>
					
					{/* Quizzes Grid - Responsive with overlapping cards on mobile */}
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 md:gap-6">
						{isLoading ? (
							// Skeleton loading state
							<>
								<div className="hidden md:block">
									<SkeletonCard className="h-full" />
								</div>
								{Array.from({ length: 6 }).map((_, index) => (
									<motion.div
										key={`skeleton-${index}`}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ 
											duration: 0.3, 
											delay: index * 0.05,
											ease: [0.22, 1, 0.36, 1]
										}}
									>
										<SkeletonCard className="h-full" />
									</motion.div>
								))}
							</>
						) : (
							<>
								{/* Next Quiz Teaser Card */}
								<motion.div 
									className="hidden md:block h-full" 
									key={`teaser-${pageAnimationKey}`}
									initial={{ opacity: 0, y: 20, scale: 0.95 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									transition={{ 
										duration: 0.5, 
										delay: 0.1,
										ease: [0.22, 1, 0.36, 1],
										type: 'spring',
										stiffness: 200,
										damping: 20
									}}
								>
									<NextQuizTeaser latestQuizId={quizzes[0]?.id || 12} />
								</motion.div>
								
								{quizzes.map((quiz, index) => {
									const isNewest = index === 0;
									return (
										<motion.div 
											key={`quiz-${quiz.id}-${pageAnimationKey}`}
											className="h-auto sm:h-full"
											initial={{ opacity: 0, y: 20, scale: 0.95 }}
											animate={{ opacity: 1, y: 0, scale: 1 }}
											transition={{ 
												duration: 0.5, 
												delay: 0.1 + (index * 0.05), // Stagger by 50ms per card
												ease: [0.22, 1, 0.36, 1],
												type: 'spring',
												stiffness: 200,
												damping: 20
											}}
										>
											<QuizCard quiz={quiz} isNewest={isNewest} />
										</motion.div>
									);
								})}
							</>
						)}
					</div>
				</div>
			</main>

			<Footer />
		</>
	);
}
