/**
 * Unified quiz state management hook
 * Consolidates quiz state logic from QuizPlayer
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { sessionStorage } from '@/lib/storage';
import { logger } from '@/lib/logger';

export interface QuizState {
  currentIndex: number;
  currentScreen: 'round-intro' | 'question' | 'results';
  viewedQuestions: Set<number>;
  revealedAnswers: Set<number>;
  correctAnswers: Set<number>;
  incorrectAnswers: Set<number>;
  attemptedAnswers: Set<number>;
  timer: number;
  isTimerRunning: boolean;
  isAnswerRevealed: boolean;
  isMarkedCorrect: boolean;
}

const DEFAULT_STATE: Omit<QuizState, 'viewedQuestions' | 'revealedAnswers' | 'correctAnswers' | 'incorrectAnswers' | 'attemptedAnswers'> = {
  currentIndex: 0,
  currentScreen: 'round-intro',
  timer: 0,
  isTimerRunning: false,
  isAnswerRevealed: false,
  isMarkedCorrect: false,
};

function loadStateFromStorage(quizSlug: string): Partial<QuizState> {
  const key = `quiz-${quizSlug}-state`;
  const saved = sessionStorage.get<Partial<QuizState>>(key, {});
  
  // Convert arrays back to Sets
  const state: Partial<QuizState> = {
    ...saved,
    viewedQuestions: saved.viewedQuestions ? new Set(saved.viewedQuestions as number[]) : new Set(),
    revealedAnswers: saved.revealedAnswers ? new Set(saved.revealedAnswers as number[]) : new Set(),
    correctAnswers: saved.correctAnswers ? new Set(saved.correctAnswers as number[]) : new Set(),
    incorrectAnswers: saved.incorrectAnswers ? new Set(saved.incorrectAnswers as number[]) : new Set(),
    attemptedAnswers: saved.attemptedAnswers ? new Set(saved.attemptedAnswers as number[]) : new Set(),
  };
  
  return state;
}

function saveStateToStorage(quizSlug: string, state: QuizState): void {
  const key = `quiz-${quizSlug}-state`;
  try {
    // Convert Sets to arrays for storage
    const serializable = {
      ...state,
      viewedQuestions: Array.from(state.viewedQuestions),
      revealedAnswers: Array.from(state.revealedAnswers),
      correctAnswers: Array.from(state.correctAnswers),
      incorrectAnswers: Array.from(state.incorrectAnswers),
      attemptedAnswers: Array.from(state.attemptedAnswers),
    };
    sessionStorage.set(key, serializable);
  } catch (error) {
    logger.error('Failed to save quiz state:', error);
  }
}

export function useQuizState(quizSlug: string, totalQuestions: number) {
  const [state, setState] = useState<QuizState>(() => {
    const saved = loadStateFromStorage(quizSlug);
    return {
      ...DEFAULT_STATE,
      ...saved,
      viewedQuestions: saved.viewedQuestions || new Set(),
      revealedAnswers: saved.revealedAnswers || new Set(),
      correctAnswers: saved.correctAnswers || new Set(),
      incorrectAnswers: saved.incorrectAnswers || new Set(),
      attemptedAnswers: saved.attemptedAnswers || new Set(),
    } as QuizState;
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced save to storage
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveStateToStorage(quizSlug, state);
    }, 1000); // Debounce saves by 1 second

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [quizSlug, state]);

  // Timer logic
  useEffect(() => {
    if (!state.isTimerRunning) return;

    const interval = setInterval(() => {
      setState(prev => ({ ...prev, timer: prev.timer + 1 }));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isTimerRunning]);

  // Action creators
  const setCurrentIndex = useCallback((index: number) => {
    setState(prev => ({ ...prev, currentIndex: index }));
  }, []);

  const setCurrentScreen = useCallback((screen: QuizState['currentScreen']) => {
    setState(prev => ({ ...prev, currentScreen: screen }));
  }, []);

  const markQuestionViewed = useCallback((questionId: number) => {
    setState(prev => ({
      ...prev,
      viewedQuestions: new Set([...prev.viewedQuestions, questionId]),
    }));
  }, []);

  const revealAnswer = useCallback((questionId: number) => {
    setState(prev => ({
      ...prev,
      revealedAnswers: new Set([...prev.revealedAnswers, questionId]),
      attemptedAnswers: new Set([...prev.attemptedAnswers, questionId]),
      isAnswerRevealed: true,
    }));
  }, []);

  const markCorrect = useCallback((questionId: number) => {
    setState(prev => ({
      ...prev,
      correctAnswers: new Set([...prev.correctAnswers, questionId]),
      isMarkedCorrect: true,
    }));
  }, []);

  const markIncorrect = useCallback((questionId: number) => {
    setState(prev => ({
      ...prev,
      incorrectAnswers: new Set([...prev.incorrectAnswers, questionId]),
    }));
  }, []);

  const toggleTimer = useCallback(() => {
    setState(prev => ({ ...prev, isTimerRunning: !prev.isTimerRunning }));
  }, []);

  const resetQuiz = useCallback(() => {
    const resetState: QuizState = {
      ...DEFAULT_STATE,
      viewedQuestions: new Set(),
      revealedAnswers: new Set(),
      correctAnswers: new Set(),
      incorrectAnswers: new Set(),
      attemptedAnswers: new Set(),
    };
    setState(resetState);
    sessionStorage.remove(`quiz-${quizSlug}-state`);
    sessionStorage.remove(`quiz-${quizSlug}-timer`);
  }, [quizSlug]);

  return {
    state,
    setState,
    // Actions
    setCurrentIndex,
    setCurrentScreen,
    markQuestionViewed,
    revealAnswer,
    markCorrect,
    markIncorrect,
    toggleTimer,
    resetQuiz,
  };
}



