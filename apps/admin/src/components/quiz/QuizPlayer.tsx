"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import AnswerReveal from "./AnswerReveal";
import RailProgress from "../progress/RailProgress";
import { AchievementNotification, Achievement } from "./AchievementNotification";
import { ACHIEVEMENT_MAP } from "./achievements";
import { MobileGridLayout } from "./play/MobileGridLayout";
import { QuizHeader } from "./play/QuizHeader";
import { QuestionArea } from "./play/QuestionArea";
import { QuizStatusBar } from "./play/QuizStatusBar";
import { QuestionProgressBar } from "./play/QuestionProgressBar";
import { QuizQuestion, QuizRound, QuizThemeMode } from "./play/types";
import { trackQuizPlayed, hasExceededFreeQuizzes, hasPlayedQuiz } from "@/lib/quizAttempts";
import { MidQuizSignupPrompt } from "./MidQuizSignupPrompt";
import { QuizCompletionModal } from "./QuizCompletionModal";
import { IncompleteQuizModal } from "./IncompleteQuizModal";
import { useUserAccess } from "@/contexts/UserAccessContext";
import { applyTheme, Theme } from "@/lib/theme";
import { getAuthToken, getUserId } from "@/lib/storage";
import { useQuizTimer } from "@/hooks/useQuizTimer";
import { useQuizPlay } from "@/hooks/useQuizPlay";
import { useQuizAchievements } from "@/hooks/useQuizAchievements";
import { QuizSessionService } from "@/services/quizSessionService";

const STANDARD_ROUND_COUNT = 4;
const QUESTIONS_PER_STANDARD_ROUND = 6;
const FINALE_ROUND_NUMBER = STANDARD_ROUND_COUNT + 1;
const FINALE_QUESTION_COUNT = 1;
const TOTAL_QUESTIONS_EXPECTED =
	STANDARD_ROUND_COUNT * QUESTIONS_PER_STANDARD_ROUND + FINALE_QUESTION_COUNT;

const ACHIEVEMENT_AUTO_DISMISS_MS = 6500;

// Circular Progress Component for Score Display
function CircularProgress({
	value,
	size = 100,
	strokeWidth = 10,
	isDark = false,
	showPlusOne = false,
	plusOneKey = 0,
	accentColor,
	total,
	averageValue,
}: {
	value: number;
	size?: number;
	strokeWidth?: number;
	isDark?: boolean;
	showPlusOne?: boolean;
	plusOneKey?: number;
	accentColor?: string;
	total?: number;
	averageValue?: number;
}) {
	const radius = size / 2 - strokeWidth;
	const circumference = Math.ceil(2 * Math.PI * radius);
	// Calculate progress percentage based on value/total if total exists, otherwise use value as percentage
	const progressPercentage = total ? (value / total) * 100 : value;
	const strokeDashoffset = circumference - (circumference * (progressPercentage / 100));
	
	const viewBox = `-${size * 0.125} -${size * 0.125} ${size * 1.25} ${size * 1.25}`;
	
	// Generate random direction for +1 animation - only when plusOneKey changes
	// Use client-side only to avoid hydration mismatches
	const [randomDirection, setRandomDirection] = React.useState({ x: 0, y: 0 });
	
	React.useEffect(() => {
		if (!showPlusOne) {
			setRandomDirection({ x: 0, y: 0 });
			return;
		}
		// Random angle between 0 and 360 degrees (excluding straight up 90deg)
		// Prefer upward angles but allow some variation
		const angle = (Math.random() * 120 + 60) * (Math.PI / 180); // 60-180 degrees (mostly upward)
		const distance = 40 + Math.random() * 20; // 40-60px distance
		setRandomDirection({
			x: Math.cos(angle) * distance * (Math.random() > 0.5 ? 1 : -1), // Random left/right
			y: -Math.sin(angle) * distance, // Mostly upward
		});
	}, [showPlusOne, plusOneKey]);

	return (
		<div className="relative" style={{ width: size, height: size }}>
			<svg
				width={size}
				height={size}
				viewBox={viewBox}
				version="1.1"
				xmlns="http://www.w3.org/2000/svg"
				style={{ transform: "rotate(-90deg)" }}
				className="absolute inset-0"
			>
				{/* Base Circle */}
				<circle
					r={radius}
					cx={size / 2}
					cy={size / 2}
					fill="transparent"
					strokeWidth={strokeWidth}
					strokeDasharray={circumference}
					strokeDashoffset="0"
					className={isDark ? "stroke-white/20" : "stroke-black/20"}
					style={{ transition: "stroke 700ms ease-in-out" }}
				/>

				{/* User Progress */}
				<circle
					r={radius}
					cx={size / 2}
					cy={size / 2}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeDashoffset={strokeDashoffset}
					fill="transparent"
					strokeDasharray={circumference}
					className={isDark ? "stroke-white" : "stroke-black"}
					style={{ 
						transition: "stroke-dashoffset 0.6s ease",
						stroke: accentColor || (isDark ? "#fff" : "#000")
					}}
				/>
			</svg>
			{/* Score Display - Centered number */}
			<div 
				className="absolute inset-0 pointer-events-none flex items-center justify-center transition-colors duration-300 ease-in-out tracking-tight"
				style={{
					fontFamily: 'var(--app-font), system-ui, sans-serif',
					color: isDark ? "#fff" : "#000"
				}}
			>
				<span 
					className="font-bold tracking-tight transition-colors duration-300 ease-in-out"
					style={{
						fontSize: size * 0.34,
						fontWeight: 700,
						lineHeight: 0.85
					}}
				>
					{value}
				</span>
			</div>
		
		{/* +1 Animation */}
		<AnimatePresence>
			{showPlusOne && (
				<motion.div
					key={`plus-one-${plusOneKey}`}
					initial={{ 
						opacity: 0, 
						scale: 0.5,
						y: -30,
						x: 0
					}}
					animate={{ 
						opacity: [0, 1, 1, 1, 0],
						scale: [0.5, 1.4, 1.3, 1.2, 0.9],
						y: [-30, randomDirection.y * 0.3 - 20, randomDirection.y * 0.5 - 10, randomDirection.y * 0.8, randomDirection.y],
						x: [0, randomDirection.x * 0.25, randomDirection.x * 0.5, randomDirection.x * 0.75, randomDirection.x]
					}}
					exit={{
						opacity: 0,
						scale: 0.9,
						y: randomDirection.y,
						x: randomDirection.x
					}}
					transition={{
						duration: 1.8,
						ease: "easeOut",
						times: [0, 0.15, 0.4, 0.75, 1]
					}}
					className="absolute inset-0 flex items-center justify-center pointer-events-none"
					style={{
						zIndex: 10
					}}
				>
					<span
						className="text-5xl font-bold"
						style={{
							color: isDark ? "#fff" : "#000",
							textShadow: isDark
								? "0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.4)"
								: "0 0 20px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 0, 0, 0.3)"
						}}
					>
						+1
					</span>
				</motion.div>
			)}
		</AnimatePresence>
		</div>
	);
}

