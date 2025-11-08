import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Grid3x3, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import AnswerReveal from './quiz/AnswerReveal';
import { SimpleAnimatedTooltip } from '@/components/ui/animated-tooltip';

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

// Circular Progress Component for Score Display
function CircularProgress({
	value,
	size = 100,
	strokeWidth = 10,
	isDark = false,
}: {
	value: number;
	size?: number;
	strokeWidth?: number;
	isDark?: boolean;
}) {
	const radius = size / 2 - strokeWidth;
	const circumference = Math.ceil(2 * Math.PI * radius);
	const percentage = Math.ceil(circumference * ((100 - value) / 100));
	const viewBox = `-${size * 0.125} -${size * 0.125} ${size * 1.25} ${size * 1.25}`;

	return (
		<div className="relative">
			<svg
				width={size}
				height={size}
				viewBox={viewBox}
				version="1.1"
				xmlns="http://www.w3.org/2000/svg"
				style={{ transform: "rotate(-90deg)" }}
				className="relative"
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
				/>

				{/* Progress */}
				<circle
					r={radius}
					cx={size / 2}
					cy={size / 2}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeDashoffset={percentage}
					fill="transparent"
					strokeDasharray={circumference}
					className={isDark ? "stroke-white" : "stroke-black"}
				/>
			</svg>
			{/* Label */}
			<div
				className="absolute inset-0 flex items-center justify-center text-3xl font-bold"
				style={{ color: isDark ? "#fff" : "#000" }}
			>
				{value}
			</div>
		</div>
	);
}

