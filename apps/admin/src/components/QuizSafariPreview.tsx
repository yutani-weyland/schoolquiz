"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Grid3x3, X, ChevronLeft, ChevronRight, Eye, Check, Menu, Share2, LayoutList } from 'lucide-react';
import AnswerReveal from '@/components/quiz/AnswerReveal';

// Custom Paint Bucket Icon with thicker outlines
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


export default function QuizSafariPreview() {
	const [showAnswer, setShowAnswer] = useState(false);
	const [isChecked, setIsChecked] = useState(false);
	const [score] = useState(3); // Showing 3 correct answers
	const [totalQuestions] = useState(25);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [isMouseMoving, setIsMouseMoving] = useState(false);
	const [revealButtonPosition, setRevealButtonPosition] = useState({ top: 0, left: 0 });
	const [isPositionCalculated, setIsPositionCalculated] = useState(false);
	const [questionScale, setQuestionScale] = useState(1);
	const questionTextRef = useRef<HTMLParagraphElement>(null);
	const mainContainerRef = useRef<HTMLElement>(null);
	
	// Marketing questions that showcase features
	const marketingQuestions = [
		{ question: "Which quiz platform is tailor-made for high school classrooms?", answer: "The School Quiz!" },
		{ question: "Which quiz offers private leaderboards, achievements, and shoutouts?", answer: "The School Quiz!" },
		{ question: "Which quiz delivers handcrafted, engaging content every week?", answer: "The School Quiz!" },
		{ question: "Which quiz platform brings classrooms together with heads-up competition?", answer: "The School Quiz!" },
	];
	
	const currentQuestion = marketingQuestions[currentQuestionIndex];
	const currentQuestionNumber = 4 + currentQuestionIndex; // Maps to 4-7 based on index
	
	// Theme colors
	const colors = [
		"#FF6B6B", // Vibrant coral red
		"#4ECDC4", // Turquoise
		"#45B7D1", // Sky blue
		"#FFA07A", // Soft salmon
		"#98D8C8", // Mint green
		"#F7DC6F", // Sunny yellow
		"#BB8FCE", // Lavender purple
		"#85C1E2", // Light blue
	];
	
	// Randomly pick initial theme color
	const [themeColor, setThemeColor] = useState(() => colors[Math.floor(Math.random() * colors.length)]);
	const [bucketRotate, setBucketRotate] = useState(0);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	
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
		// Cycle through colors
		setThemeColor((current) => {
			const currentIndex = colors.indexOf(current);
			return colors[(currentIndex + 1) % colors.length];
		});
		setBucketRotate((prev) => prev + 360);
	};

	const handleAnswerReveal = () => {
		setShowAnswer(true);
	};

	const handleCheckboxClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		if (!isChecked) {
			setIsChecked(true);
			
			// Small confetti from button position
			const button = e.currentTarget;
			const rect = button.getBoundingClientRect();
			const x = (rect.left + rect.width / 2) / window.innerWidth;
			const y = (rect.top + rect.height / 2) / window.innerHeight;
			
			confetti({
				particleCount: 50,
				spread: 60,
				origin: { x, y },
				startVelocity: 30,
				gravity: 0.9,
				ticks: 100,
				decay: 0.94,
				shapes: ['🔵', '⚪', '🔷', '🔹', '◼️', '⚫'].map(emoji => 
					confetti.shapeFromText({ text: emoji, scalar: 1.8 })
				),
				scalar: 1.8,
				drift: 0.1
			});
		}
	};

	const getDesaturatedColor = (hex: string) => {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, 0.95)`;
	};

	// Helper to darken a hex color by a percentage
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

	// Helper to get round color for a specific question index
	const getRoundColorForIndex = (index: number) => {
		return themeColor; // For preview, all rounds use the same theme color
	};

	const backgroundColor = themeColor; // Use full color, not desaturated
	const textColor = textOn(themeColor);

	// Calculate AnswerReveal button position dynamically
	useEffect(() => {
		setIsPositionCalculated(false);

		const updatePosition = () => {
			const questionEl = questionTextRef.current;
			const containerEl = mainContainerRef.current;
			if (!questionEl || !containerEl) return;

			const questionRect = questionEl.getBoundingClientRect();
			const containerRect = containerEl.getBoundingClientRect();
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

			const approximateButtonHeight = 88;
			const containerHeight = containerRect.height;
			const maxTop = containerHeight - approximateButtonHeight - 40;
			const relativeTop = questionRect.bottom - containerRect.top;
			const desiredTop = relativeTop + 80;

			setRevealButtonPosition({
				top: Math.min(desiredTop, maxTop),
				left: containerRect.width / 2,
			});

			setIsPositionCalculated(true);
		};

		const timer1 = setTimeout(updatePosition, 100);
		const timer2 = setTimeout(updatePosition, 300);
		const timer3 = setTimeout(updatePosition, 600);

		window.addEventListener("resize", updatePosition);
		window.addEventListener("scroll", updatePosition, true);

		const observer = new ResizeObserver(updatePosition);
		if (questionTextRef.current) {
			observer.observe(questionTextRef.current);
		}
		if (mainContainerRef.current) {
			observer.observe(mainContainerRef.current);
		}

		return () => {
			window.removeEventListener("resize", updatePosition);
			window.removeEventListener("scroll", updatePosition, true);
			observer.disconnect();
			clearTimeout(timer1);
			clearTimeout(timer2);
			clearTimeout(timer3);
		};
	}, [currentQuestion.question]);

	// Track mouse movement for navigation arrows
	useEffect(() => {
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
	}, []);

	const shouldShowFullOpacity = isMouseMoving || showAnswer;
	const arrowOpacity = shouldShowFullOpacity ? 1 : 0.2;
	const isDarkText = textColor === "white";
	const menuButtonClass = isDarkText
		? "bg-white/15 text-white hover:bg-white/25"
		: "bg-black/10 text-gray-900 hover:bg-black/15";

	return (
		<div className="w-full max-w-5xl mx-auto">
			<div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden relative" style={{ height: '800px' }}>
				{/* Browser-like header */}
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

				{/* Quiz content - Presenter Mode */}
				<div 
					className="relative overflow-hidden"
					style={{ 
						backgroundColor,
						height: 'calc(800px - 60px)',
						transition: "background-color 300ms ease-in-out, color 300ms ease-in-out",
					}}
				>
					{/* QuizHeader - Absolute at top */}
					<div
						className="absolute top-0 left-0 right-0 z-50 py-3 px-6 transition-colors duration-300 ease-out"
						style={{
							pointerEvents: "auto",
							backgroundColor: backgroundColor,
							transition: "background-color 300ms ease-in-out, color 300ms ease-in-out",
						}}
					>
						<div className="flex items-center justify-between w-full gap-4">
							<div className="flex flex-col items-start gap-4 relative">
								<motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
									<div className={`text-2xl font-bold tracking-tight transition-opacity duration-300 cursor-pointer ${isDarkText ? "text-white" : "text-[#0f0f0f]"}`}>
										The School Quiz
									</div>
								</motion.div>
							</div>

							<div className="flex items-center gap-3">
								<motion.button
									onClick={handleThemeChange}
									className={`h-12 w-12 items-center justify-center rounded-full transition-colors duration-300 ease-out flex ${menuButtonClass}`}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									title="Change theme"
									aria-label="Change theme"
								>
									<motion.div
										animate={{ rotate: bucketRotate }}
										transition={{ type: "spring", stiffness: 260, damping: 20 }}
									>
										<PaintBucketIcon className="h-5 w-5" />
									</motion.div>
								</motion.button>
								<motion.button
									className={`h-12 w-12 items-center justify-center rounded-full transition-colors duration-300 ease-out flex ${menuButtonClass}`}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									title="Grid view"
									aria-label="Grid view"
								>
									<LayoutList className="h-5 w-5" />
								</motion.button>
								<motion.button
									className={`h-12 w-12 items-center justify-center rounded-full transition-colors duration-300 ease-out flex ${menuButtonClass}`}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									title="Share"
									aria-label="Share"
								>
									<Share2 className="h-5 w-5" />
								</motion.button>
								<motion.button
									onClick={() => setIsMenuOpen(!isMenuOpen)}
									className={`h-12 w-12 items-center justify-center rounded-full transition-colors duration-300 ease-out flex relative ${menuButtonClass}`}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									aria-haspopup="menu"
									aria-expanded={isMenuOpen}
									aria-label={isMenuOpen ? "Close menu" : "Open menu"}
								>
									<AnimatePresence mode="wait">
										{isMenuOpen ? (
											<motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
												<X className="h-5 w-5" />
											</motion.div>
										) : (
											<motion.div key="menu" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }} transition={{ duration: 0.2 }}>
												<Menu className="h-5 w-5" />
											</motion.div>
										)}
									</AnimatePresence>
								</motion.button>
							</div>
						</div>
					</div>

					{/* QuizStatusBar - Absolute below header */}
					<div className="absolute top-0 left-1/2 -translate-x-1/2 z-40 pt-24 pb-3 px-4 sm:px-6">
						<div className="flex flex-row gap-3 sm:gap-4 items-center justify-center flex-nowrap">
							<div
								className={`relative rounded-full font-semibold flex items-center gap-4 transition-colors duration-200 whitespace-nowrap ${
									isDarkText
										? "bg-white/20 text-white hover:bg-white/28"
										: "bg-black/10 text-gray-900 hover:bg-black/15"
								} px-12 py-6 backdrop-blur-sm`}
								aria-label={`Score: ${score} out of ${totalQuestions}`}
							>
								<span className="text-2xl font-medium opacity-90">Score:</span>
								<span className="text-5xl font-bold tabular-nums leading-none" style={{ letterSpacing: "-0.045em" }}>
									{score} / {totalQuestions}
								</span>
							</div>
						</div>
					</div>

					{/* Navigation Arrows - Absolute at 45% from top */}
					<AnimatePresence>
						{currentQuestionIndex > 0 && (
							<motion.button
								onClick={handlePreviousQuestion}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: arrowOpacity, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								whileHover={{ opacity: 1, scale: 1.05 }}
								transition={{ duration: 0.3 }}
								className={`absolute left-4 sm:left-8 z-40 p-3 sm:p-4 rounded-full transition-colors duration-700 ease-in-out ${
									isDarkText ? "bg-white/15 hover:bg-white/25 text-white" : "bg-black/10 hover:bg-black/15 text-gray-900"
								}`}
								style={{ top: "45%", transform: "translateY(-50%)" }}
								whileTap={{ scale: 0.95 }}
								aria-label="Previous question"
							>
								<ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
							</motion.button>
						)}
					</AnimatePresence>

					<motion.button
						onClick={handleNextQuestion}
						animate={{
							opacity: arrowOpacity,
						}}
						whileHover={{ opacity: 1, scale: 1.05 }}
						transition={{ duration: 0.3 }}
						className={`absolute right-4 sm:right-8 z-40 p-3 sm:p-4 rounded-full transition-colors duration-700 ease-in-out ${
							isDarkText ? "bg-white/15 hover:bg-white/25 text-white" : "bg-black/10 hover:bg-black/15 text-gray-900"
						}`}
						style={{ top: "45%", transform: "translateY(-50%)" }}
						whileTap={{ scale: 0.95 }}
						aria-label="Next question"
					>
						<ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
					</motion.button>

					{/* Question Area - Absolute at 46% from top */}
					<main
						ref={mainContainerRef}
						className="absolute inset-0 overflow-y-auto px-4 sm:px-6 md:px-8 transition-colors duration-700 ease-in-out"
						style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
						aria-live="polite"
					>
						<div
							className="absolute left-0 right-0 flex justify-center z-30"
							style={{ top: "46%", transform: "translateY(-50%)", padding: "0 1.5rem" }}
						>
							<div className="max-w-[92ch] md:max-w-[108ch] lg:max-w-[128ch] xl:max-w-[150ch] text-center [text-wrap:balance] w-full mx-16 sm:mx-20 md:mx-24 lg:mx-28 px-4 sm:px-6 pt-16 sm:pt-20">
								<motion.p
									ref={questionTextRef}
									key={currentQuestionIndex}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ duration: 0.25, delay: 0.15 }}
									className={`font-extrabold leading-[1.05] break-words [overflow-wrap:anywhere] transition-colors duration-700 ease-in-out ${
										isDarkText ? "text-white" : "text-gray-900"
									}`}
									style={{
										fontSize: "clamp(24px, min(3.4vw + 0.9rem, (100vh - 360px) / 3), 50px)",
										marginBottom: "clamp(28px, 4vh, 48px)",
										transform: `scale(${questionScale})`,
										transformOrigin: "center top",
									}}
								>
									{currentQuestion.question}
								</motion.p>
							</div>
						</div>

						{/* AnswerReveal - Dynamically positioned */}
						{isPositionCalculated && (
							<motion.div
								className="absolute flex justify-center z-30"
								style={{ transform: "translateX(-50%)", overflow: "visible", top: revealButtonPosition.top, left: revealButtonPosition.left }}
								initial={{ opacity: 0 }}
								animate={{
									opacity: 1,
								}}
								transition={{
									opacity: { duration: 0.25, ease: "easeOut" },
								}}
							>
								<AnswerReveal
									answerText={currentQuestion.answer}
									revealed={showAnswer}
									onReveal={handleAnswerReveal}
									onHide={() => {
										setShowAnswer(false);
										setIsChecked(false);
									}}
									accentColor={themeColor}
									textColor={textColor}
									isMarkedCorrect={isChecked}
									isMarkedIncorrect={showAnswer && !isChecked}
									onMarkCorrect={handleCheckboxClick}
									onUnmarkCorrect={() => setIsChecked(false)}
									className={isDarkText ? "outline outline-2 outline-white/80" : undefined}
								/>
							</motion.div>
						)}
					</main>

					{/* Progress Bar - Absolute at bottom */}
					<div 
						role="progressbar"
						aria-valuemin={1}
						aria-valuemax={totalQuestions}
						aria-valuenow={currentQuestionNumber}
						aria-label="Quiz progress"
						className={`absolute bottom-0 left-0 right-0 z-40 w-full pb-safe pt-2 pb-4 sm:pt-3 sm:pb-5 transition-all duration-500 ease-in-out ${isMouseMoving ? "opacity-100" : "opacity-35"}`}
						style={{
							backgroundColor: backgroundColor || "transparent",
							transition: "background-color 300ms ease-in-out, opacity 500ms ease-in-out"
						}}
					>
						{/* Fade overlays */}
						{currentQuestionNumber > 1 && (
							<div 
								className="absolute left-0 top-0 bottom-0 w-20 pointer-events-none z-20"
								style={{ 
									background: `linear-gradient(to right, ${backgroundColor || (isDarkText ? "rgba(26, 26, 26, 0.95)" : "rgba(255, 255, 255, 0.95)")}, transparent)`,
									transition: "background 700ms ease-in-out"
								}}
							/>
						)}
						{currentQuestionNumber < totalQuestions && (
							<div 
								className="absolute right-0 top-0 bottom-0 w-20 pointer-events-none z-20"
								style={{ 
									background: `linear-gradient(to left, ${backgroundColor || (isDarkText ? "rgba(26, 26, 26, 0.95)" : "rgba(255, 255, 255, 0.95)")}, transparent)`,
									transition: "background 700ms ease-in-out"
								}}
							/>
						)}

						{/* Scrollable container */}
						<div className="flex justify-center">
							<div
								className="flex gap-2 scrollbar-hide py-1 max-w-full overflow-x-auto overflow-y-visible"
								style={{ 
									paddingLeft: '24px', 
									paddingRight: '24px',
									scrollBehavior: 'smooth'
								}}
							>
								{Array.from({ length: totalQuestions }, (_, i) => i + 1).map((n) => {
									const isCurrent = n === currentQuestionNumber;
									const isCorrect = n === 1 || n === 2 || n === 3; // Fixed 3 correct answers for preview
									const isIncorrect = n === currentQuestionNumber && showAnswer && !isChecked;
									const isViewed = false; // For preview, we don't track viewed questions
									
									const roundColor = getRoundColorForIndex(n - 1);
									
									// Determine button style and content
									let buttonStyle: React.CSSProperties = {};
									let displayContent: string | React.ReactNode = n;
									
									if (isCurrent) {
										if (isViewed && !showAnswer) {
											buttonStyle = { 
												backgroundColor: "#0B0B0B", 
												color: "white", 
												border: "3px solid rgba(255, 255, 255, 0.85)" 
											};
											displayContent = n;
										} else if (isCorrect) {
											buttonStyle = { 
												backgroundColor: "#10B981", 
												color: "white", 
												border: "3px solid rgba(255, 255, 255, 0.7)" 
											};
											displayContent = <Check className="w-5 h-5" strokeWidth={3} />;
										} else if (isIncorrect) {
											buttonStyle = { 
												backgroundColor: "#EF4444", 
												color: "white", 
												border: "3px solid rgba(255, 255, 255, 0.7)" 
											};
											displayContent = <X className="w-5 h-5" strokeWidth={3} />;
										} else {
											buttonStyle = { 
												backgroundColor: "#0B0B0B", 
												color: "white", 
												border: "3px solid rgba(255, 255, 255, 0.85)" 
											};
											displayContent = n;
										}
									} else if (isCorrect) {
										buttonStyle = { 
											backgroundColor: "#10B981", 
											color: "white", 
											border: "2px solid rgba(16, 185, 129, 0.45)" 
										};
										displayContent = <Check className="w-5 h-5" strokeWidth={3} />;
									} else if (isIncorrect) {
										buttonStyle = { 
											backgroundColor: "#EF4444", 
											color: "white", 
											border: "2px solid rgba(239, 68, 68, 0.45)" 
										};
										displayContent = <X className="w-5 h-5" strokeWidth={3} />;
									} else if (isViewed && !isCurrent) {
										const darkerColor = darkenColor(roundColor, 0.4);
										buttonStyle = { 
											border: `2px solid ${darkerColor}`,
											color: darkerColor,
											backgroundColor: "transparent"
										};
										displayContent = <Eye className="w-6 h-6" />;
									} else {
										const darkerColor = darkenColor(roundColor, 0.4);
										const darkerNumberColor = darkenColor(roundColor, 0.2);
										buttonStyle = { 
											border: `2px solid ${darkerColor}`, 
											color: darkerNumberColor,
											backgroundColor: "transparent"
										};
										displayContent = n;
									}

									return (
										<motion.div 
											key={n}
											className="relative flex-shrink-0"
											initial={false}
											animate={{
												scale: isCurrent ? 1.03 : 1,
											}}
											transition={{
												type: "spring",
												stiffness: 400,
												damping: 25,
											}}
										>
											<button
												type="button"
												data-step={n}
												aria-label={`Question ${n}${isCurrent ? ", current question" : isCorrect ? ", correct" : isIncorrect ? ", incorrect" : ""}`}
												aria-current={isCurrent ? "step" : undefined}
												className={`inline-flex h-14 w-14 items-center justify-center rounded-full text-xl font-semibold leading-none tabular-nums tracking-tight focus:outline-none focus:ring-0 transition-opacity duration-300 ${isCurrent ? "opacity-100" : "opacity-50 group-hover:opacity-80"}`}
												style={{
													...buttonStyle,
													fontFamily: 'var(--app-font), system-ui, sans-serif',
													letterSpacing: '-0.015em',
													transition: 'transform 0.2s ease, opacity 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
												}}
											>
												<motion.span
													key={`${n}-${isCorrect ? 'correct' : isIncorrect ? 'incorrect' : 'default'}`}
													initial={{ scale: 0.8, opacity: 0 }}
													animate={{ scale: 1, opacity: 1 }}
													exit={{ scale: 0.8, opacity: 0 }}
													transition={{ duration: 0.2, ease: "easeOut" }}
													className="inline-flex items-center justify-center"
												>
													{displayContent}
												</motion.span>
											</button>
										</motion.div>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

