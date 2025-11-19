/**
 * Quiz Session Service - Manages quiz progress and completion
 * 
 * Handles saving/loading quiz progress and completion data.
 * Currently uses localStorage as optimistic cache, but designed to work with API.
 */

export interface QuizProgress {
	currentIndex: number;
	correctAnswers: number[];
	incorrectAnswers: number[];
	viewedQuestions: number[];
	startedAt: string;
	lastUpdatedAt: string;
}

export interface QuizCompletion {
	score: number;
	totalQuestions: number;
	completedAt: string;
	timeSpent?: number; // in seconds
}

export class QuizSessionService {
	private static readonly PROGRESS_PREFIX = 'quiz-progress-';
	private static readonly COMPLETION_PREFIX = 'quiz-completion-';

	/**
	 * Save quiz progress (optimistic cache in localStorage)
	 * In production, this should also save to database
	 */
	static async saveProgress(quizSlug: string, progress: QuizProgress): Promise<void> {
		const key = `${this.PROGRESS_PREFIX}${quizSlug}`;
		
		// Save to localStorage as optimistic cache
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem(key, JSON.stringify(progress));
			} catch (error) {
				console.warn('Failed to save progress to localStorage:', error);
			}
		}

		// TODO: When database is ready, save to API
		// try {
		//   await fetch('/api/quiz/sessions', {
		//     method: 'POST',
		//     headers: { 'Content-Type': 'application/json' },
		//     body: JSON.stringify({ quizSlug, progress })
		//   })
		// } catch (error) {
		//   console.error('Failed to save progress to server:', error)
		//   // Continue with localStorage cache
		// }
	}

	/**
	 * Get quiz progress
	 * Tries API first, falls back to localStorage cache
	 */
	static async getProgress(quizSlug: string): Promise<QuizProgress | null> {
		// TODO: When database is ready, fetch from API first
		// try {
		//   const response = await fetch(`/api/quiz/sessions/${quizSlug}`)
		//   if (response.ok) {
		//     const data = await response.json()
		//     return data.progress
		//   }
		// } catch (error) {
		//   console.warn('Failed to fetch progress from server:', error)
		// }

		// Fallback to localStorage
		if (typeof window !== 'undefined') {
			try {
				const key = `${this.PROGRESS_PREFIX}${quizSlug}`;
				const cached = localStorage.getItem(key);
				if (cached) {
					return JSON.parse(cached) as QuizProgress;
				}
			} catch (error) {
				console.warn('Failed to load progress from localStorage:', error);
			}
		}

		return null;
	}

	/**
	 * Save quiz completion
	 */
	static async saveCompletion(quizSlug: string, completion: QuizCompletion): Promise<void> {
		const key = `${this.COMPLETION_PREFIX}${quizSlug}`;

		// Save to localStorage as optimistic cache
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem(key, JSON.stringify(completion));
			} catch (error) {
				console.warn('Failed to save completion to localStorage:', error);
			}
		}

		// TODO: When database is ready, save to API
		// try {
		//   await fetch('/api/quiz/completions', {
		//     method: 'POST',
		//     headers: { 'Content-Type': 'application/json' },
		//     body: JSON.stringify({ quizSlug, completion })
		//   })
		// } catch (error) {
		//   console.error('Failed to save completion to server:', error)
		// }
	}

	/**
	 * Get quiz completion
	 */
	static async getCompletion(quizSlug: string): Promise<QuizCompletion | null> {
		// TODO: When database is ready, fetch from API first
		// try {
		//   const response = await fetch(`/api/quiz/completions/${quizSlug}`)
		//   if (response.ok) {
		//     const data = await response.json()
		//     return data.completion
		//   }
		// } catch (error) {
		//   console.warn('Failed to fetch completion from server:', error)
		// }

		// Fallback to localStorage
		if (typeof window !== 'undefined') {
			try {
				const key = `${this.COMPLETION_PREFIX}${quizSlug}`;
				const cached = localStorage.getItem(key);
				if (cached) {
					return JSON.parse(cached) as QuizCompletion;
				}
			} catch (error) {
				console.warn('Failed to load completion from localStorage:', error);
			}
		}

		return null;
	}

	/**
	 * Clear progress for a quiz (useful for restarting)
	 */
	static clearProgress(quizSlug: string): void {
		if (typeof window !== 'undefined') {
			const key = `${this.PROGRESS_PREFIX}${quizSlug}`;
			localStorage.removeItem(key);
		}
	}

	/**
	 * Clear completion for a quiz
	 */
	static clearCompletion(quizSlug: string): void {
		if (typeof window !== 'undefined') {
			const key = `${this.COMPLETION_PREFIX}${quizSlug}`;
			localStorage.removeItem(key);
		}
	}
}

