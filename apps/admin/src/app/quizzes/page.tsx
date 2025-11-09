"use client";

import React, { useState, useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { QuizCard, Quiz } from "@/components/quiz/QuizCard";
import { NextQuizTeaser } from "@/components/quiz/NextQuizTeaser";
import Link from "next/link";

import { getQuizColor } from '@/lib/colors';

const quizzes: Quiz[] = [
  {
    id: 279,
    slug: "279",
    title: "Shape Up, Pumpkins, Famous First Words, Crazes, and Next In Sequence.",
    blurb: "A weekly selection mixing patterns, pop culture and logic.",
    weekISO: "2024-01-15",
    colorHex: getQuizColor(279),
    status: "available",
    tags: ["Patterns", "Pop Culture", "Logic", "Famous Quotes", "Sequences"]
  },
  {
    id: 278,
    slug: "278",
    title: "Opposite Day, Lights, Common Ground, Robots Etc, and First Ladies.",
    blurb: "Wordplay meets trivia.",
    weekISO: "2024-01-08",
    colorHex: getQuizColor(278),
    status: "available",
    tags: ["Wordplay", "History", "Technology", "Politics", "General Knowledge"]
  },
  {
    id: 277,
    slug: "277",
    title: "Back to the Past, Name That Nation, Name the Other, Analog Games, and What Does It Stand For?",
    blurb: "History, geography and acronyms.",
    weekISO: "2024-01-01",
    colorHex: getQuizColor(277),
    status: "available",
    tags: ["History", "Geography", "Games", "Acronyms", "Trivia"]
  },
  {
    id: 276,
    slug: "276",
    title: "Holiday Trivia, Winter Sports, Year End Review, and Festive Fun.",
    blurb: "Seasonal mixed bag.",
    weekISO: "2023-12-25",
    colorHex: getQuizColor(276),
    status: "coming_soon",
    tags: ["Seasonal", "Sports", "Year Review", "Holidays", "Winter"]
  },
  {
    id: 275,
    slug: "275",
    title: "Movie Magic, Tech Trends, Sports Moments, and Pop Culture.",
    blurb: "Headlines and highlights.",
    weekISO: "2023-12-18",
    colorHex: getQuizColor(275),
    status: "available",
    tags: ["Movies", "Technology", "Sports", "Pop Culture", "Entertainment"]
  },
  {
    id: 274,
    slug: "274",
    title: "World Wonders, Historical Events, Science Facts, and Geography.",
    blurb: "Curiosities around the world.",
    weekISO: "2023-12-11",
    colorHex: getQuizColor(274),
    status: "available",
    tags: ["Science", "Geography", "History", "World Facts", "Nature"]
  }
];

export default function QuizzesPage() {
	const [userName, setUserName] = useState<string | null>(null);

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

	return (
		<>
			<SiteHeader fadeLogo={true} showUpgrade={true} />
			<main className="min-h-screen pt-24 pb-0">
				<div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
					{/* Page Title */}
					<h1 id="page-title" className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white text-center mb-16">
						{userName ? `G'day ${userName}!` : "Your Quizzes"}
					</h1>
					
					{/* Quizzes Grid - Responsive and spacious */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
						{/* Next Quiz Teaser Card */}
						<div className="hidden md:block h-full">
							<NextQuizTeaser />
						</div>
						
						{quizzes.map((quiz, index) => (
							<div key={quiz.id} className="h-full">
								<QuizCard quiz={quiz} isNewest={index === 0} />
							</div>
						))}
					</div>

					{/* Subscribe CTA - Minimalist */}
					<div className="mt-24 mb-32 text-center px-4">
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
					</div>
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
