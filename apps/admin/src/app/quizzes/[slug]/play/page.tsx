/**
 * Server Component for Quiz Play Page
 * 
 * This version fetches data on the server for better performance.
 * The QuizPlayer component remains a client component for interactivity.
 */

import { notFound, redirect } from 'next/navigation';
import { prisma } from '@schoolquiz/db';
import { transformQuizToPlayFormat, QuizWithRelations } from '@/lib/transformers/quizTransformers';
import { getMockQuizData, hasMockQuizData } from '@/lib/mock/quiz-fixtures';
import { QuizPlayerWrapper } from '@/components/quiz/QuizPlayerWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { getQuizColor } from '@/lib/colors';

// Static generation with ISR - QuizPlayerWrapper handles client-side hydration
export const dynamic = 'force-static';
export const revalidate = 3600; // 1 hour

interface QuizMetadata {
	id: number;
	slug: string;
	title: string;
	blurb: string;
	weekISO: string;
	colorHex: string;
	status: string;
}

// Hardcoded quiz metadata (fallback)
const QUIZ_METADATA: QuizMetadata[] = [
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
	{ id: 1, slug: "1", title: "Famous Inventions, Scientific Discoveries, Medical Breakthroughs, and Innovation.", blurb: "Celebrate human ingenuity.", weekISO: "2023-10-30", colorHex: getQuizColor(1), status: "available" },
];

/**
 * Fetch quiz data from database or fallback to mock data
 */
async function getQuizData(slug: string) {
	// Special handling for demo quiz - redirect to /demo route
	if (slug === "demo") {
		redirect("/demo");
	}

	// Try database first (if available)
	try {
		// Check if Prisma is available
		if (!prisma) {
			throw new Error('Prisma client not available');
		}
		
		// Try to find quiz by slug (could be official or custom)
		const quiz = await prisma.quiz.findUnique({
			where: { slug },
			include: {
				rounds: {
					include: {
						category: true,
						questions: {
							include: {
								question: true,
							},
							orderBy: {
								order: 'asc',
							},
						},
					},
					orderBy: {
						index: 'asc',
					},
				},
			},
		}) as QuizWithRelations | null;

		if (quiz) {
			const quizData = transformQuizToPlayFormat(quiz);
			
			// Handle custom quizzes differently
			if (quiz.quizType === 'CUSTOM') {
				const metadata = {
					id: 0,
					slug: quiz.slug || slug,
					title: quiz.title,
					blurb: quiz.blurb || '',
					weekISO: quiz.weekISO || new Date().toISOString().split('T')[0],
					colorHex: quiz.colorHex || getQuizColor(0),
					status: quiz.status,
					isCustom: true,
				};
				return { quizData, metadata };
			}
			
			// Official quiz
			const metadata = QUIZ_METADATA.find(q => q.slug === slug) || {
				id: 0,
				slug: quiz.slug || slug,
				title: quiz.title,
				blurb: quiz.blurb || '',
				weekISO: quiz.weekISO || '',
				colorHex: quiz.colorHex || getQuizColor(0),
				status: quiz.status,
			};
			return { quizData, metadata };
		}
	} catch (error) {
		// Database not available or error - fall back to mock data
		console.warn(`[Quiz Play Page] Database fetch failed for ${slug}, using mock data:`, error);
	}

	// Fallback to mock data
	if (hasMockQuizData(slug)) {
		const quizData = getMockQuizData(slug);
		const metadata = QUIZ_METADATA.find(q => q.slug === slug);
		
		if (quizData && metadata) {
			return { quizData, metadata };
		}
	}

	return null;
}

export default async function QuizPlayPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const { quizData, metadata } = await getQuizData(slug) || {};

	if (!quizData || !metadata) {
		notFound();
	}

	const isNewest = QUIZ_METADATA[0]?.slug === metadata.slug;

	return (
		<ErrorBoundary>
			<QuizPlayerWrapper
				quizTitle={metadata.title}
				quizColor={metadata.colorHex}
				quizSlug={metadata.slug}
				questions={quizData.questions}
				rounds={quizData.rounds}
				weekISO={metadata.weekISO}
				isNewest={isNewest}
			/>
		</ErrorBoundary>
	);
}

