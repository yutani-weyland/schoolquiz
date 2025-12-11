import { NextRequest, NextResponse } from 'next/server';
import { QuizService } from '@/services/quizService';
import { validateQuizStructure } from '@/lib/validation/quizValidation';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/quizzes/[slug]/data
 * 
 * Returns quiz data (questions and rounds) for a given slug.
 * Uses QuizService which handles database queries with mock data fallback.
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> }
) {
	try {
		const { slug } = await params;

		// Require authentication
		// Note: We might want to allow public access for published quizzes in the future,
		// but for now we'll require auth for all API access to be safe.
		// The QuizService will handle granular permissions (draft vs published).
		const user = await requireAuth();

		// Use QuizService which handles database + mock data fallback
		const quizData = await QuizService.getQuizBySlug(slug, user);

		// Validate quiz structure
		const validation = validateQuizStructure(quizData);
		if (!validation.valid) {
			console.error(`[Quiz API] Validation failed for quiz ${slug}:`, validation.errors);
			// Still return data but log validation errors
			// In production, you might want to return 500 or fix the data
		}

		return NextResponse.json(quizData);
	} catch (error) {
		console.error('[Quiz API] Error fetching quiz data:', error);

		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if it's a "not found" error
		if (error instanceof Error && error.message.includes('not found')) {
			return NextResponse.json(
				{ error: 'Quiz not found' },
				{ status: 404 }
			);
		}

		return NextResponse.json(
			{
				error: 'Failed to fetch quiz data',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
}

