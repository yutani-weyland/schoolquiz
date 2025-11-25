"use client";

import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Share2, Copy, Check, Lock, Crown, Trophy, FileDown } from "lucide-react";
import React, { useState, useMemo, useCallback } from "react";
import { textOn } from "@/lib/contrast";
import { formatWeek } from "@/lib/format";
import { useUserTier } from "@/hooks/useUserTier";
import { UpgradeModal } from "@/components/premium/UpgradeModal";
import { canAccessQuiz, canAccessFeature } from "@/lib/feature-gating";
import { sessionStorage } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { SimpleAnimatedTooltip } from "@/components/ui/animated-tooltip";

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
	index?: number; // For rotation angle variation
	completionData?: { score: number; totalQuestions: number; completedAt?: string } | null; // Optional: pre-fetched completion data
}

export function QuizCard({ quiz, isNewest = false, index = 0, completionData: initialCompletionData }: QuizCardProps) {
	const { data: session } = useSession();
	// Random tilt angles for hover effect (in degrees) - creates varied interactivity
	const hoverTilts = [-1.5, 1.2, -1.8, 1.5, -1.2, 1.8, -1.5, 1.2, -1.8, 1.5, -1.2, 1.8];
	const hoverTilt = hoverTilts[index % hoverTilts.length] || 0;
	const [showShareMenu, setShowShareMenu] = useState(false);
	const [copied, setCopied] = useState(false);
	const [hasProgress, setHasProgress] = useState(false); // Always start with false to match server render
	const [mounted, setMounted] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [formattedDate, setFormattedDate] = useState<string>("");
	const [showUpgradeModal, setShowUpgradeModal] = useState(false);
	const [animationKey, setAnimationKey] = useState(0);
	const [completionData, setCompletionData] = useState<{ score: number; totalQuestions: number } | null>(initialCompletionData || null);
	const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
	const { tier, isPremium } = useUserTier();
	
	// Format date on client only to avoid hydration errors
	React.useEffect(() => {
		setFormattedDate(formatWeek(quiz.weekISO));
	}, [quiz.weekISO]);
	
	// Set mounted flag and check progress after hydration
	React.useEffect(() => {
		setMounted(true);
		if (typeof window !== 'undefined') {
			const timer = sessionStorage.get<string | null>(`quiz-${quiz.slug}-timer`, null);
			setHasProgress(!!(timer && parseInt(timer, 10) > 0));
		}
	}, [quiz.slug]);
	
	// Listen for theme changes to re-animate cards
	React.useEffect(() => {
		const handleThemeChange = () => {
			setAnimationKey(prev => prev + 1);
		};
		
		window.addEventListener('themechange', handleThemeChange);
		
		// Also listen to storage changes (for cross-tab theme sync)
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === 'theme') {
				setAnimationKey(prev => prev + 1);
			}
		};
		
		window.addEventListener('storage', handleStorageChange);
		
		return () => {
			window.removeEventListener('themechange', handleThemeChange);
			window.removeEventListener('storage', handleStorageChange);
		};
	}, []);

	// Check for quiz completion data (only if not provided as prop)
	React.useEffect(() => {
		// If completion data was provided as prop, use it and skip fetching
		if (initialCompletionData) {
			setCompletionData(initialCompletionData);
			return;
		}

		if (typeof window !== 'undefined') {
			const fetchCompletionData = async () => {
				// First check localStorage for completion data
				const completionKey = `quiz-${quiz.slug}-completion`;
				const completionStr = localStorage.getItem(completionKey);
				
				if (completionStr) {
					try {
						const completion = JSON.parse(completionStr);
						if (completion && typeof completion === 'object' && 'score' in completion && 'totalQuestions' in completion) {
							setCompletionData({
								score: completion.score as number,
								totalQuestions: completion.totalQuestions as number,
							});
							return; // Found in localStorage, no need to check API
						}
					} catch (err) {
						logger.error('Failed to parse completion data from localStorage:', err);
					}
				}
				
				// If not in localStorage and user is logged in, try fetching from API
				if (session?.user?.id) {
					try {
						const response = await fetch(`/api/quiz/completion?quizSlug=${encodeURIComponent(quiz.slug)}`, {
							credentials: 'include', // Send session cookie
						});
						
						// Check if response is JSON before parsing
						const contentType = response.headers.get('content-type');
						if (response.ok && contentType && contentType.includes('application/json')) {
							const data = await response.json();
							if (data.completion && data.completion.score !== undefined && data.completion.totalQuestions !== undefined) {
								setCompletionData({
									score: data.completion.score,
									totalQuestions: data.completion.totalQuestions,
								});
								// Also save to localStorage for future use
								localStorage.setItem(completionKey, JSON.stringify({
									score: data.completion.score,
									totalQuestions: data.completion.totalQuestions,
									completedAt: data.completion.completedAt,
								}));
							}
						} else if (!response.ok) {
							// For error responses, try to parse JSON if available, otherwise log error
							if (contentType && contentType.includes('application/json')) {
								try {
									const errorData = await response.json();
									logger.warn('Quiz completion API error:', errorData);
								} catch {
									// If JSON parsing fails, it's probably HTML - just log status
									logger.warn(`Quiz completion API returned ${response.status} (non-JSON response)`);
								}
							} else {
								logger.warn(`Quiz completion API returned ${response.status} with content-type: ${contentType}`);
							}
						}
					} catch (err) {
						logger.error('Failed to fetch completion data from API:', err);
					}
				} else {
					setCompletionData(null);
				}
			};
			
			fetchCompletionData();
		}
	}, [quiz.slug, initialCompletionData]);
	
	const text = textOn(quiz.colorHex);
	const invert = text === "white" ? "text-white" : "text-gray-900";
	const sub = text === "white" ? "text-white/90" : "text-gray-800/80";
	const footerMuted = quiz.status === "coming_soon" ? "opacity-70" : "";
	
	const quizUrl = typeof window !== 'undefined' ? `${window.location.origin}/quizzes/${quiz.slug}/intro` : '';
	
	// Determine card type
	const isPlayable = quiz.status === "available" && canAccessQuiz(tier, isNewest);
	const isPremiumLocked = quiz.status === "available" && !canAccessQuiz(tier, isNewest);
	const isFreePlayable = isPlayable && !isPremium && isNewest;

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

	const handleDownloadPDF = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		// Check premium access
		if (!canAccessFeature(tier, 'pdf_downloads')) {
			setShowUpgradeModal(true);
			return;
		}

		setIsDownloadingPDF(true);
		try {
			const authToken = localStorage.getItem('authToken');
			const userId = localStorage.getItem('userId');

			if (!authToken || !userId) {
				throw new Error('Not authenticated');
			}

			const response = await fetch(`/api/quizzes/${quiz.slug}/pdf`, {
				headers: {
					Authorization: `Bearer ${authToken}`,
					'X-User-Id': userId,
				},
			});

			if (!response.ok) {
				if (response.status === 403) {
					setShowUpgradeModal(true);
					return;
				}
				throw new Error('Failed to generate PDF');
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `quiz-${quiz.slug}.pdf`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error('Error downloading PDF:', error);
			// Could show a toast notification here
		} finally {
			setIsDownloadingPDF(false);
		}
	};

	const canDownloadPDF = canAccessFeature(tier, 'pdf_downloads');

	return (
		<div
			key={`quiz-card-${quiz.id}`}
			className="h-auto sm:h-full"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<motion.div
				className={`rounded-3xl p-4 sm:p-7 md:p-9 shadow-lg h-auto sm:h-full min-h-[215px] sm:min-h-[380px] md:min-h-[430px] flex flex-col relative overflow-hidden cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 transition-shadow duration-300 ${isHovered ? (isPremiumLocked ? 'shadow-[0_0_0_1px_rgba(251,191,36,0.4),0_25px_50px_-12px_rgba(251,191,36,0.2)]' : 'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]') : ''}`}
				style={{ 
					backgroundColor: quiz.colorHex,
					viewTransitionName: `quiz-${quiz.id}`,
					transformOrigin: 'center',
					...(isPremiumLocked && {
						boxShadow: '0 0 0 1px rgba(251, 191, 36, 0.3), 0 0 20px rgba(251, 191, 36, 0.1)',
					}),
				}}
				initial={{ opacity: 0, y: 20, rotate: 0 }}
				animate={{ 
					opacity: 1, 
					y: 0, 
					rotate: isHovered ? hoverTilt : 0,
					scale: isHovered ? 1.02 : 1,
					transition: {
						type: "spring",
						stiffness: 300,
						damping: 20
					}
				}}
				whileHover={{ 
					rotate: hoverTilt,
					scale: 1.02,
					y: -4,
				}}
				whileTap={{ scale: 0.98 }}
				transition={{ 
					type: "spring",
					stiffness: 300,
					damping: 20
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
							sessionStorage.set("quizzes.scrollY", String(window.scrollY));
							sessionStorage.set("quizzes.scrollParams", window.location.search);
							sessionStorage.set("quiz.transition.id", String(quiz.id));
						} catch (err) {
							logger.warn('Failed to save scroll state', { error: err });
						}
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
								sessionStorage.set('quizzes.scrollY', String(window.scrollY));
								sessionStorage.set('quizzes.scrollParams', window.location.search);
								sessionStorage.set('quiz.transition.id', String(quiz.id));
							} catch (err) {
								logger.warn('Failed to save scroll state', { error: err });
							}
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

				<div className="flex items-center justify-between mb-2 sm:mb-4 relative z-10 gap-2 sm:gap-3">
					<div className="flex items-center gap-2 flex-nowrap">
						<motion.span
							className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold ${invert} bg-black/10 bg-clip-padding whitespace-nowrap`}
							whileHover={{ scale: 1.05 }}
							transition={{ duration: 0.2 }}
						>
							#{quiz.id}
						</motion.span>
						{completionData && (
							<motion.span
								className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${invert} relative overflow-hidden shadow-sm whitespace-nowrap`}
								style={{
									backgroundColor: text === "white" ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.15)",
									backdropFilter: "blur(8px)",
								}}
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
								whileHover={{ scale: 1.1, y: -2 }}
								title={`Completed: ${completionData.score}/${completionData.totalQuestions}`}
							>
								<Trophy className="w-3.5 h-3.5" />
								<span className="relative z-10">{completionData.score}/{completionData.totalQuestions}</span>
							</motion.span>
						)}
						{isFreePlayable && (
							<motion.span
								className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${invert} relative overflow-hidden shadow-sm whitespace-nowrap`}
								style={{
									backgroundColor: text === "white" ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.2)",
									backdropFilter: "blur(8px)",
								}}
								initial={{ opacity: 0, scale: 0.8, y: -4 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
								whileHover={{ scale: 1.1, y: -2 }}
							>
								<span className="relative z-10">Free</span>
							</motion.span>
						)}
						{isPremiumLocked && (
							<motion.span
								className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${invert} bg-black/20 bg-clip-padding whitespace-nowrap`}
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.2 }}
								title="Upgrade to Premium to access previous quizzes"
								whileHover={{ scale: 1.1 }}
							>
								<Lock className="w-3 h-3" />
								Premium
							</motion.span>
						)}
						{isNewest && !isPremiumLocked && (
							<motion.span
								className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${invert} relative overflow-hidden shadow-sm whitespace-nowrap`}
								style={{
									backgroundColor: text === "white" ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.15)",
									backdropFilter: "blur(8px)",
								}}
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
								whileHover={{ scale: 1.1, y: -2 }}
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
					<span className={`inline-flex items-center gap-2 text-base font-medium ${sub} flex-shrink-0`}>
						<Calendar className="h-5 w-5" aria-hidden />
						{formattedDate || formatWeek(quiz.weekISO)}
					</span>
				</div>
				
				<h3 className={`text-3xl sm:text-3xl md:text-4xl font-extrabold leading-tight mb-2 sm:mb-5 ${invert} relative z-10`}>
					{quiz.title}
				</h3>
				
				{/* Categories tags */}
				{quiz.tags && quiz.tags.length > 0 && (
					<motion.div
						className="flex flex-wrap gap-2 sm:gap-2.5 mb-3 sm:mb-7 relative z-10"
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
								initial={{ opacity: 0, scale: 0.8, y: 4 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								transition={{ delay: 0.1 * index, duration: 0.3 }}
								whileHover={{ scale: 1.1, y: -2 }}
							>
								{tag}
							</motion.span>
						))}
					</motion.div>
				)}
				
				<div className="mt-auto relative z-10">
					<div className={`flex items-center justify-between ${footerMuted}`}>
						<motion.button
							disabled={quiz.status === "coming_soon" || isPremiumLocked}
							className={`px-5 py-2 sm:px-6 sm:py-3 rounded-full text-base font-semibold transition whitespace-nowrap relative ${
								quiz.status === "coming_soon"
									? "bg-white/40 text-black/60 cursor-not-allowed"
									: isPremiumLocked
									? text === "white"
										? "bg-white/30 text-white/60 cursor-pointer backdrop-blur-sm"
										: "bg-gray-900/30 text-gray-900/60 cursor-pointer backdrop-blur-sm"
									: text === "white"
									? "bg-white text-gray-900 hover:bg-white/90"
									: "bg-gray-900 text-white hover:bg-gray-800"
							}`}
							whileHover={quiz.status !== "coming_soon" && !isPremiumLocked ? { scale: 1.04 } : {}}
							whileTap={quiz.status !== "coming_soon" && !isPremiumLocked ? { scale: 0.96 } : {}}
							onClick={(e) => {
								if (isPremiumLocked) {
									e.preventDefault();
									e.stopPropagation();
									setShowUpgradeModal(true);
								}
							}}
						>
							{quiz.status === "coming_soon" 
								? "Coming soon" 
								: isPremiumLocked 
								? "Play quiz" 
								: completionData
								? "Play Again"
								: mounted && hasProgress 
								? "Continue quiz" 
								: "Play quiz"}
						</motion.button>
						<div className="flex items-center gap-2">
							{/* PDF Download Button - Premium Only */}
							{canDownloadPDF && (
								<div className="relative z-[100]">
									<SimpleAnimatedTooltip content="Download PDF" position="top" offsetY={20} preventFlip>
										<motion.button
											type="button"
											aria-label="Download PDF"
											disabled={isDownloadingPDF}
											className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${
												text === "white" ? "bg-white/15 text-white hover:bg-white/25" : "bg-black/5 text-gray-900 hover:bg-black/10"
											} ${isDownloadingPDF ? "opacity-50 cursor-not-allowed" : ""}`}
											onClick={handleDownloadPDF}
											whileHover={!isDownloadingPDF ? { 
												scale: 1.1,
												transition: { type: "spring", stiffness: 400, damping: 10 }
											} : {}}
											whileTap={!isDownloadingPDF ? { scale: 0.85 } : {}}
										>
											<FileDown className={`h-6 w-6 ${isDownloadingPDF ? "animate-pulse" : ""}`} />
										</motion.button>
									</SimpleAnimatedTooltip>
								</div>
							)}
							{!canDownloadPDF && (
								<div className="relative z-[100]">
									<SimpleAnimatedTooltip content="Download PDF (Premium)" position="top" offsetY={20} preventFlip>
										<motion.div className="relative">
											<motion.button
												type="button"
												aria-label="Download PDF (Premium)"
												className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${
													text === "white" ? "bg-white/10 text-white/60 hover:bg-white/20" : "bg-black/5 text-gray-900/60 hover:bg-black/10"
												}`}
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													setShowUpgradeModal(true);
												}}
												whileHover={{ 
													scale: 1.1,
													transition: { type: "spring", stiffness: 400, damping: 10 }
												}}
												whileTap={{ scale: 0.85 }}
											>
												<FileDown className="h-6 w-6" />
											</motion.button>
											<Crown className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400" />
										</motion.div>
									</SimpleAnimatedTooltip>
								</div>
							)}
							<div className="relative z-[100]">
								<SimpleAnimatedTooltip content="Share quiz" position="top" offsetY={20} preventFlip>
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
								</SimpleAnimatedTooltip>

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
											{typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function' && (
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
				</div>
			</motion.div>
			
			{/* Upgrade Modal */}
			<UpgradeModal
				isOpen={showUpgradeModal}
				onClose={() => setShowUpgradeModal(false)}
				feature={canDownloadPDF ? "Previous Quizzes" : "PDF Downloads"}
			/>
		</div>
	);
}
