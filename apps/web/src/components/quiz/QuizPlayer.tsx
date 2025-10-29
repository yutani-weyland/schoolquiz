"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Grid3x3, Maximize2, ChevronLeft, ChevronRight, X, Check, PaintBucket } from "lucide-react";
import confetti from "canvas-confetti";
import AnswerReveal from "./AnswerReveal";
import QuizProgress from "./QuizProgress";
import { AnimatedTooltip } from "../AnimatedTooltip";

interface Question {
	id: number;
	question: string;
	answer: string;
	roundNumber: number;
}

interface Round {
	number: number;
	title: string;
	blurb: string;
}

interface QuizPlayerProps {
	quizTitle: string;
	quizColor: string;
	quizSlug: string;
	questions: Question[];
	rounds: Round[];
}

type ViewMode = "presenter" | "grid";
type ScreenType = "round-intro" | "question";
type ThemeMode = "colored" | "light" | "dark";

export function QuizPlayer({ quizTitle, quizColor, quizSlug, questions, rounds }: QuizPlayerProps) {
	// Debug logging
	React.useEffect(() => {
		console.log('QuizPlayer mounted', { quizTitle, quizColor, quizSlug, questionsCount: questions?.length, roundsCount: rounds?.length });
	}, []);

	const [viewMode, setViewMode] = useState<ViewMode>(() => {
		// Read mode from URL params
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const mode = params.get('mode');
			if (mode === 'grid') return 'grid';
		}
		return 'presenter';
	});
	const [currentScreen, setCurrentScreen] = useState<ScreenType>(() => {
		// Skip round intro if starting in grid mode
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const mode = params.get('mode');
			if (mode === 'grid') return 'question';
		}
		return 'round-intro';
	});
	const [currentRound, setCurrentRound] = useState(1);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
	const [correctAnswers, setCorrectAnswers] = useState<Set<number>>(new Set());
	const [themeMode, setThemeMode] = useState<ThemeMode>("colored");
	const [showTimer, setShowTimer] = useState(true);
	const [timer, setTimer] = useState(() => {
		// Load timer from sessionStorage
		if (typeof window !== 'undefined') {
			const saved = sessionStorage.getItem(`quiz-${quizSlug}-timer`);
			return saved ? parseInt(saved, 10) : 0;
		}
		return 0;
	});
	const [isTimerRunning, setIsTimerRunning] = useState(() => {
		// Auto-start timer in grid mode
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const mode = params.get('mode');
			if (mode === 'grid') return true;
		}
		return false; // Don't start until first question in presenter mode
	});
	
	// Safety check
	if (!questions || questions.length === 0) {
		return (
			<div className="fixed inset-0 flex items-center justify-center bg-red-500 text-white">
				<div className="text-center">
					<h1 className="text-4xl font-bold mb-4">Error Loading Quiz</h1>
					<p>No questions found</p>
				</div>
			</div>
		);
	}

	// Timer - save to sessionStorage
	useEffect(() => {
		if (!isTimerRunning) return;
		const interval = setInterval(() => {
			setTimer((t) => {
				const newTime = t + 1;
				sessionStorage.setItem(`quiz-${quizSlug}-timer`, String(newTime));
				return newTime;
			});
		}, 1000);
		return () => clearInterval(interval);
	}, [isTimerRunning, quizSlug]);

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (currentScreen !== "question") return;
			if (e.key === "ArrowLeft" && currentIndex > 0) {
				goToPrevious();
			} else if (e.key === "ArrowRight" && currentIndex < questions.length - 1) {
				goToNext();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [currentIndex, currentScreen, questions.length]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
	};

	const handleRevealAnswer = (id: number) => {
		setRevealedAnswers((prev) => new Set([...prev, id]));
	};

	const handleHideAnswer = (id: number) => {
		setRevealedAnswers((prev) => {
			const newSet = new Set(prev);
			newSet.delete(id);
			return newSet;
		});
		// Also remove correct marking if present
		if (correctAnswers.has(id)) {
			handleUnmarkCorrect(id);
		}
	};

	const handleMarkCorrect = (id: number, event?: React.MouseEvent<HTMLButtonElement>) => {
		setCorrectAnswers((prev) => new Set([...prev, id]));
		
		// Determine if we're in grid view
		const isGridMode = viewMode === "grid";
		
		if (isGridMode && event) {
			// Grid mode: small confetti from checkbox position
			const button = event.currentTarget;
			const rect = button.getBoundingClientRect();
			const x = (rect.left + rect.width / 2) / window.innerWidth;
			const y = (rect.top + rect.height / 2) / window.innerHeight;
			
			confetti({
				particleCount: 30,
				spread: 45,
				origin: { x, y },
				startVelocity: 25,
				gravity: 0.9,
				ticks: 100,
				decay: 0.94,
				colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
				shapes: ['circle', 'square'],
				scalar: 0.8, // Smaller particles
				drift: 0.1
			});
		} else {
			// Presenter mode: big, spread out confetti
			confetti({
				particleCount: 200,
				spread: 180,
				origin: { x: 0.5, y: 0.75 },
				startVelocity: 60,
				gravity: 0.8,
				ticks: 150,
				decay: 0.92,
				colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
				shapes: ['circle', 'square', 'star'],
				scalar: 2.2,
				drift: 0.15
			});
		}
	};

	const handleUnmarkCorrect = (id: number) => {
		setCorrectAnswers((prev) => {
			const newSet = new Set(prev);
			newSet.delete(id);
			return newSet;
		});
	};

	const currentQuestion = questions[currentIndex];
	const isAnswerRevealed = currentQuestion ? revealedAnswers.has(currentQuestion.id) : false;
	const isMarkedCorrect = currentQuestion ? correctAnswers.has(currentQuestion.id) : false;

	const goToNext = () => {
		const nextIndex = currentIndex + 1;
		if (nextIndex < questions.length) {
			const nextQuestion = questions[nextIndex];
			// Check if we're moving to a new round
			if (nextQuestion.roundNumber !== currentQuestion.roundNumber) {
				setCurrentRound(nextQuestion.roundNumber);
				setCurrentScreen("round-intro");
			}
			setCurrentIndex(nextIndex);
		}
	};

	const goToPrevious = () => {
		if (currentIndex > 0) {
			const prevIndex = currentIndex - 1;
			const prevQuestion = questions[prevIndex];
			// Check if we're moving to a different round
			if (prevQuestion.roundNumber !== currentQuestion.roundNumber) {
				setCurrentRound(prevQuestion.roundNumber);
				setCurrentScreen("round-intro");
			}
			setCurrentIndex(prevIndex);
		}
	};

	const startRound = () => {
		setCurrentScreen("question");
		setIsTimerRunning(true); // Start timer when quiz begins
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
		
		// Return slightly lighter/less saturated version
		return `rgba(${r}, ${g}, ${b}, 0.95)`;
	};

	// Get round-specific color
	const getRoundColor = (roundNumber: number, baseColor: string) => {
		const roundColors = [
			baseColor, // Round 1 - quiz card color
			"#39FF14", // Round 2 - neon green
			"#FF69B4", // Round 3 - hot pink
			"#FFD84D", // Round 4 - yellow
			"#7FB3FF", // Round 5 - blue
		];
		return roundColors[roundNumber - 1] || baseColor;
	};

	const currentRoundNumber = currentQuestion?.roundNumber || 1;
	const roundColor = getRoundColor(currentRoundNumber, quizColor);
	
	const backgroundColor = themeMode === "colored" 
		? getDesaturatedColor(roundColor)
		: themeMode === "light" 
		? "#ffffff" 
		: "#1a1a1a";
	
	const textColor = themeMode === "colored" 
		? getTextColor(roundColor)
		: themeMode === "light"
		? "black"
		: "white";

	return (
		<div className="fixed inset-0 flex flex-col transition-colors duration-700 ease-in-out" style={{ backgroundColor }}>
			{/* New Progress Header - Only show in presenter mode */}
			{viewMode === "presenter" && questions && questions.length > 0 && (
				<QuizProgress
					total={questions.length}
					currentIndex={currentIndex}
					correctCount={correctAnswers.size}
					textColor={textColor}
					questions={questions}
					baseColor={quizColor}
					onSegmentClick={(index) => {
						setCurrentIndex(index);
						setCurrentScreen("question");
					}}
				/>
			)}

			{/* Top Bar - Logo and Icons - Consistent with site header (py-3 px-6) */}
			<div className="absolute top-0 left-0 right-0 flex items-center justify-between py-3 px-6 z-50">
				{/* Logo - Top Left */}
				<motion.a
					href="#"
					onClick={(e) => {
						e.preventDefault();
						if (typeof window !== 'undefined') {
							const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
							window.location.href = isLoggedIn ? '/quizzes' : '/';
						}
					}}
					initial={{ opacity: 0, x: -10 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.4 }}
					className={`text-2xl font-bold tracking-tight cursor-pointer hover:opacity-80 transition-opacity ${
						textColor === "white" ? "text-white" : "text-gray-900"
					}`}
				>
					The School Quiz
				</motion.a>
				
				{/* Icons - Top Right */}
				<div className="flex items-center gap-2">
				<AnimatedTooltip content="Change theme" position="left">
					<motion.button
						onClick={() => {
							const modes: ThemeMode[] = ["colored", "light", "dark"];
							const currentIdx = modes.indexOf(themeMode);
							setThemeMode(modes[(currentIdx + 1) % modes.length]);
						}}
						className={`p-3 rounded-full transition ${
							textColor === "white"
								? "bg-white/15 hover:bg-white/25 text-white"
								: "bg-black/10 hover:bg-black/15 text-gray-900"
						}`}
						whileHover={{ 
							scale: 1.1,
							transition: { 
								type: "spring", 
								stiffness: 400, 
								damping: 10 
							}
						}}
						whileTap={{ scale: 0.85, rotate: -5 }}
					>
					<motion.div
						className="relative"
						whileHover={{
							scale: 1.15,
							rotate: [0, -8, 8, -8, 0],
							transition: {
								duration: 0.4,
								ease: "easeInOut"
							}
						}}
						whileTap={{ scale: 0.9 }}
					>
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 ﷎2.828l-8.486 8.485M7 17h.01" />
						</svg>
					</motion.div>
					</motion.button>
				</AnimatedTooltip>

				<AnimatedTooltip content={viewMode === "presenter" ? "Grid view" : "Presenter view"} position="left">
					<motion.button
						onClick={() => setViewMode(viewMode === "presenter" ? "grid" : "presenter")}
						className={`p-3 rounded-full transition ${
							textColor === "white"
								? "bg-white/15 hover:bg-white/25 text-white"
								: "bg-black/10 hover:bg-black/15 text-gray-900"
						}`}
						whileHover={{ 
							scale: 1.1,
							rotate: [0, 15, -15, 0],
							transition: { 
								rotate: { duration: 0.5, ease: "easeInOut" },
								scale: { type: "spring", stiffness: 400, damping: 10 }
							}
						}}
						whileTap={{ scale: 0.85, rotate: 5 }}
					>
						<motion.div
							animate={{ 
								rotate: viewMode === "grid" ? 0 : 90,
								transition: { type: "spring", stiffness: 300, damping: 20 }
							}}
						>
							{viewMode === "presenter" ? <Grid3x3 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
						</motion.div>
					</motion.button>
				</AnimatedTooltip>

				<AnimatedTooltip content="Exit quiz" position="left">
					<motion.button
						onClick={() => window.location.href = '/quizzes'}
						className={`p-3 rounded-full transition ${
							textColor === "white"
								? "bg-white/15 hover:bg-white/25 text-white"
								: "bg-black/10 hover:bg-black/15 text-gray-900"
						}`}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
					>
						<X className="h-5 w-5" />
					</motion.button>
				</AnimatedTooltip>
				</div>
			</div>

			{/* Content Area */}
			<div className="flex-1 overflow-y-auto">
				<AnimatePresence mode="wait">
					{viewMode === "presenter" ? (
						currentScreen === "round-intro" ? (
							<RoundIntro
								key={`round-${currentRound}`}
								round={rounds.find(r => r.number === currentRound)!}
								textColor={textColor}
								onStart={startRound}
							/>
						) : (
							<PresenterMode
								key={`question-${currentIndex}`}
								question={currentQuestion}
								currentIndex={currentIndex}
								totalQuestions={questions.length}
								isAnswerRevealed={isAnswerRevealed}
								isMarkedCorrect={isMarkedCorrect}
								textColor={textColor}
								quizColor={roundColor}
								revealedAnswers={revealedAnswers}
								setRevealedAnswers={setRevealedAnswers}
								onRevealAnswer={() => handleRevealAnswer(currentQuestion.id)}
								onHideAnswer={() => handleHideAnswer(currentQuestion.id)}
								onMarkCorrect={() => handleMarkCorrect(currentQuestion.id, undefined)}
								onUnmarkCorrect={() => handleUnmarkCorrect(currentQuestion.id)}
								onNext={goToNext}
								onPrevious={goToPrevious}
								canGoNext={currentIndex < questions.length - 1}
								canGoPrevious={currentIndex > 0}
							/>
						)
					) : (
						<GridMode
							key="grid"
							questions={questions}
							rounds={rounds}
							revealedAnswers={revealedAnswers}
							correctAnswers={correctAnswers}
							textColor={textColor}
							themeMode={themeMode}
							backgroundColor={backgroundColor}
							quizTitle={quizTitle}
							quizId={quizSlug}
							baseColor={quizColor}
							onRevealAnswer={handleRevealAnswer}
							onHideAnswer={handleHideAnswer}
							onMarkCorrect={handleMarkCorrect}
							onUnmarkCorrect={handleUnmarkCorrect}
							onSelectQuestion={(index: number) => {
								setCurrentIndex(index);
								setCurrentScreen("question");
								setViewMode("presenter");
							}}
						/>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}

// Round Intro Component
function RoundIntro({ round, textColor, onStart }: any) {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 1.05 }}
			transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
			className="min-h-full flex flex-col items-center justify-center px-8 md:px-16 lg:px-24 py-12"
		>
			<div className="max-w-4xl w-full text-center space-y-8">
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.2, duration: 0.6 }}
				>
					<div
						className={`text-xl md:text-2xl font-bold mb-4 ${
							textColor === "white" ? "text-white" : "text-gray-900"
						}`}
					>
						Round {round.number}
					</div>
					<h2
						className={`text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 ${
							textColor === "white" ? "text-white" : "text-gray-900"
						}`}
					>
						{round.title}
					</h2>
					<p
						className={`text-title ${
							textColor === "white" ? "text-white opacity-80" : "text-gray-900 opacity-70"
						}`}
					>
						{round.blurb}
					</p>
				</motion.div>

			<motion.button
				onClick={onStart}
				className={`px-10 py-5 rounded-full text-2xl font-bold transition shadow-2xl ${
					textColor === "white"
						? "bg-white text-gray-900 hover:bg-white/90"
						: "bg-gray-900 text-white hover:bg-gray-800"
				}`}
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
			>
				Let's go! →
			</motion.button>
			</div>
		</motion.div>
	);
}

