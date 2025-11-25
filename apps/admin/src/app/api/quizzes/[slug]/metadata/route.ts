import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';
import { getQuizColor } from '@/lib/colors';

/**
 * GET /api/quizzes/[slug]/metadata
 * 
 * Returns lightweight quiz metadata (no questions/rounds data).
 * Used for faster initial loads and prefetching.
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> }
) {
	try {
		const { slug } = await params;

		// Try database first
		try {
			const quiz = await prisma.quiz.findUnique({
				where: { slug },
				select: {
					id: true,
					slug: true,
					title: true,
					blurb: true,
					weekISO: true,
					colorHex: true,
					status: true,
					quizType: true,
					_count: {
						select: {
							rounds: true,
						},
					},
				},
			});

			if (quiz) {
				return NextResponse.json({
					id: quiz.id,
					slug: quiz.slug,
					title: quiz.title,
					blurb: quiz.blurb,
					weekISO: quiz.weekISO,
					colorHex: quiz.colorHex || getQuizColor(0),
					status: quiz.status,
					quizType: quiz.quizType,
					roundCount: quiz._count.rounds,
				});
			}
		} catch (error) {
			// Database not available or error - fall back to metadata lookup
			console.warn(`[Quiz Metadata API] Database fetch failed for ${slug}:`, error);
		}

		// Fallback: Return basic metadata from hardcoded list
		// This matches the pattern used in quiz pages
		const QUIZ_METADATA = [
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

		const metadata = QUIZ_METADATA.find(q => q.slug === slug);
		if (metadata) {
			return NextResponse.json({
				...metadata,
				roundCount: 5, // Standard round count
			});
		}

		return NextResponse.json(
			{ error: 'Quiz not found' },
			{ status: 404 }
		);
	} catch (error) {
		console.error('[Quiz Metadata API] Error fetching quiz metadata:', error);
		
		return NextResponse.json(
			{ 
				error: 'Failed to fetch quiz metadata', 
				details: error instanceof Error ? error.message : 'Unknown error' 
			},
			{ status: 500 }
		);
	}
}

