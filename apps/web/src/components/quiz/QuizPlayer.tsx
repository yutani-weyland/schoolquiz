"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Grid3x3, Maximize2, ChevronLeft, ChevronRight, X, Check } from "lucide-react";
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

	const handleMarkCorrect = (id: number) => {
		setCorrectAnswers((prev) => new Set([...prev, id]));
		
		// Get current round number to determine color
		const question = questions.find(q => q.id === id);
		const roundNumber = question?.roundNumber || 1;
		
		// Round colors matching the UI
		const roundColors = [
			quizColor, // Round 1 uses quiz base color
			"#9b87f5", // Round 2 - Purple
			"#10b981", // Round 3 - Green
			"#f59e0b", // Round 4 - Amber
			"#ec4899", // Round 5 - Pink
		];
		
		const roundColor = roundColors[roundNumber - 1] || quizColor;
		
		// Create star shape for confetti
		const star = confetti.shapeFromPath({
			path: 'M0 -1 L0.588 0.809 L-0.951 -0.309 L0.951 -0.309 L-0.588 0.809 Z',
		});
		
		// Elegant star burst animation
		const duration = 1200;
		const animationEnd = Date.now() + duration;
		const defaults = { 
			startVelocity: 25,
			spread: 360,
			ticks: 60,
			zIndex: 9999,
			gravity: 0.8,
			decay: 0.94,
			scalar: 1.2,
			shapes: [star],
			colors: [roundColor, '#FFFFFF']
		};

		function randomInRange(min: number, max: number) {
			return Math.random() * (max - min) + min;
		}

		const interval = setInterval(function() {
			const timeLeft = animationEnd - Date.now();

			if (timeLeft <= 0) {
				return clearInterval(interval);
			}

			const particleCount = 50 * (timeLeft / duration);
			
			// Multiple star bursts from different positions
			confetti({
				...defaults,
				particleCount,
				origin: { x: randomInRange(0.2, 0.4), y: randomInRange(0.3, 0.7) },
			});
			confetti({
				...defaults,
				particleCount,
				origin: { x: randomInRange(0.6, 0.8), y: randomInRange(0.3, 0.7) },
			});
		}, 150);
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
		<LayoutGroup>
			<div className="fixed inset-0 flex flex-col transition-colors duration-700 ease-in-out" style={{ backgroundColor }}>
			{/* New Progress Header - Temporarily disabled for debugging */}
			{questions && questions.length > 0 && (
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

			{/* Top-Right Icons - Absolute Position */}
			<div className="absolute right-6 top-6 flex items-center gap-2 z-50">
				<AnimatedTooltip content="Change theme" position="bottom">
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
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
					>
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
						</svg>
					</motion.button>
				</AnimatedTooltip>

				<AnimatedTooltip content={viewMode === "presenter" ? "Grid view" : "Presenter view"} position="bottom">
					<motion.button
						onClick={() => setViewMode(viewMode === "presenter" ? "grid" : "presenter")}
						className={`p-3 rounded-full transition ${
							textColor === "white"
								? "bg-white/15 hover:bg-white/25 text-white"
								: "bg-black/10 hover:bg-black/15 text-gray-900"
						}`}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
					>
						{viewMode === "presenter" ? <Grid3x3 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
					</motion.button>
				</AnimatedTooltip>

				<AnimatedTooltip content="Exit quiz" position="bottom">
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
								onMarkCorrect={() => handleMarkCorrect(currentQuestion.id)}
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
							quizTitle={quizTitle}
							quizId={quizSlug}
							baseColor={quizColor}
							onRevealAnswer={handleRevealAnswer}
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
		</LayoutGroup>
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
			className="min-h-full flex flex-col items-center relative"
			style={{ 
				minHeight: 'calc(100vh - 120px)',
				paddingTop: '6vh',
				paddingBottom: '25vh'
			}}
		>
			{/* Fixed Navigation Arrows */}
			<div className="fixed left-8 top-1/2 -translate-y-1/2 z-40">
				<motion.button
					onClick={onPrevious}
					disabled={!canGoPrevious}
					className={`p-4 rounded-full transition ${
						canGoPrevious
							? textColor === "white"
								? "bg-white/15 hover:bg-white/25 text-white"
								: "bg-black/10 hover:bg-black/15 text-gray-900"
							: "opacity-30 cursor-not-allowed"
					}`}
					whileHover={canGoPrevious ? { scale: 1.05 } : {}}
					whileTap={canGoPrevious ? { scale: 0.95 } : {}}
				>
					<ChevronLeft className="h-6 w-6" />
				</motion.button>
			</div>

			<div className="fixed right-8 top-1/2 -translate-y-1/2 z-40">
				<motion.button
					onClick={onNext}
					disabled={!canGoNext}
					className={`p-4 rounded-full transition ${
						canGoNext
							? textColor === "white"
								? "bg-white/15 hover:bg-white/25 text-white"
								: "bg-black/10 hover:bg-black/15 text-gray-900"
							: "opacity-30 cursor-not-allowed"
					}`}
					whileHover={canGoNext ? { scale: 1.05 } : {}}
					whileTap={canGoNext ? { scale: 0.95 } : {}}
				>
					<ChevronRight className="h-6 w-6" />
				</motion.button>
			</div>

			{/* Main centered content - constrained to not overlap answer button */}
			<div className="w-full flex-1 flex flex-col items-center justify-center px-8 md:px-16" style={{
				maxWidth: '90vw',
				marginBottom: 'calc(14vh + 100px)' // Reserve space for answer button
			}}>
				<div className="w-full grid gap-6 text-center" style={{ maxWidth: 'min(78ch, 85vw)' }}>
					{/* Subtle round indicator above question */}
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.1 }}
					>
						<span 
							className={`text-sm font-semibold tracking-wide uppercase ${
								textColor === "white" ? "text-white/50" : "text-black/50"
							}`}
						>
							{getRoundTitle(question.roundNumber)}
						</span>
					</motion.div>

					{/* Question - Large, Centered, won't overlap button */}
					<motion.h1
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.25, delay: 0.15 }}
						className={`text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.15] text-balance ${
							textColor === "white" ? "text-white" : "text-gray-900"
						}`}
					>
						{question.question}
					</motion.h1>
				</div>
			</div>

			{/* Answer Section - Fixed distance from bottom */}
			<div className="w-full flex items-center justify-center absolute" style={{
				bottom: 'clamp(16vh, 22vh, 240px)',
				left: 0,
				right: 0
			}}>
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
		</motion.div>
	);
}

