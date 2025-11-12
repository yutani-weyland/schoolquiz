/**
 * Deterministic start button label logic
 * No flicker - computes label synchronously from props
 */

export type RunMode = "live" | "practice";

export function getStartLabel(mode: RunMode): string {
	return mode === "practice" ? "Try Quiz" : "Play Quiz";
}

/**
 * Get start label for QuizIntro component
 * Determines label based on user state and quiz access
 */
export function getQuizIntroStartLabel(options: {
	isLoggedIn: boolean;
	isPremium: boolean;
	hasExceededFreeQuizzes: boolean;
	isNewest: boolean;
}): string {
	const { isLoggedIn, isPremium, hasExceededFreeQuizzes, isNewest } = options;
	
	// Visitors always see "Try Quiz"
	if (!isLoggedIn) {
		return "Try Quiz";
	}
	
	// Premium users or users with access see "Play Quiz"
	if (isPremium || (!hasExceededFreeQuizzes && isNewest)) {
		return "Play Quiz";
	}
	
	// Restricted users see upgrade/premium messages (handled separately)
	return "Play Quiz"; // Fallback, but should not be shown
}

