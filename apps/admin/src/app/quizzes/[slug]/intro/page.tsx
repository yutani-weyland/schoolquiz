/**
 * Server Component - Quiz Intro Page
 * OPTIMIZATION: Server-side rendering with database fetching for maximum performance
 */

import { notFound, redirect } from 'next/navigation';
import { prisma } from '@schoolquiz/db';
import { getQuizColor } from '@/lib/colors';
import QuizIntro from '@/components/quiz/QuizIntro';
import { Quiz } from '@/components/quiz/QuizCard';

// Enable dynamic rendering for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every minute

/**
 * Fetch quiz metadata (lightweight - no questions/rounds)
 * OPTIMIZATION: Only fetch what's needed for intro page
 */
async function getQuizMetadata(slug: string): Promise<Quiz | null> {
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
			},
		});

		if (!quiz) {
			return null;
		}

		return {
			id: quiz.slug ? parseInt(quiz.slug, 10) || 0 : 0,
			slug: quiz.slug || slug,
			title: quiz.title,
			blurb: quiz.blurb || '',
			weekISO: quiz.weekISO || new Date().toISOString().split('T')[0],
			colorHex: quiz.colorHex || getQuizColor(0),
			status: (quiz.status === 'published' || quiz.status === 'archived') ? 'available' : 'coming_soon',
		};
	} catch (error) {
		console.error(`[Quiz Intro] Error fetching quiz ${slug}:`, error);
		return null;
	}
}

/**
 * OPTIMIZATION: Fetch newest quiz slug in parallel with quiz metadata
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
		console.error('[Quiz Intro] Error fetching newest quiz:', error);
		return null;
	}
}

export default async function QuizIntroPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;

	// OPTIMIZATION: Fetch quiz metadata and newest slug in parallel
	const [quiz, newestQuizSlug] = await Promise.all([
		getQuizMetadata(slug),
		getNewestQuizSlug(),
	]);

	if (!quiz) {
		notFound();
	}

	const isNewest = newestQuizSlug === quiz.slug;

	return (
		<>
			{/* Set background color immediately to prevent flash */}
			<script
				dangerouslySetInnerHTML={{
					__html: `
						(function() {
							const quizColor = ${JSON.stringify(quiz.colorHex)};
							if (document.body) {
								document.body.style.setProperty('background-color', quizColor, 'important');
							}
							if (document.documentElement) {
								document.documentElement.style.setProperty('background-color', quizColor, 'important');
								document.documentElement.classList.remove('dark');
							}
						})();
					`,
				}}
			/>
			<QuizIntro quiz={quiz} isNewest={isNewest} />
		</>
	);
}
