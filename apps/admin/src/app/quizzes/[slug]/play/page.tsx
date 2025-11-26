/**
 * Server Component for Quiz Play Page
 * 
 * OPTIMIZATION: Maximum performance with parallel queries, selective field fetching,
 * and aggressive caching strategies.
 */

import { notFound, redirect } from 'next/navigation';
import { prisma } from '@schoolquiz/db';
import { transformQuizToPlayFormat, QuizWithRelations } from '@/lib/transformers/quizTransformers';
import { getMockQuizData, hasMockQuizData } from '@/lib/mock/quiz-fixtures';
import { QuizPlayerWrapper } from '@/components/quiz/QuizPlayerWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { getQuizColor } from '@/lib/colors';

// Enable dynamic rendering for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 300; // Revalidate every 5 minutes

/**
 * OPTIMIZATION: Fetch quiz data with selective field fetching
 * Only fetches fields needed for quiz play - reduces payload size significantly
 */
async function getQuizData(slug: string) {
	const startTime = Date.now();
	
	// Special handling for demo quiz - redirect to /demo route
	if (slug === "demo") {
		redirect("/demo");
	}

	// Try database first (if available)
	try {
		if (!prisma) {
			throw new Error('Prisma client not available');
		}
		
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

		if (quiz) {
			const dbTime = Date.now() - startTime;
			console.log(`[Quiz Play] Database fetch for ${slug} took ${dbTime}ms`);
			
			const transformStart = Date.now();
			const quizData = transformQuizToPlayFormat(quiz);
			const transformTime = Date.now() - transformStart;
			console.log(`[Quiz Play] Transform for ${slug} took ${transformTime}ms`);
			
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
			console.log(`[Quiz Play] Total getQuizData for ${slug} took ${totalTime}ms (DB: ${dbTime}ms, Transform: ${transformTime}ms)`);
			
			return { quizData, metadata };
		}
	} catch (error) {
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
 * Uses minimal select for maximum speed
 */
async function getNewestQuizSlug(): Promise<string | null> {
	const startTime = Date.now();
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
		const duration = Date.now() - startTime;
		if (duration > 50) {
			console.log(`[Quiz Play] getNewestQuizSlug took ${duration}ms (slow)`);
		}
		return newestQuiz?.slug || null;
	} catch (error) {
		console.error('Error fetching newest quiz:', error);
		return null;
	}
}

export default async function QuizPlayPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const pageStartTime = Date.now();
	const { slug } = await params;
	
	// OPTIMIZATION: Fetch quiz data and newest slug in parallel (no waterfall!)
	const [quizResult, newestQuizSlug] = await Promise.all([
		getQuizData(slug),
		getNewestQuizSlug(),
	]);

	const { quizData, metadata } = quizResult || {};

	if (!quizData || !metadata) {
		notFound();
	}

	// Validate that quiz has questions - redirect to quizzes page if empty
	if (!quizData.questions || quizData.questions.length === 0) {
		console.warn(`[Quiz Play Page] Quiz ${slug} has no questions, redirecting to quizzes page`);
		redirect('/quizzes');
	}

	const isNewest = newestQuizSlug === metadata.slug;
	
	const totalPageTime = Date.now() - pageStartTime;
	console.log(`[Quiz Play] Total page render for ${slug} took ${totalPageTime}ms`);

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
