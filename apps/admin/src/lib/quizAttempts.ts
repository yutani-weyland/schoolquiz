/**
 * Quiz Access Tracking Utility (Admin App)
 * Tracks signed-in basic users' quiz access (max 3 quizzes total, latest week only)
 */

import { storage } from './storage';
import { logger } from './logger';

const STORAGE_KEY = 'user-quiz-access';
const MAX_FREE_QUIZZES = 3;

interface QuizAccess {
  quizzesPlayed: string[]; // Array of quiz slugs
  firstQuizDate: string;
  lastQuizDate: string;
}

/**
 * Get quiz access data from localStorage
 */
function getQuizAccess(): QuizAccess {
  return storage.get<QuizAccess>(STORAGE_KEY, {
    quizzesPlayed: [],
    firstQuizDate: '',
    lastQuizDate: '',
  });
}

/**
 * Save quiz access data to localStorage
 */
function saveQuizAccess(access: QuizAccess): void {
  try {
    storage.set(STORAGE_KEY, access);
  } catch (error) {
    logger.error('Failed to save quiz access:', error);
  }
}

/**
 * Track a quiz being played
 */
export function trackQuizPlayed(quizSlug: string): void {
  const access = getQuizAccess();
  const now = new Date().toISOString();
  
  // Only add if not already played
  if (!access.quizzesPlayed.includes(quizSlug)) {
    access.quizzesPlayed.push(quizSlug);
    if (!access.firstQuizDate) {
      access.firstQuizDate = now;
    }
    access.lastQuizDate = now;
    saveQuizAccess(access);
  }
}

/**
 * Get total number of quizzes played
 */
export function getQuizzesPlayedCount(): number {
  const access = getQuizAccess();
  return access.quizzesPlayed.length;
}

/**
 * Get list of quizzes played
 */
export function getQuizzesPlayed(): string[] {
  const access = getQuizAccess();
  return access.quizzesPlayed;
}

/**
 * Check if user has exceeded free quiz limit
 */
export function hasExceededFreeQuizzes(): boolean {
  return getQuizzesPlayedCount() >= MAX_FREE_QUIZZES;
}

/**
 * Get remaining free quizzes
 */
export function getRemainingFreeQuizzes(): number {
  const count = getQuizzesPlayedCount();
  return Math.max(0, MAX_FREE_QUIZZES - count);
}

/**
 * Check if a specific quiz has been played
 */
export function hasPlayedQuiz(quizSlug: string): boolean {
  const access = getQuizAccess();
  return access.quizzesPlayed.includes(quizSlug);
}

/**
 * Clear quiz access data (useful for testing)
 */
export function clearQuizAccess(): void {
  storage.remove(STORAGE_KEY);
}

