/**
 * useQuizTimer hook - Manages quiz timer state
 * 
 * Handles timer counting, persistence to sessionStorage, and auto-start logic.
 */

import { useState, useEffect, useRef } from 'react';
import { QuizSessionService } from '@/services/quizSessionService';

export interface UseQuizTimerOptions {
	quizSlug: string;
	autoStart?: boolean;
	initialTime?: number;
}

export interface UseQuizTimerResult {
	timer: number; // in seconds
	isRunning: boolean;
	start: () => void;
	stop: () => void;
	reset: () => void;
}

/**
 * Hook to manage quiz timer
 * 
 * @param options - Timer configuration
 * @returns Timer state and control functions
 */
export function useQuizTimer({
	quizSlug,
	autoStart = false,
	initialTime = 0,
}: UseQuizTimerOptions): UseQuizTimerResult {
	// Load timer from sessionStorage on mount
	const [timer, setTimer] = useState(() => {
		if (typeof window !== 'undefined') {
			const saved = sessionStorage.getItem(`quiz-${quizSlug}-timer`);
			return saved ? parseInt(saved, 10) : initialTime;
		}
		return initialTime;
	});

	const [isRunning, setIsRunning] = useState(() => {
		// Auto-start in grid mode
		if (autoStart) return true;
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const mode = params.get('mode');
			if (mode === 'grid') return true;
		}
		return false;
	});

	const pendingTimerValueRef = useRef<number>(timer);

	// Update ref when timer changes
	useEffect(() => {
		pendingTimerValueRef.current = timer;
	}, [timer]);

	// Timer interval - updates every second
	useEffect(() => {
		if (!isRunning) return;

		// Update timer every second for display
		const interval = setInterval(() => {
			setTimer((t) => {
				const newTime = t + 1;
				pendingTimerValueRef.current = newTime;
				return newTime;
			});
		}, 1000);

		// Debounced save to sessionStorage (every 5 seconds)
		const saveInterval = setInterval(() => {
			if (pendingTimerValueRef.current !== null) {
				sessionStorage.setItem(`quiz-${quizSlug}-timer`, String(pendingTimerValueRef.current));
			}
		}, 5000);

		// Cleanup
		return () => {
			clearInterval(interval);
			clearInterval(saveInterval);
			// Save final value on cleanup
			if (pendingTimerValueRef.current !== null) {
				sessionStorage.setItem(`quiz-${quizSlug}-timer`, String(pendingTimerValueRef.current));
			}
		};
	}, [isRunning, quizSlug]);

	const start = () => {
		setIsRunning(true);
	};

	const stop = () => {
		setIsRunning(false);
	};

	const reset = () => {
		setTimer(initialTime);
		pendingTimerValueRef.current = initialTime;
		if (typeof window !== 'undefined') {
			sessionStorage.removeItem(`quiz-${quizSlug}-timer`);
		}
	};

	return {
		timer,
		isRunning,
		start,
		stop,
		reset,
	};
}