// Circular Progress Component for Button Indicator (simpler, wraps around button)
function CircularProgressButton({
	value,
	size = 56,
	strokeWidth = 3,
	isDark = false,
	className = "",
}: {
	value: number;
	size?: number;
	strokeWidth?: number;
	isDark?: boolean;
	className?: string;
}) {
	const radius = size / 2 - strokeWidth / 2;
	const circumference = 2 * Math.PI * radius;
	const progressPercentage = Math.min(100, Math.max(0, value));
	const strokeDashoffset = circumference - (circumference * (progressPercentage / 100));

	return (
		<motion.div 
			className={`pointer-events-none ${className}`}
			style={{ width: size, height: size }}
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.3, ease: "easeOut" }}
		>
			<svg
				width={size}
				height={size}
				viewBox={`0 0 ${size} ${size}`}
				version="1.1"
				xmlns="http://www.w3.org/2000/svg"
				style={{ transform: "rotate(-90deg)" }}
				className="absolute inset-0"
			>
				{/* Track Slot - Base Circle */}
				<circle
					r={radius}
					cx={size / 2}
					cy={size / 2}
					fill="transparent"
					strokeWidth={strokeWidth}
					strokeDasharray={circumference}
					strokeDashoffset="0"
					className={isDark ? "stroke-white/20" : "stroke-black/20"}
					style={{ transition: "stroke 700ms ease-in-out" }}
				/>

				{/* Progress Track */}
				<circle
					r={radius}
					cx={size / 2}
					cy={size / 2}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeDashoffset={strokeDashoffset}
					fill="transparent"
					strokeDasharray={circumference}
					className={isDark ? "stroke-white" : "stroke-black"}
					style={{ 
						transition: "stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
						opacity: 0.8
					}}
				/>
			</svg>
		</motion.div>
	);
}

interface QuizPlayerProps {
	quizTitle: string;
	quizColor: string;
	quizSlug: string;
	questions: QuizQuestion[];
	rounds: QuizRound[];
	weekISO?: string;
	isNewest?: boolean;
	isDemo?: boolean;
	maxQuestions?: number;
	onDemoComplete?: (score: number, totalQuestions: number) => void;
}

type ViewMode = "presenter" | "grid";
type ScreenType = "round-intro" | "question";
type ThemeMode = QuizThemeMode;

