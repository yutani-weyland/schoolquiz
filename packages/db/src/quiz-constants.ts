/**
 * Quiz Constants
 * 
 * Centralized constants for quiz structure and validation.
 * Used across admin, web, and API layers for consistency.
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

/**
 * Type-safe access to quiz constants
 */
export type QuizConstants = typeof QUIZ_CONSTANTS;

/**
 * Helper functions for quiz structure validation
 */
export const QuizStructure = {
	/**
	 * Check if a round number is valid (1-5)
	 */
	isValidRoundNumber(roundNumber: number): boolean {
		return roundNumber >= 1 && roundNumber <= QUIZ_CONSTANTS.TOTAL_ROUNDS;
	},
	
	/**
	 * Check if a round is the people's round
	 */
	isPeoplesRound(roundNumber: number): boolean {
		return roundNumber === QUIZ_CONSTANTS.PEOPLES_ROUND_NUMBER;
	},
	
	/**
	 * Check if a round is a standard round
	 */
	isStandardRound(roundNumber: number): boolean {
		return roundNumber >= 1 && roundNumber <= QUIZ_CONSTANTS.STANDARD_ROUND_COUNT;
	},
	
	/**
	 * Get expected question count for a round
	 */
	getExpectedQuestionCount(roundNumber: number): number {
		if (this.isPeoplesRound(roundNumber)) {
			return QUIZ_CONSTANTS.PEOPLE_ROUND_QUESTION_COUNT;
		}
		if (this.isStandardRound(roundNumber)) {
			return QUIZ_CONSTANTS.QUESTIONS_PER_STANDARD_ROUND;
		}
		return 0;
	},
	
	/**
	 * Validate quiz structure
	 */
	validateQuizStructure(rounds: Array<{ number: number; questions: unknown[] }>): {
		valid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];
		
		// Check total rounds
		if (rounds.length !== QUIZ_CONSTANTS.TOTAL_ROUNDS) {
			errors.push(
				`Quiz must have exactly ${QUIZ_CONSTANTS.TOTAL_ROUNDS} rounds (${QUIZ_CONSTANTS.STANDARD_ROUND_COUNT} standard + 1 people's round)`
			);
		}
		
		// Check each round
		for (const round of rounds) {
			const expected = this.getExpectedQuestionCount(round.number);
			if (round.questions.length !== expected) {
				errors.push(
					`Round ${round.number} must have exactly ${expected} question${expected !== 1 ? 's' : ''}`
				);
			}
		}
		
		// Check for people's round
		const hasPeoplesRound = rounds.some(r => this.isPeoplesRound(r.number));
		if (!hasPeoplesRound) {
			errors.push(`Quiz must include a people's round (round ${QUIZ_CONSTANTS.PEOPLES_ROUND_NUMBER})`);
		}
		
		return {
			valid: errors.length === 0,
			errors,
		};
	},
};