// Auto-fit hook for text that scales down if too large
function useFitDown(maxPx = 60, minPx = 24) {
	const ref = React.useRef<HTMLParagraphElement>(null);
	
	React.useEffect(() => {
		const el = ref.current;
		if (!el) return;
		
		const parent = el.parentElement?.parentElement; // Get the container div
		if (!parent) return;
		
		const ro = new ResizeObserver(() => {
			// Reset to max size
			let size = maxPx;
			el.style.fontSize = `${size}px`;
			
			// Check if it overflows and reduce until it fits
			// Account for scroll padding and some extra space
			const availableHeight = parent.clientHeight - 100; // Reserve space for padding/CTA
			
			while (size > minPx && el.scrollHeight > availableHeight) {
				size -= 1;
				el.style.fontSize = `${size}px`;
			}
		});
		
		ro.observe(parent);
		ro.observe(el);
		
		return () => ro.disconnect();
	}, [maxPx, minPx]);
	
	return ref;
}

// Presenter Mode Component
function PresenterMode({
	question,
	currentIndex,
	totalQuestions,
	isAnswerRevealed,
	isMarkedCorrect,
	textColor,
	quizColor,
	onRevealAnswer,
	onHideAnswer,
	onMarkCorrect,
	onUnmarkCorrect,
	onNext,
	onPrevious,
	canGoNext,
	canGoPrevious,
}: any) {
	const [showRoundInfo, setShowRoundInfo] = React.useState(false);
	const questionRef = useFitDown(60, 28); // Auto-scale from 60px down to 28px if needed
	
	// Get round title
	const getRoundTitle = (roundNum: number) => {
		const titles = ["Shape Up", "Pumpkins", "Famous First Words", "Crazes", "Next In Sequence"];
		return titles[roundNum - 1] || `Round ${roundNum}`;
	};

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.25, ease: "easeInOut" }}
			className="grid min-h-full relative"
			style={{ 
				gridTemplateRows: '1fr auto',
				minHeight: 'calc(100vh - 120px)',
				paddingBottom: 'env(safe-area-inset-bottom)'
			}}
			role="main"
			aria-label="Quiz presenter"
		>
			{/* Fixed Navigation Arrows */}
			<div className="fixed left-4 sm:left-8 top-1/2 -translate-y-1/2 z-40">
				<motion.button
					onClick={onPrevious}
					disabled={!canGoPrevious}
					className={`p-3 sm:p-4 rounded-full transition ${
						canGoPrevious
							? textColor === "white"
								? "bg-white/15 hover:bg-white/25 text-white"
								: "bg-black/10 hover:bg-black/15 text-gray-900"
							: "opacity-30 cursor-not-allowed"
					}`}
					whileHover={canGoPrevious ? { scale: 1.05 } : {}}
					whileTap={canGoPrevious ? { scale: 0.95 } : {}}
					aria-label="Previous question"
				>
					<ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
				</motion.button>
			</div>

			<div className="fixed right-4 sm:right-8 top-1/2 -translate-y-1/2 z-40">
				<motion.button
					onClick={onNext}
					disabled={!canGoNext}
					className={`p-3 sm:p-4 rounded-full transition ${
						canGoNext
							? textColor === "white"
								? "bg-white/15 hover:bg-white/25 text-white"
								: "bg-black/10 hover:bg-black/15 text-gray-900"
							: "opacity-30 cursor-not-allowed"
					}`}
					whileHover={canGoNext ? { scale: 1.05 } : {}}
					whileTap={canGoNext ? { scale: 0.95 } : {}}
					aria-label="Next question"
				>
					<ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
				</motion.button>
			</div>

			{/* Main: Question Stage - vertically centered with scroll if needed */}
			<main
				className="relative min-h-0 overflow-y-auto flex flex-col justify-center items-center px-4 sm:px-6 md:px-8 scroll-pb-32"
				aria-live="polite"
			>
				<div className="max-w-[85ch] text-center [text-wrap:balance]">
					{/* Subtle round indicator */}
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.1 }}
						className="mb-4"
					>
						<div className="flex flex-col items-center gap-1">
							<span 
								className={`text-sm font-semibold tracking-wide uppercase ${
									textColor === "white" ? "text-white/50" : "text-black/50"
								}`}
							>
								{getRoundTitle(question.roundNumber)}
							</span>
							<span 
								className={`text-sm font-semibold ${
									textColor === "white" ? "text-white/60" : "text-black/60"
								}`}
							>
								Question {currentIndex + 1} of {totalQuestions}
							</span>
						</div>
					</motion.div>

					{/* Question - truly centered and balanced, auto-scales if too large */}
					<motion.p
						ref={questionRef}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.25, delay: 0.15 }}
						className={`font-extrabold leading-[1.05] break-words [overflow-wrap:anywhere] ${
							textColor === "white" ? "text-white" : "text-gray-900"
						}`}
						style={{
							fontSize: 'clamp(28px, 5vw, 60px)' // Base responsive size, hook will adjust if needed
						}}
					>
						{question.question}
					</motion.p>
				</div>
			</main>

			{/* CTA: Reveal Answer - consistent position above footer */}
			<div className="px-6 sm:px-10 mt-4 pb-6">
				<div className="w-full max-w-xl mx-auto">
					<AnswerReveal
						answerText={question.answer}
						revealed={isAnswerRevealed}
						onReveal={onRevealAnswer}
						onHide={onHideAnswer}
						accentColor={quizColor}
						textColor={textColor}
						isMarkedCorrect={isMarkedCorrect}
						onMarkCorrect={onMarkCorrect}
						onUnmarkCorrect={onUnmarkCorrect}
					/>
				</div>
			</div>
		</motion.div>
	);
}

