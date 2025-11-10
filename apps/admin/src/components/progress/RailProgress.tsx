"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Check, X } from "lucide-react";

// Tooltip component that adjusts position to stay on screen
function TooltipPositioner({ cursorX, cursorY, content }: { cursorX: number; cursorY: number; content: string }) {
	// Calculate position upfront based on estimated width to avoid bouncing
	const position = useMemo(() => {
		// Estimate tooltip height and width
		const estimatedHeight = 45; // Approximate tooltip height
		const estimatedWidth = Math.min(content.length * 8 + 32, 400); // ~8px per char + padding
		const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
		const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
		const padding = 16;
		const verticalGap = 40; // Gap between cursor and tooltip - "up a bit"
		
		// Position directly above cursor (due north), centered horizontally
		// The tooltip's bottom edge should be `verticalGap` pixels above the cursor
		// With translateY(-100%), the tooltip's bottom aligns with the `top` value
		let left = cursorX;
		let top = cursorY - verticalGap;
		
		// Adjust horizontal position to prevent overflow
		const halfWidth = estimatedWidth / 2;
		if (left - halfWidth < padding) {
			// Too far left - align left edge
			left = padding + halfWidth;
		} else if (left + halfWidth > viewportWidth - padding) {
			// Too far right - align right edge
			left = viewportWidth - padding - halfWidth;
		}
		
		// Adjust vertical position if tooltip would go off-screen
		// Only adjust if it would actually go above the viewport (not just close to it)
		if (top - estimatedHeight < padding) {
			// Not enough room above - position below cursor instead
			top = cursorY + verticalGap;
			return {
				left,
				top,
				transform: "translateX(-50%) translateY(0)"
			};
		}
		
		// Default: position directly above cursor (due north), centered
		return {
			left,
			top,
			transform: "translateX(-50%) translateY(-100%)"
		};
	}, [cursorX, cursorY, content]);

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ 
				opacity: 1, 
				scale: 1,
			}}
			exit={{ opacity: 0, scale: 0.8 }}
			transition={{
				type: "spring",
				stiffness: 260,
				damping: 10,
			}}
			style={{
				position: "fixed",
				left: position.left,
				top: position.top,
				transform: position.transform,
				pointerEvents: "none",
				zIndex: 999999, // Very high z-index to overlay all elements
			}}
			className="flex flex-col items-center justify-center rounded-lg bg-black/95 backdrop-blur-sm shadow-xl px-4 py-2.5 border border-white/10 whitespace-nowrap"
		>
			<div className="font-medium text-white relative text-base" style={{ fontFamily: 'var(--app-font), system-ui, sans-serif' }}>
				{content}
			</div>
		</motion.div>
	);
}

export type RailProgressProps = {
	total: number; // 1..n
	current: number; // 1-based
	onSelect?: (n: number) => void;
	locked?: boolean;
	rightSlot?: React.ReactNode;
	sections?: number[];
	className?: string;
	roundColors?: string[];
	isDark?: boolean;
	backgroundColor?: string;
	correctAnswers?: Set<number>;
	incorrectAnswers?: Set<number>;
	attemptedAnswers?: Set<number>;
	viewedQuestions?: Set<number>;
	questions?: any[];
	showPlusOne?: boolean;
	isMouseActive?: boolean;
};

