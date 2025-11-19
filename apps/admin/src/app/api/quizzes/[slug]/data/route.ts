import { NextRequest, NextResponse } from 'next/server';
import { getMockQuizData, hasMockQuizData } from '@/lib/mock/quiz-fixtures';
import { validateQuizStructure } from '@/lib/validation/quizValidation';

/**
 * GET /api/quizzes/[slug]/data
 * 
 * Returns quiz data (questions and rounds) for a given slug.
 * Currently uses mock data, but can be updated to fetch from database.
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> }
) {
	try {
		const { slug } = await params;

		// TODO: When database is ready, fetch from database here
		// const quiz = await db.quiz.findUnique({ where: { slug }, include: { rounds: { include: { questions: true } } } })
		// if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
		// return NextResponse.json(transformQuizToPlayFormat(quiz))

		// For now, use mock data
		if (!hasMockQuizData(slug)) {
			return NextResponse.json(
				{ error: 'Quiz not found' },
				{ status: 404 }
			);
		}

		const quizData = getMockQuizData(slug);
		if (!quizData) {
			return NextResponse.json(
				{ error: 'Quiz not found' },
				{ status: 404 }
			);
		}

		// Validate quiz structure
		const validation = validateQuizStructure(quizData);
		if (!validation.valid) {
			console.error(`[Quiz API] Validation failed for quiz ${slug}:`, validation.errors);
			// Still return data but log validation errors
			// In production, you might want to return 500 or fix the data
		}

		return NextResponse.json(quizData);
	} catch (error) {
		console.error('Error fetching quiz data:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch quiz data', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
}

