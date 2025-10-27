"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Grid3x3, Maximize2, ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import confetti from "canvas-confetti";
import AnswerReveal from "./AnswerReveal";
import QuizProgress from "./QuizProgress";

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

	const [viewMode, setViewMode] = useState<ViewMode>("presenter");
	const [currentScreen, setCurrentScreen] = useState<ScreenType>("round-intro");
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
	const [isTimerRunning, setIsTimerRunning] = useState(false); // Don't start until first question
	
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
		
		// Get complementary colors based on quiz color
		const getComplementaryColors = (hex: string) => {
			const r = parseInt(hex.slice(1, 3), 16);
			const g = parseInt(hex.slice(3, 5), 16);
			const b = parseInt(hex.slice(5, 7), 16);
			
			// Create variations of the main color
			const lighter = `rgb(${Math.min(255, r + 60)}, ${Math.min(255, g + 60)}, ${Math.min(255, b + 60)})`;
			const darker = `rgb(${Math.max(0, r - 60)}, ${Math.max(0, g - 60)}, ${Math.max(0, b - 60)})`;
			
			// Complementary color (opposite on color wheel)
			const compR = 255 - r;
			const compG = 255 - g;
			const compB = 255 - b;
			const complementary = `rgb(${compR}, ${compG}, ${compB})`;
			
			return [hex, lighter, darker, complementary, "#FFD700"];
		};
		
		const colors = getComplementaryColors(quizColor);
		
		// Multi-burst confetti animation for more satisfaction
		const duration = 2000;
		const animationEnd = Date.now() + duration;
		const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

		function randomInRange(min: number, max: number) {
			return Math.random() * (max - min) + min;
		}

		const interval = setInterval(function() {
			const timeLeft = animationEnd - Date.now();

			if (timeLeft <= 0) {
				return clearInterval(interval);
			}

			const particleCount = 50 * (timeLeft / duration);
			
			// Launch from two sides
			confetti({
				...defaults,
				particleCount,
				origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
				colors: colors
			});
			confetti({
				...defaults,
				particleCount,
				origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
				colors: colors
			});
		}, 250);
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

	const backgroundColor = themeMode === "colored" 
		? getDesaturatedColor(quizColor)
		: themeMode === "light" 
		? "#ffffff" 
		: "#1a1a1a";
	
	const textColor = themeMode === "colored" 
		? getTextColor(quizColor)
		: themeMode === "light"
		? "black"
		: "white";

	return (
		<LayoutGroup>
			<div className="fixed inset-0 flex flex-col" style={{ backgroundColor }}>
			{/* New Progress Header - Temporarily disabled for debugging */}
			{questions && questions.length > 0 && (
				<QuizProgress
					total={questions.length}
					currentIndex={currentIndex}
					rounds={rounds?.map((r, i) => ({ label: `R${i + 1}`, count: 5 })) || []}
					timeText={showTimer ? formatTime(timer) : undefined}
					correctCount={correctAnswers.size}
					textColor={textColor}
					onSegmentClick={(index) => {
						setCurrentIndex(index);
						setCurrentScreen("question");
					}}
				/>
			)}

			{/* Top-Right Icons - Absolute Position */}
			<div className="absolute right-6 top-6 flex items-center gap-2 z-50">
				<div className="relative group">
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
					<div className="absolute top-full right-0 mt-2 px-3 py-2 rounded-lg text-xs font-medium bg-gray-900 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-50">
						Change theme
					</div>
				</div>

				<div className="relative group">
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
					<div className="absolute top-full right-0 mt-2 px-3 py-2 rounded-lg text-xs font-medium bg-gray-900 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-50">
						{viewMode === "presenter" ? "Grid view" : "Presenter view"}
					</div>
				</div>

				<div className="relative group">
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
					<div className="absolute top-full right-0 mt-2 px-3 py-2 rounded-lg text-xs font-medium bg-gray-900 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-50">
						Exit quiz
					</div>
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
								quizColor={quizColor}
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
							onRevealAnswer={handleRevealAnswer}
							onMarkCorrect={handleMarkCorrect}
							onUnmarkCorrect={handleUnmarkCorrect}
							onSelectQuestion={(index) => {
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
							textColor === "white" ? "text-white/60" : "text-gray-600"
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
						className={`text-xl md:text-2xl ${
							textColor === "white" ? "text-white/80" : "text-gray-700"
						}`}
					>
						{round.blurb}
					</p>
				</motion.div>

				<motion.button
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.5, duration: 0.6 }}
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
			className="min-h-full flex items-start justify-center px-24 md:px-32 lg:px-40 pt-24 pb-12 relative"
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

			<div className="max-w-4xl w-full">
				{/* Category Pill with Info - More Prominent */}
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.1 }}
					className="flex items-center gap-3 mb-12"
				>
					<div 
						className={`relative inline-flex items-center px-6 py-3 rounded-full shadow-lg backdrop-blur-sm ${
							textColor === "white" 
								? "bg-white/20 text-white ring-2 ring-white/30" 
								: "bg-black/15 text-gray-900 ring-2 ring-black/20"
						}`}
						onMouseEnter={() => setShowRoundInfo(true)}
						onMouseLeave={() => setShowRoundInfo(false)}
					>
						<span className="text-base font-bold">
							{getRoundTitle(question.roundNumber)}
						</span>
						<svg className="ml-2 h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						
						{showRoundInfo && (
							<div className="absolute top-full left-0 mt-2 px-3 py-2 rounded-lg text-xs font-medium bg-gray-900 text-white whitespace-nowrap shadow-lg z-50">
								Round {question.roundNumber} • Question {((currentIndex) % 5) + 1} of 5
							</div>
						)}
					</div>
				</motion.div>

				{/* Question - Large, Centered, Generous Line Height */}
				<motion.h1
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.25, delay: 0.15 }}
					className={`text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.3] mb-16 ${
						textColor === "white" ? "text-white" : "text-gray-900"
					}`}
				>
					{question.question}
				</motion.h1>

				{/* Answer Section - New Reveal Component */}
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
}: any) {
	// Group questions by round
	const questionsByRound = questions.reduce((acc: any, q: Question) => {
		if (!acc[q.roundNumber]) acc[q.roundNumber] = [];
		acc[q.roundNumber].push(q);
		return acc;
	}, {});
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="p-6 md:p-10"
		>
			<div className="max-w-7xl mx-auto space-y-10">
				{rounds.map((round: any) => (
					<div key={round.number}>
						<h2
							className={`text-3xl font-bold mb-4 ${
								textColor === "white" ? "text-white" : "text-gray-900"
							}`}
						>
							Round {round.number}: {round.title}
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{questionsByRound[round.number]?.map((q: Question, idx: number) => {
								const globalIndex = questions.findIndex((qu: Question) => qu.id === q.id);
								const isRevealed = revealedAnswers.has(q.id);
								const isCorrect = correctAnswers.has(q.id);

								return (
									<motion.div
										key={q.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: idx * 0.05 }}
										className={`p-6 rounded-2xl cursor-pointer hover:scale-[1.02] transition ${
											textColor === "white" ? "bg-white/10 backdrop-blur-sm" : "bg-black/10"
										} ${isCorrect ? "ring-4 ring-green-500" : ""}`}
										onClick={() => onSelectQuestion(globalIndex)}
									>
										<div className="flex items-start gap-4">
											<div
												className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
													textColor === "white" ? "bg-white/20 text-white" : "bg-black/15 text-gray-900"
												}`}
											>
												{idx + 1}
											</div>

								<div className="flex-1 min-w-0">
									<div className={`text-base font-bold mb-2 ${textColor === "white" ? "text-white" : "text-gray-900"}`}>
										{q.question}
									</div>

									{!isRevealed ? (
										<button
											onClick={() => onRevealAnswer(q.id)}
											className={`text-sm px-4 py-2 rounded-full transition ${
												textColor === "white"
													? "bg-white/20 hover:bg-white/30 text-white"
													: "bg-black/15 hover:bg-black/20 text-gray-900"
											}`}
										>
											Reveal answer
										</button>
									) : (
										<div
											className={`text-sm font-semibold mb-3 ${
												textColor === "white" ? "text-white/90" : "text-gray-800"
											}`}
										>
											{q.answer}
										</div>
									)}
								</div>

										{isRevealed && (
											<motion.button
												onClick={(e) => {
													e.stopPropagation();
													isCorrect ? onUnmarkCorrect(q.id) : onMarkCorrect(q.id);
												}}
												className={`relative flex-shrink-0 w-12 h-12 rounded-full transition-all ${
													isCorrect
														? "bg-green-500 shadow-lg ring-2 ring-green-300"
														: textColor === "white"
														? "bg-transparent border-2 border-white/40 hover:border-white/60 hover:bg-white/10"
														: "bg-transparent border-2 border-gray-400 hover:border-gray-600 hover:bg-black/5"
												}`}
												whileHover={{ scale: 1.1 }}
												whileTap={{ scale: 0.9 }}
												aria-label={isCorrect ? "Mark as incorrect" : "Mark as correct"}
											>
												<AnimatePresence>
													{isCorrect && (
														<motion.div
															initial={{ scale: 0, rotate: -180 }}
															animate={{ scale: 1, rotate: 0 }}
															exit={{ scale: 0, rotate: 180 }}
															transition={{ type: "spring", bounce: 0.6, duration: 0.5 }}
															className="absolute inset-0 flex items-center justify-center"
														>
															<Check className="h-6 w-6 text-white" strokeWidth={3} />
														</motion.div>
													)}
												</AnimatePresence>
											</motion.button>
										)}
									</div>
								</motion.div>
							);
						})}
						</div>
					</div>
				))}
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

