/**
 * useQuizPlay hook - Manages quiz play state and navigation
 * 
 * Handles question navigation, answer tracking, screen management, and completion.
 */

import { useState, useCallback, useEffect } from 'react';
import { QuizQuestion, QuizRound } from '@/components/quiz/play/types';
import { QuizSessionService, QuizProgress } from '@/services/quizSessionService';

export type ScreenType = 'round-intro' | 'question';
export type ViewMode = 'presenter' | 'grid';

export interface UseQuizPlayOptions {
	quizSlug: string;
	questions: QuizQuestion[];
	rounds: QuizRound[];
	isDemo?: boolean;
	maxQuestions?: number;
	onDemoComplete?: (score: number, totalQuestions: number) => void;
}

export interface UseQuizPlayResult {
	// State
	currentIndex: number;
	currentRound: number;
	currentScreen: ScreenType;
	viewMode: ViewMode;
	viewedQuestions: Set<number>;
	revealedAnswers: Set<number>;
	correctAnswers: Set<number>;
	incorrectAnswers: Set<number>;
	
	// Current question info
	currentQuestion: QuizQuestion | undefined;
	isAnswerRevealed: boolean;
	isMarkedCorrect: boolean;
	isQuestionAnswered: boolean;
	canGoNext: boolean;
	canGoPrevious: boolean;
	
	// Actions
	goToNext: () => void;
	goToPrevious: () => void;
	goToIndex: (index: number) => void;
	revealAnswer: () => void;
	hideAnswer: () => void;
	markCorrect: (id: number) => void;
	unmarkCorrect: (id: number) => void;
	switchToGridView: () => void;
	switchToPresenterView: () => void;
	startRound: () => void;
	finishQuiz: () => void;
	reset: () => void;
	
	// Completion
	isComplete: boolean;
	score: number;
	showCompletionModal: boolean;
	setShowCompletionModal: (show: boolean) => void;
	showIncompleteModal: boolean;
	setShowIncompleteModal: (show: boolean) => void;
}

const RESTRICTED_ANSWER_LIMIT = 6;

/**
 * Hook to manage quiz play state
 */
