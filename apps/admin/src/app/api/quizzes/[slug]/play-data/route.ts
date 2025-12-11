/**
 * OPTIMIZED API Route: GET /api/quizzes/[slug]/play-data
 * 
 * Returns quiz play data (questions and rounds) with aggressive caching.
 * This endpoint is optimized for speed with selective field fetching.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';
import { transformQuizToPlayFormat, QuizWithRelations } from '@/lib/transformers/quizTransformers';
import { getQuizColor } from '@/lib/colors';

// Aggressive caching headers
export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> }
) {
	const startTime = Date.now();
	const { slug } = await params;

	try {
		// OPTIMIZATION: Selective field fetching - only what's needed for quiz play
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
				rounds: {
					select: {
						id: true,
						index: true,
						title: true,
						blurb: true,
						isPeoplesRound: true,
						category: {
							select: {
								id: true,
								name: true,
							},
						},
						questions: {
							select: {
								id: true,
								order: true,
								question: {
									select: {
										id: true,
										text: true,
										answer: true,
										explanation: true,
										isPeopleQuestion: true,
									},
								},
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

		if (!quiz) {
			return NextResponse.json(
				{ error: 'Quiz not found' },
				{ status: 404 }
			);
		}

		// Validate quiz has questions
		const totalQuestions = quiz.rounds.reduce(
			(sum, round) => sum + round.questions.length,
			0
		);

		if (totalQuestions === 0) {
			return NextResponse.json(
				{ error: 'Quiz has no questions' },
				{ status: 400 }
			);
		}

		const transformStart = Date.now();
		const quizData = transformQuizToPlayFormat(quiz);
		const transformTime = Date.now() - transformStart;

		const metadata = {
			id: quiz.slug ? parseInt(quiz.slug, 10) || 0 : 0,
			slug: quiz.slug || slug,
			title: quiz.title,
			blurb: quiz.blurb || '',
			weekISO: quiz.weekISO || new Date().toISOString().split('T')[0],
			colorHex: quiz.colorHex || getQuizColor(0),
			status: quiz.status,
			isCustom: quiz.quizType === 'CUSTOM',
		};

		const totalTime = Date.now() - startTime;
		console.log(`[Quiz Play API] ${slug} took ${totalTime}ms (DB: ${totalTime - transformTime}ms, Transform: ${transformTime}ms)`);

		const response = NextResponse.json({
			quizData,
			metadata,
		});

		// Aggressive caching headers
		response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

		return response;
	} catch (error) {
		console.error(`[Quiz Play API] Error fetching quiz ${slug}:`, error);
		return NextResponse.json(
			{ 
				error: 'Failed to fetch quiz data',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
}







