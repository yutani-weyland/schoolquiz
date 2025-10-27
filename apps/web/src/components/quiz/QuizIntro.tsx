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
			<motion.main
				layoutId={`quiz-bg-${quiz.id}`}
				className="min-h-dvh w-full flex flex-col px-6 sm:px-8 md:px-12 lg:px-16 fixed inset-0"
				style={{ 
					backgroundColor: quiz.colorHex,
					viewTransitionName: `quiz-${quiz.id}`
				}}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.2 }}
			>
				{/* Header with Logo and X Button */}
				<div className="flex items-center justify-between py-6">
					{/* Site Logo - Top Left */}
					<motion.div
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.4 }}
						className={`text-2xl font-bold tracking-tight ${text}`}
					>
						The School Quiz
					</motion.div>

					{/* X Button - Top Right */}
					<motion.button
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.2 }}
						onClick={onBack}
						className={`p-3 rounded-full transition ${
							tone === "white" 
								? "bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm" 
								: "bg-black/10 hover:bg-black/15 text-gray-900 backdrop-blur-sm"
						}`}
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.9 }}
						aria-label="Close"
					>
						<X className="h-6 w-6" />
					</motion.button>
				</div>

				{/* Centered Content */}
				<div className="flex-1 flex items-center justify-center">
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, staggerChildren: 0.04 }}
						className="max-w-5xl w-full mx-auto text-center"
					>
						{/* Edition Badge - Prominent */}
						<motion.div
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.4, delay: 0.05 }}
							className="mb-6"
						>
							<span className={`inline-flex items-center px-6 py-3 rounded-full text-2xl sm:text-3xl font-black ${
								tone === "white" 
									? "bg-white/20 text-white backdrop-blur-sm ring-2 ring-white/30" 
									: "bg-black/15 text-gray-900 backdrop-blur-sm ring-2 ring-black/20"
							}`}>
								#{quiz.id}
							</span>
						</motion.div>

						<motion.h1
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, delay: 0.1 }}
							className={`font-extrabold ${text} text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl mb-6 leading-tight px-4`}
						>
							{quiz.title}
						</motion.h1>
					<motion.p
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, delay: 0.15 }}
						className={`mx-auto max-w-2xl ${sub} text-base sm:text-lg md:text-xl mb-8 px-4`}
					>
						{quiz.blurb}
					</motion.p>
					<motion.div
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, delay: 0.2 }}
						className="flex items-center justify-center gap-3 mb-8 flex-wrap"
					>
						<a
							href={`/quiz/${quiz.slug}/play`}
							autoFocus
							className={`px-6 py-3 rounded-full font-semibold transition inline-block ${
								tone === "white" ? "bg-white text-gray-900 hover:bg-white/90" : "bg-gray-900 text-white hover:bg-gray-800"
							}`}
						>
							{hasProgress ? "Continue" : "Start"}
						</a>
						<button
							onClick={onBack}
							className={`px-6 py-3 rounded-full font-semibold transition ${
								tone === "white" ? "text-white hover:bg-white/10" : "text-gray-900 hover:bg-black/5"
							}`}
						>
							Back
						</button>
						{hasProgress && (
							<motion.button
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								onClick={handleReset}
								className={`px-6 py-3 rounded-full font-semibold transition ${
									tone === "white" ? "text-white hover:bg-white/10" : "text-gray-900 hover:bg-black/5"
								}`}
							>
								Reset
							</motion.button>
						)}
						<div className="relative">
							<motion.button
								onClick={() => setShowShareMenu(!showShareMenu)}
								className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition ${
									tone === "white" ? "text-white hover:bg-white/10" : "text-gray-900 hover:bg-black/5"
								}`}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<Share2 className="h-5 w-5" />
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
												<button
													onClick={handleShare}
													className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition ${
														tone === "white" 
															? "hover:bg-gray-100" 
															: "hover:bg-gray-800"
													}`}
												>
													<Share2 className="h-4 w-4" />
													<span className="text-sm font-medium">Share</span>
												</button>
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
					<motion.div
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, delay: 0.25 }}
						className={`flex items-center justify-center gap-2 ${sub} text-sm sm:text-base px-4`}
					>
						<Calendar className="h-4 w-4" aria-hidden />
						{formatWeek(quiz.weekISO)}
					</motion.div>
					</motion.div>
				</div>
			</motion.main>
		</LayoutGroup>
	);
}

