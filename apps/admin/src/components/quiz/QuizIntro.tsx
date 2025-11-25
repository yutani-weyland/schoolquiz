"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import { Calendar, Share2, Copy, Check, X } from "lucide-react";
import { formatWeek } from "@/lib/format";
import { useUserTier } from "@/hooks/useUserTier";
import { hasExceededFreeQuizzes, getRemainingFreeQuizzes } from "@/lib/quizAttempts";
import { QuizSignupModal } from "@/components/premium/QuizSignupModal";
import { QuizLimitModal } from "@/components/premium/QuizLimitModal";
import { QuizLockoutModal } from "@/components/quiz/QuizLockoutModal";
import { storage } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { getQuizIntroStartLabel } from "@/lib/quizStartLabel";
import { useUserAccess } from "@/contexts/UserAccessContext";

interface Quiz {
	id: number;
	slug: string;
	title: string;
	blurb: string;
	weekISO: string;
	colorHex: string;
}

interface QuizIntroProps {
	quiz: Quiz;
	isNewest?: boolean; // Whether this is the latest quiz
}

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

export default function QuizIntro({ quiz, isNewest = false }: QuizIntroProps) {
	const { data: session } = useSession();
	const router = useRouter();
	const [showShareMenu, setShowShareMenu] = useState(false);
	const [copied, setCopied] = useState(false);
	const [formattedDate, setFormattedDate] = useState<string>("");
	const [showSignupModal, setShowSignupModal] = useState(false);
	const [showLimitModal, setShowLimitModal] = useState(false);
	const [showLockoutModal, setShowLockoutModal] = useState(false);
	const [isQuizCompleted, setIsQuizCompleted] = useState(false);
	const [mounted, setMounted] = useState(false);
	const { isLoggedIn: userIsLoggedIn, isVisitor } = useUserAccess();
	const { tier, isPremium, isLoading } = useUserTier();
	const loggedIn = userIsLoggedIn;
	
	// Compute start label - use state to avoid hydration mismatch
	const [startLabel, setStartLabel] = React.useState("Play Quiz"); // Default to "Play Quiz" to match server render
	
	// Update label after mount to avoid hydration errors
	React.useEffect(() => {
		if (!loggedIn) {
			setStartLabel("Play Quiz");
			return;
		}
		
		// For logged-in users, check restrictions
		try {
			const hasExceeded = hasExceededFreeQuizzes();
			const label = getQuizIntroStartLabel({
				isLoggedIn: loggedIn,
				isPremium: isPremium || false,
				hasExceededFreeQuizzes: hasExceeded,
				isNewest: isNewest || false,
			});
			setStartLabel(label);
		} catch (e) {
			setStartLabel("Play Quiz"); // Safe fallback
		}
	}, [isPremium, isNewest, loggedIn]);
	
	// Format date on client only to avoid hydration errors
	useEffect(() => {
		setFormattedDate(formatWeek(quiz.weekISO));
	}, [quiz.weekISO]);
	
	// Check if quiz is completed
	React.useEffect(() => {
		if (typeof window !== 'undefined' && loggedIn) {
			const checkCompletion = async () => {
				// First check localStorage
				const completionKey = `quiz-${quiz.slug}-completion`;
				const completionStr = localStorage.getItem(completionKey);
				
				if (completionStr) {
					try {
						const completion = JSON.parse(completionStr);
						if (completion && typeof completion === 'object' && 'score' in completion) {
							setIsQuizCompleted(true);
							return;
						}
					} catch (err) {
						// Ignore parse errors
					}
				}
				
				// Also check API if logged in
				if (session?.user?.id) {
					try {
						const response = await fetch(`/api/quiz/completion?quizSlug=${encodeURIComponent(quiz.slug)}`, {
							credentials: 'include', // Send session cookie
						});
						
						// Check if response is JSON before parsing
						const contentType = response.headers.get('content-type');
						if (response.ok && contentType && contentType.includes('application/json')) {
							const data = await response.json();
							if (data.completion) {
								setIsQuizCompleted(true);
							}
						}
					} catch (err) {
						// Ignore errors silently
					}
				}
			};
			
			checkCompletion();
		}
	}, [quiz.slug, loggedIn]);

	// Check authentication on client only to avoid hydration errors
	useEffect(() => {
		setMounted(true);
		
		// Disable scroll restoration for the intro page
		if (typeof window !== 'undefined') {
			window.history.scrollRestoration = "manual";
			window.scrollTo(0, 0);
			
			// Only show modals for logged-in users with restrictions
			// Visitors can play (they'll be limited to 5 questions)
			if (loggedIn && !isLoading && !isPremium) {
				// Check if basic user has exceeded free quizzes
				if (hasExceededFreeQuizzes()) {
					setShowLimitModal(true);
				}
				// Check if trying to access non-latest quiz
				if (!isNewest) {
					setShowLimitModal(true);
				}
			}
		}
	}, [quiz.slug, isPremium, isLoading, isNewest, loggedIn]);

	// Prefetch play page route when intro page loads
	// This makes the play page feel instant when user clicks "Start Quiz"
	useEffect(() => {
		// Just prefetch the route - Next.js will handle data fetching efficiently
		router.prefetch(`/quizzes/${quiz.slug}/play`);
	}, [quiz.slug, router]);
	
	const remainingQuizzes = loggedIn && !isPremium ? getRemainingFreeQuizzes() : 3;
	const quizzesPlayed = loggedIn && !isPremium ? (3 - remainingQuizzes) : 0;
	
	const handlePlayClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
		if (!mounted) return;
		
		// Visitors can only play the latest quiz
		if (!loggedIn && !isNewest) {
			e.preventDefault();
			// Redirect to latest quiz intro (quiz #12)
			window.location.href = '/quizzes/12/intro';
			return;
		}
		
		// Allow visitors to play latest quiz (they'll be limited to 5 questions in QuizPlayer)
		// Only block if they're logged in but have restrictions
		if (loggedIn) {
			// Premium users can always replay
			if (isPremium) {
				return; // Allow play
			}
			
			// Free users: check if quiz is already completed
			if (isQuizCompleted) {
				e.preventDefault();
				setShowLockoutModal(true);
				return;
			}
			
			// Check if basic user has exceeded free quizzes
			if (hasExceededFreeQuizzes()) {
				e.preventDefault();
				setShowLimitModal(true);
				return;
			}
			
			// Check if basic user is trying to access non-latest quiz
			if (!isNewest) {
				e.preventDefault();
				setShowLimitModal(true);
				return;
			}
		}
		// Visitors can proceed with latest quiz - they'll be limited to 5 questions
	};

	const tone = textOn(quiz.colorHex);
	const text = tone === "white" ? "text-white" : "text-gray-900";
	const sub = tone === "white" ? "text-white/90" : "text-gray-800/80";
	
	const quizUrl = typeof window !== 'undefined' ? window.location.href : '';

	const handleShare = async () => {
		if (typeof navigator !== 'undefined' && navigator.share) {
			try {
				await navigator.share({
					title: `Quiz #${quiz.id} - The School Quiz`,
					text: quiz.title,
					url: quizUrl,
				});
			} catch (err) {
				console.log('Share cancelled');
			}
		} else {
			handleCopy();
		}
		setShowShareMenu(false);
	};

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(quizUrl);
			setCopied(true);
			setTimeout(() => {
				setCopied(false);
				setShowShareMenu(false);
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	};

	function onBack() {
		if (typeof window !== 'undefined') {
			// Use direct navigation instead of history.back() to ensure it always works
			if (loggedIn) {
				// Logged-in users: go to quizzes page
				window.location.href = '/quizzes';
			} else {
				// Logged-out users: redirect to index page
				window.location.href = '/';
			}
		}
	}

	// Set background color immediately to prevent flash - runs synchronously on mount
	React.useLayoutEffect(() => {
		if (typeof document !== 'undefined') {
			// Set body background to match quiz color immediately - use !important to override CSS
			document.body.style.setProperty('background-color', quiz.colorHex, 'important');
			// Also set html background
			document.documentElement.style.setProperty('background-color', quiz.colorHex, 'important');
			// Remove dark mode class that might cause black background
			document.documentElement.classList.remove('dark');
			
			return () => {
				// Cleanup: restore default background when component unmounts
				document.body.style.removeProperty('background-color');
				document.documentElement.style.removeProperty('background-color');
			};
		}
	}, [quiz.colorHex]);

	return (
		<LayoutGroup>
			<motion.section
				layoutId={`quiz-bg-${quiz.id}`}
				className="quiz-safe h-dvh grid fixed inset-0 md:overflow-hidden"
				style={{
					backgroundColor: quiz.colorHex,
					viewTransitionName: `quiz-${quiz.id}`,
					gridTemplateRows: "auto 1fr",
					transition: "background-color 0.25s ease-out",
					height: "100dvh"
				}}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.2 }}
			>
				{/* Top bar - consistent with site header (py-3 px-6) */}
				<header className="flex items-center justify-between py-3 px-6">
					<motion.a
						href={loggedIn ? '/quizzes' : '/'}
						onClick={(e) => {
							e.preventDefault();
							if (typeof window !== 'undefined') {
								window.location.href = loggedIn ? '/quizzes' : '/';
							}
						}}
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.4 }}
						className={`text-2xl font-bold tracking-tight cursor-pointer hover:opacity-80 transition-opacity truncate ${text}`}
					>
						The School Quiz
					</motion.a>
					
					<div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
						<motion.button
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: 0.2 }}
							onClick={onBack}
							aria-label="Close"
							className={`p-4 rounded-full transition flex-shrink-0 ${
								tone === "white" 
									? "bg-white/15 hover:bg-white/25 text-white" 
									: "bg-black/10 hover:bg-black/15 text-gray-900"
							}`}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							<X className="h-6 w-6" />
						</motion.button>
					</div>
				</header>

				{/* Main stack */}
				<main 
					className="flex flex-col items-center justify-center px-8 sm:px-6 md:px-12 lg:px-16 flex-1 overflow-x-hidden md:overflow-y-hidden overflow-y-auto min-h-0"
					style={{
						paddingTop: 'clamp(1rem, 3vh, 3rem)',
						paddingBottom: 'clamp(1rem, 3vh, 3rem)'
					}}
				>
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, staggerChildren: 0.04 }}
						className="w-full flex flex-col items-center text-center mx-auto max-w-full"
						style={{ maxWidth: 'var(--maxw-reading)' }}
					>
						{/* Edition Badge */}
						<motion.div
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.4, delay: 0.05 }}
							style={{ marginBottom: 'clamp(1rem, 2.5vh, 2.5rem)' }}
						>
							<span 
								className={`inline-flex items-center rounded-full font-bold ${
									tone === "white" 
										? "bg-white/10 text-white" 
										: "bg-black/10 text-gray-900"
								}`}
								style={{
									padding: 'clamp(0.375rem, 1vh, 0.5rem) clamp(1rem, 2vw, 1.25rem)',
									fontSize: 'clamp(0.875rem, min(1.125rem, 2vh), 1.125rem)'
								}}
							>
								#{quiz.id}
							</span>
						</motion.div>

						<motion.h1
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, delay: 0.1 }}
							className={`font-extrabold text-balance tracking-tight px-2 ${text}`}
							style={{ 
								fontSize: 'clamp(2rem, min(6vw, 8vh), 4rem)',
								lineHeight: '1.1',
								marginBottom: 'clamp(1.5rem, 3vh, 2.5rem)'
							}}
						>
							{quiz.title}
						</motion.h1>
						
						{quiz.blurb && (
							<motion.p
								initial={{ opacity: 0, y: 6 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.4, delay: 0.15 }}
								className={`px-2 ${tone === "white" ? "opacity-80" : "opacity-70"} ${text}`}
								style={{
									fontSize: 'clamp(0.875rem, min(1.125rem, 2.5vh), 1.25rem)',
									marginBottom: 'clamp(1.5rem, 3vh, 3rem)'
								}}
							>
								{quiz.blurb}
							</motion.p>
						)}

						{/* Date - positioned after blurb */}
						<motion.time
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ 
								duration: 0.4, 
								delay: quiz.blurb ? 0.2 : 0.15
							}}
							className={`flex items-center justify-center gap-1.5 ${tone === "white" ? "opacity-70" : "opacity-60"} ${text}`}
							style={{
								fontSize: 'clamp(0.75rem, 1.5vh, 0.875rem)',
								marginBottom: 'clamp(2rem, 4vh, 4rem)'
							}}
						>
							<Calendar className="h-4 w-4" aria-hidden />
							{formattedDate || formatWeek(quiz.weekISO)}
						</motion.time>

						{/* Action Buttons */}
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ 
								type: "spring",
								stiffness: 300,
								damping: 25,
								delay: 0.2
							}}
							className="flex flex-row items-center justify-center gap-3 w-full px-4"
							style={{ 
								flexWrap: 'wrap',
								maxWidth: '100%',
								marginBottom: 'clamp(0.75rem, 2vh, 3rem)'
							}}
						>
							{!loggedIn ? (
								<motion.a
									href={`/quizzes/${quiz.slug}/play`}
									onClick={handlePlayClick}
									autoFocus
									className={`rounded-full font-semibold cursor-pointer whitespace-nowrap ${
										tone === "white" ? "bg-white text-gray-900" : "bg-gray-900 text-white"
									}`}
									style={{
										paddingTop: 'clamp(0.75rem, min(1.25rem, 3vh), 1.5rem)',
										paddingBottom: 'clamp(0.75rem, min(1.25rem, 3vh), 1.5rem)',
										paddingLeft: 'clamp(1.5rem, min(2.5rem, 4vw), 2.5rem)',
										paddingRight: 'clamp(1.5rem, min(2.5rem, 4vw), 2.5rem)',
										fontSize: 'clamp(0.875rem, min(1.125rem, 2.5vh), 1.25rem)',
										boxShadow: tone === "white" 
											? "0 4px 14px 0 rgba(0, 0, 0, 0.15)" 
											: "0 4px 14px 0 rgba(0, 0, 0, 0.3)"
									}}
									whileHover={{ 
										scale: 1.05,
										transition: { 
											type: "spring",
											stiffness: 500,
											damping: 20,
											mass: 0.5
										}
									}}
									transition={{
										type: "spring",
										stiffness: 600,
										damping: 25,
										mass: 0.3
									}}
									whileTap={{ 
										scale: 0.98,
										transition: { 
											type: "spring",
											stiffness: 500,
											damping: 30
										}
									}}
								>
									{startLabel}
								</motion.a>
							) : !isPremium && !isLoading && (hasExceededFreeQuizzes() || !isNewest) ? (
								<motion.button
									onClick={() => setShowLimitModal(true)}
									autoFocus
									className={`rounded-full px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5 text-base sm:text-lg md:text-xl font-semibold cursor-pointer whitespace-nowrap ${
										tone === "white" ? "bg-white/50 text-gray-900" : "bg-gray-400 text-white"
									}`}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
								>
									{hasExceededFreeQuizzes() ? "Upgrade to Play" : "Premium Required"}
								</motion.button>
							) : (
								<motion.a
									href={`/quizzes/${quiz.slug}/play`}
									onClick={handlePlayClick}
									autoFocus
									className={`rounded-full font-semibold cursor-pointer whitespace-nowrap ${
										tone === "white" ? "bg-white text-gray-900" : "bg-gray-900 text-white"
									}`}
									style={{
										paddingTop: 'clamp(0.75rem, min(1.25rem, 3vh), 1.5rem)',
										paddingBottom: 'clamp(0.75rem, min(1.25rem, 3vh), 1.5rem)',
										paddingLeft: 'clamp(1.5rem, min(2.5rem, 4vw), 2.5rem)',
										paddingRight: 'clamp(1.5rem, min(2.5rem, 4vw), 2.5rem)',
										fontSize: 'clamp(0.875rem, min(1.125rem, 2.5vh), 1.25rem)',
										boxShadow: tone === "white" 
											? "0 4px 14px 0 rgba(0, 0, 0, 0.15)" 
											: "0 4px 14px 0 rgba(0, 0, 0, 0.3)"
									}}
									whileHover={{ 
										scale: 1.05,
										transition: { 
											type: "spring",
											stiffness: 500,
											damping: 20,
											mass: 0.5
										}
									}}
									transition={{
										type: "spring",
										stiffness: 600,
										damping: 25,
										mass: 0.3
									}}
									whileTap={{ 
										scale: 0.98,
										transition: { 
											type: "spring",
											stiffness: 500,
											damping: 30
										}
									}}
								>
									{startLabel}
								</motion.a>
							)}
							
							<div className="relative">
								<motion.button
									onClick={() => setShowShareMenu(!showShareMenu)}
									className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full font-semibold cursor-pointer whitespace-nowrap ${
										tone === "white" ? "bg-white/15 text-white hover:bg-white/25" : "bg-white/20 text-gray-900 hover:bg-white/30"
									}`}
									style={{
										paddingTop: 'clamp(0.75rem, min(1.25rem, 3vh), 1.5rem)',
										paddingBottom: 'clamp(0.75rem, min(1.25rem, 3vh), 1.5rem)',
										paddingLeft: 'clamp(1.5rem, min(2.5rem, 4vw), 2.5rem)',
										paddingRight: 'clamp(1.5rem, min(2.5rem, 4vw), 2.5rem)',
										fontSize: 'clamp(0.875rem, min(1.125rem, 2.5vh), 1.25rem)',
										boxShadow: tone === "white" 
											? "0 4px 14px 0 rgba(0, 0, 0, 0.15)" 
											: "0 4px 14px 0 rgba(0, 0, 0, 0.1)"
									}}
									whileHover={{ 
										scale: 1.05,
										transition: { 
											type: "spring",
											stiffness: 500,
											damping: 20,
											mass: 0.5
										}
									}}
									transition={{
										type: "spring",
										stiffness: 600,
										damping: 25,
										mass: 0.3
									}}
									whileTap={{ 
										scale: 0.98,
										transition: { 
											type: "spring",
											stiffness: 500,
											damping: 30
										}
									}}
									>
										<motion.div
											whileHover={{ 
												rotate: [0, -8, 8, 0],
												transition: { 
													duration: 0.4,
													ease: "easeInOut"
												}
											}}
										>
											<Share2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
										</motion.div>
										<span>Share</span>
									</motion.button>

								<AnimatePresence>
									{showShareMenu && (
										<motion.div
											initial={{ opacity: 0, scale: 0.9, y: -10 }}
											animate={{ opacity: 1, scale: 1, y: 0 }}
											exit={{ opacity: 0, scale: 0.9, y: -10 }}
											transition={{ duration: 0.2 }}
											className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 rounded-xl shadow-2xl overflow-hidden z-50 ${
												tone === "white" ? "bg-white text-gray-900" : "bg-gray-900 text-white"
											}`}
											style={{ minWidth: '180px' }}
										>
											<div className="p-2">
											{typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
												<motion.button
													onClick={handleShare}
													className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition ${
														tone === "white" 
															? "hover:bg-gray-100" 
															: "hover:bg-gray-800"
													}`}
													whileHover={{ x: 4 }}
												>
													<Share2 className="h-4 w-4" />
													<span className="text-sm font-medium">Share</span>
												</motion.button>
											)}
												<button
													onClick={handleCopy}
													className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition ${
														tone === "white" 
															? "hover:bg-gray-100" 
															: "hover:bg-gray-800"
													}`}
												>
													{copied ? (
														<>
															<Check className="h-4 w-4" />
															<span className="text-sm font-medium">Copied!</span>
														</>
													) : (
														<>
															<Copy className="h-4 w-4" />
															<span className="text-sm font-medium">Copy link</span>
														</>
													)}
												</button>
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						</motion.div>
					</motion.div>
				</main>

			</motion.section>
			
			{/* Signup Modal */}
			<QuizSignupModal
				isOpen={showSignupModal}
				onClose={() => setShowSignupModal(false)}
			/>
			
			{/* Limit Modal */}
			<QuizLimitModal
				isOpen={showLimitModal}
				onClose={() => setShowLimitModal(false)}
				quizzesPlayed={quizzesPlayed}
				maxQuizzes={3}
			/>
			<QuizLockoutModal
				isOpen={showLockoutModal}
				onClose={() => setShowLockoutModal(false)}
				quizTitle={quiz.title}
			/>
		</LayoutGroup>
	);
}
