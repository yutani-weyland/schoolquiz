"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3x3, X, ChevronLeft, ChevronRight, Eye, Check, Menu, Share2, LayoutList, Maximize2 } from 'lucide-react';
import AnswerReveal from '@/components/quiz/AnswerReveal';
import { CalendarDays } from 'lucide-react';

// Custom Paint Bucket Icon
function PaintBucketIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="-2.56 -2.56 37.12 37.12" version="1.1" xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
			<path d="M22.347 14.827v0l-10.4-10.453-0.213 0.16v-0.267c0-1.76-1.44-3.2-3.2-3.2s-3.2 1.44-3.2 3.2v6.667l-4.427 4.427c-1.227 1.227-1.227 3.2 0 4.427l6.027 6.027c0.587 0.64 1.44 0.907 2.24 0.907s1.6-0.32 2.24-0.907l7.627-7.68h6.56l-3.253-3.307zM6.4 4.267c0-1.173 0.96-2.133 2.133-2.133s2.133 0.96 2.133 2.133v1.333l-4.267 4.267v-5.6zM18.613 17.067l-8 8c-0.373 0.373-0.907 0.587-1.493 0.587-0.533 0-1.067-0.213-1.44-0.587l-6.027-6.027c-0.8-0.8-0.8-2.133 0-2.933l9.013-8.96v6.72h1.067v-7.787l0.16-0.16 11.147 11.147h-4.427z"/>
			<path d="M28.213 26.987c-0.32-2.88-3.413-6.72-3.413-6.72s-3.147 3.893-3.413 6.773c0 0.16 0 0.267 0 0.427 0 1.92 1.547 3.467 3.467 3.467s3.467-1.547 3.467-3.467c-0.053-0.16-0.053-0.32-0.107-0.48zM24.8 29.867c-1.333 0-2.4-1.067-2.4-2.4 0-0.107 0-0.16 0-0.267v0 0c0.16-1.6 1.387-3.68 2.347-5.12 0.96 1.387 2.187 3.52 2.4 5.067 0 0.107 0 0.213 0 0.32 0.053 1.333-1.013 2.4-2.347 2.4z"/>
		</svg>
	);
}

// Helper function to determine text color based on background
function textOn(bg: string): "black" | "white" {
	const hex = bg.replace("#", "");
	if (hex.length !== 6) return "black";
	const r = parseInt(hex.slice(0, 2), 16) / 255;
	const g = parseInt(hex.slice(2, 4), 16) / 255;
	const b = parseInt(hex.slice(4, 6), 16) / 255;

	const chan = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
	const R = chan(r);
	const G = chan(g);
	const B = chan(b);
	const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;
	return luminance > 0.5 ? "black" : "white";
}

type ViewMode = "presenter" | "grid";