// Helper to calculate luminance for contrast
function getLuminance(hex: string): number {
	const rgb = hex.replace('#', '');
	if (rgb.length !== 6) return 0.5;
	const r = parseInt(rgb.slice(0, 2), 16) / 255;
	const g = parseInt(rgb.slice(2, 4), 16) / 255;
	const b = parseInt(rgb.slice(4, 6), 16) / 255;
	const chan = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
	return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

// Get reverse/contrast background color for notch
function getNotchBackground(backgroundColor: string): string {
	const luminance = getLuminance(backgroundColor);
	// If background is light, use dark; if dark, use light
	if (luminance > 0.5) {
		// Light background -> dark notch
		return '#1a1a1a';
	} else {
		// Dark background -> light notch
		return '#f5f5f5';
	}
}

// Get contrast text color for notch
function getNotchTextColor(backgroundColor: string): string {
	const luminance = getLuminance(backgroundColor);
	return luminance > 0.5 ? 'white' : 'black';
}

export function QuizPlayer({ quizTitle, quizColor, quizSlug, questions, rounds, weekISO, isNewest = false, isDemo = false, maxQuestions, onDemoComplete }: QuizPlayerProps) {
	const { isPremium, isVisitor, isLoggedIn } = useUserAccess();
	
	// For restricted quiz mode: show all questions initially, but lock after 6 answers
	const RESTRICTED_ANSWER_LIMIT = 6; // Lock restricted quiz after 6 answers
	
	// In restricted quiz mode, show all questions initially (no slicing)
	// In non-restricted mode, apply maxQuestions limit if specified
	const displayQuestions = isDemo 
		? questions // Show all questions in restricted quiz mode
		: (maxQuestions ? questions.slice(0, maxQuestions) : questions);
	const displayRounds = isDemo 
		? rounds // Show all rounds in restricted quiz mode
		: (maxQuestions ? rounds.slice(0, 2) : rounds);
	
	// Always show all questions (no visitor limit)
	const finalQuestions = displayQuestions;
	const finalRounds = displayRounds;
	
	const [showSignupPrompt, setShowSignupPrompt] = React.useState(false);
	const [hasShownPrompt, setHasShownPrompt] = React.useState(false);
	
	// Debug logging
	React.useEffect(() => {
		console.log('QuizPlayer mounted', { quizTitle, quizColor, quizSlug, questionsCount: finalQuestions?.length, roundsCount: finalRounds?.length, isDemo, isVisitor });
	}, [quizTitle, quizColor, quizSlug, finalQuestions?.length, finalRounds?.length, isDemo, isVisitor]);

	// Initialize viewMode and currentScreen from URL params after mount to prevent hydration mismatch
	useEffect(() => {
		setMounted(true);
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const mode = params.get('mode');
			if (mode === 'grid') {
				quizPlaySwitchToGrid();
			}
		}
	}, [quizPlaySwitchToGrid]);

	// Safeguard: Check authentication and quiz limits (skip for restricted quiz mode and visitors)
	React.useEffect(() => {
		if (isDemo) return; // Restricted quiz mode bypasses auth checks
		if (isVisitor) return; // Visitors can start the quiz (will be prompted after 5 questions)
		
		if (typeof window === 'undefined') return;
		
		const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
		
		// Require sign-up for non-visitors
		if (!loggedIn) {
			window.location.href = `/quizzes/${quizSlug}/intro`;
			return;
		}
		
		// If not premium, check quiz limits
		if (!isPremium) {
			// Check if they've exceeded free quizzes
			if (hasExceededFreeQuizzes()) {
				window.location.href = `/quizzes/${quizSlug}/intro`;
				return;
			}
			
			// Check if trying to access non-latest quiz
			if (!isNewest) {
				window.location.href = `/quizzes/${quizSlug}/intro`;
				return;
			}
			
			// Track quiz play (only once per quiz)
			if (!hasPlayedQuiz(quizSlug)) {
				trackQuizPlayed(quizSlug);
			}
		}
	}, [quizSlug, isNewest, isPremium, isDemo, isVisitor]);

	// Use quiz play hook for state management
	const quizPlay = useQuizPlay({
		quizSlug,
		questions: finalQuestions,
		rounds: finalRounds,
		isDemo,
		maxQuestions,
		onDemoComplete,
	});

	// Destructure quiz play state and actions
	const {
		currentIndex,
		currentRound,
		currentScreen,
		viewMode: quizPlayViewMode,
		viewedQuestions,
		revealedAnswers,
		correctAnswers,
		incorrectAnswers,
		currentQuestion,
		isAnswerRevealed,
		isMarkedCorrect,
		isQuestionAnswered,
		canGoNext,
		canGoPrevious,
		goToNext,
		goToPrevious,
		goToIndex,
		revealAnswer,
		hideAnswer,
		markCorrect,
		unmarkCorrect,
		switchToGridView: quizPlaySwitchToGrid,
		switchToPresenterView: quizPlaySwitchToPresenter,
		startRound,
		finishQuiz,
		reset: resetQuiz,
		showCompletionModal,
		setShowCompletionModal,
		showIncompleteModal,
		setShowIncompleteModal,
	} = quizPlay;

	// Keep viewMode state for UI-specific logic (will sync with quizPlay)
	const [viewMode, setViewMode] = useState<ViewMode>(quizPlayViewMode);
	
	// Sync viewMode with quizPlay viewMode
	useEffect(() => {
		setViewMode(quizPlayViewMode);
	}, [quizPlayViewMode]);

	// Enhanced switchToGridView with scroll logic
	const switchToGridView = useCallback(() => {
		quizPlaySwitchToGrid();
		
		// Scroll logic: wait for view mode to change and grid to render
		setTimeout(() => {
			// If on first question or round splash screen, scroll to top
			if (currentIndex === 0 || currentScreen === "round-intro") {
				window.scrollTo({ top: 0, behavior: "smooth" });
			} else {
				// Otherwise, scroll to center the current question
				const questionId = finalQuestions[currentIndex]?.id;
				if (questionId) {
					// Try to find the question element
					const questionEl = document.getElementById(`mobile-question-${questionId}`);
					if (questionEl) {
						// Center the question in the viewport
						questionEl.scrollIntoView({ 
							behavior: "smooth", 
							block: "center",
							inline: "nearest" 
						});
					} else {
						// If question not found yet, try again after a short delay
						setTimeout(() => {
							const retryEl = document.getElementById(`mobile-question-${questionId}`);
							if (retryEl) {
								retryEl.scrollIntoView({ 
									behavior: "smooth", 
									block: "center",
									inline: "nearest" 
								});
							}
						}, 100);
					}
				}
			}
		}, 150); // Delay to ensure grid has rendered
	}, [currentIndex, currentScreen, finalQuestions, quizPlaySwitchToGrid]);

	const switchToPresenterView = useCallback(() => {
		quizPlaySwitchToPresenter();
	}, [quizPlaySwitchToPresenter]);

	const [showPlusOne, setShowPlusOne] = useState(false);
	const [plusOneKey, setPlusOneKey] = useState(0);
	// Initialize themeMode from DOM (set by pre-paint script) to match server render
	// IMPORTANT: For quiz pages, default to "colored" if no cookie exists
	const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
		if (typeof window === 'undefined') return "colored"; // SSR fallback to colored for quiz pages
		
		// Read from data-theme attribute (set by pre-paint script) to match server render
		try {
			const dataTheme = document.documentElement.getAttribute('data-theme');
			if (dataTheme === 'color') return 'colored';
			if (dataTheme === 'dark' || dataTheme === 'light') return dataTheme as ThemeMode;
		} catch (e) {
			// Ignore errors
		}
		
		// Fallback to cookie if data-theme not set
		try {
			const cookieMatch = document.cookie.match(/(?:^|; )sq_theme=([^;]*)/);
			if (cookieMatch) {
				const cookieTheme = decodeURIComponent(cookieMatch[1]);
				// Map "color" to "colored" for quiz theme mode
				if (cookieTheme === 'color') return 'colored';
				if (cookieTheme === 'dark' || cookieTheme === 'light') return cookieTheme as ThemeMode;
			}
		} catch (e) {
			// Ignore errors
		}
		
		// Only use localStorage if cookie is not set (backward compatibility)
		try {
			const saved = localStorage.getItem('quizThemeMode');
			if (saved === 'colored' || saved === 'dark' || saved === 'light') {
				return saved as ThemeMode;
			}
		} catch (e) {
			// Ignore errors
		}
		
		// Default to "colored" for quiz pages (quiz-specific default)
		return "colored";
	});
	const [showTimer, setShowTimer] = useState(true);
	const [isNarrowViewport, setIsNarrowViewport] = useState(false);
	const [isMobileLayout, setIsMobileLayout] = useState(false);
	const [trophies, setTrophies] = useState<string[]>([]);
	const [notchNotifications, setNotchNotifications] = useState<Array<{ id: string; message: string; timestamp: number }>>([]);
	const [isNotchLocked, setIsNotchLocked] = useState(false);
	const [isNotchRetracted, setIsNotchRetracted] = useState(false);
	const [currentNotchMessage, setCurrentNotchMessage] = useState(0);
	const [isNotchHovered, setIsNotchHovered] = useState(false);
	const [isMouseMoving, setIsMouseMoving] = useState(false);
	const isNavigatingRef = useRef(false);
	const [mounted, setMounted] = useState(false);
	
	// Use achievements hook
	const { achievements, dismissAchievement } = useQuizAchievements({
		quizSlug,
		correctAnswers,
		incorrectAnswers,
		revealedAnswers,
		totalQuestions: finalQuestions.length,
		timer,
		currentIndex,
		rounds: finalRounds,
		questions: finalQuestions,
	});
	
	// Use timer hook
	const { timer, isRunning: isTimerRunning, start: startTimer, stop: stopTimer } = useQuizTimer({
		quizSlug,
		autoStart: viewMode === 'grid',
		initialTime: 0,
	});

	const [averageScoreData, setAverageScoreData] = useState<{ quizAverage?: number; userScore?: number; percentile?: number; privateLeagueAverage?: number; leagueName?: string; time?: number }>({
		quizAverage: 18.5, // Mock data - replace with API call
		userScore: 0, // Will be updated when correctAnswers changes
		percentile: 75, // Mock data - replace with API call (e.g., user is in 75th percentile = top 25%)
		privateLeagueAverage: 19.2, // Mock data
		leagueName: "My Private League", // Mock data
		time: 0 // Will be updated when timer changes
	});

	// Update userScore and time when correctAnswers or timer changes
	useEffect(() => {
		setAverageScoreData(prev => ({
			...prev,
			userScore: correctAnswers.size,
			time: timer
		}));
	}, [correctAnswers.size, timer]);

	// Handle completion submission when quiz is completed
	const [hasSubmittedCompletion, setHasSubmittedCompletion] = React.useState(false);
	const [isSubmittingCompletion, setIsSubmittingCompletion] = React.useState(false);
	const [completionError, setCompletionError] = React.useState<string | null>(null);
	
	// Save completion when modal is shown
	useEffect(() => {
		if (!isDemo && showCompletionModal && !hasSubmittedCompletion && finalQuestions.length > 0) {
			const score = correctAnswers.size;
			
			// Save via QuizSessionService
			QuizSessionService.saveCompletion(quizSlug, {
				score,
				totalQuestions: finalQuestions.length,
				completedAt: new Date().toISOString(),
				timeSpent: timer,
			});
			
			// Calculate round scores for achievement evaluation
			const roundScores = rounds.map((round) => {
				const roundQuestions = finalQuestions.filter((q) => q.roundNumber === round.number);
				const roundCorrect = roundQuestions.filter((q) => correctAnswers.has(q.id)).length;
				return {
					roundNumber: round.number,
					category: round.title.toLowerCase(),
					score: roundCorrect,
					totalQuestions: roundQuestions.length,
				};
			});
			
			const categories = rounds.map((r) => r.title.toLowerCase());
			
			// Submit to API if user is logged in
			const token = getAuthToken();
			const userId = getUserId();
			
			if (token && userId) {
				setHasSubmittedCompletion(true);
				setIsSubmittingCompletion(true);
				setCompletionError(null);
				
				fetch('/api/quiz/completion', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
						'X-User-Id': userId,
					},
					body: JSON.stringify({
						quizSlug,
						score,
						totalQuestions: finalQuestions.length,
						completionTimeSeconds: timer,
						roundScores,
						categories,
					}),
				})
					.then(async (res) => {
						if (!res.ok) {
							const errorData = await res.json().catch(() => ({}));
							throw new Error(errorData.error || `Failed to save completion (${res.status})`);
						}
						return res.json();
					})
					.then((data) => {
						// Handle newly unlocked achievements
						if (data.newlyUnlockedAchievements && data.newlyUnlockedAchievements.length > 0) {
							console.log('New achievements unlocked:', data.newlyUnlockedAchievements);
						}
						setIsSubmittingCompletion(false);
					})
					.catch((error) => {
						console.error('Error submitting quiz completion:', error);
						setCompletionError(error.message || 'Failed to save quiz completion');
						setIsSubmittingCompletion(false);
						setHasSubmittedCompletion(false); // Allow retry
					});
			}
		}
	}, [showCompletionModal, hasSubmittedCompletion, quizSlug, isDemo, correctAnswers, finalQuestions, rounds, timer]);
	// Timer running state is now managed by useQuizTimer hook
	// Safety check
	if (!finalQuestions || finalQuestions.length === 0) {
		return (
			<div className="fixed inset-0 flex items-center justify-center bg-red-500 text-white">
				<div className="text-center">
					<h1 className="text-4xl font-bold mb-4">Error Loading Quiz</h1>
					<p>No questions found</p>
				</div>
			</div>
		);
	}

	// Start timer when navigating to question screen if not already running
	React.useEffect(() => {
		if (currentScreen === "question" && !isTimerRunning) {
			startTimer();
		}
	}, [currentScreen, isTimerRunning, startTimer]);

	// Handle viewport width for notch
	useEffect(() => {
		const handleResize = () => {
			const width = window.innerWidth;
			setIsNarrowViewport(width < 1024);
			setIsMobileLayout(width < 768);
		};
		handleResize(); // Check on mount
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	useEffect(() => {
		setViewMode((prev) => {
			if (isMobileLayout && prev !== "grid") {
				return "grid";
			}
			if (!isMobileLayout && prev !== "presenter") {
				return "presenter";
			}
			return prev;
		});
	}, [isMobileLayout]);

	// Achievement checking is now handled by useQuizAchievements hook

	// Cycle through notch messages (notifications + timer)
	useEffect(() => {
		const messagesCount = notchNotifications.length + (isTimerRunning ? 1 : 0);
		if (messagesCount === 0) {
			setCurrentNotchMessage(0);
			return;
		}
		
		const tickerInterval = setInterval(() => {
			setCurrentNotchMessage((prev) => (prev + 1) % messagesCount);
		}, 5000); // Change message every 5 seconds

		return () => clearInterval(tickerInterval);
	}, [notchNotifications.length, isTimerRunning]);

	// Clean up old notifications (older than 30 seconds)
	useEffect(() => {
		const cleanupInterval = setInterval(() => {
			const now = Date.now();
			setNotchNotifications(notifications => 
				notifications.filter(n => now - n.timestamp < 30000) // Keep notifications less than 30 seconds old
			);
		}, 5000); // Check every 5 seconds

		return () => clearInterval(cleanupInterval);
	}, []);

	// Auto-retract notch when scrolling (unless locked or hovered)
	useEffect(() => {
		if (isNotchLocked || isNarrowViewport || isNotchHovered) return;
		
		const handleScroll = () => {
			const currentScrollY = window.scrollY;
			
			// Auto-retract when scrolling down past 100px
			if (currentScrollY > 100 && !isNotchRetracted) {
				setIsNotchRetracted(true);
			}
			// Reappear when scrolling back to top (within 50px)
			else if (currentScrollY <= 50 && isNotchRetracted) {
				setIsNotchRetracted(false);
			}
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, [isNotchRetracted, isNotchLocked, isNarrowViewport, isNotchHovered]);

		// Track mouse movement for arrow fade
		useEffect(() => {
			let timeoutId: NodeJS.Timeout | null = null;
			
			const handleMouseMove = () => {
				setIsMouseMoving(true);
				// Clear existing timeout
				if (timeoutId) {
					clearTimeout(timeoutId);
				}
				// Set new timeout to mark mouse as stopped after 500ms
				timeoutId = setTimeout(() => {
					setIsMouseMoving(false);
				}, 500);
			};

		window.addEventListener('mousemove', handleMouseMove);
		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, []);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
	};

	// revealAnswer and hideAnswer are now provided by useQuizPlay hook
	const handleRevealAnswer = (id: number) => {
		if (currentQuestion?.id === id) {
			revealAnswer();
		}
	};

	const handleHideAnswer = (id: number) => {
		if (currentQuestion?.id === id) {
			hideAnswer();
		}
		// Note: Marking as incorrect when X is pressed should be handled separately
		// The hook's hideAnswer just hides the answer, doesn't mark incorrect
	};

	// Helper function to get context-based emoji shapes based on round
	const getContextEmojis = (roundNumber: number, scalar: number) => {
		const emojiSets: { [key: number]: string[] } = {
			1: ['🔵', '⚪', '🔷', '🔹', '◼️', '⚫'], // Shape Up - geometric shapes
			2: ['🎃', '🍂', '🍁', '🍄', '🦃', '🌽'], // Pumpkins - autumn/harvest
			3: ['📝', '✍️', '📜', '📚', '📖', '🖋️'], // Famous First Words - writing/text
			4: ['🎮', '📱', '💻', '⌚', '📺', '🎧'], // Crazes - tech/trends
			5: ['🔢', '➡️', '🔀', '🔁', '⏭️', '🔜'], // Next In Sequence - progression
		};
		// Default emojis if round not found
		const emojis = emojiSets[roundNumber] || ['🎉', '✨', '🎊', '🌟', '💫', '⭐'];
		
		// Convert emojis to confetti shapes
		return emojis.map(emoji => confetti.shapeFromText({ text: emoji, scalar }));
	};

	const handleMarkCorrect = (id: number, event?: React.MouseEvent<HTMLButtonElement>) => {
		const wasAlreadyCorrect = correctAnswers.has(id);
		markCorrect(id);
		// Remove from incorrect if it was marked incorrect (handled by hook)
		
		// Show +1 animation only if this question wasn't already marked correct
		if (!wasAlreadyCorrect) {
			// Reset to false first, then set to true to trigger animation
			setShowPlusOne(false);
			// Use a small delay to ensure the reset happens, then trigger animation
			setTimeout(() => {
				setPlusOneKey(prev => prev + 1); // Increment key to force new animation
				setShowPlusOne(true);
			}, 10);
			// Hide the animation after it completes
			setTimeout(() => setShowPlusOne(false), 2000);
		}
		
		// Get emoji shapes based on current round
		const currentRoundNumber = currentQuestion?.roundNumber || 1;
		
		if (event) {
			// Confetti from button position (both grid and presenter mode)
			const button = event.currentTarget;
			const rect = button.getBoundingClientRect();
			const x = (rect.left + rect.width / 2) / window.innerWidth;
			const y = (rect.top + rect.height / 2) / window.innerHeight;
			const scalar = 1.8;
			const emojiShapes = getContextEmojis(currentRoundNumber, scalar);
			
			confetti({
				particleCount: 50,
				spread: 60,
				origin: { x, y },
				startVelocity: 30,
				gravity: 0.9,
				ticks: 100,
				decay: 0.94,
				shapes: emojiShapes,
				scalar: scalar,
				drift: 0.1
			});
		} else {
			// Fallback: big, spread out confetti (for backwards compatibility)
			const scalar = 2.2;
			const emojiShapes = getContextEmojis(currentRoundNumber, scalar);
			
			confetti({
				particleCount: 200,
				spread: 180,
				origin: { x: 0.5, y: 0.75 },
				startVelocity: 60,
				gravity: 0.8,
				ticks: 150,
				decay: 0.92,
				shapes: emojiShapes,
				scalar: scalar,
				drift: 0.15
			});
		}
	};

	const handleUnmarkCorrect = (id: number) => {
		unmarkCorrect(id);
	};

	// currentQuestion, isAnswerRevealed, and isMarkedCorrect are now provided by useQuizPlay hook
	
	// Track answered questions for visitor prompt
	const answeredQuestionsCount = React.useMemo(() => {
		return correctAnswers.size + incorrectAnswers.size;
	}, [correctAnswers.size, incorrectAnswers.size]);
	
	// Show sign-up prompt after 6 questions answered in restricted quiz mode
	React.useEffect(() => {
		if (isDemo && answeredQuestionsCount >= RESTRICTED_ANSWER_LIMIT && !hasShownPrompt) {
			setShowSignupPrompt(true);
			setHasShownPrompt(true);
		}
	}, [isDemo, answeredQuestionsCount, hasShownPrompt, RESTRICTED_ANSWER_LIMIT]);

	// completeQuiz, handleFinishQuiz, goToNext, and goToPrevious are now provided by useQuizPlay hook
	// Use finishQuiz from hook for handleFinishQuiz
	const handleFinishQuiz = finishQuiz;

	// Enhanced keyboard navigation with shortcuts (placed after function definitions)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't trigger shortcuts when typing in inputs
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
				return;
			}

			// Test achievement shortcut: Ctrl/Cmd + Shift + A (works anywhere)
			// Note: This would need to be handled differently with the hook
			// For now, keeping it but it won't work until achievement hook supports manual additions
			if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "A") {
				e.preventDefault();
				// TODO: Add test achievement support to useQuizAchievements hook
				console.log('Test achievement shortcut - needs hook support');
				return;
			}

			// Escape: Exit quiz
			if (e.key === "Escape") {
				e.preventDefault();
				if (typeof window !== 'undefined') {
					if (confirm('Are you sure you want to exit? Your progress will be saved.')) {
						// Check login status and redirect accordingly
						const token = getAuthToken();
						const userId = getUserId();
						const loggedInStatus = !!(token && userId);
						
						if (loggedInStatus) {
							// Logged-in users: go to quizzes page
							window.location.href = '/quizzes';
						} else {
							// Logged-out users: go to quiz intro page
							window.location.href = `/quizzes/${quizSlug}/intro`;
						}
					}
				}
				return;
			}

			// Space: Toggle timer (when on question screen)
			if (e.key === " " && currentScreen === "question") {
				e.preventDefault();
				if (isTimerRunning) {
					stopTimer();
				} else {
					startTimer();
				}
				return;
			}

			// T: Toggle timer
			if (e.key === "t" || e.key === "T") {
				e.preventDefault();
				if (isTimerRunning) {
					stopTimer();
				} else {
					startTimer();
				}
				return;
			}

			// G: Toggle grid/presenter view
			if (e.key === "g" || e.key === "G") {
				e.preventDefault();
				if (viewMode === "grid") {
					switchToPresenterView();
				} else {
					switchToGridView();
				}
				return;
			}

			// ?: Show keyboard shortcuts help
			if (e.key === "?") {
				e.preventDefault();
				alert(`Keyboard Shortcuts:\n\n← → Arrow Keys: Navigate questions\nSpace/T: Toggle timer\nG: Toggle grid/presenter view\nEsc: Exit quiz\n?: Show this help`);
				return;
			}
			
			// Navigation - works on both question and round-intro screens
			if (isNavigatingRef.current) return; // Prevent double navigation
			
			// Handle navigation when on round-intro screen
			if (currentScreen === "round-intro") {
				if (e.key === "ArrowRight") {
					e.preventDefault();
					isNavigatingRef.current = true;
					// On round-intro, right arrow should go to first question of this round
					// Use startRound from hook
					startRound();
					if (!isTimerRunning) {
						startTimer();
					}
					setTimeout(() => { isNavigatingRef.current = false; }, 150);
				} else if (e.key === "ArrowLeft" && currentIndex > 0) {
					e.preventDefault();
					isNavigatingRef.current = true;
					// On round-intro, left arrow should skip round-intro and go to previous question
					goToPrevious();
					setTimeout(() => { isNavigatingRef.current = false; }, 150);
				}
			} else {
				// Normal navigation on question screen
				if (e.key === "ArrowLeft" && currentIndex > 0) {
					e.preventDefault();
					isNavigatingRef.current = true;
					goToPrevious();
					// Reset flag after navigation completes
					setTimeout(() => { isNavigatingRef.current = false; }, 150);
				} else if (e.key === "ArrowRight" && currentIndex < finalQuestions.length - 1) {
					e.preventDefault();
					isNavigatingRef.current = true;
					goToNext();
					// Reset flag after navigation completes
					setTimeout(() => { isNavigatingRef.current = false; }, 150);
				}
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [currentIndex, currentScreen, finalQuestions.length, isVisitor, isDemo, viewMode, quizSlug, goToPrevious, goToNext, switchToGridView, switchToPresenterView]);

	// startRound is now provided by useQuizPlay hook

	const restartQuiz = () => {
		if (typeof window !== 'undefined') {
			if (confirm('Are you sure you want to restart this quiz? All progress will be lost.')) {
				// Reset quiz state via hook
				resetQuiz();
				// Reset timer
				stopTimer();
				// Reset UI state
				setShowPlusOne(false);
				setPlusOneKey(0);
				setTrophies([]);
				setNotchNotifications([]);
				setIsNotchLocked(false);
				setIsNotchRetracted(false);
				setCurrentNotchMessage(0);
			}
		}
	};

	const exitQuiz = () => {
		// Restore global theme before exiting quiz to prevent flash
		if (typeof window !== 'undefined') {
			// Check login status synchronously from localStorage (same way UserAccessContext does)
			// This ensures we immediately know where to redirect without any async delays
			// that could cause flashing of intermediate pages
			const token = getAuthToken();
			const userId = getUserId();
			const loggedInStatus = !!(token && userId);
			
			try {
				const themeOverride = localStorage.getItem('themeOverride');
				const savedTheme = localStorage.getItem('theme');
				
				if (themeOverride === 'true' && savedTheme) {
					if (savedTheme === 'dark') {
						document.documentElement.classList.add('dark');
					} else {
						document.documentElement.classList.remove('dark');
					}
				} else {
					// Use time-based theme
					const hour = new Date().getHours();
					const isDark = hour >= 18 || hour < 6;
					if (isDark) {
						document.documentElement.classList.add('dark');
					} else {
						document.documentElement.classList.remove('dark');
					}
				}
			} catch (e) {
				// Fallback to light mode
				document.documentElement.classList.remove('dark');
			}
			
			// Navigate immediately based on login status - no delays, no intermediate pages
			if (loggedInStatus) {
				// Logged-in users: go to quizzes page
				window.location.href = '/quizzes';
			} else {
				// Logged-out users: redirect directly to index page
				// Use replace to avoid adding to history and prevent back button issues
				window.location.replace('/');
			}
		}
	};

	// Get background color and text color based on theme mode
	// Reduce saturation by ~10% for colored mode
	const getDesaturatedColor = (hex: string) => {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		
		// Convert to HSL, reduce saturation, convert back
		const max = Math.max(r, g, b) / 255;
		const min = Math.min(r, g, b) / 255;
		const l = (max + min) / 2;
		const s = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
		
		// Reduce saturation by 10%
		const newS = Math.max(0, s * 0.9);
		
		// Simple conversion back (approximate)
		const c = (1 - Math.abs(2 * l - 1)) * newS;
		const x = c * (1 - Math.abs(((r / 255 - g / 255) / (max - min || 1)) % 2 - 1));
		const m = l - c / 2;
		
		// Convert rgba opacity to solid hex by blending with white (95% color + 5% white)
		// This ensures both main container and progress bar render identically
		const blendWithWhite = (component: number) => Math.round(component * 0.95 + 255 * 0.05);
		const finalR = blendWithWhite(r);
		const finalG = blendWithWhite(g);
		const finalB = blendWithWhite(b);
		
		return `#${finalR.toString(16).padStart(2, '0')}${finalG.toString(16).padStart(2, '0')}${finalB.toString(16).padStart(2, '0')}`;
	};

	// Get round-specific color
	const getRoundColor = (roundNumber: number, baseColor: string) => {
		const standardRoundColors = [
			baseColor, // Round 1 - quiz card color
			"#39FF14", // Round 2 - neon green
			"#FF69B4", // Round 3 - hot pink
			"#FFD84D", // Round 4 - golden yellow
		];
		const finaleColor = "#C084FC"; // Finale - lavender
		if (roundNumber === FINALE_ROUND_NUMBER) {
			return finaleColor;
		}
		return standardRoundColors[roundNumber - 1] || baseColor;
	};

	const currentRoundNumber = currentQuestion?.roundNumber || 1;
	const roundColor = getRoundColor(currentRoundNumber, quizColor);
	
	// Calculate backgroundColor immediately - default to quizColor to prevent white flash
	const backgroundColor = themeMode === "colored" 
		? quizColor
		: themeMode === "light" 
		? "#ffffff" 
		: "#1a1a1a";
	
	const textColor = themeMode === "colored" 
		? getTextColor(quizColor)
		: themeMode === "light"
		? "black"
		: "white";

	// Compute section breaks from round numbers (for timeline markers)
	const sections = React.useMemo(() => {
		const breaks: number[] = [];
		let lastRound = 0;
		finalQuestions.forEach((q, idx) => {
			if (q.roundNumber !== lastRound) {
				breaks.push(idx + 1); // 1-based index
				lastRound = q.roundNumber;
			}
		});
		return breaks;
	}, [finalQuestions]);
	
	// Round colors array for the progress rail
	const roundColorsArray = [
		quizColor, // Round 1 - quiz card color
		"#39FF14", // Round 2 - neon green
		"#FF69B4", // Round 3 - hot pink
		"#FFD84D", // Round 4 - golden yellow
		"#C084FC", // Finale - lavender
	];

	const headerTone = getTextColor(quizColor);
	const currentRoundDetails = finalRounds.find(r => r.number === currentRoundNumber);
	const containerClass =
		mounted && viewMode === "presenter"
			? "fixed inset-0 flex flex-col transition-colors duration-300 ease-in-out"
			: "min-h-dvh flex flex-col overflow-y-auto transition-colors duration-300 ease-in-out";

	// Apply theme immediately on mount to prevent flash
	React.useEffect(() => {
		if (typeof window === 'undefined') return;
		
		// Apply theme immediately on mount
		if (themeMode === "dark") {
			document.documentElement.classList.add('dark');
		} else if (themeMode === "light" || themeMode === "colored") {
			document.documentElement.classList.remove('dark');
		}
	}, []); // Run once on mount
	
	// Persist themeMode to cookie (unified theme system) and localStorage (backward compatibility)
	// IMPORTANT: Always write to cookie when themeMode changes (user action in presenter view)
	// On initial mount: if no cookie exists and themeMode is "colored", write cookie immediately
	// This ensures quiz pages start in colored mode and persist correctly
	const hasSyncedFromCookie = React.useRef(false);
	const previousThemeModeRef = React.useRef<ThemeMode | null>(null);
	
	React.useEffect(() => {
		if (typeof window === 'undefined') return;
		
		// On initial mount, check if cookie exists and sync themeMode to it ONCE
		if (!hasSyncedFromCookie.current) {
			hasSyncedFromCookie.current = true;
			const cookieMatch = document.cookie.match(/(?:^|; )sq_theme=([^;]*)/);
			if (cookieMatch) {
				const cookieTheme = decodeURIComponent(cookieMatch[1]);
				// Map cookie theme to quiz theme mode and sync if different
				if (cookieTheme === 'color' && themeMode !== 'colored') {
					// Cookie says "color" but themeMode is not "colored" - sync it
					setThemeMode('colored');
					previousThemeModeRef.current = 'colored';
					return; // Don't write cookie, just sync state
				} else if ((cookieTheme === 'dark' || cookieTheme === 'light') && themeMode !== cookieTheme) {
					// Cookie says "dark" or "light" but themeMode doesn't match - sync it
					setThemeMode(cookieTheme as ThemeMode);
					previousThemeModeRef.current = cookieTheme as ThemeMode;
					return; // Don't write cookie, just sync state
				}
			} else {
				// No cookie exists - if themeMode is "colored" (quiz default), write cookie immediately
				// This ensures quiz pages start in colored mode and persist
				if (themeMode === 'colored') {
					const unifiedTheme: Theme = 'color';
					applyTheme(unifiedTheme);
					previousThemeModeRef.current = 'colored';
					try {
						localStorage.setItem('quizThemeMode', 'colored');
					} catch (e) {
						// Ignore localStorage errors
					}
					return;
				}
			}
			previousThemeModeRef.current = themeMode;
		}
		
		// If themeMode changed (user action), ALWAYS write to cookie
		// This handles theme changes from presenter view menu
		if (previousThemeModeRef.current !== themeMode) {
			previousThemeModeRef.current = themeMode;
			
			// Map "colored" to "color" for unified theme system
			const unifiedTheme: Theme = themeMode === 'colored' ? 'color' : themeMode;
			
			// Use unified applyTheme function to ensure cookie is written properly
			applyTheme(unifiedTheme);
			
			// Also update localStorage for backward compatibility
			try {
				localStorage.setItem('quizThemeMode', themeMode);
			} catch (e) {
				// Ignore localStorage errors
			}
		} else if (!previousThemeModeRef.current) {
			// Initialize ref on first run if no previous value
			previousThemeModeRef.current = themeMode;
		}
	}, [themeMode]);

	// Use neutral background during SSR to prevent hydration mismatch
	// After mount, use the actual backgroundColor
	const containerBackgroundColor = mounted ? backgroundColor : "transparent";

	// Don't render content until mounted to prevent hydration mismatch
	// This ensures all theme-dependent styles are only applied client-side
	if (!mounted) {
		return (
			<div
				className="min-h-dvh flex flex-col"
				suppressHydrationWarning
				style={{
					backgroundColor: "transparent",
				}}
			/>
		);
	}

	return (
		<div
			className={containerClass}
			suppressHydrationWarning
			style={{
				backgroundColor: containerBackgroundColor,
				transition: "background-color 300ms ease-in-out, color 300ms ease-in-out",
				transitionProperty: "background-color, color",
				transitionDuration: "300ms",
				transitionTimingFunction: "ease-in-out",
			}}
		>
			{/* New Progress Header - Only show in presenter mode */}
			{viewMode === "presenter" && finalQuestions && finalQuestions.length > 0 && (
				<QuestionProgressBar
					total={finalQuestions.length}
					currentIndex={currentIndex}
					sections={sections}
					roundColors={roundColorsArray}
					isDarkText={textColor === "white"}
					backgroundColor={backgroundColor}
					correctAnswers={correctAnswers}
					incorrectAnswers={incorrectAnswers}
					attemptedAnswers={revealedAnswers}
					viewedQuestions={viewedQuestions}
					questions={finalQuestions}
					showPlusOne={showPlusOne}
					onSelect={(n) => {
						// For restricted quiz mode, prevent selecting questions after 6 answers
						if (isDemo && answeredQuestionsCount >= RESTRICTED_ANSWER_LIMIT) {
							return;
						}
						goToIndex(n - 1);
						// Start timer if not already running
						if (!isTimerRunning) {
							startTimer();
						}
					}}
					isMouseActive={isMouseMoving}
				/>
			)}

			{viewMode === "presenter" && (
				<QuizStatusBar
					currentScreen={currentScreen}
					currentRound={currentRoundDetails}
					textColor={textColor}
					score={correctAnswers.size}
					totalQuestions={finalQuestions.length}
					showPlusOne={showPlusOne}
					plusOneKey={plusOneKey}
					isTimerRunning={isTimerRunning}
					timer={timer}
					formatTime={formatTime}
					averageScoreData={averageScoreData}
				/>
			)}

			<QuizHeader
												textColor={textColor}
				headerTone={headerTone}
				backgroundColor={backgroundColor}
				achievements={achievements}
				onDismissAchievement={dismissAchievement}
				themeMode={themeMode}
				onThemeModeChange={setThemeMode}
				onRestartQuiz={restartQuiz}
				onExitQuiz={exitQuiz}
				currentScreen={currentScreen}
				onOpenGridView={viewMode === "presenter" ? switchToGridView : undefined}
				onOpenPresenterView={viewMode === "grid" ? switchToPresenterView : undefined}
				isGridView={viewMode === "grid"}
				isPresenterView={viewMode === "presenter"}
			/>

			{/* Content Area */}
			<div className="flex-1 pt-20 flex items-center justify-center">
					{viewMode === "presenter" ? (
					<QuestionArea
						screen={currentScreen}
						round={currentRoundDetails}
								question={currentQuestion}
								currentIndex={currentIndex}
								totalQuestions={finalQuestions.length}
						textColor={textColor}
						quizColor={roundColor}
						finaleRoundNumber={FINALE_ROUND_NUMBER}
								isAnswerRevealed={isAnswerRevealed}
								isMarkedCorrect={isMarkedCorrect}
								isQuestionAnswered={isMarkedCorrect || incorrectAnswers.has(currentQuestion.id)}
						isMouseMoving={isMouseMoving}
						canGoNext={currentIndex < finalQuestions.length - 1}
						canGoPrevious={currentIndex > 0}
						onStartRound={startRound}
								onRevealAnswer={() => handleRevealAnswer(currentQuestion.id)}
								onHideAnswer={() => handleHideAnswer(currentQuestion.id)}
						onMarkCorrect={(event) => handleMarkCorrect(currentQuestion.id, event)}
								onUnmarkCorrect={() => handleUnmarkCorrect(currentQuestion.id)}
								onNext={goToNext}
								onPrevious={goToPrevious}
								onFinish={!isDemo ? handleFinishQuiz : undefined}
							/>
					) : (
					<MobileGridLayout
						key="grid"
						questions={finalQuestions}
						rounds={finalRounds}
						revealedAnswers={revealedAnswers}
						correctAnswers={correctAnswers}
						textColor={textColor}
						themeMode={themeMode}
						backgroundColor={backgroundColor}
						quizTitle={quizTitle}
						baseColor={quizColor}
						incorrectAnswers={incorrectAnswers}
						finaleRoundNumber={FINALE_ROUND_NUMBER}
						activeQuestionId={currentQuestion?.id}
						onRevealAnswer={handleRevealAnswer}
						onHideAnswer={handleHideAnswer}
						onMarkCorrect={handleMarkCorrect}
						onUnmarkCorrect={handleUnmarkCorrect}
						quizSlug={quizSlug}
						weekISO={weekISO}
						onFinish={handleFinishQuiz}
					/>
					)}
			</div>
			
			{/* Mid-quiz sign-up prompt for visitors */}
			<MidQuizSignupPrompt
				isOpen={showSignupPrompt}
				onClose={() => setShowSignupPrompt(false)}
				onSignUp={() => {
					setShowSignupPrompt(false);
					window.location.href = '/sign-up';
				}}
				questionsAnswered={answeredQuestionsCount}
			/>

			{/* Quiz completion modal */}
			{!isDemo && (
				<QuizCompletionModal
					isOpen={showCompletionModal}
					onClose={() => {
						setShowCompletionModal(false);
						// Navigate to quizzes page when closing
						window.location.href = '/quizzes';
					}}
					score={correctAnswers.size}
					totalQuestions={finalQuestions.length}
					quizSlug={quizSlug}
					quizTitle={quizTitle}
					onReviewAnswers={() => {
						// Switch to grid view to review all answers
						if (viewMode !== 'grid') {
							switchToGridView();
						}
						// Scroll to top
						window.scrollTo({ top: 0, behavior: 'smooth' });
					}}
				/>
			)}

			{/* Incomplete quiz modal */}
			{!isDemo && (
				<IncompleteQuizModal
					isOpen={showIncompleteModal}
					onClose={() => setShowIncompleteModal(false)}
					onFinishAnyway={() => {
						setShowIncompleteModal(false);
						completeQuiz();
					}}
					unansweredQuestions={finalQuestions.filter(q => 
						!correctAnswers.has(q.id) && !incorrectAnswers.has(q.id)
					)}
					allQuestions={finalQuestions}
					onNavigateToQuestion={(questionIndex) => {
						const question = finalQuestions[questionIndex];
						if (question) {
							goToIndex(questionIndex);
							if (viewMode === "grid") {
								switchToPresenterView();
							}
							// Scroll to question in grid view if needed
							if (viewMode === "grid") {
								const questionEl = document.getElementById(`mobile-question-${question.id}`);
								if (questionEl) {
									questionEl.scrollIntoView({ behavior: "smooth", block: "center" });
								}
							}
						}
					}}
					viewMode={viewMode}
				/>
			)}
		</div>
	);
}

// Utility function to determine text color based on background (WCAG luminance)
function getTextColor(hex: string): "black" | "white" {
	const cleanHex = hex.replace("#", "");
	if (cleanHex.length !== 6) return "black";
	
	const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
	const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
	const b = parseInt(cleanHex.slice(4, 6), 16) / 255;

	// WCAG luminance calculation
	const chan = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
	const R = chan(r);
	const G = chan(g);
	const B = chan(b);
	const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;
	
	return luminance > 0.5 ? "black" : "white";
}


