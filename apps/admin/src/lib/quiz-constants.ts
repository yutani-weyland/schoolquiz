/**
 * Quiz Constants (Client-Safe)
 * 
 * Client-side constants for quiz structure.
 * Extracted from @schoolquiz/db to avoid Prisma client initialization in browser.
 */

/**
 * Standard quiz structure:
 * - 4 standard rounds with 6 questions each (24 questions)
 * - 1 people's round with 1 question
 * - Total: 25 questions
 */
export const QUIZ_CONSTANTS = {
	/** Number of standard rounds in a quiz */
	STANDARD_ROUND_COUNT: 4,
	
	/** Number of questions per standard round */
	QUESTIONS_PER_STANDARD_ROUND: 6,
	
	/** Number of questions in the people's round */
	PEOPLE_ROUND_QUESTION_COUNT: 1,
	
	/** Total number of rounds (standard + people's) */
	TOTAL_ROUNDS: 5,
	
	/** Round number for the people's round (1-indexed) */
	PEOPLES_ROUND_NUMBER: 5,
	
	/** Total number of questions in a complete quiz */
	TOTAL_QUESTIONS: 25, // (4 * 6) + 1
	
	/** Maximum number of questions in a standard round */
	MAX_QUESTIONS_PER_STANDARD_ROUND: 6,
	
	/** Minimum number of questions in a standard round */
	MIN_QUESTIONS_PER_STANDARD_ROUND: 6,
} as const;

