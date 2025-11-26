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
import { QuizPlayer } from '@/components/quiz/QuizPlayer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { getQuizColor } from '@/lib/colors';

// Static generation settings
export const dynamic = 'force-static';
export const revalidate = 3600; // 1 hour

/**
 * Fetch quiz data from database or fallback to mock data
 * OPTIMIZATION: Removed hardcoded QUIZ_METADATA - now uses database as single source of truth
 */
async function getQuizData(slug: string) {
	// Special handling for demo quiz - redirect to /demo route
	if (slug === "demo") {
		redirect("/demo");
	}

	// Try database first
	try {
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
			// OPTIMIZATION: Use database metadata directly (no hardcoded fallback)
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
			return { quizData, metadata };
		}
	} catch (error) {
		// Database not available or error - fall back to mock data
		console.warn(`[Quiz Play Page] Database fetch failed for ${slug}, using mock data:`, error);
	}

	// Fallback to mock data (for development/testing)
	if (hasMockQuizData(slug)) {
		const quizData = getMockQuizData(slug);
		const metadata = {
			id: 0,
			slug: slug,
			title: quizData?.title || 'Quiz',
			blurb: '',
			weekISO: new Date().toISOString().split('T')[0],
			colorHex: getQuizColor(0),
			status: 'available',
		};
		
		if (quizData) {
			return { quizData, metadata };
		}
	}

	return null;
}

/**
 * OPTIMIZATION: Fetch newest quiz slug from database to determine isNewest
 * This replaces the hardcoded QUIZ_METADATA array lookup
 */
async function getNewestQuizSlug(): Promise<string | null> {
	try {
		const newestQuiz = await prisma.quiz.findFirst({
			where: {
				quizType: 'OFFICIAL',
				status: 'published',
				slug: { not: null },
			},
			select: { slug: true },
			orderBy: [
				{ weekISO: 'desc' },
				{ createdAt: 'desc' },
			],
		});
		return newestQuiz?.slug || null;
	} catch (error) {
		console.error('Error fetching newest quiz:', error);
		return null;
	}
}

export default async function QuizPlayPage({
	params,
}: {
	params: { slug: string };
}) {
	const { quizData, metadata } = await getQuizData(params.slug) || {};

	if (!quizData || !metadata) {
		notFound();
	}

	// OPTIMIZATION: Determine isNewest from database instead of hardcoded array
	const newestQuizSlug = await getNewestQuizSlug();
	const isNewest = newestQuizSlug === metadata.slug;

	return (
		<ErrorBoundary>
			<QuizPlayer
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