// Grid Mode Component
function GridMode({
	questions,
	rounds,
	revealedAnswers,
	correctAnswers,
	textColor,
	onRevealAnswer,
	onMarkCorrect,
	onUnmarkCorrect,
	onSelectQuestion,
	quizTitle,
	quizId,
	baseColor,
}: any) {
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

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="p-6 md:p-10 overflow-y-auto"
			style={{ maxHeight: 'calc(100vh - 120px)' }}
		>
			<div className="max-w-7xl mx-auto space-y-8">
				{/* Wide Title Card */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden"
					style={{ 
						backgroundColor: baseColor,
						color: textColor === "white" ? "#fff" : "#000"
					}}
				>
					<div className="relative z-10">
						<div className="text-sm font-semibold uppercase tracking-wider mb-3 opacity-70">
							Quiz #{quizId}
						</div>
						<h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4">
							{quizTitle}
						</h1>
						<div className="flex items-center gap-4 text-lg opacity-80">
							<span>{questions.length} questions</span>
							<span>•</span>
							<span>{rounds.length} rounds</span>
							<span>•</span>
							<span>{correctAnswers.size}/{questions.length} correct</span>
						</div>
					</div>
				</motion.div>

				{/* Round Sections */}
				{rounds.map((round: any, roundIdx: number) => {
					const roundColor = getRoundColor(round.number);
					const roundTextColor = getTextColor(roundColor);
					
					return (
						<motion.div
							key={round.number}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1 + roundIdx * 0.1 }}
						>
							{/* Round Header */}
							<div
								className="rounded-2xl p-6 mb-4 shadow-lg"
								style={{
									backgroundColor: roundColor,
									color: roundTextColor === "white" ? "#fff" : "#000"
								}}
							>
								<div className="flex items-center justify-between">
									<div>
										<div className="text-sm font-semibold uppercase tracking-wide mb-1 opacity-70">
											Round {round.number}
										</div>
										<h2 className="text-3xl font-extrabold">
											{round.title}
										</h2>
									</div>
									<div className="text-right">
										<div className="text-4xl font-black">
											{questionsByRound[round.number]?.filter((q: Question) => correctAnswers.has(q.id)).length || 0}/5
										</div>
										<div className="text-sm opacity-70">correct</div>
									</div>
								</div>
							</div>

							{/* Questions Grid */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{questionsByRound[round.number]?.map((q: Question, idx: number) => {
									const globalIndex = questions.findIndex((qu: Question) => qu.id === q.id);
									const isRevealed = revealedAnswers.has(q.id);
									const isCorrect = correctAnswers.has(q.id);

									return (
										<motion.div
											key={q.id}
											initial={{ opacity: 0, scale: 0.95 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{ delay: 0.05 * idx }}
											className={`p-5 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
												isCorrect 
													? "ring-4 ring-green-500 bg-green-50 dark:bg-green-950" 
													: "bg-white dark:bg-gray-800 hover:scale-[1.02]"
											}`}
											style={{
												boxShadow: isCorrect 
													? "0 10px 40px rgba(16,185,129,0.3)" 
													: "0 4px 15px rgba(0,0,0,0.1)"
											}}
											onClick={() => onSelectQuestion(globalIndex)}
										>
											<div className="flex items-start gap-3 mb-3">
												<div
													className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
													style={{
														backgroundColor: roundColor,
														color: roundTextColor === "white" ? "#fff" : "#000"
													}}
												>
													{idx + 1}
												</div>
												{isCorrect && (
													<div className="ml-auto flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
														<Check className="h-5 w-5 text-white" strokeWidth={3} />
													</div>
												)}
											</div>

											<div className="text-sm font-bold mb-3 text-gray-900 dark:text-white line-clamp-2">
												{q.question}
											</div>

											{isRevealed && (
												<div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
													{q.answer}
												</div>
											)}

											{!isRevealed ? (
												<button
													onClick={(e) => {
														e.stopPropagation();
														onRevealAnswer(q.id);
													}}
													className="text-xs px-3 py-1.5 rounded-full font-medium transition"
													style={{
														backgroundColor: roundColor,
														color: roundTextColor === "white" ? "#fff" : "#000",
														opacity: 0.9
													}}
												>
													Reveal answer
												</button>
											) : !isCorrect && (
												<button
													onClick={(e) => {
														e.stopPropagation();
														onMarkCorrect(q.id);
													}}
													className="text-xs px-3 py-1.5 rounded-full bg-green-500 text-white font-medium hover:bg-green-600 transition"
												>
													Mark correct
												</button>
											)}
										</motion.div>
									);
								})}
							</div>
						</motion.div>
					);
				})}
			</div>
		</motion.div>
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

