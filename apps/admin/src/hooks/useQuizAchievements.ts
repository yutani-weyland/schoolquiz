/**
 * useQuizAchievements hook - Manages achievement checking and notifications
 * 
 * Handles achievement evaluation, unlocking, and notification display.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Achievement } from '@/components/quiz/AchievementNotification';
import { AchievementService, AchievementContext } from '@/services/achievementService';
import { QuizQuestion, QuizRound } from '@/components/quiz/play/types';

const ACHIEVEMENT_AUTO_DISMISS_MS = 6500;

export interface UseQuizAchievementsOptions {
	quizSlug: string;
	correctAnswers: Set<number>;
	incorrectAnswers: Set<number>;
	revealedAnswers: Set<number>;
	totalQuestions: number;
	timer: number; // in seconds
	currentIndex: number;
	rounds: QuizRound[];
	questions: QuizQuestion[];
}

export interface UseQuizAchievementsResult {
	achievements: Achievement[];
	dismissAchievement: (id: string) => void;
}

/**
 * Hook to manage quiz achievements
 * 
 * Checks for achievements based on quiz progress and displays notifications.
 */
export function useQuizAchievements({
	quizSlug,
	correctAnswers,
	incorrectAnswers,
	revealedAnswers,
	totalQuestions,
	timer,
	currentIndex,
	rounds,
	questions,
}: UseQuizAchievementsOptions): UseQuizAchievementsResult {
	const [achievements, setAchievements] = useState<Achievement[]>([]);
	const achievementTimeoutsRef = useRef<Record<string, number>>({});

	const dismissAchievement = useCallback((id: string) => {
		setAchievements((prev) => prev.filter((a) => a.id !== id));
		const timeouts = achievementTimeoutsRef.current;
		if (timeouts[id]) {
			clearTimeout(timeouts[id]);
			delete timeouts[id];
		}
	}, []);

	// Check for achievements when answers change
	useEffect(() => {
		// Only check if we have answers
		if (correctAnswers.size === 0 && revealedAnswers.size === 0) return;

		// Build achievement context
		const context: AchievementContext = {
			quizSlug,
			correctAnswers,
			incorrectAnswers,
			revealedAnswers,
			totalQuestions,
			timer,
			currentIndex,
			rounds: rounds.map((r) => ({
				number: r.number,
				title: r.title,
				category: r.title.toLowerCase(), // Use title as category proxy
			})),
			questions: questions.map((q) => ({
				id: q.id,
				roundNumber: q.roundNumber,
			})),
		};

		// Check achievements via service
		// TODO: When achievement checking logic is re-enabled, uncomment this
		// AchievementService.checkAchievements(context)
		//   .then((newAchievements) => {
		//     if (newAchievements.length > 0) {
		//       setAchievements((prev) => {
		//         // Filter out duplicates
		//         const existingIds = new Set(prev.map((a) => a.id));
		//         const trulyNew = newAchievements.filter((a) => !existingIds.has(a.id));
		//         return [...prev, ...trulyNew];
		//       });
		//     }
		//   })
		//   .catch((error) => {
		//     console.error('Error checking achievements:', error);
		//   });

		// For now, achievement checking is disabled (most logic is commented out in QuizPlayer)
		// This hook provides the structure for when it's re-enabled
	}, [
		quizSlug,
		correctAnswers,
		incorrectAnswers,
		revealedAnswers,
		totalQuestions,
		timer,
		currentIndex,
		rounds,
		questions,
	]);

	// Auto-dismiss achievements after delay
	useEffect(() => {
		if (typeof window === 'undefined') return;

		const timeouts = achievementTimeoutsRef.current;

		achievements.forEach((achievement) => {
			if (!timeouts[achievement.id]) {
				timeouts[achievement.id] = window.setTimeout(() => {
					dismissAchievement(achievement.id);
				}, ACHIEVEMENT_AUTO_DISMISS_MS);
			}
		});

		// Clear any timers whose achievements have been removed
		Object.keys(timeouts).forEach((id) => {
			if (!achievements.some((achievement) => achievement.id === id)) {
				clearTimeout(timeouts[id]);
				delete timeouts[id];
			}
		});
	}, [achievements, dismissAchievement]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			const timeouts = achievementTimeoutsRef.current;
			Object.values(timeouts).forEach(clearTimeout);
		};
	}, []);

	return {
		achievements,
		dismissAchievement,
	};
}

