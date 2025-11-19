/**
 * Quiz Validation Schemas
 * 
 * Zod schemas for validating quiz data structures.
 * Used in API routes, quiz builder, and data transformations.
 */

import { z } from 'zod';

// Import constants with fallback
let QUIZ_CONSTANTS: typeof import('@schoolquiz/db').QUIZ_CONSTANTS;
try {
	QUIZ_CONSTANTS = require('@schoolquiz/db').QUIZ_CONSTANTS;
} catch (e) {
	// Fallback constants if import fails
	QUIZ_CONSTANTS = {
		STANDARD_ROUND_COUNT: 4,
		QUESTIONS_PER_STANDARD_ROUND: 6,
		PEOPLE_ROUND_QUESTION_COUNT: 1,
		TOTAL_ROUNDS: 5,
		PEOPLES_ROUND_NUMBER: 5,
		TOTAL_QUESTIONS: 25,
		MAX_QUESTIONS_PER_STANDARD_ROUND: 6,
		MIN_QUESTIONS_PER_STANDARD_ROUND: 6,
	} as const;
}

/**
 * Question validation schema
 */
export const QuestionSchema = z.object({
	id: z.union([z.string(), z.number()]),
	question: z.string().min(1, 'Question text is required'),
	answer: z.string().min(1, 'Answer is required'),
	explanation: z.string().optional(),
	roundNumber: z.number().int().min(1).max(QUIZ_CONSTANTS.TOTAL_ROUNDS),
	submittedBy: z.string().optional(),
	submissionDisplayStyle: z.enum(['full', 'first_name', 'anonymous']).optional(),
});

/**
 * Round validation schema
 */
export const RoundSchema = z.object({
	number: z.number().int().min(1).max(QUIZ_CONSTANTS.TOTAL_ROUNDS),
	title: z.string().min(1, 'Round title is required'),
	blurb: z.string().optional(),
	questions: z.array(QuestionSchema),
});

/**
 * Quiz data validation schema (for play format)
 */
export const QuizDataSchema = z.object({
	questions: z.array(QuestionSchema).length(
		QUIZ_CONSTANTS.TOTAL_QUESTIONS,
		`Quiz must have exactly ${QUIZ_CONSTANTS.TOTAL_QUESTIONS} questions`
	),
	rounds: z.array(RoundSchema).length(
		QUIZ_CONSTANTS.TOTAL_ROUNDS,
		`Quiz must have exactly ${QUIZ_CONSTANTS.TOTAL_ROUNDS} rounds`
	),
});

/**
 * Quiz metadata schema (for quiz cards/listings)
 */
export const QuizMetadataSchema = z.object({
	id: z.union([z.string(), z.number()]),
	slug: z.string().min(1, 'Quiz slug is required'),
	title: z.string().min(1, 'Quiz title is required'),
	blurb: z.string().optional(),
	weekISO: z.string().optional(),
	colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color hex format').optional(),
	status: z.enum(['available', 'coming_soon', 'draft', 'published', 'scheduled']).optional(),
});

/**
 * Validate quiz structure
 */
export function validateQuizStructure(data: unknown): {
	valid: boolean;
	errors: string[];
	data?: z.infer<typeof QuizDataSchema>;
} {
	try {
		const validated = QuizDataSchema.parse(data);
		
		// Additional validation: check round structure
		const errors: string[] = [];
		
		// Check that rounds are numbered 1-5
		const roundNumbers = validated.rounds.map(r => r.number).sort((a, b) => a - b);
		for (let i = 1; i <= QUIZ_CONSTANTS.TOTAL_ROUNDS; i++) {
			if (!roundNumbers.includes(i)) {
				errors.push(`Missing round ${i}`);
			}
		}
		
		// Check question counts per round
		for (const round of validated.rounds) {
			const expectedCount = round.number === QUIZ_CONSTANTS.PEOPLES_ROUND_NUMBER
				? QUIZ_CONSTANTS.PEOPLE_ROUND_QUESTION_COUNT
				: QUIZ_CONSTANTS.QUESTIONS_PER_STANDARD_ROUND;
			
			if (round.questions.length !== expectedCount) {
				errors.push(
					`Round ${round.number} has ${round.questions.length} questions, expected ${expectedCount}`
				);
			}
			
			// Check that all questions in round have correct roundNumber
			for (const question of round.questions) {
				if (question.roundNumber !== round.number) {
					errors.push(
						`Question ${question.id} has roundNumber ${question.roundNumber} but is in round ${round.number}`
					);
				}
			}
		}
		
		if (errors.length > 0) {
			return { valid: false, errors };
		}
		
		return { valid: true, errors: [], data: validated };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				valid: false,
				errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
			};
		}
		return {
			valid: false,
			errors: [error instanceof Error ? error.message : 'Unknown validation error'],
		};
	}
}

/**
 * Validate quiz metadata
 */
export function validateQuizMetadata(data: unknown): {
	valid: boolean;
	errors: string[];
	data?: z.infer<typeof QuizMetadataSchema>;
} {
	try {
		const validated = QuizMetadataSchema.parse(data);
		return { valid: true, errors: [], data: validated };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				valid: false,
				errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
			};
		}
		return {
			valid: false,
			errors: [error instanceof Error ? error.message : 'Unknown validation error'],
		};
	}
}

/**
 * Type-safe quiz data
 */
export type ValidatedQuizData = z.infer<typeof QuizDataSchema>;
export type ValidatedQuizMetadata = z.infer<typeof QuizMetadataSchema>;
export type ValidatedQuestion = z.infer<typeof QuestionSchema>;
export type ValidatedRound = z.infer<typeof RoundSchema>;

