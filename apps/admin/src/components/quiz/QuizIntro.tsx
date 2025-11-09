"use client";

import React, { useEffect, useState } from "react";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import { Calendar, Share2, Copy, Check, X } from "lucide-react";
import { formatWeek } from "@/lib/format";
import { useUserTier } from "@/hooks/useUserTier";
import { hasExceededFreeQuizzes, getRemainingFreeQuizzes } from "@/lib/quizAttempts";
import { QuizSignupModal } from "@/components/premium/QuizSignupModal";
import { QuizLimitModal } from "@/components/premium/QuizLimitModal";

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
	const [showShareMenu, setShowShareMenu] = useState(false);
	const [copied, setCopied] = useState(false);
	const [formattedDate, setFormattedDate] = useState<string>("");
	const [showSignupModal, setShowSignupModal] = useState(false);
	const [showLimitModal, setShowLimitModal] = useState(false);
	const { tier, isPremium, isLoading } = useUserTier();
	
	// Check authentication
	const loggedIn = typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') === 'true';
	const remainingQuizzes = loggedIn && !isPremium ? getRemainingFreeQuizzes() : 3;
	const quizzesPlayed = loggedIn && !isPremium ? (3 - remainingQuizzes) : 0;
	
	// Format date on client only to avoid hydration errors
	useEffect(() => {
		setFormattedDate(formatWeek(quiz.weekISO));
	}, [quiz.weekISO]);
	
	useEffect(() => {
		// Disable scroll restoration for the intro page
		if (typeof window !== 'undefined') {
			window.history.scrollRestoration = "manual";
			window.scrollTo(0, 0);
			
			// Check if not logged in
			if (!loggedIn) {
				setShowSignupModal(true);
			} else if (!isLoading && !isPremium) {
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
	}, [quiz.slug, loggedIn, isPremium, isLoading, isNewest]);
	
	const handlePlayClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
		// Require sign-up
		if (!loggedIn) {
			e.preventDefault();
			setShowSignupModal(true);
			return;
		}
		
		// Check if basic user has exceeded free quizzes
		if (!isPremium && hasExceededFreeQuizzes()) {
			e.preventDefault();
			setShowLimitModal(true);
			return;
		}
		
		// Check if basic user is trying to access non-latest quiz
		if (!isPremium && !isNewest) {
			e.preventDefault();
			setShowLimitModal(true);
			return;
		}
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
		window.history.back();
	}

	return (
		<LayoutGroup>
			<motion.section
				layoutId={`quiz-bg-${quiz.id}`}
				className="quiz-safe min-h-dvh grid fixed inset-0"
				style={{
					backgroundColor: quiz.colorHex,
					viewTransitionName: `quiz-${quiz.id}`,
					gridTemplateRows: "auto 1fr",
					transition: "background-color 0.25s ease-out",
					minHeight: "100dvh"
				}}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.2 }}
			>
				{/* Top bar - consistent with site header (py-3 px-6) */}
				<header className="flex items-center justify-between py-3 px-6">
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
						className={`text-2xl font-bold tracking-tight cursor-pointer hover:opacity-80 transition-opacity ${text}`}
					>
						The School Quiz
					</motion.a>
					
					<div className="flex items-center gap-4">
						<motion.button
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: 0.2 }}
							onClick={onBack}
							aria-label="Close"
							className={`p-4 rounded-full transition ${
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
				<main className="flex flex-col items-center justify-center px-6 sm:px-0 flex-1 py-12">
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, staggerChildren: 0.04 }}
						className="w-full flex flex-col items-center text-center mx-auto"
						style={{ maxWidth: 'var(--maxw-reading)' }}
					>
						{/* Edition Badge */}
						<motion.div
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.4, delay: 0.05 }}
							className="mb-6"
						>
							<span className={`inline-flex items-center rounded-full px-5 py-2 text-lg font-bold ${
								tone === "white" 
									? "bg-white/10 text-white" 
									: "bg-black/10 text-gray-900"
							}`}>
								#{quiz.id}
							</span>
						</motion.div>

						<motion.h1
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, delay: 0.1 }}
							className={`font-extrabold text-balance tracking-tight mb-6 ${text}`}
							style={{ 
								fontSize: 'clamp(2.5rem, 5vw, 4rem)',
								lineHeight: '1.1'
							}}
						>
							{quiz.title}
						</motion.h1>
						
						{quiz.blurb && (
							<motion.p
								initial={{ opacity: 0, y: 6 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.4, delay: 0.15 }}
								className={`text-title mb-8 ${tone === "white" ? "opacity-80" : "opacity-70"} ${text}`}
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
							className={`flex items-center justify-center gap-1.5 text-sm mb-12 ${tone === "white" ? "opacity-70" : "opacity-60"} ${text}`}
						>
							<Calendar className="h-4 w-4" aria-hidden />
							{formattedDate || formatWeek(quiz.weekISO)}
						</motion.time>

						{/* Warning - Show for basic users */}
						{loggedIn && !isPremium && !isLoading && remainingQuizzes > 0 && remainingQuizzes < 3 && isNewest && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className={`mb-6 px-4 py-3 rounded-xl border ${
									tone === "white"
										? "bg-white/10 border-white/20 text-white"
										: "bg-black/10 border-black/20 text-gray-900"
								}`}
							>
								<p className="text-sm font-medium text-center">
									{remainingQuizzes === 1 
										? "⚠️ Last free quiz! Upgrade to Premium for unlimited access."
										: `${remainingQuizzes} free quiz${remainingQuizzes !== 1 ? 'es' : ''} remaining. Upgrade to Premium for unlimited access.`}
								</p>
							</motion.div>
						)}

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
							className="flex flex-wrap items-center justify-center gap-3 mb-12"
						>
							{!loggedIn ? (
								<motion.button
									onClick={() => setShowSignupModal(true)}
									autoFocus
									className={`rounded-full px-10 py-5 text-xl font-semibold cursor-pointer ${
										tone === "white" ? "bg-white/50 text-gray-900" : "bg-gray-400 text-white"
									}`}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
								>
									Sign Up to Play
								</motion.button>
							) : !isPremium && !isLoading && (hasExceededFreeQuizzes() || !isNewest) ? (
								<motion.button
									onClick={() => setShowLimitModal(true)}
									autoFocus
									className={`rounded-full px-10 py-5 text-xl font-semibold cursor-pointer ${
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
									className={`rounded-full px-10 py-5 text-xl font-semibold cursor-pointer ${
										tone === "white" ? "bg-white text-gray-900" : "bg-gray-900 text-white"
									}`}
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
									style={{
										boxShadow: tone === "white" 
											? "0 4px 14px 0 rgba(0, 0, 0, 0.15)" 
											: "0 4px 14px 0 rgba(0, 0, 0, 0.3)"
									}}
								>
									Play Quiz
								</motion.a>
							)}
							
							<div className="relative">
								<motion.button
									onClick={() => setShowShareMenu(!showShareMenu)}
									className={`inline-flex items-center gap-1.5 rounded-full px-10 py-5 text-xl font-semibold cursor-pointer ${
										tone === "white" ? "bg-white/10 text-white" : "bg-black/10 text-gray-900"
									}`}
									whileHover={{ 
										scale: 1.05,
										backgroundColor: tone === "white" ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.15)",
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
										<Share2 className="h-5 w-5" />
									</motion.div>
									Share
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
		</LayoutGroup>
	);
}
