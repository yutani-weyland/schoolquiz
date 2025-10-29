"use client";

import React, { useEffect, useState } from "react";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import { Calendar, Share2, Copy, Check, X } from "lucide-react";

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

function formatWeek(weekISO: string): string {
	const d = new Date(weekISO);
	if (isNaN(d.getTime())) return weekISO;
	return d.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric"
	});
}

export default function QuizIntro({ quiz }: QuizIntroProps) {
	const [showShareMenu, setShowShareMenu] = useState(false);
	const [copied, setCopied] = useState(false);
	const [hasProgress, setHasProgress] = useState(false);
	
	useEffect(() => {
		// Disable scroll restoration for the intro page
		window.history.scrollRestoration = "manual";
		window.scrollTo(0, 0);
		
		// Check if quiz has progress
		if (typeof window !== 'undefined') {
			const timer = sessionStorage.getItem(`quiz-${quiz.slug}-timer`);
			setHasProgress(timer && parseInt(timer, 10) > 0);
		}
	}, [quiz.slug]);

	const tone = textOn(quiz.colorHex);
	const text = tone === "white" ? "text-white" : "text-gray-900";
	const sub = tone === "white" ? "text-white/90" : "text-gray-800/80";
	
	const handleReset = () => {
		if (typeof window !== 'undefined') {
			if (confirm('Are you sure you want to reset this quiz? All progress will be lost.')) {
				sessionStorage.removeItem(`quiz-${quiz.slug}-timer`);
				setHasProgress(false);
				// Reload to update button text
				window.location.reload();
			}
		}
	};
	
	const quizUrl = typeof window !== 'undefined' ? window.location.href : '';

	const handleShare = async () => {
		if (navigator.share) {
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
					gridTemplateRows: "auto 1fr auto",
					transition: "background-color 0.25s ease-out"
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
					
					<motion.button
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.2 }}
						onClick={onBack}
						aria-label="Close"
						className={`w-12 h-12 grid place-items-center rounded-full transition ${
							tone === "white" 
								? "bg-white/10 hover:bg-white/15 text-white" 
								: "bg-black/10 hover:bg-black/15 text-gray-900"
						}`}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
					>
						<X className="h-5 w-5" />
					</motion.button>
				</header>

				{/* Main stack */}
				<main className="container grid place-items-center px-0">
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, staggerChildren: 0.04 }}
						className="w-full grid gap-6 text-center"
						style={{ maxWidth: 'var(--maxw-reading)' }}
					>
						{/* Edition Badge */}
						<motion.div
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.4, delay: 0.05 }}
							className="justify-self-center"
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
							className={`font-extrabold text-balance tracking-tight ${text}`}
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
								className={`text-title ${tone === "white" ? "opacity-80" : "opacity-70"} ${text}`}
							>
								{quiz.blurb}
							</motion.p>
						)}
					</motion.div>
				</main>

				{/* Footer actions */}
				<footer className="container flex flex-wrap items-center justify-center gap-2x py-3x">
					<motion.a
						href={`/quiz/${quiz.slug}/play?mode=presenter`}
						autoFocus
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, delay: 0.2 }}
						className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
							tone === "white" ? "bg-white text-gray-900 hover:bg-white/90" : "bg-gray-900 text-white hover:bg-gray-800"
						}`}
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
					>
						{hasProgress ? "Continue" : "Presenter Mode"}
					</motion.a>
					
					<motion.a
						href={`/quiz/${quiz.slug}/play?mode=grid`}
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, delay: 0.25 }}
						className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
							tone === "white" ? "bg-white/10 text-white hover:bg-white/15" : "bg-black/10 text-gray-900 hover:bg-black/15"
						}`}
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
					>
						Grid View
					</motion.a>
					
					
					{hasProgress && (
						<motion.button
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, delay: 0.3 }}
							onClick={handleReset}
							className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
								tone === "white" ? "bg-white/10 text-white hover:bg-white/15" : "bg-black/10 text-gray-900 hover:bg-black/15"
							}`}
						>
							Reset
						</motion.button>
					)}
					
					<div className="relative">
					<motion.button
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, delay: 0.35 }}
						onClick={() => setShowShareMenu(!showShareMenu)}
						className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
							tone === "white" ? "bg-white/10 text-white hover:bg-white/15" : "bg-black/10 text-gray-900 hover:bg-black/15"
						}`}
						whileHover={{ 
							scale: 1.05,
							transition: { type: "spring", stiffness: 400, damping: 10 }
						}}
						whileTap={{ scale: 0.95 }}
					>
						<motion.div
							whileHover={{ 
								rotate: [0, -12, 12, 0],
								transition: { duration: 0.5, ease: "easeInOut" }
							}}
						>
							<Share2 className="h-4 w-4" />
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
									{navigator.share && (
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
					
					{/* Line break to push date to next line */}
					<div className="basis-full h-0" />
					
					<motion.time
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, delay: 0.4 }}
						className={`flex items-center gap-1.5 text-sm ${tone === "white" ? "opacity-70" : "opacity-60"} ${text}`}
					>
						<Calendar className="h-4 w-4" aria-hidden />
						{formatWeek(quiz.weekISO)}
					</motion.time>
				</footer>
			</motion.section>
		</LayoutGroup>
	);
}

