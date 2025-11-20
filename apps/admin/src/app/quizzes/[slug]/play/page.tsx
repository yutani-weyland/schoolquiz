"use client";

import React, { useEffect, lazy, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { Quiz } from "@/components/quiz/QuizCard";
import { getQuizColor } from '@/lib/colors';
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useQuiz } from "@/hooks/useQuiz";
import { QuizLoadingSkeleton } from "@/components/quiz/QuizLoadingSkeleton";
import { QuizError } from "@/components/quiz/QuizError";
import { QuizNotFound } from "@/components/quiz/QuizNotFound";

// Lazy load QuizPlayer to reduce initial bundle size (~200-300KB saved)
const QuizPlayer = lazy(() => import("@/components/quiz/QuizPlayer").then(module => ({ default: module.QuizPlayer })));

const DATA: Quiz[] = [
	{ id: 12, slug: "12", title: "Shape Up, Pumpkins, Famous First Words, Crazes, and Next In Sequence.", blurb: "A weekly selection mixing patterns, pop culture and logic.", weekISO: "2024-01-15", colorHex: getQuizColor(12), status: "available" },
	{ id: 11, slug: "11", title: "Opposite Day, Lights, Common Ground, Robots Etc, and First Ladies.", blurb: "Wordplay meets trivia.", weekISO: "2024-01-08", colorHex: getQuizColor(11), status: "available" },
	{ id: 10, slug: "10", title: "Back to the Past, Name That Nation, Name the Other, Analog Games, and What Does It Stand For?", blurb: "History, geography and acronyms.", weekISO: "2024-01-01", colorHex: getQuizColor(10), status: "available" },
	{ id: 9, slug: "9", title: "Holiday Trivia, Winter Sports, Year End Review, and Festive Fun.", blurb: "Seasonal mixed bag.", weekISO: "2023-12-25", colorHex: getQuizColor(9), status: "available" },
	{ id: 8, slug: "8", title: "Movie Magic, Tech Trends, Sports Moments, and Pop Culture.", blurb: "Headlines and highlights.", weekISO: "2023-12-18", colorHex: getQuizColor(8), status: "available" },
	{ id: 7, slug: "7", title: "World Wonders, Historical Events, Science Facts, and Geography.", blurb: "Curiosities around the world.", weekISO: "2023-12-11", colorHex: getQuizColor(7), status: "available" },
	{ id: 6, slug: "6", title: "Literature Classics, Music Legends, Art Movements, and Cultural Icons.", blurb: "Explore the arts and humanities.", weekISO: "2023-12-04", colorHex: getQuizColor(6), status: "available" },
	{ id: 5, slug: "5", title: "Space Exploration, Ocean Depths, Animal Kingdom, and Natural Phenomena.", blurb: "Discover the wonders of nature.", weekISO: "2023-11-27", colorHex: getQuizColor(5), status: "available" },
	{ id: 4, slug: "4", title: "Food & Drink, Cooking Techniques, World Cuisines, and Culinary History.", blurb: "A feast for the mind.", weekISO: "2023-11-20", colorHex: getQuizColor(4), status: "available" },
	{ id: 3, slug: "3", title: "Sports Legends, Olympic Moments, World Records, and Athletic Achievements.", blurb: "Celebrate sporting excellence.", weekISO: "2023-11-13", colorHex: getQuizColor(3), status: "available" },
	{ id: 2, slug: "2", title: "Mathematics Puzzles, Logic Problems, Number Patterns, and Brain Teasers.", blurb: "Exercise your logical mind.", weekISO: "2023-11-06", colorHex: getQuizColor(2), status: "available" },
	{ id: 1, slug: "1", title: "Famous Inventions, Scientific Discoveries, Medical Breakthroughs, and Innovation.", blurb: "Celebrate human ingenuity.", weekISO: "2023-10-30", colorHex: getQuizColor(1), status: "available" }
];

// Quiz data is now fetched via useQuiz hook from centralized fixtures
// Static generation is handled in layout.tsx

export default function QuizPlayPage() {
	const params = useParams();
	const router = useRouter();
	const slug = String(params?.slug ?? "");
	const quiz = DATA.find((q) => q.slug === slug);
	const { data: quizData, loading, error, refetch } = useQuiz(slug);
	
	// Special handling for demo quiz - redirect to /demo route
	useEffect(() => {
		if (slug === "demo") {
			router.replace("/demo");
			return;
		}
	}, [slug, router]);
	
	// Redirect if quiz metadata not found (but not for demo, which is handled above)
	useEffect(() => {
		if (slug !== "demo" && !quiz) {
			router.replace("/quizzes");
		}
	}, [quiz, router, slug]);

	// Show loading state
	if (loading) {
		return <QuizLoadingSkeleton />;
	}

	// Show error state
	if (error) {
		return <QuizError error={error} onRetry={refetch} slug={slug} />;
	}

	// Show not found if no quiz data (but not for demo)
	if (slug !== "demo" && (!quiz || !quizData)) {
		return <QuizNotFound slug={slug} />;
	}

	// For demo quiz, show loading while redirecting
	if (slug === "demo") {
		return <QuizLoadingSkeleton />;
	}

	// Ensure quiz and quizData exist before accessing their properties
	if (!quiz || !quizData) {
		return <QuizNotFound slug={slug} />;
	}

	const isNewest = DATA[0].slug === quiz.slug;

	return (
		<ErrorBoundary>
			<Suspense fallback={<QuizLoadingSkeleton />}>
				<QuizPlayer
					quizTitle={quiz.title}
					quizColor={quiz.colorHex}
					quizSlug={quiz.slug}
					questions={quizData.questions}
					rounds={quizData.rounds}
					weekISO={quiz.weekISO}
					isNewest={isNewest}
				/>
			</Suspense>
		</ErrorBoundary>
	);
}