export default function QuizSafariPreview() {
	const [isMobile, setIsMobile] = useState(false);
	const [viewMode, setViewMode] = useState<ViewMode>(() => {
		if (typeof window !== 'undefined') {
			return window.innerWidth < 768 ? "grid" : "presenter";
		}
		return "presenter";
	});
	const [showAnswer, setShowAnswer] = useState(false);
	const [isChecked, setIsChecked] = useState(false);
	const [score] = useState(0); // Start at 0 to match screenshot
	const [totalQuestions] = useState(25);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [isMounted, setIsMounted] = useState(false);
	
	// Marketing questions - matching the screenshot
	const marketingQuestions = [
		{ id: 1, roundNumber: 1, question: "What colour is directly opposite purple on a traditional RYB colour wheel?", answer: "Yellow" },
		{ id: 2, roundNumber: 1, question: "In literature, what word is the opposite of a prologue?", answer: "Epilogue" },
		{ id: 3, roundNumber: 1, question: "The antipode (direct opposite point of the earth) to Auckland, New Zealand lies in the southern region of which European country: France, Spain, or Germany?", answer: "Spain" },
		{ id: 4, roundNumber: 2, question: "In which hemisphere are pumpkins native?", answer: "Western Hemisphere (North America)" },
		{ id: 5, roundNumber: 2, question: "What pigment gives pumpkins their orange color?", answer: "Beta-carotene" },
		{ id: 6, roundNumber: 3, question: "Which novel begins with 'Call me Ishmael'?", answer: "Moby-Dick" },
	];
	
	const rounds = [
		{ number: 1, title: "Shape Up", blurb: "Time to get in shape! Questions about forms, figures, and geometry." },
		{ number: 2, title: "Pumpkins", blurb: "Orange you glad? All about the beloved autumn squash." },
		{ number: 3, title: "Famous First Words", blurb: "How well do you know these iconic opening lines?" },
	];
	
	const quizTitle = "Shape Up, Pumpkins, Famous First Words, Crazes, and Next In Sequence.";
	const quizTags = ["Shape Up", "Pumpkins", "Famous First Words", "Crazes"];
	const quizNumber = "12";
	const quizDate = "15 Jan 2024";
	
	const currentQuestion = marketingQuestions[currentQuestionIndex];
	const currentQuestionNumber = currentQuestionIndex + 1;
	const correctAnswers = new Set<number>(); // Empty set to show 0 score
	
	// Theme colors - teal first to match screenshot
	const colors = [
		"#2DD4BF", // Teal (matches screenshot)
		"#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2",
	];
	
	const [themeColor, setThemeColor] = useState(() => colors[0]);
	const [bucketRotate, setBucketRotate] = useState(0);
	const [hasAnswered] = useState(false);
	const questionTextRef = useRef<HTMLParagraphElement>(null);
	const mainContainerRef = useRef<HTMLElement>(null);
	const [revealButtonPosition, setRevealButtonPosition] = useState({ top: 0, left: 0 });
	const [questionScale, setQuestionScale] = useState(1);
	const [isPositionCalculated, setIsPositionCalculated] = useState(false);
	const [isMouseMoving, setIsMouseMoving] = useState(false);
	
	// Check if mobile and lock to grid view on mobile
	useEffect(() => {
		const checkMobile = () => {
			const mobile = window.innerWidth < 768;
			setIsMobile(mobile);
			if (mobile) {
				setViewMode("grid");
			}
		};
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	useEffect(() => {
		setIsMounted(true);
		setThemeColor(colors[Math.floor(Math.random() * colors.length)]);
	}, []);

	const handleNextQuestion = () => {
		setShowAnswer(false);
		setIsChecked(false);
		setCurrentQuestionIndex((prev) => (prev + 1) % marketingQuestions.length);
	};
	
	const handlePreviousQuestion = () => {
		setShowAnswer(false);
		setIsChecked(false);
		setCurrentQuestionIndex((prev) => (prev - 1 + marketingQuestions.length) % marketingQuestions.length);
	};
	
	const handleThemeChange = () => {
		setThemeColor((current) => {
			const currentIndex = colors.indexOf(current);
			return colors[(currentIndex + 1) % colors.length];
		});
		setBucketRotate((prev) => prev + 360);
	};

	const handleAnswerReveal = () => {
		setShowAnswer(true);
	};

	const darkenColor = (hex: string, percent: number): string => {
		const num = parseInt(hex.replace('#', ''), 16);
		const r = (num >> 16) & 255;
		const g = (num >> 8) & 255;
		const b = num & 255;
		const newR = Math.floor(r * (1 - percent));
		const newG = Math.floor(g * (1 - percent));
		const newB = Math.floor(b * (1 - percent));
		return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
	};

	const backgroundColor = themeColor;
	const textColor = textOn(themeColor);
	const isDarkText = textColor === "white";
	const menuButtonClass = isDarkText
		? "bg-white/15 text-white hover:bg-white/25 border border-white/20 backdrop-blur-sm"
		: "bg-black/10 text-gray-900 hover:bg-black/15 border border-black/20 backdrop-blur-sm";

	// Track mouse movement
	useEffect(() => {
		if (viewMode !== "presenter") return;
		
		let timeoutId: NodeJS.Timeout;
		const handleMouseMove = () => {
			setIsMouseMoving(true);
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => setIsMouseMoving(false), 2000);
		};
		window.addEventListener("mousemove", handleMouseMove);
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			clearTimeout(timeoutId);
		};
	}, [viewMode]);

	// Calculate answer reveal position - simplified for preview container
	useEffect(() => {
		if (viewMode !== "presenter") {
			setIsPositionCalculated(false);
			return;
		}

		const updatePosition = () => {
			const questionEl = questionTextRef.current;
			const containerEl = mainContainerRef.current;
			if (!questionEl || !containerEl) return;

			// Get container dimensions
			const containerRect = containerEl.getBoundingClientRect();
			const containerHeight = containerRect.height;
			const containerWidth = containerRect.width;
			
			// Get question position relative to container
			const questionRect = questionEl.getBoundingClientRect();
			const questionTopRelative = questionRect.top - containerRect.top;
			const questionBottomRelative = questionRect.bottom - containerRect.top;
			
			// Simple scale calculation based on question height
			const computedLineHeight = parseFloat(window.getComputedStyle(questionEl).lineHeight || "0");
			const approxLines = computedLineHeight > 0 ? Math.round(questionRect.height / computedLineHeight) : 1;

			if (approxLines > 6) {
				setQuestionScale(0.78);
			} else if (approxLines > 5) {
				setQuestionScale(0.85);
			} else if (approxLines > 4) {
				setQuestionScale(0.9);
			} else {
				setQuestionScale(1);
			}

			// Position answer button below question with spacing
			const spacing = 40;
			const buttonTop = questionBottomRelative + spacing;
			
			// Ensure button fits in container (leave 20px padding at bottom)
			const maxTop = containerHeight - 100;
			const finalTop = Math.min(Math.max(buttonTop, 50), maxTop);
			
			// Center horizontally
			const finalLeft = containerWidth / 2;

			setRevealButtonPosition({
				top: finalTop,
				left: finalLeft,
			});

			setIsPositionCalculated(true);
		};

		// Wait for layout, then calculate
		const timer = setTimeout(() => {
			updatePosition();
		}, 100);

		return () => {
			clearTimeout(timer);
		};
	}, [currentQuestion.question, currentQuestionIndex, viewMode]);

	const renderPresenterMode = () => {
		// Show round intro screen - matching the image
		const currentRound = rounds[0]; // Show first round
		
		return (
			<div
				className="relative w-full h-full overflow-hidden flex flex-col"
				style={{ 
					backgroundColor,
					transition: "background-color 300ms ease-in-out",
				}}
				role="main"
				aria-label="Quiz round intro"
			>
				{/* Score pill at top */}
				<div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
					<div
						className={`relative rounded-full font-semibold flex items-center gap-3 transition-colors duration-300 ease-in-out whitespace-nowrap ${
							textColor === "white"
								? "bg-white/20 text-white"
								: "bg-black/10 text-gray-900"
						} px-8 py-3 backdrop-blur-sm`}
						aria-label={`Score: ${score} out of ${totalQuestions}`}
					>
						<span className="text-lg font-medium opacity-90">Score:</span>
						<span className="text-3xl font-bold tabular-nums leading-none" style={{ letterSpacing: "-0.045em" }}>
							{score} / {totalQuestions}
						</span>
					</div>
				</div>

				{/* Round intro content - centered */}
				<main
					ref={mainContainerRef}
					className="relative w-full h-full flex flex-col items-center justify-center px-8 transition-colors duration-300 ease-in-out"
					style={{ 
						backgroundColor: "transparent"
					}}
					aria-live="polite"
				>
					<div className="max-w-2xl w-full text-center space-y-6">
						{/* Round title */}
						<motion.h1
							initial={{ y: 20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ delay: 0.1, duration: 0.6 }}
							className={`font-extrabold text-balance tracking-tight transition-colors duration-300 ease-in-out ${
								textColor === "white" ? "text-white" : "text-gray-900"
							}`}
							style={{ 
								fontSize: 'clamp(2rem, 5vw, 3.5rem)',
								lineHeight: '1.1',
								marginBottom: '1.5rem'
							}}
						>
							{currentRound.title}
						</motion.h1>

						{/* Round description */}
						{currentRound.blurb && (
							<motion.p
								initial={{ y: 20, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								transition={{ delay: 0.2, duration: 0.6 }}
								className={`opacity-70 transition-colors duration-300 ease-in-out ${
									textColor === "white" ? "text-white" : "text-gray-900"
								}`}
								style={{
									fontSize: 'clamp(0.875rem, 1.5vw, 1.125rem)',
									marginBottom: '2rem'
								}}
							>
								{currentRound.blurb}
							</motion.p>
						)}

						{/* Let's go button */}
						<motion.button
							initial={{ y: 20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ delay: 0.3, duration: 0.6 }}
							onClick={() => {}}
							className={`rounded-full font-bold transition-colors duration-300 ease-in-out ${
								textColor === "white" ? "bg-white text-gray-900 hover:bg-white/90" : "bg-gray-900 text-white hover:bg-gray-800"
							}`}
							style={{
								fontSize: "clamp(1rem, 2vw, 1.25rem)",
								padding: "clamp(0.75rem, 1.5vw, 1rem) clamp(2rem, 4vw, 2.5rem)",
							}}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							Let's go!
						</motion.button>
					</div>
				</main>

				{/* Footer navigation - question numbers */}
				<div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto">
					{Array.from({ length: Math.min(23, totalQuestions) }, (_, i) => i + 1).map((num) => (
						<div
							key={num}
							className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
								num === 1
									? textColor === "white"
										? "bg-gray-900 text-white"
										: "bg-gray-900 text-white"
									: textColor === "white"
									? "bg-white/20 text-white border border-white/30"
									: "bg-white/60 text-gray-900 border border-gray-300"
							}`}
						>
							{num}
						</div>
					))}
				</div>
			</div>
		);
	};

	const renderGridView = () => {
		const groupedQuestions = rounds.map(round => ({
			round,
			questions: marketingQuestions.filter(q => q.roundNumber === round.number)
		}));
		
		const pillBackgroundClass = isDarkText ? "bg-white/25 hover:bg-white/30" : "bg-black/10 hover:bg-black/15";
		const pillTextClass = isDarkText ? "text-white" : "text-gray-900";
		
		return (
			<div 
				className="relative flex flex-col w-full h-full overflow-hidden"
				style={{ 
					backgroundColor,
					transition: "background-color 300ms ease-in-out",
				}}
			>
				{/* Top Header with "The School Quiz" */}
				<div
					className="flex-shrink-0 py-3 px-6 z-50"
					style={{
						pointerEvents: "auto",
						backgroundColor: backgroundColor,
					}}
				>
					<div className="flex items-center justify-between w-full gap-4">
						<div className={`text-2xl font-bold tracking-tight ${isDarkText ? "text-white" : "text-[#0f0f0f]"}`}>
							The School Quiz
						</div>
						<div className="flex items-center gap-3">
							{!isMobile && (
								<motion.button
									onClick={() => setViewMode("presenter")}
									className={`h-12 w-12 items-center justify-center rounded-full flex ${menuButtonClass}`}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									title="Switch to presenter view"
								>
									<Maximize2 className="h-5 w-5" />
								</motion.button>
							)}
							<motion.button
								className={`h-12 w-12 items-center justify-center rounded-full flex ${menuButtonClass}`}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								title="Menu"
							>
								<Menu className="h-5 w-5" />
							</motion.button>
						</div>
					</div>
				</div>

				{/* Quiz Details Header - matches MobileGridLayout exactly */}
				<header
					className="flex-shrink-0 px-6 pb-6 pt-4 sm:px-8 sm:pt-6 md:px-12 md:pt-8 z-30"
					style={{
						background: "transparent",
						color: isDarkText ? "#fffef5" : "var(--color-text)",
					}}
				>
					<div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
						<div className="flex flex-wrap items-center justify-between gap-3 text-sm">
							<div className="flex flex-wrap items-center gap-3">
								<span
									className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ease-in-out ${pillBackgroundClass} ${pillTextClass}`}
								>
									#{quizNumber}
								</span>
								<span
									className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 ease-in-out ${pillBackgroundClass} ${pillTextClass}`}
								>
									<CalendarDays className="h-4 w-4" />
									{quizDate}
								</span>
							</div>
						</div>
						<h1
							className={`font-extrabold leading-tight px-1 ${isDarkText ? "text-white" : "text-gray-900"}`}
							style={{ fontSize: "clamp(2.4rem, 2rem + 1.4vw, 3.2rem)" }}
						>
							{quizTitle}
						</h1>
						{quizTags.length > 0 && (
							<div className="flex flex-wrap items-center gap-2 text-sm px-1">
								{quizTags.map((tag) => (
									<span
										key={tag}
										className={`inline-flex items-center rounded-full px-3.5 py-1.5 font-medium transition-colors duration-300 ease-in-out ${pillBackgroundClass} ${pillTextClass}`}
									>
										{tag}
									</span>
								))}
							</div>
						)}
					</div>
				</header>

				{/* Score pill - absolute bottom right */}
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.35 }}
					className="absolute bottom-6 right-6 z-40 sm:bottom-8 sm:right-8 pointer-events-none"
				>
					<div
						className={`rounded-full font-semibold flex items-center gap-2 sm:gap-3 md:gap-4 whitespace-nowrap backdrop-blur-sm transition-colors duration-300 ease-in-out pointer-events-auto ${
							isDarkText
								? "bg-white/20 text-white hover:bg-white/28"
								: "bg-black/10 text-gray-900 hover:bg-black/15"
						} px-5 py-2.5 sm:px-8 sm:py-4 md:px-12 md:py-6`}
					>
						<span className="text-sm sm:text-lg md:text-2xl font-medium opacity-90 leading-normal">Score:</span>
						<span className="text-xl sm:text-3xl md:text-5xl font-bold tabular-nums leading-none" style={{ letterSpacing: "-0.045em" }}>
							{score} / {totalQuestions}
						</span>
					</div>
				</motion.div>

				{/* Questions grid */}
				<main className="flex-1 overflow-y-auto px-6 pb-36 pt-4 sm:px-8 sm:pb-40 sm:pt-6 md:px-12 md:pb-44 md:pt-8" style={{ paddingBottom: "max(18vh, 190px)" }}>
					<section className="quiz-grid-layout mx-auto max-w-5xl w-full">
						{groupedQuestions.map(({ round, questions: roundQuestions }) => {
							// Get round accent color
							const roundAccent = round.number === 1 ? "#2DD4BF" : round.number === 2 ? "#F97316" : "#FACC15";
							
							return (
								<React.Fragment key={round.number}>
									{/* Round intro - matches MobileGridLayout exactly */}
									<motion.section
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
										className="mb-4 sm:mb-10 w-full rounded-[26px] border px-7 py-7 sm:px-9 sm:py-8 transition-colors duration-300 ease-in-out"
										style={{
											gridColumn: '1 / -1',
											background: `color-mix(in srgb, ${roundAccent} 25%, rgba(255,255,255,0.95) 75%)`,
											borderColor: `color-mix(in srgb, ${roundAccent} 35%, rgba(255,255,255,0.7))`,
											borderWidth: '2px',
											boxShadow: `0 12px 28px ${roundAccent}2b, 0 0 0 1px ${roundAccent}40`,
										}}
									>
										<div className="flex flex-col gap-6">
											<h2
												className="font-extrabold tracking-tight"
												style={{
													color: roundAccent,
													fontSize: 'clamp(2.75rem, 7vw, 4.5rem)',
													lineHeight: '0.9',
												}}
											>
												Round {round.number}: {round.title}
											</h2>
											{round.blurb && (
												<p 
													className="text-left text-[clamp(1rem,0.9rem+0.5vw,1.2rem)] leading-relaxed"
													style={{
														color: textOn(roundAccent) === "black" ? "rgba(15, 15, 15, 0.68)" : "rgba(255, 255, 255, 0.85)"
													}}
												>
													{round.blurb}
												</p>
											)}
										</div>
									</motion.section>

									{/* Questions - matches MobileGridLayout exactly */}
									{roundQuestions.map((q, questionIndex) => {
										const isCorrect = correctAnswers.has(q.id);
										const baseSurface = `color-mix(in srgb, #ffffff 92%, ${roundAccent} 8%)`;
										
										return (
											<motion.article
												key={q.id}
												initial={{ opacity: 0, y: 16 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{
													duration: 0.4,
													delay: Math.min(questionIndex * 0.03, 0.24),
													ease: [0.22, 1, 0.36, 1],
												}}
												className="group relative flex flex-col gap-8 overflow-hidden rounded-[26px] border px-7 sm:px-9 py-8 sm:py-10 transition-[transform,box-shadow] duration-200 transition-colors duration-300 ease-in-out will-change-transform"
												style={{
													background: baseSurface,
													borderColor: `color-mix(in srgb, ${roundAccent} 15%, rgba(255,255,255,0.4))`,
													borderWidth: '2px',
													boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
													backdropFilter: "blur(10px)",
													WebkitBackdropFilter: "blur(10px)",
													scrollMarginTop: "120px",
												}}
											>
												<div className="flex flex-col gap-8 w-full">
													<h2
														className="text-left font-extrabold tracking-tight text-balance w-full"
														style={{
															fontSize: "clamp(1.5rem, 1.2rem + 2vw, 2.5rem)",
															lineHeight: 1.12,
															textAlign: "left",
															color: "rgba(17,17,17,0.9)",
														}}
													>
														{`${q.id}. ${q.question}`}
													</h2>
													<div className="pointer-events-auto w-full">
														<AnswerReveal
															size="compact"
															answerText={q.answer}
															revealed={false}
															onReveal={() => {}}
															onHide={() => {}}
															accentColor={roundAccent}
															textColor={textColor}
															className={isDarkText ? "outline outline-2 outline-white/80" : undefined}
															isMarkedCorrect={isCorrect}
															isMarkedIncorrect={false}
															onMarkCorrect={() => {}}
															onUnmarkCorrect={() => {}}
														/>
													</div>
												</div>
											</motion.article>
										);
									})}
								</React.Fragment>
							);
						})}
					</section>
				</main>
			</div>
		);
	};

	if (!isMounted) {
		return (
			<div className="w-full max-w-5xl mx-auto">
				{isMobile ? (
					<div className="relative mx-auto" style={{ width: '375px', maxWidth: '100%' }}>
						<div className="bg-black rounded-[3rem] p-2 shadow-2xl">
							<div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-50"></div>
							<div className="bg-white rounded-[2.5rem] overflow-hidden relative" style={{ height: '667px', backgroundColor: colors[0] }}>
								<div className="h-full"></div>
							</div>
						</div>
					</div>
				) : (
					<div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden relative" style={{ height: '800px' }}>
						<div className="bg-gray-100 dark:bg-gray-700 px-6 py-4 flex items-center gap-3">
							<div className="flex gap-2">
								<div className="w-3 h-3 bg-red-400 rounded-full"></div>
								<div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
								<div className="w-3 h-3 bg-green-400 rounded-full"></div>
							</div>
							<div className="flex-1 bg-white dark:bg-gray-600 rounded-xl px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
								theschoolquiz.com.au/quiz/42
							</div>
						</div>
						<div className="relative overflow-hidden" style={{ backgroundColor: colors[0], height: 'calc(800px - 60px)' }}></div>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="w-full max-w-5xl mx-auto">
			{isMobile ? (
				<div className="relative mx-auto" style={{ width: '375px', maxWidth: '100%' }}>
					{/* iPhone bezel */}
					<div className="bg-black rounded-[3rem] p-2 shadow-2xl">
						{/* Notch */}
						<div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-50"></div>
						{/* Screen - grey background for video */}
						<div className="bg-gray-300 rounded-[2.5rem] overflow-hidden relative" style={{ height: '667px' }}>
							{/* Placeholder for video */}
						</div>
					</div>
				</div>
			) : (
				<div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden relative" style={{ height: '800px' }}>
					{/* Browser header */}
					<div className="bg-gray-100 dark:bg-gray-700 px-6 py-4 flex items-center gap-3">
						<div className="flex gap-2">
							<div className="w-3 h-3 bg-red-400 rounded-full"></div>
							<div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
							<div className="w-3 h-3 bg-green-400 rounded-full"></div>
						</div>
						<div className="flex-1 bg-white dark:bg-gray-600 rounded-xl px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
							theschoolquiz.com.au/quiz/42
						</div>
					</div>

					{/* Grey background for video */}
					<div className="relative bg-gray-300" style={{ height: 'calc(800px - 60px)' }}>
						{/* Placeholder for video */}
					</div>
				</div>
			)}
		</div>
	);
}