export default function QuizSafariPreview() {
	const [showAnswer, setShowAnswer] = useState(false);
	const [isChecked, setIsChecked] = useState(false);
	const [score] = useState(3); // Showing 3 correct answers
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	
	// Marketing questions that showcase features
	const marketingQuestions = [
		{ question: "Which quiz platform is tailor-made for high school classrooms?", answer: "The School Quiz!" },
		{ question: "Which quiz offers private leaderboards, achievements, and shoutouts?", answer: "The School Quiz!" },
		{ question: "Which quiz delivers handcrafted, engaging content every week?", answer: "The School Quiz!" },
		{ question: "Which quiz platform brings classrooms together with heads-up competition?", answer: "The School Quiz!" },
	];
	
	const currentQuestion = marketingQuestions[currentQuestionIndex];
	
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

	const backgroundColor = getDesaturatedColor(themeColor);
	const textColor = textOn(themeColor);

	return (
		<div className="w-full max-w-5xl mx-auto">
			<div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden relative">
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
				<div style={{ backgroundColor }}>
					<div className="pt-8 pb-8 px-8">
						<div className="max-w-4xl mx-auto relative" style={{ minHeight: '500px' }}>
							{/* Top Bar - Score, Logo and Icons */}
							<div className="flex items-start justify-between mb-8">
								{/* Circular Score - Top Left */}
							<div className="flex-shrink-0">
								<CircularProgress 
									value={score} 
									size={80} 
									strokeWidth={8} 
									isDark={textColor === "white"}
								/>
							</div>

							{/* Logo - Centered */}
							<div className="absolute left-1/2 -translate-x-1/2" style={{ top: '28px' }}>
								<div 
									className="text-3xl font-bold tracking-tight"
									style={{ color: textColor === "white" ? "#ffffff" : "#000000" }}
								>
									The School Quiz
								</div>
							</div>
							
							{/* Icons - Top Right */}
							<div className="flex items-center gap-2" style={{ marginTop: '20px' }}>
								<motion.button
									onClick={handleThemeChange}
									className="p-2 rounded-full transition"
									style={{
										backgroundColor: textColor === "white" ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
										color: textColor === "white" ? "#ffffff" : "#000000",
									}}
									whileHover={{ 
										scale: 1.1,
										backgroundColor: textColor === "white" ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.15)"
									}}
									whileTap={{ scale: 0.85 }}
								>
									<motion.div
										animate={{ rotate: bucketRotate }}
										transition={{ type: "spring", stiffness: 260, damping: 20 }}
									>
										<PaintBucketIcon className="h-4 w-4" />
									</motion.div>
								</motion.button>

								<motion.button
									className="p-2 rounded-full transition"
									style={{
										backgroundColor: textColor === "white" ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
										color: textColor === "white" ? "#ffffff" : "#000000",
									}}
									whileHover={{ 
										scale: 1.1,
										backgroundColor: textColor === "white" ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.15)"
									}}
									whileTap={{ scale: 0.85 }}
								>
									<Grid3x3 className="h-4 w-4" />
								</motion.button>

								<motion.button
									className="p-2 rounded-full transition"
									style={{
										backgroundColor: textColor === "white" ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
										color: textColor === "white" ? "#ffffff" : "#000000",
									}}
									whileHover={{ 
										scale: 1.05,
										backgroundColor: textColor === "white" ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.15)"
									}}
									whileTap={{ scale: 0.95 }}
								>
									<X className="h-4 w-4" />
								</motion.button>
							</div>
							</div>

							{/* Main Question */}
							<div className="flex items-center justify-center relative" style={{ minHeight: '320px' }}>
								{/* Previous Button */}
								<motion.button
									onClick={handlePreviousQuestion}
									className="absolute left-0 p-2 rounded-full transition z-10"
									style={{
										backgroundColor: textColor === "white" ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
										color: textColor === "white" ? "#ffffff" : "#000000",
									}}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
								>
									<ChevronLeft className="h-6 w-6" />
								</motion.button>
								
								<div className="max-w-3xl text-center">
									<motion.p
										key={currentQuestionIndex}
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										className="font-extrabold leading-tight break-words"
										style={{ 
											fontSize: 'clamp(24px, 4vw, 48px)',
											color: textColor === "white" ? "#ffffff" : "#000000"
										}}
									>
										{currentQuestion.question}
									</motion.p>
								</div>
								
								{/* Next Button */}
								<motion.button
									onClick={handleNextQuestion}
									className="absolute right-0 p-2 rounded-full transition z-10"
									style={{
										backgroundColor: textColor === "white" ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
										color: textColor === "white" ? "#ffffff" : "#000000",
									}}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
								>
									<ChevronRight className="h-6 w-6" />
								</motion.button>
							</div>

							{/* CTA: Reveal Answer */}
							<div className="mt-8 flex items-center justify-center">
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
									onMarkCorrect={handleCheckboxClick}
									onUnmarkCorrect={() => setIsChecked(false)}
								/>
							</div>
						</div>
					</div>

					{/* HUD at bottom - mini progress rail - full width */}
					<div className="py-6 relative" style={{ backgroundColor: backgroundColor || "transparent" }}>
						{/* Fade overlay on left */}
						<div 
							className="absolute left-0 top-0 bottom-0 w-16 pointer-events-none z-10"
							style={{ 
								background: `linear-gradient(to right, ${backgroundColor || "transparent"}, transparent)`,
								transition: "background 700ms ease-in-out"
							}}
						/>
						{/* Fade overlay on right */}
						<div 
							className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none z-10"
							style={{ 
								background: `linear-gradient(to left, ${backgroundColor || "transparent"}, transparent)`,
								transition: "background 700ms ease-in-out"
							}}
						/>
						{/* Chips - Scrollable with snap points */}
						<div className="flex justify-center relative">
							<div
								className="flex snap-x gap-2 overflow-x-auto scrollbar-hide py-2 max-w-full"
								style={{ paddingLeft: '24px', paddingRight: '24px' }}
							>
								{Array.from({ length: 25 }, (_, i) => i + 1).map((n) => {
									const currentQuestionNumber = 4 + currentQuestionIndex; // Maps to 4-7 based on index
									const isCurrent = n === currentQuestionNumber;
									const isCorrect = n === 1 || n === 2 || n === 3; // Fixed 3 correct answers for preview
									const isAttempted = n === currentQuestionNumber && showAnswer;
									// For preview, we don't have historical "viewed" questions beyond the current one
									// so isViewed is always false - this matches the real behavior
									const isViewed = false;
									
									const roundColor = getRoundColorForIndex(n - 1);
									
									const base =
										"snap-start inline-flex h-14 w-14 items-center justify-center rounded-full text-base font-semibold tabular-nums transition-colors " +
										"focus:outline-none";
									
									// Determine button style
									let buttonStyle: React.CSSProperties = {};
									let displayContent: string | React.ReactNode = n;
									
									if (isCurrent) {
										buttonStyle = { backgroundColor: "#0B0B0B", color: "white", boxShadow: "0 0 0 4px rgba(11, 11, 11, 0.3), 0 0 12px rgba(11, 11, 11, 0.5)" };
									} else if (isCorrect) {
										// Correct answer - green with checkmark
										buttonStyle = { backgroundColor: "#10B981", color: "white", boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.3)" };
										displayContent = "✓";
									} else if (isAttempted) {
										// Attempted but not correct - outlined with checkmark (darker border)
										const darkerColor = darkenColor(roundColor, 0.4);
										buttonStyle = { 
											border: `2px solid ${darkerColor}`, 
											color: textColor === "white" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)",
											backgroundColor: "transparent"
										};
										displayContent = "✓";
									} else if (isViewed) {
										// Viewed but not revealed - outlined with eye icon
										const darkerColor = darkenColor(roundColor, 0.4);
										buttonStyle = { 
											border: `2px solid ${darkerColor}`, 
											color: darkerColor,
											backgroundColor: "transparent"
										};
										displayContent = <Eye className="w-5 h-5" />;
									} else {
										// Not answered yet - outlined with darker round color
										const darkerColor = darkenColor(roundColor, 0.4);
										const darkerNumberColor = darkenColor(roundColor, 0.2);
										buttonStyle = { 
											border: `2px solid ${darkerColor}`, 
											color: darkerNumberColor,
											backgroundColor: "transparent"
										};
									}
									
									return (
										<SimpleAnimatedTooltip
											key={n}
											content={`Go to question ${n}`}
											position="top"
										>
											<button
												type="button"
												className={base}
												style={buttonStyle}
											>
												{displayContent}
											</button>
										</SimpleAnimatedTooltip>
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