export function useQuizPlay({
	quizSlug,
	questions,
	rounds,
	isDemo = false,
	maxQuestions,
	onDemoComplete,
}: UseQuizPlayOptions): UseQuizPlayResult {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [currentRound, setCurrentRound] = useState(1);
	const [currentScreen, setCurrentScreen] = useState<ScreenType>('round-intro');
	const [viewMode, setViewMode] = useState<ViewMode>('presenter');
	const [viewedQuestions, setViewedQuestions] = useState<Set<number>>(new Set());
	const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
	const [correctAnswers, setCorrectAnswers] = useState<Set<number>>(new Set());
	const [incorrectAnswers, setIncorrectAnswers] = useState<Set<number>>(new Set());
	const [showCompletionModal, setShowCompletionModal] = useState(false);
	const [showIncompleteModal, setShowIncompleteModal] = useState(false);

	// Load progress from session service
	useEffect(() => {
		QuizSessionService.getProgress(quizSlug).then((progress) => {
			if (progress) {
				setCurrentIndex(progress.currentIndex);
				setCorrectAnswers(new Set(progress.correctAnswers));
				setIncorrectAnswers(new Set(progress.incorrectAnswers));
				setViewedQuestions(new Set(progress.viewedQuestions));
			}
		}).catch((error) => {
			console.error('[useQuizPlay] Error loading progress:', error);
			// Continue without progress - don't block rendering
		});
	}, [quizSlug]);

	// Save progress periodically
	useEffect(() => {
		const progress: QuizProgress = {
			currentIndex,
			correctAnswers: Array.from(correctAnswers),
			incorrectAnswers: Array.from(incorrectAnswers),
			viewedQuestions: Array.from(viewedQuestions),
			startedAt: new Date().toISOString(),
			lastUpdatedAt: new Date().toISOString(),
		};
		QuizSessionService.saveProgress(quizSlug, progress);
	}, [quizSlug, currentIndex, correctAnswers, incorrectAnswers, viewedQuestions]);

	// Safety check - ensure questions array exists and has items
	if (!questions || questions.length === 0) {
		console.warn('[useQuizPlay] No questions provided');
	}

	const currentQuestion = questions && questions.length > 0 ? questions[currentIndex] : undefined;
	const isAnswerRevealed = currentQuestion ? revealedAnswers.has(currentQuestion.id) : false;
	const isMarkedCorrect = currentQuestion ? correctAnswers.has(currentQuestion.id) : false;
	const isQuestionAnswered = currentQuestion
		? correctAnswers.has(currentQuestion.id) || incorrectAnswers.has(currentQuestion.id)
		: false;

	const canGoNext = questions && questions.length > 0 ? currentIndex < questions.length - 1 : false;
	const canGoPrevious = currentIndex > 0;

	const revealAnswer = useCallback(() => {
		if (currentQuestion) {
			setRevealedAnswers((prev) => new Set([...prev, currentQuestion.id]));
		}
	}, [currentQuestion]);

	const hideAnswer = useCallback(() => {
		if (currentQuestion) {
			setRevealedAnswers((prev) => {
				const next = new Set(prev);
				next.delete(currentQuestion.id);
				return next;
			});
		}
	}, [currentQuestion]);

	const markCorrect = useCallback(
		(id: number) => {
			setCorrectAnswers((prev) => new Set([...prev, id]));
			setIncorrectAnswers((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
		},
		[]
	);

	const unmarkCorrect = useCallback((id: number) => {
		setCorrectAnswers((prev) => {
			const next = new Set(prev);
			next.delete(id);
			return next;
		});
		setIncorrectAnswers((prev) => new Set([...prev, id]));
	}, []);

	const startRound = useCallback(() => {
		setCurrentScreen('question');
	}, []);

	const goToNext = useCallback(() => {
		const nextIndex = currentIndex + 1;

		// In restricted quiz mode with maxQuestions
		if (isDemo && maxQuestions && nextIndex >= maxQuestions) {
			const score = correctAnswers.size;
			if (onDemoComplete) {
				onDemoComplete(score, maxQuestions);
			}
			return;
		}

		if (nextIndex < questions.length) {
			const nextQuestion = questions[nextIndex];
			// Check if we're moving to a new round
			if (nextQuestion.roundNumber !== currentQuestion?.roundNumber) {
				setCurrentRound(nextQuestion.roundNumber);
				setCurrentScreen('round-intro');
			} else {
				setCurrentScreen('question');
			}
			setCurrentIndex(nextIndex);
			setViewedQuestions((prev) => new Set([...prev, nextQuestion.id]));
		} else if (isDemo && onDemoComplete) {
			// Reached end of demo questions
			const score = correctAnswers.size;
			onDemoComplete(score, questions.length);
		} else if (!isDemo && nextIndex >= questions.length) {
			// Reached end - check if all questions answered
			const allAnswered = questions.every(
				(q) => correctAnswers.has(q.id) || incorrectAnswers.has(q.id)
			);
			if (allAnswered) {
				setShowCompletionModal(true);
			} else {
				setShowIncompleteModal(true);
			}
		}
	}, [
		currentIndex,
		currentQuestion,
		questions,
		isDemo,
		maxQuestions,
		correctAnswers,
		onDemoComplete,
	]);

	const goToPrevious = useCallback(() => {
		if (currentIndex > 0) {
			const prevIndex = currentIndex - 1;
			const prevQuestion = questions[prevIndex];
			// When going left, skip round-intro screens - always go directly to question
			setCurrentRound(prevQuestion.roundNumber);
			setCurrentScreen('question');
			setCurrentIndex(prevIndex);
			setViewedQuestions((prev) => new Set([...prev, prevQuestion.id]));
		}
	}, [currentIndex, questions]);

	const goToIndex = useCallback((index: number) => {
		if (index >= 0 && index < questions.length) {
			const question = questions[index];
			setCurrentRound(question.roundNumber);
			setCurrentScreen('question');
			setCurrentIndex(index);
			setViewedQuestions((prev) => new Set([...prev, question.id]));
		}
	}, [questions]);

	const switchToGridView = useCallback(() => {
		setViewMode('grid');
		setCurrentScreen('question');
		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			url.searchParams.set('mode', 'grid');
			window.history.replaceState({}, '', url.toString());
		}
	}, []);

	const switchToPresenterView = useCallback(() => {
		setViewMode('presenter');
		setCurrentScreen('question');
		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			url.searchParams.set('mode', 'presenter');
			window.history.replaceState({}, '', url.toString());
		}
	}, []);

	const finishQuiz = useCallback(() => {
		const allAnswered = questions.every(
			(q) => correctAnswers.has(q.id) || incorrectAnswers.has(q.id)
		);

		if (allAnswered) {
			setShowCompletionModal(true);
		} else {
			setShowIncompleteModal(true);
		}
	}, [questions, correctAnswers, incorrectAnswers]);

	const isComplete = questions.every(
		(q) => correctAnswers.has(q.id) || incorrectAnswers.has(q.id)
	);
	const score = correctAnswers.size;

	const reset = useCallback(() => {
		setCurrentIndex(0);
		setCurrentRound(1);
		setCurrentScreen('round-intro');
		setViewedQuestions(new Set());
		setRevealedAnswers(new Set());
		setCorrectAnswers(new Set());
		setIncorrectAnswers(new Set());
		QuizSessionService.clearProgress(quizSlug);
	}, [quizSlug]);

	return {
		// State
		currentIndex,
		currentRound,
		currentScreen,
		viewMode,
		viewedQuestions,
		revealedAnswers,
		correctAnswers,
		incorrectAnswers,

		// Current question info
		currentQuestion,
		isAnswerRevealed,
		isMarkedCorrect,
		isQuestionAnswered,
		canGoNext,
		canGoPrevious,

		// Actions
		goToNext,
		goToPrevious,
		goToIndex,
		revealAnswer,
		hideAnswer,
		markCorrect,
		unmarkCorrect,
		switchToGridView,
		switchToPresenterView,
		startRound,
		finishQuiz,
		reset,

		// Completion
		isComplete,
		score,
		showCompletionModal,
		setShowCompletionModal,
		showIncompleteModal,
		setShowIncompleteModal,
	};
}