export default function RailProgress({
	total,
	current,
	onSelect,
	locked = false,
	rightSlot,
	sections,
	className = "",
	roundColors,
	isDark,
	backgroundColor,
	correctAnswers,
	incorrectAnswers,
	attemptedAnswers,
	viewedQuestions,
	questions,
	showPlusOne = false,
	isMouseActive = true,
}: RailProgressProps) {
	const steps = useMemo(() => Array.from({ length: total }, (_, i) => i + 1), [total]);
	const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
	const [tooltipPosition, setTooltipPosition] = React.useState<{ x: number; y: number } | null>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const currentQuestionRef = useRef<HTMLDivElement>(null);
	const isUserScrollingRef = useRef(false);
	const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastCurrentRef = useRef(current);

	// Track user-initiated scrolling to prevent scrollIntoView from interfering
	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const handleUserScroll = () => {
			isUserScrollingRef.current = true;
			if (scrollTimeoutRef.current) {
				clearTimeout(scrollTimeoutRef.current);
			}
			// Reset flag after scroll ends (with some delay to catch rapid scrolling)
			scrollTimeoutRef.current = setTimeout(() => {
				isUserScrollingRef.current = false;
			}, 200);
		};

		container.addEventListener('scroll', handleUserScroll, { passive: true });
		container.addEventListener('touchstart', handleUserScroll, { passive: true });
		container.addEventListener('mousedown', handleUserScroll);

		return () => {
			container.removeEventListener('scroll', handleUserScroll);
			container.removeEventListener('touchstart', handleUserScroll);
			container.removeEventListener('mousedown', handleUserScroll);
			if (scrollTimeoutRef.current) {
				clearTimeout(scrollTimeoutRef.current);
			}
		};
	}, []);

	// Auto-scroll to current question when it changes (only if user isn't manually scrolling)
	useEffect(() => {
		// Only auto-scroll if current actually changed (not just on mount)
		if (lastCurrentRef.current === current) return;
		lastCurrentRef.current = current;

		// Wait a bit to ensure user scrolling state is updated
		const timeoutId = setTimeout(() => {
			if (!isUserScrollingRef.current && currentQuestionRef.current) {
				currentQuestionRef.current.scrollIntoView({
					behavior: "smooth",
					block: "nearest",
					inline: "center"
				});
			}
		}, 50);

		return () => clearTimeout(timeoutId);
	}, [current]);

	// Helper to darken a hex color by a percentage
	const darkenColor = useMemo(() => {
		return (hex: string, percent: number): string => {
			const num = parseInt(hex.replace('#', ''), 16);
			const r = (num >> 16) & 255;
			const g = (num >> 8) & 255;
			const b = num & 255;
			const newR = Math.floor(r * (1 - percent));
			const newG = Math.floor(g * (1 - percent));
			const newB = Math.floor(b * (1 - percent));
			return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
		};
	}, []);

	// Helper to get round color for a specific question index
	const getRoundColorForIndex = useMemo(() => {
		return (index: number) => {
			if (!roundColors || roundColors.length === 0) return "#3B82F6";
			let roundNum = 0;
			if (sections) {
				for (let i = sections.length - 1; i >= 0; i--) {
					if (index + 1 >= sections[i]) {
						roundNum = i;
						break;
					}
				}
			} else {
				roundNum = Math.floor(index / 5);
			}
			return roundColors[roundNum] || roundColors[0];
		};
	}, [roundColors, sections]);

	function onKeyDown(e: React.KeyboardEvent) {
		if (!onSelect) return;
		if (e.key === "ArrowRight") {
			onSelect(Math.min(total, current + 1));
			e.preventDefault();
		}
		if (e.key === "ArrowLeft") {
			onSelect(Math.max(1, current - 1));
			e.preventDefault();
		}
		if (e.key === "Home") {
			onSelect(1);
			e.preventDefault();
		}
		if (e.key === "End") {
			onSelect(total);
			e.preventDefault();
		}
	}

	// Memoize question status to avoid recalculation
	const questionStatuses = useMemo(() => {
		return steps.map((n) => {
			const questionId = questions?.[n - 1]?.id;
			const isCurrent = n === current;
			const isViewed = questionId && viewedQuestions?.has(questionId);
			const isAttempted = questionId && attemptedAnswers?.has(questionId);
			const isCorrect = questionId && correctAnswers?.has(questionId);
			const isIncorrect = questionId && incorrectAnswers?.has(questionId);
			const roundColor = getRoundColorForIndex(n - 1);

			return {
				n,
				isCurrent,
				isViewed,
				isAttempted,
				isCorrect,
				isIncorrect,
				roundColor,
				questionId,
			};
		});
	}, [steps, current, questions, viewedQuestions, attemptedAnswers, correctAnswers, incorrectAnswers, getRoundColorForIndex]);

	return (
		<div 
			role="progressbar"
			aria-valuemin={1}
			aria-valuemax={total}
			aria-valuenow={current}
			aria-label="Quiz progress"
			className={`fixed bottom-0 left-0 right-0 z-40 w-full pb-safe pt-2 pb-4 sm:pt-3 sm:pb-5 transition-all duration-500 ease-in-out ${isMouseActive ? "opacity-100" : "opacity-35"} ${className}`}
			style={{
				backgroundColor: backgroundColor || "transparent",
				transition: "background-color 300ms ease-in-out, opacity 500ms ease-in-out"
			}}
			onKeyDown={onKeyDown}
		>
			{/* Fade overlays */}
			{current > 1 && (
				<div 
					className="absolute left-0 top-0 bottom-0 w-20 pointer-events-none z-20"
					style={{ 
						background: `linear-gradient(to right, ${backgroundColor || (isDark ? "rgba(26, 26, 26, 0.95)" : "rgba(255, 255, 255, 0.95)")}, transparent)`,
						transition: "background 700ms ease-in-out"
					}}
				/>
			)}
			{current < total && (
				<div 
					className="absolute right-0 top-0 bottom-0 w-20 pointer-events-none z-20"
					style={{ 
						background: `linear-gradient(to left, ${backgroundColor || (isDark ? "rgba(26, 26, 26, 0.95)" : "rgba(255, 255, 255, 0.95)")}, transparent)`,
						transition: "background 700ms ease-in-out"
					}}
				/>
			)}

			{/* Scrollable container */}
			<div className="flex justify-center">
				<div
					ref={scrollContainerRef}
					className="flex gap-2 scrollbar-hide py-1 max-w-full overflow-x-auto overflow-y-visible"
					style={{ 
						paddingLeft: '24px', 
						paddingRight: '24px',
						scrollBehavior: 'smooth'
					}}
				>
					{questionStatuses.map((status) => {
						const { n, isCurrent, isViewed, isAttempted, isCorrect, isIncorrect, roundColor } = status;

						// Determine button style and content
						let buttonStyle: React.CSSProperties = {};
						let displayContent: string | React.ReactNode = n;
						
						if (isCurrent) {
							if (isViewed && !isAttempted) {
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
							// Use high contrast text color based on background for readability (circles have transparent bg)
							const textColor = isDark ? "white" : "#1a1a1a";
							buttonStyle = { 
								border: `2px solid ${darkerColor}`,
								color: textColor,
								backgroundColor: "transparent"
							};
							displayContent = <Eye className="w-6 h-6" />;
						} else {
							const darkerColor = darkenColor(roundColor, 0.4);
							// Use high contrast text color based on background for readability (circles have transparent bg)
							const textColor = isDark ? "white" : "#1a1a1a";
							buttonStyle = { 
								border: `2px solid ${darkerColor}`, 
								color: textColor,
								backgroundColor: "transparent"
							};
							displayContent = n;
						}

						// Generate tooltip content
						let tooltipContent = `Go to question ${n}`;
						if (questions && questions[n - 1]) {
							const question = questions[n - 1];
							const preview = question.question || '';
							const truncated = preview.length > 50 ? preview.slice(0, 50) + '...' : preview;
							tooltipContent = `Q${n}: ${truncated}`;
						}
						if (locked && !isCurrent) {
							tooltipContent = "Locked";
						}

						const isHovered = hoveredIndex === n;

						// Determine aria-label based on state
						let ariaLabel = `Question ${n}`;
						if (isCurrent) {
							ariaLabel = `Question ${n}, current question`;
						} else if (isCorrect) {
							ariaLabel = `Question ${n}, correct`;
						} else if (isIncorrect) {
							ariaLabel = `Question ${n}, incorrect`;
						} else if (isViewed) {
							ariaLabel = `Question ${n}, visited`;
						}

						const handleMouseEnter = (e: React.MouseEvent) => {
							setHoveredIndex(n);
							// Capture cursor position once when entering - position directly above cursor
							setTooltipPosition({ x: e.clientX, y: e.clientY });
						};

						const handleMouseMove = (e: React.MouseEvent) => {
							// Only update if user is not scrolling to avoid position issues
							if (!isUserScrollingRef.current) {
								setTooltipPosition({ x: e.clientX, y: e.clientY });
							}
						};

						const handleMouseLeave = () => {
							setHoveredIndex(null);
							setTooltipPosition(null);
						};

						return (
							<motion.div 
								key={n}
								ref={isCurrent ? currentQuestionRef : null}
								className="relative flex-shrink-0"
								style={{ 
									zIndex: isHovered ? 9999 : 1
								}}
								onMouseEnter={handleMouseEnter}
								onMouseLeave={handleMouseLeave}
								onMouseMove={handleMouseMove}
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
									aria-label={ariaLabel}
									aria-current={isCurrent ? "step" : undefined}
									className={`inline-flex h-14 w-14 items-center justify-center rounded-full text-xl font-semibold leading-none tabular-nums tracking-tight focus:outline-none focus:ring-0 transition-opacity duration-300 ${isCurrent ? "opacity-100" : "opacity-50 group-hover:opacity-80"}`}
									style={{
										...buttonStyle,
										fontFamily: 'var(--app-font), system-ui, sans-serif',
										letterSpacing: '-0.015em',
										transition: 'transform 0.2s ease, opacity 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
									}}
									onClick={() => onSelect?.(n)}
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
								
								{/* Custom cursor-following tooltip */}
								<AnimatePresence>
									{isHovered && tooltipPosition && (
										<TooltipPositioner
											cursorX={tooltipPosition.x}
											cursorY={tooltipPosition.y}
											content={tooltipContent}
										/>
									)}
								</AnimatePresence>

								{/* +1 Animation above current question */}
								<AnimatePresence>
									{showPlusOne && isCurrent && (
										<motion.div
											initial={{ opacity: 0, scale: 0.5, y: 0, x: 0 }}
											animate={{ 
												opacity: [0, 1, 1, 0],
												scale: [0.5, 1.2, 1.1, 0.8],
												y: [0, -30, -40, -50],
												x: [0, 5, -5, 0]
											}}
											exit={{ opacity: 0, scale: 0.8, y: -50 }}
											transition={{
												duration: 1,
												ease: "easeOut",
												times: [0, 0.2, 0.7, 1]
											}}
											className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-none z-20"
										>
											<span 
												className="text-2xl font-bold whitespace-nowrap"
												style={{ 
													color: isDark ? "#fff" : "#000",
													textShadow: isDark 
														? "0 0 10px rgba(255, 255, 255, 0.5)" 
														: "0 0 10px rgba(0, 0, 0, 0.3)",
													fontFamily: 'var(--app-font), system-ui, sans-serif',
												}}
											>
												+1
											</span>
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
