"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { SimpleAnimatedTooltip } from "@/components/ui/animated-tooltip";

type Props = {
	answerText: string;
	revealed: boolean;
	onReveal: () => void;
	onHide: () => void;
	disabled?: boolean;
	accentColor: string;
	textColor: "white" | "black";
	isMarkedCorrect?: boolean;
	isMarkedIncorrect?: boolean;
	onMarkCorrect?: (event: React.MouseEvent<HTMLButtonElement>) => void;
	onUnmarkCorrect?: () => void;
	size?: "default" | "compact";
	className?: string;
};

export default function AnswerReveal({
	answerText,
	revealed,
	onReveal,
	onHide,
	disabled,
	accentColor,
	textColor,
	isMarkedCorrect,
	isMarkedIncorrect,
	onMarkCorrect,
	onUnmarkCorrect,
	size = "default",
	className,
}: Props) {
	const isCompact = size === "compact";
	const BUTTON_HEIGHT = isCompact ? 56 : 68;
	const BUTTON_RADIUS = BUTTON_HEIGHT / 2;
	const CIRCLE_SIZE = isCompact ? 42 : 48; // Circle size for the X/Check buttons - fits inside button
	const CIRCLE_PADDING = isCompact ? 8 : 10; // Padding from the edge inside the button
	const buttonFontSize = isCompact ? "1.35rem" : "1.5rem";
	const encouragementFontSize = isCompact ? "1rem" : "1.25rem";
	const encouragementPaddingX = isCompact ? 18 : 24;
	const encouragementPaddingY = isCompact ? 12 : 16;

	const buttonBg = "#111111";
	const buttonColor = "#FFFFFF";
	const buttonBorder = "1px solid rgba(17,17,17,0.25)";
	const buttonShadow = "0 16px 32px rgba(17,17,17,0.24)";
	const greenFlashColor = "var(--color-correct)";
	const redFlashColor = "var(--color-wrong)";
	
	const answerTextRef = useRef<HTMLDivElement>(null);
	const answerSpanRef = useRef<HTMLSpanElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [needsScroll, setNeedsScroll] = useState(false);
	const [scrollDistance, setScrollDistance] = useState(0);
	const [xButtonKey, setXButtonKey] = useState(0); // Trigger animation on click
	const [hasShownEncouragement, setHasShownEncouragement] = useState(false);
	const [activeMessages, setActiveMessages] = useState<Array<{
		id: number;
		message: string;
		angle: number;
		xOffset: number;
	}>>([]);
	const [messageIdCounter, setMessageIdCounter] = useState(0);
	const [showGreenFlash, setShowGreenFlash] = useState(false);
	const [showRedFlash, setShowRedFlash] = useState(false);
	
	const encouragementMessages = [
		"You've got this 💪",
		"Keep going, you're doing fine 🙌",
		"Stick with it 👍",
		"You'll get there 🌟",
		"Nearly there! 🏁",
		"You're all good 😊",
		"Don't stress it 😌",
		"You've got this in the bag 🎒",
		"Chin up, mate 👊",
		"Keep smashing it 🔥",
		"You're killing it 😎",
		"Ride it out 🌊",
		"It'll sort itself out 🤷‍♂️",
		"U got this 💪",
		"Hang tight 🤙",
		"Stay solid 🧱",
		"Keep vibin' 🎧",
		"Lowkey you'll be fine 😏",
		"You're built for this 🧠",
		"Trust the process ⚙️",
		"Keep your cool 🧊",
		"You're doing bits 👏",
		"Power through ⚡️",
		"You've got more in the tank ⛽️",
		"Don't chuck it in yet 😉",
		"You're tougher than you think 💥",
		"Keep pushing 👟",
		"You're smashing goals 🎯",
		"Don't let it get to you 🌀",
		"One step at a time 🪜",
		"You're solid as 💪",
		"Back yourself 💭",
		"Hold it down ✊",
		"Stay chill 😎",
		"You've got this covered 🧢",
		"Head up, legend 🦸‍♂️",
		"You're doing great, mate ❤️",
		"You'll bounce back 🏀",
		"Keep the vibes up 🌈",
		"Stay in the game 🕹️",
		"Hakuna matata 🦁",
		"No worries mate 🤝",
		"Don't stress 😌"
	];

	// Capture the width once when showing "Reveal answer" and use it ALWAYS
	// This width should never change - it's the fixed width for the button
	const fixedButtonWidthRef = useRef<number | null>(null);
	const [isWidthReady, setIsWidthReady] = useState(false);
	const [isMobileViewport, setIsMobileViewport] = useState(() => {
		if (typeof window === "undefined") return false;
		return window.innerWidth < 768;
	});
	const [targetWidth, setTargetWidth] = useState(() => {
		if (typeof window === "undefined") return calculateInitialWidth();
		const viewport = window.innerWidth;
		return viewport < 768 ? viewport * 0.92 : calculateInitialWidth();
	});

	// Pre-calculate a reliable width estimate based on "Reveal answer" text
	// This ensures the button has a consistent width from the start
	function calculateInitialWidth() {
		if (typeof window === 'undefined') return 500;
		
		const viewportWidth = window.innerWidth;
		const maxAllowedWidth = viewportWidth * 0.9;
		
		// Estimate width based on "Reveal answer" text and control size
		const estimatedWidth = isCompact ? 420 : 450;
		
		return Math.min(estimatedWidth, maxAllowedWidth);
	}

	// Calculate the fixed width based on "Reveal answer" text - do this once
	// This width is calculated once and NEVER changes
	// Make it wider (500px default) and ensure it doesn't cause scrollbar
	useEffect(() => {
		if (fixedButtonWidthRef.current === null && !revealed) {
			// Set initial width estimate immediately
			const initialWidth = calculateInitialWidth();
			fixedButtonWidthRef.current = initialWidth;
			setIsWidthReady(true);
			setTargetWidth(prev => {
				if (typeof window === "undefined") return initialWidth;
				const viewport = window.innerWidth;
				return viewport < 768 ? viewport * 0.92 : initialWidth;
			});
			
			// Then refine it by measuring the actual button once it renders
			const timer = setTimeout(() => {
				if (buttonRef.current && !revealed) {
					// Measure the actual button width when it shows "Reveal answer"
					const viewportWidth = window.innerWidth;
					const maxAllowedWidth = viewportWidth * 0.9;
					
					const measuredWidth = buttonRef.current.offsetWidth;
					if (measuredWidth > 0 && Math.abs(measuredWidth - initialWidth) > 20) {
						// Only update if there's a significant difference (more than 20px)
						// Use the measured width, but make it wider (add 150px) and cap at viewport
						const extra = isCompact ? 140 : 150;
						fixedButtonWidthRef.current = Math.min(measuredWidth + extra, maxAllowedWidth);
						setTargetWidth(prev => {
							if (typeof window === "undefined") return fixedButtonWidthRef.current ?? measuredWidth;
							const viewport = window.innerWidth;
							return viewport < 768 ? viewport * 0.92 : (fixedButtonWidthRef.current ?? measuredWidth);
						});
					}
				}
			}, 50); // Reduced delay for faster measurement
			return () => clearTimeout(timer);
		} else if (revealed) {
			// Reset when answer is revealed so we can recalculate when needed
			setIsWidthReady(true);
		}
	}, [revealed]);

	// Track when answer is revealed to show encouragement animation
	useEffect(() => {
		if (revealed && !hasShownEncouragement && !isMarkedCorrect) {
			// Show subtle encouragement animation after a brief delay
			const timer = setTimeout(() => {
				setHasShownEncouragement(true);
			}, 800);
			return () => clearTimeout(timer);
		} else if (!revealed) {
			setHasShownEncouragement(false);
			setShowGreenFlash(false); // Reset green flash when answer is hidden
			setShowRedFlash(false); // Reset red flash when answer is hidden
		}
	}, [revealed, hasShownEncouragement, isMarkedCorrect]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const handleResize = () => {
			const viewport = window.innerWidth;
			setIsMobileViewport(viewport < 768);
			const base = fixedButtonWidthRef.current ?? calculateInitialWidth();
			setTargetWidth(viewport < 768 ? viewport * 0.92 : base);
		};
		window.addEventListener("resize", handleResize, { passive: true });
		return () => window.removeEventListener("resize", handleResize);
	}, [isCompact]);

	// Check if answer text overflows and needs scrolling
	useEffect(() => {
		if (!revealed) {
			setNeedsScroll(false);
			setScrollDistance(0);
			return;
		}

		// Function to check and set scroll state
		const checkOverflow = () => {
			if (answerTextRef.current && answerSpanRef.current) {
				const container = answerTextRef.current;
				const textElement = answerSpanRef.current;
				
				// Get actual dimensions
				const containerWidth = container.offsetWidth || container.clientWidth;
				const textWidth = textElement.scrollWidth || textElement.offsetWidth;
				
				// Check if text overflows (with a small threshold for rounding)
				const isOverflowing = textWidth > containerWidth + 5;
				
				if (isOverflowing && textWidth > 0 && containerWidth > 0) {
					// Calculate scroll distance: difference between text width and container width
					// Add a bit extra to ensure the end of the text is fully visible
					const extraPadding = 40; // Extra pixels to show end of text clearly
					const scrollDist = textWidth - containerWidth + extraPadding;
					setScrollDistance(scrollDist);
					setNeedsScroll(true);
				} else {
					setNeedsScroll(false);
					setScrollDistance(0);
				}
			}
		};

		// Debounce function for resize events
		let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
		const debouncedCheckOverflow = () => {
			if (resizeTimeout) clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => {
				requestAnimationFrame(checkOverflow);
			}, 150);
		};

		// Initial check after a short delay to ensure DOM is ready
		const timer = setTimeout(() => {
			requestAnimationFrame(checkOverflow);
		}, 100);

		// Check on resize with debouncing
		window.addEventListener('resize', debouncedCheckOverflow, { passive: true });

		// Use ResizeObserver with debouncing for layout changes
		let resizeObserver: ResizeObserver | null = null;
		if (answerTextRef.current && typeof ResizeObserver !== 'undefined') {
			let observerTimeout: ReturnType<typeof setTimeout> | null = null;
			resizeObserver = new ResizeObserver(() => {
				if (observerTimeout) clearTimeout(observerTimeout);
				observerTimeout = setTimeout(() => {
					requestAnimationFrame(checkOverflow);
				}, 150);
			});
			resizeObserver.observe(answerTextRef.current);
		}

		return () => {
			clearTimeout(timer);
			if (resizeTimeout) clearTimeout(resizeTimeout);
			window.removeEventListener('resize', debouncedCheckOverflow);
			if (resizeObserver) {
				resizeObserver.disconnect();
			}
		};
	}, [revealed, answerText]);

	const tooltipContent = revealed ? "Click ✓ if you got it right, or ✗ if you got it wrong" : null;
	
	// Get the button width - use initial estimate if available, otherwise use calculated
	const resolvedWidth = isMobileViewport ? "100%" : `${Math.round(targetWidth)}px`;
	
	const minHorizontalPadding = Math.max(CIRCLE_SIZE + CIRCLE_PADDING + 12, 32);
	const buttonContent = (
		<motion.button
					ref={buttonRef}
					type="button"
					disabled={disabled}
					onClick={() => {
						if (!revealed) {
							onReveal();
						}
					}}
					aria-pressed={revealed}
					className={`relative flex select-none items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${className ?? ""}`}
					style={{
						alignSelf: "flex-start",
						marginLeft: 0,
						borderRadius: isMobileViewport ? "32px" : `${BUTTON_RADIUS}px`,
						height: BUTTON_HEIGHT,
						width: resolvedWidth,
						minWidth: isMobileViewport ? "auto" : resolvedWidth,
						maxWidth: "100%", // Allow button to shrink to fit container
						paddingLeft: minHorizontalPadding,
						paddingRight: minHorizontalPadding,
						paddingTop: 16,
						paddingBottom: 16,
						color: buttonColor,
						boxShadow: "none",
						backgroundColor: buttonBg,
						border: buttonBorder,
						overflow: 'visible', // Allow buttons to be visible
						lineHeight: 1.1,
						textAlign: 'center',
						// Smooth transition if width needs to adjust
						transition: 'width 0.2s ease-out, max-width 0.2s ease-out, transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease',
						willChange: 'transform',
					}}
					animate={{
						backgroundColor: showGreenFlash 
							? (isMarkedCorrect ? [buttonBg, greenFlashColor, greenFlashColor] : [buttonBg, greenFlashColor, buttonBg])
							: showRedFlash 
							? (isMarkedIncorrect ? [buttonBg, redFlashColor, redFlashColor] : [buttonBg, redFlashColor, buttonBg])
							: isMarkedCorrect 
							? greenFlashColor
							: isMarkedIncorrect 
							? redFlashColor
							: buttonBg,
						transform: [
							`scale(${textColor === "white" ? 1 : 0.98})`,
						],
					}}
					transition={{
						backgroundColor: (showGreenFlash || showRedFlash) ? {
							duration: 0.5,
							ease: "easeInOut",
							times: [0, 0.3, 1],
						} : {
							duration: 0.4,
							ease: "easeOut",
						},
					}}
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.99 }}
				>
					{/* X Button - Left Side with Circle - Only show when revealed and not marked correct */}
					{revealed && !isMarkedCorrect && (
						<motion.div
							key={xButtonKey}
							role="button"
							tabIndex={0}
							onClick={(e) => {
								e.stopPropagation();
								setXButtonKey(prev => prev + 1); // Trigger animation
								// Trigger red flash animation
								setShowRedFlash(true);
								setTimeout(() => {
									setShowRedFlash(false);
								}, 1000);
								// Show encouraging message - pick a random one each time
								const randomIndex = Math.floor(Math.random() * encouragementMessages.length);
								const newMessage = encouragementMessages[randomIndex];
								// Random direction: angle between -30 and 30 degrees, x offset between -40 and 40
								const randomAngle = (Math.random() - 0.5) * 60; // -30 to +30 degrees
								const randomXOffset = (Math.random() - 0.5) * 80; // -40 to +40 pixels
								const newId = messageIdCounter;
								setMessageIdCounter(prev => prev + 1);
								// Add new message to the array
								setActiveMessages(prev => [...prev, {
									id: newId,
									message: newMessage,
									angle: randomAngle,
									xOffset: randomXOffset
								}]);
								// Remove message after animation completes
								setTimeout(() => {
									setActiveMessages(prev => prev.filter(msg => msg.id !== newId));
								}, 2500);
								onUnmarkCorrect?.();
							}}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									e.stopPropagation();
									(e.target as HTMLElement).click();
								}
							}}
							className="absolute flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 cursor-pointer"
							style={{
								left: `${CIRCLE_PADDING}px`,
								top: `${(BUTTON_HEIGHT - CIRCLE_SIZE) / 2}px`,
								width: `${CIRCLE_SIZE}px`,
								height: `${CIRCLE_SIZE}px`,
								borderRadius: '50%',
								background: 'var(--color-wrong)',
								border: textColor === "white" ? '2px solid rgba(255,255,255,0.55)' : '2px solid rgba(17,17,17,0.12)',
								cursor: 'pointer',
								zIndex: 30,
								boxShadow: '0 16px 32px rgba(255,107,107,0.35)',
							}}
							initial={{ scale: 0, opacity: 0 }}
							animate={{ 
								scale: hasShownEncouragement && !isMarkedCorrect ? [1, 1.08, 1] : 1, 
								opacity: showGreenFlash ? [1, 0, 0, 1] : 1, // Hide when green flash is active
								left: `${CIRCLE_PADDING}px`,
								top: `${(BUTTON_HEIGHT - CIRCLE_SIZE) / 2}px`,
								boxShadow: hasShownEncouragement && !isMarkedCorrect 
									? ['0 0 0px rgba(239, 68, 68, 0)', '0 0 12px rgba(239, 68, 68, 0.4)', '0 0 0px rgba(239, 68, 68, 0)']
									: 'none',
								transition: {
									type: "spring",
									stiffness: 400,
									damping: 25,
									opacity: showGreenFlash ? {
										duration: 1.0,
										ease: "easeInOut",
										times: [0, 0.15, 0.85, 1],
									} : {},
									...(hasShownEncouragement && !isMarkedCorrect ? {
										scale: {
											duration: 1.5,
											repeat: 2,
											repeatDelay: 0.5,
											ease: "easeInOut"
										},
										boxShadow: {
											duration: 1.5,
											repeat: 2,
											repeatDelay: 0.5,
											ease: "easeInOut"
										}
									} : {})
								}
							}}
							whileHover={{ scale: 1.1 }}
							whileTap={{ 
								scale: 0.95,
								rotate: [0, -8, 8, -4, 4, 0], // Playful wiggle
								transition: {
									type: "spring",
									stiffness: 500,
									damping: 15,
									duration: 0.4
								}
							}}
							aria-label="Mark as incorrect"
						>
							<motion.div
								key={xButtonKey}
								animate={{
									scale: [1, 1.15, 1],
									rotate: [0, -5, 5, -3, 3, 0],
								}}
								transition={{
									duration: 0.5,
									ease: [0.34, 1.56, 0.64, 1], // Playful bounce
								}}
							>
								<X className="w-6 h-6 text-white" strokeWidth={3} />
							</motion.div>
						</motion.div>
					)}

					<AnimatePresence mode="wait">
						{!revealed ? (
							<motion.div
								key="cta"
								initial={{ opacity: 0 }}
								animate={{ 
									opacity: 1,
								}}
								exit={{ 
									opacity: 0,
									transition: { duration: 0.15 }
								}}
								className="flex h-full w-full items-center justify-center truncate text-center text-2xl font-extrabold tracking-tight"
							>
								Reveal answer
							</motion.div>
						) : (
							<motion.div
								key="answer"
								initial={{ opacity: 0, scale: 0.95, y: 10 }}
								animate={{ 
									opacity: 1,
									scale: 1,
									y: 0,
									transition: { 
										duration: 0.3,
										ease: [0.22, 1, 0.36, 1]
									}
								}}
								exit={{ 
									opacity: 0,
									scale: 0.95,
									y: -10,
									transition: { duration: 0.15 }
								}}
								className="w-full h-full flex items-center justify-center relative"
								style={{ zIndex: 1 }}
							>
								{/* Answer Text - Center when short, left-aligned when long */}
								<div
									ref={answerTextRef}
									className={`font-extrabold tracking-tight w-full overflow-hidden flex items-center ${
										needsScroll 
											? "scrollbar-hide justify-start text-left" 
											: "text-center justify-center"
									}`}
									style={{
										fontSize: buttonFontSize,
										lineHeight: '1.25',
										fontWeight: '800',
										zIndex: 1
									}}
								>
									{needsScroll && scrollDistance > 0 ? (
										<motion.span
											ref={answerSpanRef}
											className="inline-block whitespace-nowrap"
											style={{
												fontSize: buttonFontSize, // Fixed size
												lineHeight: '1.25',
												fontWeight: '800'
											}}
											key={`scroll-${scrollDistance}`}
											initial={{ x: 0 }}
											animate={{
												// Right-to-left scrolling: 
												// Start at 0 (beginning of text visible), 
												// scroll left to show end of text,
												// then return to start
												x: [0, -scrollDistance, 0],
											}}
											transition={{
												// Calculate duration based on scroll distance (roughly 60px per second for readability)
												// Minimum 3 seconds, add time based on distance
												duration: scrollDistance > 0 ? Math.max(3, scrollDistance / 60) : 3,
												repeat: Infinity,
												ease: "linear",
												// Pause at start and end so users can read
												repeatDelay: 2.5,
											}}
										>
											{answerText}
										</motion.span>
									) : (
										<span 
											ref={answerSpanRef} 
											className="whitespace-nowrap"
											style={{
												fontSize: buttonFontSize, // Fixed size
												lineHeight: '1.25',
												fontWeight: '800'
											}}
										>
											{answerText}
										</span>
									)}
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					{/* Checkmark Button - Right Side with Circle - Only show when revealed and not marked incorrect */}
					{revealed && !isMarkedIncorrect && (
						<motion.div
							role="button"
							tabIndex={0}
							onClick={(e) => {
								e.stopPropagation();
								// Trigger green flash animation
								setShowGreenFlash(true);
								setTimeout(() => {
									setShowGreenFlash(false);
								}, 1000);
								onMarkCorrect?.(e as any);
							}}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									e.stopPropagation();
									(e.target as HTMLElement).click();
								}
							}}
							className="absolute flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 cursor-pointer"
							style={{
								right: `${CIRCLE_PADDING}px`,
								top: `${(BUTTON_HEIGHT - CIRCLE_SIZE) / 2}px`,
								width: `${CIRCLE_SIZE}px`,
								height: `${CIRCLE_SIZE}px`,
								borderRadius: '50%',
								background: 'var(--color-correct)',
								border: textColor === "white" ? '2px solid rgba(255,255,255,0.55)' : '2px solid rgba(17,17,17,0.12)',
								cursor: 'pointer',
								zIndex: 30,
								boxShadow: '0 16px 32px rgba(32,201,151,0.32)',
							}}
							initial={{ scale: 0, opacity: 0 }}
							animate={{ 
								scale: hasShownEncouragement && !isMarkedCorrect ? [1, 1.08, 1] : 1, 
								opacity: showRedFlash ? [1, 0, 0, 1] : 1, // Hide when red flash is active
								right: `${CIRCLE_PADDING}px`,
								top: `${(BUTTON_HEIGHT - CIRCLE_SIZE) / 2}px`,
								boxShadow: hasShownEncouragement && !isMarkedCorrect 
									? ['0 0 0px rgba(16, 185, 129, 0)', '0 0 12px rgba(16, 185, 129, 0.4)', '0 0 0px rgba(16, 185, 129, 0)']
									: 'none',
								transition: {
									type: "spring",
									stiffness: 400,
									damping: 25,
									opacity: showRedFlash ? {
										duration: 1.0,
										ease: "easeInOut",
										times: [0, 0.15, 0.85, 1],
									} : {},
									...(hasShownEncouragement && !isMarkedCorrect ? {
										scale: {
											duration: 1.5,
											repeat: 2,
											repeatDelay: 0.5,
											ease: "easeInOut"
										},
										boxShadow: {
											duration: 1.5,
											repeat: 2,
											repeatDelay: 0.5,
											ease: "easeInOut"
										}
									} : {})
								}
							}}
							whileHover={{ scale: 1.1 }}
							whileTap={{ 
								scale: 0.95,
								rotate: [0, 8, -8, 4, -4, 0], // Playful wiggle similar to X
								transition: {
									type: "spring",
									stiffness: 500,
									damping: 15,
									duration: 0.4
								}
							}}
							aria-label="Mark as correct"
						>
							<motion.div
								key={isMarkedCorrect ? 'check-marked' : 'check-unmarked'}
								animate={isMarkedCorrect ? {
									scale: [1, 1.15, 1],
									rotate: [0, 5, -5, 3, -3, 0],
								} : {}}
								transition={isMarkedCorrect ? {
									duration: 0.5,
									ease: [0.34, 1.56, 0.64, 1], // Playful bounce
								} : {}}
								className="absolute inset-0 flex items-center justify-center"
							>
								<Check className="w-6 h-6 text-white" strokeWidth={3} style={{ opacity: isMarkedCorrect ? 1 : 0.9 }} />
							</motion.div>
						</motion.div>
					)}
				</motion.button>
	);

	return (
		<div className="flex items-start justify-start gap-4 w-full max-w-2xl relative">
			{/* Main Reveal Button */}
			<div className="w-full flex items-center justify-start" style={{ overflow: 'visible' }}>
				{buttonContent}
			</div>
			
			{/* Encouragement Message Animation - floats up from X button at random angles */}
			<AnimatePresence mode="popLayout">
				{activeMessages.map((msg) => (
					<motion.div
						key={msg.id}
						initial={{ 
							opacity: 0, 
							scale: 0.5,
							y: 0,
							x: 0,
							rotate: msg.angle
						}}
						animate={{ 
							opacity: [0, 1, 1, 0.8, 0],
							scale: [0.5, 0.9, 1, 0.95, 0.8],
							y: [0, -40, -60, -80, -100],
							x: [0, msg.xOffset * 0.3, msg.xOffset * 0.6, msg.xOffset * 0.8, msg.xOffset],
							rotate: [msg.angle, msg.angle * 0.7, msg.angle * 0.4, msg.angle * 0.2, 0]
						}}
						exit={{ 
							opacity: 0,
							scale: 0.8,
							y: -100,
							x: msg.xOffset
						}}
						transition={{
							duration: 2.5,
							ease: "easeOut",
							times: [0, 0.15, 0.4, 0.7, 1]
						}}
						className="absolute pointer-events-none whitespace-nowrap"
						style={{
							left: `${CIRCLE_PADDING + CIRCLE_SIZE / 2}px`,
							top: `${(BUTTON_HEIGHT - CIRCLE_SIZE) / 2 + CIRCLE_SIZE / 2}px`,
							transformOrigin: 'center center',
							zIndex: 100 // Highest z-index so messages appear above everything
						}}
					>
						<span 
							className="font-semibold rounded-full"
							style={{ 
								color: textColor === "white" ? "rgba(255,255,255,0.96)" : "var(--color-text)",
								background: textColor === "white" 
									? "rgba(0, 0, 0, 0.68)" 
									: "rgba(255, 255, 255, 0.9)",
								backdropFilter: "blur(8px)",
								border: textColor === "white"
									? "1px solid rgba(255,255,255,0.28)"
									: "1px solid rgba(17,17,17,0.08)",
								textShadow: textColor === "white" 
									? "0 1px 6px rgba(0, 0, 0, 0.45)" 
									: "0 1px 4px rgba(17,17,17,0.18)",
								boxShadow: textColor === "white"
									? "0 12px 28px rgba(0, 0, 0, 0.35)"
									: "0 12px 28px rgba(17, 17, 17, 0.14)",
								fontSize: encouragementFontSize,
								padding: `${encouragementPaddingY}px ${encouragementPaddingX}px`
							}}
						>
							{msg.message}
						</span>
					</motion.div>
				))}
			</AnimatePresence>
		</div>
	);
}