// Grid Mode Component - Flat "All Rounds" Layout
function GridMode({
	questions,
	rounds,
	revealedAnswers,
	correctAnswers,
	textColor,
	themeMode,
	backgroundColor,
	onRevealAnswer,
	onHideAnswer,
	onMarkCorrect,
	onUnmarkCorrect,
	onSelectQuestion,
	quizTitle,
	quizId,
	baseColor,
}: {
	questions: Question[];
	rounds: Round[];
	revealedAnswers: Set<number>;
	correctAnswers: Set<number>;
	textColor: string;
	themeMode: ThemeMode;
	backgroundColor: string;
	onRevealAnswer: (id: number) => void;
	onHideAnswer: (id: number) => void;
	onMarkCorrect: (id: number, event?: React.MouseEvent<HTMLButtonElement>) => void;
	onUnmarkCorrect: (id: number) => void;
	onSelectQuestion: (index: number) => void;
	quizTitle: string;
	quizId: string;
	baseColor: string;
}) {

	// Group questions by round
	const questionsByRound = questions.reduce((acc: any, q: Question) => {
		if (!acc[q.roundNumber]) acc[q.roundNumber] = [];
		acc[q.roundNumber].push(q);
		return acc;
	}, {});

	// Round colors matching presenter mode
	const roundColors = [
		baseColor, // Round 1 uses quiz base color
		"#9b87f5", // Round 2 - Purple
		"#10b981", // Round 3 - Green
		"#f59e0b", // Round 4 - Amber
		"#ec4899", // Round 5 - Pink
	];

	const getRoundColor = (roundNumber: number) => {
		return roundColors[roundNumber - 1] || baseColor;
	};


	// Determine question status
	const getQuestionStatus = (q: Question): "idle" | "revealed" | "correct" | "incorrect" => {
		if (correctAnswers.has(q.id)) return "correct";
		if (revealedAnswers.has(q.id)) return "revealed";
		return "idle";
	};

	const totalCorrect = correctAnswers.size;
	const progress = Math.round((totalCorrect / questions.length) * 100);


	const isDark = themeMode === "dark";
	const isLight = themeMode === "light";
	const isColored = themeMode === "colored";
	
	// Text colors - use theme-specific logic
	const textColorClass = isDark 
		? "text-white" 
		: isColored
		? (textColor === "white" ? "text-white" : "text-gray-900")
		: "text-gray-900";
	
	// Background colors
	const cardBgClass = isDark 
		? "bg-gray-700/95" 
		: isLight
		? "bg-white"
		: "bg-white/90"; // Colored mode with slight transparency
	
	const roundCardBgClass = isDark 
		? "bg-gray-700/80" 
		: isLight
		? "bg-gray-50/90"
		: "bg-white/55"; // Colored mode with transparency
	
	const borderColorClass = isDark 
		? "border-white/20" 
		: isLight
		? "border-black/10"
		: "border-black/5"; // Colored mode subtle border

	return (
		<div className="min-h-dvh overflow-y-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom)', backgroundColor }}>
			{/* Header - Sticky */}
			<div className="pt-16">
				<header className={`sticky top-0 bg-[${backgroundColor}]/90 backdrop-blur-sm py-4 mb-4 border-b ${borderColorClass} z-10`}
						style={{ background: themeMode === "colored" ? `${baseColor}E6` : undefined }}>
					<div className="mx-auto max-w-6xl px-4 sm:px-6">
						<div className="flex flex-col min-w-0">
							<span className={`text-xs font-semibold tracking-wide uppercase opacity-70 ${
								isColored ? (textColor === "white" ? "text-white/90" : "text-gray-900/70") : textColorClass
							}`}>
								The School Quiz · #{quizId}
							</span>
							<h1 className={`text-2xl sm:text-3xl font-extrabold leading-tight break-words pr-4 ${
								isColored ? (textColor === "white" ? "text-white" : "text-gray-900") : textColorClass
							}`}>{quizTitle}</h1>
							<p className={`text-sm opacity-80 ${
								isColored ? (textColor === "white" ? "text-white/90" : "text-gray-900/80") : textColorClass
							}`}>
								{questions.length} questions · {rounds.length} rounds · {totalCorrect}/{questions.length} correct ({progress}%)
							</p>
						</div>
					</div>
				</header>

				{/* Content - Flat rounds layout */}
				<main className="mx-auto max-w-6xl px-4 sm:px-6 pb-24 space-y-8">
				{rounds.map((round: any) => {
					const roundColor = getRoundColor(round.number);
					const roundQuestions = questionsByRound[round.number] || [];
					const roundCorrect = roundQuestions.filter((q: Question) => correctAnswers.has(q.id)).length;
					
					return (
						<motion.section
							key={round.number}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							className={`rounded-2xl ${cardBgClass} ring-1 ${borderColorClass} shadow-sm p-4 sm:p-6`}
						>
							{/* Round Header */}
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-3 min-w-0">
									<div className="h-4 w-4 rounded-full shrink-0" style={{ background: roundColor }} />
									<h2 className={`text-xl font-extrabold leading-tight ${
										isColored ? (textColor === "white" ? "text-white" : "text-gray-900") : textColorClass
									}`}>
										Round {round.number}: {round.title}
									</h2>
								</div>
								<span className={`text-sm font-semibold tabular-nums ${
									isColored ? (textColor === "white" ? "text-white/90" : "text-gray-900/90") : textColorClass
								}`}>
									{roundCorrect}/{roundQuestions.length} correct
								</span>
							</div>

							{/* Questions Grid - Always Visible */}
							<div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
								{roundQuestions.map((q: Question, idx: number) => {
									const globalIndex = questions.findIndex((qu: Question) => qu.id === q.id);
									const status = getQuestionStatus(q);
									const isRevealed = revealedAnswers.has(q.id);
									const isCorrect = correctAnswers.has(q.id);
									const statusStyles: Record<typeof status, string> = {
										idle: "ring-black/5",
										revealed: "ring-yellow-600/30",
										correct: "ring-green-600/30",
										incorrect: "ring-red-600/30",
									};
									const badgeStyles: Record<typeof status, string> = {
										idle: "bg-black/70 text-white",
										revealed: "bg-yellow-600/90 text-white",
										correct: "bg-green-600 text-white",
										incorrect: "bg-red-600 text-white",
									};

									return (
										<motion.div
											key={q.id}
											initial={{ opacity: 0, scale: 0.95 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{ delay: idx * 0.03 }}
											whileHover={{ y: -2 }}
											className={`group rounded-xl ${cardBgClass} ring-1 ${statusStyles[status]} shadow-sm p-4 transition cursor-pointer flex flex-col min-h-[240px]`}
											onClick={() => onSelectQuestion(globalIndex)}
										>
											{/* Header */}
											<div className="flex items-start justify-between gap-2 mb-3">
												<div className="flex items-center gap-2">
													<span className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold ${badgeStyles[status]}`}>
														{idx + 1}
													</span>
													<div className="h-2 w-2 rounded-full shrink-0" style={{ background: roundColor }} />
												</div>
											</div>

											{/* Content area - takes up available space */}
											<div className="flex-1 flex flex-col">
												{/* Question Text */}
												<p className={`${isDark ? "text-base font-medium" : "text-sm"} leading-snug line-clamp-4 [text-wrap:balance] mb-3 ${
													isColored ? (textColor === "white" ? "text-white" : "text-gray-900") : textColorClass
												}`}>
													{q.question}
												</p>

												{/* Answer (when revealed) */}
												{isRevealed && (
													<p className={`text-xs font-semibold mb-3 line-clamp-3 ${
														isDark ? "text-gray-300" 
														: isColored ? (textColor === "white" ? "text-white/90" : "text-gray-700")
														: "text-gray-700"
													}`}>
														{q.answer}
													</p>
												)}

												{/* Spacer to push actions to bottom */}
												<div className="flex-1" />
											</div>

											{/* Actions - anchored to bottom */}
											<div className="flex items-center justify-between gap-2 mt-auto pt-3">
												{/* Mini Reveal/Checkbox Section */}
												<div className="flex items-center gap-2 flex-1">
													{!isRevealed ? (
														<button
															onClick={(e) => {
																e.stopPropagation();
																onRevealAnswer(q.id);
															}}
															className="px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity"
														>
															Reveal
														</button>
													) : (
														<>
															<button
																onClick={(e) => {
																	e.stopPropagation();
																	onHideAnswer(q.id);
																}}
																className="px-3 py-1.5 bg-gray-200 text-gray-800 text-xs font-semibold rounded-full hover:bg-gray-300 transition-colors"
															>
																Hide
															</button>
															{/* Mini Checkbox Circle */}
															<button
																onClick={(e) => {
																	e.stopPropagation();
																	if (isCorrect) {
																		onUnmarkCorrect(q.id);
																	} else {
																		onMarkCorrect(q.id, e);
																	}
																}}
																className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
																	isCorrect 
																		? "bg-green-600 ring-2 ring-green-600 ring-offset-2" 
																		: "bg-white border-2 border-gray-300 hover:border-gray-400"
																}`}
																aria-label={isCorrect ? "Mark as incorrect" : "Mark as correct"}
															>
																{isCorrect && (
																	<motion.div
																		initial={{ scale: 0 }}
																		animate={{ scale: 1 }}
																		transition={{ type: "spring", stiffness: 300, damping: 20 }}
																	>
																		<Check className="h-4 w-4 text-white" strokeWidth={3} />
																	</motion.div>
																)}
															</button>
														</>
													)}
												</div>
												
												{/* Click to open indicator */}
												<span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>→</span>
											</div>
										</motion.div>
									);
								})}
							</div>
						</motion.section>
					);
				})}
				</main>
			</div>

			{/* Floating score HUD - Bottom right with equal spacing */}
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				className="fixed bottom-6 right-6 z-30"
			>
				<div className={`rounded-full px-6 py-3 shadow-lg ${isDark ? "bg-gray-800 text-white border border-white/20" : "bg-black text-white"}`}>
					<span className="text-lg font-bold">Score {totalCorrect}/{questions.length}</span>
				</div>
			</motion.div>
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

