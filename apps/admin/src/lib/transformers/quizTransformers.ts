/**
 * Quiz Data Transformers
 * 
 * Transformers to convert between Prisma database types and component types.
 * This allows seamless integration when switching from mock data to database.
 */

import { Quiz, Round, Question, QuizRoundQuestion } from '@prisma/client';
import { QuizQuestion, QuizRound } from '@/components/quiz/play/types';
import { QUIZ_CONSTANTS } from '@schoolquiz/db';

// Extended Prisma types with relations
export type QuizWithRelations = Quiz & {
	rounds: (Round & {
		category: {
			id: string;
			name: string;
		};
		questions: (QuizRoundQuestion & {
			question: Question;
		})[];
	})[];
};

/**
 * Transform Prisma Question to component QuizQuestion
 */
export function transformQuestionToComponent(
	prismaQuestion: Question,
	roundNumber: number
): QuizQuestion {
	return {
		id: parseInt(prismaQuestion.id, 36) || 0, // Convert CUID to number (fallback)
		question: prismaQuestion.text,
		answer: prismaQuestion.answer,
		roundNumber,
		// Optional fields
		...(prismaQuestion.explanation && { explanation: prismaQuestion.explanation }),
		...(prismaQuestion.isPeopleQuestion && { isPeopleQuestion: true }),
	};
}

/**
 * Transform Prisma Round to component QuizRound
 */
export function transformRoundToComponent(
	prismaRound: Round & {
		category?: {
			id: string;
			name: string;
		};
		questions: (QuizRoundQuestion & {
			question: Question;
		})[];
	}
): QuizRound {
	// Sort questions by order
	const sortedQuestions = [...prismaRound.questions].sort((a, b) => a.order - b.order);

	return {
		number: prismaRound.index + 1, // Prisma uses 0-indexed, component uses 1-indexed
		title: prismaRound.title || prismaRound.category?.name || 'Untitled Round',
		blurb: prismaRound.blurb || '',
		// Note: questions are not part of QuizRound type - they belong to the Quiz object
	};
}

/**
 * Transform Prisma Quiz to component format
 */
export function transformQuizToPlayFormat(prismaQuiz: QuizWithRelations): {
	questions: QuizQuestion[];
	rounds: QuizRound[];
} {
	// Sort rounds by index
	const sortedRounds = [...prismaQuiz.rounds].sort((a, b) => a.index - b.index);

	// Transform rounds
	const rounds: QuizRound[] = sortedRounds.map(transformRoundToComponent);

	// Flatten all questions from all rounds
	const questions: QuizQuestion[] = [];
	for (const round of sortedRounds) {
		const sortedQuestions = [...round.questions].sort((a, b) => a.order - b.order);
		for (const qrq of sortedQuestions) {
			questions.push(transformQuestionToComponent(qrq.question, round.index + 1));
		}
	}

	return {
		questions,
		rounds,
	};
}

/**
 * Transform component QuizQuestion to Prisma Question format
 * (For creating/updating questions)
 */
export function transformQuestionToPrisma(
	componentQuestion: QuizQuestion,
	categoryId: string,
	createdBy: string,
	options?: {
		createdByUserId?: string | null;
		quizId?: string | null;
		isCustom?: boolean;
	}
): Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsedAt' | 'isUsed'> {
	return {
		text: componentQuestion.question,
		answer: componentQuestion.answer,
		explanation: null,
		difficulty: 0.5, // Default difficulty
		tags: '',
		status: 'published',
		createdBy,
		categoryId,
		createdByUserId: options?.createdByUserId ?? null,
		quizId: options?.quizId ?? null,
		isCustom: options?.isCustom ?? false,
		isPeopleQuestion: componentQuestion.roundNumber === QUIZ_CONSTANTS.PEOPLES_ROUND_NUMBER,
	};
}

/**
 * Transform component QuizRound to Prisma Round format
 * (For creating/updating rounds)
 */
export function transformRoundToPrisma(
	componentRound: QuizRound,
	quizId: string,
	categoryId: string,
	index: number
): Omit<Round, 'id'> {
	return {
		quizId,
		index,
		categoryId,
		title: componentRound.title,
		blurb: componentRound.blurb || null,
		targetDifficulty: null,
		isPeoplesRound: index === QUIZ_CONSTANTS.PEOPLES_ROUND_NUMBER - 1,
	};
}

/**
 * Helper to convert CUID to number for component compatibility
 * This is a temporary solution - ideally components should use string IDs
 */
export function cuidToNumber(cuid: string): number {
	// Simple hash function to convert CUID to number
	// This is not perfect but works for mock data compatibility
	let hash = 0;
	for (let i = 0; i < cuid.length; i++) {
		const char = cuid.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash);
}

/**
 * Helper to convert number to CUID-like string
 * (Reverse transformation for compatibility)
 */
export function numberToCuid(num: number): string {
	// This is a placeholder - in reality, you'd generate a proper CUID
	// For now, just prefix with a string to make it look like a CUID
	return `q${num.toString(36)}`;
}

