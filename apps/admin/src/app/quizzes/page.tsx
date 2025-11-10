"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/SiteHeader";
import { QuizCard, Quiz } from "@/components/quiz/QuizCard";
import { NextQuizTeaser } from "@/components/quiz/NextQuizTeaser";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserAccess } from "@/contexts/UserAccessContext";
import { getQuizColor } from '@/lib/colors';

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
	const { isPremium, isVisitor } = useUserAccess();
	const [pageAnimationKey, setPageAnimationKey] = useState(0);
	const pathname = usePathname();

	// Redirect logged-out users to latest quiz intro page
	useEffect(() => {
		if (typeof window !== 'undefined') {
			// Use a small delay to ensure localStorage is accessible and context has loaded
			const checkAndRedirect = () => {
				const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
				if (!isLoggedIn) {
					// Redirect to latest quiz intro page (quiz #12)
					window.location.href = '/quizzes/12/intro';
				}
			};
			// Check immediately
			checkAndRedirect();
			// Also check after a brief delay in case of timing issues
			const timeoutId = setTimeout(checkAndRedirect, 100);
			return () => clearTimeout(timeoutId);
		}
	}, []);

	useEffect(() => {
		// Check if user is logged in and get their name
		if (typeof window !== 'undefined') {
			const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
			const name = localStorage.getItem('userName');
			if (isLoggedIn && name) {
				setUserName(name);
			}
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
			<SiteHeader fadeLogo={true} showUpgrade={true} />
			<main className="min-h-screen pt-24 pb-0">
				<div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
					{/* Page Title */}
					<motion.h1 
						id="page-title" 
						className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white text-center mb-16"
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
					>
						{userName ? `G'day ${userName}!` : "Your Quizzes"}
					</motion.h1>
					
					{/* Quizzes Grid - Responsive with overlapping cards on mobile */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 md:gap-6">
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
						<NextQuizTeaser latestQuizId={quizzes[quizzes.length - 1]?.id || 12} />
					</motion.div>
						
					{quizzes.map((quiz, index) => {
						const isNewest = index === 0;
						// Premium locked if not premium and not the newest quiz
						const isPremiumLocked = !isPremium && !isNewest && quiz.status === "available";
						return (
							<motion.div 
								key={`quiz-${quiz.id}-${pageAnimationKey}`}
								className="h-full"
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
					</div>

					{/* Subscribe CTA - Minimalist */}
					<motion.div 
						className="mt-24 mb-32 text-center px-4"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ 
							duration: 0.5, 
							delay: 0.1 + (quizzes.length * 0.05) + 0.2, // After all cards
							ease: [0.22, 1, 0.36, 1]
						}}
					>
						<h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
							Don't miss the next quiz
						</h2>
						<p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
							Subscribe to get this week's quiz delivered straight to your inbox every Monday morning.
						</p>
						<Link 
							href="/subscribe"
							className="inline-flex items-center justify-center px-8 py-4 text-base bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
						>
							3 Quizzes for Free
						</Link>
					</motion.div>
				</div>
			</main>

			<footer className="bg-gray-50 dark:bg-[#1A1A1A] border-t border-gray-200 dark:border-gray-800 py-16 px-4">
				<div className="max-w-7xl mx-auto">
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
						{/* Logo */}
						<div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
							The School Quiz
						</div>
						
						{/* Navigation Links */}
						<div className="flex flex-col md:flex-row gap-8 md:gap-12">
							<div className="flex flex-col gap-3">
								<Link href="/quizzes" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
									Quizzes
								</Link>
								<Link href="/about" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
									About
								</Link>
								<Link href="/contact" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
									Contact
								</Link>
							</div>
							<div className="flex flex-col gap-3">
								<Link href="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
									Privacy
								</Link>
								<Link href="/terms" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
									Terms
								</Link>
								<Link href="/help" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
									Help
								</Link>
							</div>
						</div>
					</div>
					
					{/* Copyright */}
					<div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
						<p>&copy; 2026 The School Quiz. All rights reserved.</p>
					</div>
				</div>
			</footer>
		</>
	);
}
