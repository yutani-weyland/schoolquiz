"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Share2, Copy, Check, Lock } from "lucide-react";
import React, { useState } from "react";
import { textOn } from "@/lib/contrast";
import { formatWeek } from "@/lib/format";
import { useUserTier } from "@/hooks/useUserTier";
import { UpgradeModal } from "@/components/premium/UpgradeModal";
import { canAccessQuiz } from "@/lib/feature-gating";

export type Quiz = {
	id: number;
	slug: string;
	title: string;
	blurb: string;
	weekISO: string;
	colorHex: string;
	status?: "available" | "coming_soon";
	tags?: string[];
};

interface QuizCardProps {
	quiz: Quiz;
	isNewest?: boolean;
}

export function QuizCard({ quiz, isNewest = false }: QuizCardProps) {
	const [showShareMenu, setShowShareMenu] = useState(false);
	const [copied, setCopied] = useState(false);
	const [hasProgress, setHasProgress] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [formattedDate, setFormattedDate] = useState<string>("");
	const [showUpgradeModal, setShowUpgradeModal] = useState(false);
	const { tier, isPremium } = useUserTier();
	
	// Format date on client only to avoid hydration errors
	React.useEffect(() => {
		setFormattedDate(formatWeek(quiz.weekISO));
	}, [quiz.weekISO]);
	
	// Check if quiz has been started
	React.useEffect(() => {
		if (typeof window !== 'undefined') {
			const timer = sessionStorage.getItem(`quiz-${quiz.slug}-timer`);
			setHasProgress(timer && parseInt(timer, 10) > 0);
		}
	}, [quiz.slug]);
	
	const text = textOn(quiz.colorHex);
	const invert = text === "white" ? "text-white" : "text-gray-900";
	const sub = text === "white" ? "text-white/90" : "text-gray-800/80";
	const footerMuted = quiz.status === "coming_soon" ? "opacity-70" : "";
	
	const quizUrl = typeof window !== 'undefined' ? `${window.location.origin}/quizzes/${quiz.slug}/intro` : '';

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
			// Fallback to copy
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

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-100px" }}
			transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
			className="h-full"
		>
			<motion.div
				className="rounded-3xl p-7 sm:p-9 shadow-lg h-full min-h-[430px] flex flex-col relative overflow-hidden cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
				style={{ 
					backgroundColor: quiz.colorHex,
					viewTransitionName: `quiz-${quiz.id}`,
					transformOrigin: 'center',
				}}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				whileHover={{ 
					rotate: 1.4,
					scale: 1.02,
					boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
				}}
				whileTap={{ scale: 0.98 }}
				transition={{ 
					type: "spring",
					stiffness: 300,
					damping: 25
				}}
				onClick={(e) => {
					e.stopPropagation();
					if (quiz.status === "available") {
						// Check if basic user is trying to access non-latest quiz
						if (!canAccessQuiz(tier, isNewest)) {
							setShowUpgradeModal(true);
							return;
						}
						try {
							sessionStorage.setItem("quizzes.scrollY", String(window.scrollY));
							sessionStorage.setItem("quizzes.scrollParams", window.location.search);
							sessionStorage.setItem("quiz.transition.id", String(quiz.id));
						} catch {}
						window.location.href = `/quizzes/${quiz.slug}/intro`;
					}
				}}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						if (quiz.status === "available") {
							// Check if basic user is trying to access non-latest quiz
							if (!canAccessQuiz(tier, isNewest)) {
								setShowUpgradeModal(true);
								return;
							}
							try {
								sessionStorage.setItem("quizzes.scrollY", String(window.scrollY));
								sessionStorage.setItem("quizzes.scrollParams", window.location.search);
								sessionStorage.setItem("quiz.transition.id", String(quiz.id));
							} catch {}
							window.location.href = `/quizzes/${quiz.slug}/intro`;
						}
					}
				}}
				aria-label={`Play Quiz ${quiz.id}: ${quiz.title}`}
			>
				{/* Subtle gradient overlay on hover */}
				<motion.div
					className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/10 pointer-events-none rounded-3xl"
					initial={{ opacity: 0 }}
					animate={{ opacity: isHovered ? 1 : 0 }}
					transition={{ duration: 0.3 }}
				/>

				<div className="flex items-start justify-between mb-4 relative z-10">
					<div className="flex items-center gap-3">
						<motion.span
							className={`inline-flex items-center px-4 py-2 rounded-full text-base font-bold ${invert} bg-black/10 bg-clip-padding`}
							whileHover={{ scale: 1.05 }}
							transition={{ duration: 0.2 }}
						>
							#{quiz.id}
						</motion.span>
						{!canAccessQuiz(tier, isNewest) && (
							<motion.span
								className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${invert} bg-black/20 bg-clip-padding`}
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.2 }}
								title="Upgrade to Premium to access previous quizzes"
							>
								<Lock className="w-3 h-3" />
								Premium
							</motion.span>
						)}
						{isNewest && (
							<motion.span
								className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${invert} relative overflow-hidden shadow-sm`}
								style={{
									backgroundColor: text === "white" ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.15)",
									backdropFilter: "blur(8px)",
								}}
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
								whileHover={{ scale: 1.1 }}
							>
								{/* Shine effect */}
								<motion.div
									className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
									animate={{
										x: ['-100%', '200%'],
									}}
									transition={{
										duration: 2,
										repeat: Infinity,
										repeatDelay: 3,
										ease: 'easeInOut',
									}}
									style={{ width: '50%' }}
								/>
								<span className="relative z-10">NEW</span>
							</motion.span>
						)}
					</div>
					<span className={`inline-flex items-center gap-2 text-base font-medium ${sub}`}>
						<Calendar className="h-5 w-5" aria-hidden />
						{formattedDate || formatWeek(quiz.weekISO)}
					</span>
				</div>
				
				<h3 className={`text-3xl sm:text-4xl font-extrabold leading-tight mb-5 ${invert} relative z-10 min-h-[4.5rem]`}>
					{quiz.title}
				</h3>
				
				{/* Categories tags */}
				{quiz.tags && quiz.tags.length > 0 && (
					<motion.div
						className="flex flex-wrap gap-2.5 mb-7 relative z-10"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.2, duration: 0.4 }}
					>
						{quiz.tags.map((tag, index) => (
							<motion.span
								key={tag}
								className={`px-3.5 py-1.5 rounded-full text-sm font-medium ${
									text === "white" ? "bg-white/20 text-white" : "bg-black/10 text-gray-900"
								}`}
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.1 * index, duration: 0.3 }}
								whileHover={{ scale: 1.1 }}
							>
								{tag}
							</motion.span>
						))}
					</motion.div>
				)}
				
				<div className="mt-auto relative z-10">
					<div className={`flex items-center justify-between ${footerMuted}`}>
						<motion.button
							disabled={quiz.status === "coming_soon"}
							className={`px-6 py-3 rounded-full text-base font-semibold transition whitespace-nowrap ${
								quiz.status === "coming_soon"
									? "bg-white/40 text-black/60 cursor-not-allowed"
									: text === "white"
									? "bg-white text-gray-900 hover:bg-white/90"
									: "bg-gray-900 text-white hover:bg-gray-800"
							}`}
							whileHover={quiz.status !== "coming_soon" ? { scale: 1.04 } : {}}
							whileTap={quiz.status !== "coming_soon" ? { scale: 0.96 } : {}}
						>
							{quiz.status === "coming_soon" ? "Coming soon" : hasProgress ? "Continue quiz" : "Play quiz"}
						</motion.button>
						<div className="relative">
							<motion.button
								type="button"
								aria-label="Share quiz"
								className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${
									text === "white" ? "bg-white/15 text-white hover:bg-white/25" : "bg-black/5 text-gray-900 hover:bg-black/10"
								}`}
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									setShowShareMenu(!showShareMenu);
								}}
								whileHover={{ 
									scale: 1.1,
									rotate: [0, -12, 12, 0],
									transition: { 
										rotate: { duration: 0.5, ease: "easeInOut" },
										scale: { type: "spring", stiffness: 400, damping: 10 }
									}
								}}
								whileTap={{ scale: 0.85, rotate: -8 }}
							>
								<Share2 className="h-6 w-6" />
							</motion.button>

							<AnimatePresence>
								{showShareMenu && (
									<motion.div
										initial={{ opacity: 0, scale: 0.9, y: 10 }}
										animate={{ opacity: 1, scale: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.9, y: 10 }}
										transition={{ duration: 0.2 }}
										className={`absolute bottom-full right-0 mb-2 rounded-xl shadow-2xl overflow-hidden z-50 ${
											text === "white" ? "bg-white text-gray-900" : "bg-gray-900 text-white"
										}`}
										style={{ minWidth: '180px' }}
										onClick={(e) => e.stopPropagation()}
									>
										<div className="p-2">
											{[
												{
													label: "Share on Facebook",
													href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(quizUrl)}`,
												},
												{
													label: "Share on LinkedIn",
													href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(quizUrl)}`,
												},
												{
													label: "Share on Instagram",
													href: `https://www.instagram.com/?url=${encodeURIComponent(quizUrl)}`,
												},
											].map((target) => (
												<a
													key={target.label}
													href={target.href}
													target="_blank"
													rel="noopener noreferrer"
													className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
														text === "white" ? "hover:bg-gray-100" : "hover:bg-gray-800"
													}`}
												>
													<span>{target.label}</span>
												</a>
											))}
											{typeof navigator !== 'undefined' && navigator.share && (
												<motion.button
													onClick={(e) => {
														e.preventDefault();
														e.stopPropagation();
														handleShare();
													}}
													className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition ${
														text === "white" 
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
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													handleCopy();
												}}
												className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition ${
													text === "white" 
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
					</div>
				</div>
			</motion.div>
			
			{/* Upgrade Modal */}
			<UpgradeModal
				isOpen={showUpgradeModal}
				onClose={() => setShowUpgradeModal(false)}
				feature="Previous Quizzes"
			/>
		</motion.div>
	);
}
