"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Calendar } from "lucide-react";
import { textOn } from "@/lib/contrast";

export function NextQuizTeaser({ latestQuizId = 279 }: { latestQuizId?: number }) {
	const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
	const [nextQuizDateLabel, setNextQuizDateLabel] = useState<string>("");
	const [animationKey, setAnimationKey] = useState(0);
	
	// Calculate next quiz ID (latest + 1)
	const nextQuizId = latestQuizId + 1;
	
	// Listen for theme changes to re-animate card
	useEffect(() => {
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

	useEffect(() => {
		const calculateTimeLeft = () => {
			const now = new Date();
			const nextMonday = new Date(now);

			const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
			nextMonday.setDate(now.getDate() + daysUntilMonday);
			nextMonday.setHours(7, 0, 0, 0);

			if (now.getDay() === 1 && now.getHours() >= 7) {
				nextMonday.setDate(nextMonday.getDate() + 7);
			}

			const difference = nextMonday.getTime() - now.getTime();

			if (difference > 0) {
				setTimeLeft({
					days: Math.floor(difference / (1000 * 60 * 60 * 24)),
					hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
					minutes: Math.floor((difference / 1000 / 60) % 60),
					seconds: Math.floor((difference / 1000) % 60),
				});

				setNextQuizDateLabel(
					nextMonday.toLocaleDateString(undefined, {
						year: "numeric",
						month: "short",
						day: "numeric",
					})
				);
			}
		};

		calculateTimeLeft();
		const timer = setInterval(calculateTimeLeft, 1000);

		return () => clearInterval(timer);
	}, []);

	const countdownSegments = [
		{ label: "Days", value: String(timeLeft.days) },
		{ label: "Hours", value: String(timeLeft.hours).padStart(2, "0") },
		{ label: "Minutes", value: String(timeLeft.minutes).padStart(2, "0") },
	];

	// Use a cooler grey-to-blue gradient for the countdown card
	const cardColor = "#64748B"; // slate-500 (slightly darker for better contrast)
	const text = textOn(cardColor);
	const invert = text === "white" ? "text-white" : "text-gray-900";
	const sub = text === "white" ? "text-white/90" : "text-gray-800/80";

	return (
		<motion.div
			key={`next-quiz-${animationKey}`}
			className="h-full md:-mr-2 md:ml-2"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
		>
			<motion.div
				className="rounded-3xl p-7 sm:p-9 shadow-lg h-full flex flex-col relative overflow-hidden"
				style={{ 
					background: `linear-gradient(135deg, ${cardColor} 0%, #475569 100%)`,
					viewTransitionName: `quiz-next`,
					transformOrigin: 'center',
					boxShadow: '0 0 0 1px rgba(148, 163, 184, 0.2), 0 0 30px rgba(59, 130, 246, 0.1)',
					minHeight: '430px',
				}}
				whileHover={{ 
					rotate: 0.5,
					scale: 1.02,
					y: -4,
					boxShadow: '0 0 0 1px rgba(148, 163, 184, 0.3), 0 0 40px rgba(59, 130, 246, 0.2)'
				}}
				whileTap={{ scale: 0.98 }}
				transition={{ 
					type: "spring",
					stiffness: 300,
					damping: 25
				}}
			>
				{/* Radial glow effect */}
				<motion.div
					className="absolute inset-0 pointer-events-none rounded-3xl"
					style={{
						background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
					}}
					animate={{
						opacity: [0.3, 0.5, 0.3],
					}}
					transition={{
						duration: 3,
						repeat: Infinity,
						ease: 'easeInOut',
					}}
				/>
				
				{/* Subtle gradient overlay on hover */}
				<motion.div
					className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/10 pointer-events-none rounded-3xl"
					initial={{ opacity: 0 }}
					whileHover={{ opacity: 1 }}
					transition={{ duration: 0.3 }}
				/>

				<div className="flex items-center justify-between mb-4 relative z-10 gap-3">
					<motion.span
						className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold ${invert} bg-black/10 bg-clip-padding whitespace-nowrap`}
						whileHover={{ scale: 1.05 }}
						transition={{ duration: 0.2 }}
					>
						#{nextQuizId}
					</motion.span>
					<span className={`inline-flex items-center gap-2 text-base font-medium ${sub} flex-shrink-0`}>
						<Calendar className="h-5 w-5" aria-hidden />
						{nextQuizDateLabel || "Next Monday"} · 7:00 AM
					</span>
				</div>

				<h3 className={`text-3xl sm:text-4xl font-extrabold leading-tight mb-5 ${invert} relative z-10 min-h-[4.5rem]`}>
					Your next quiz is on the way!
				</h3>

				<p className={`text-sm sm:text-base ${sub} leading-relaxed mb-8 relative z-10`}>
					We're putting together something special for you. Check back Monday morning to dive in.
				</p>

				<div className="mb-8 relative z-10" aria-live="polite">
					<div className="grid grid-cols-3 gap-2.5 mb-6">
						{countdownSegments.map((segment, index) => (
							<motion.div
								key={segment.label}
								className={`rounded-2xl border ${text === "white" ? "border-white/20 bg-white/10" : "border-black/20 bg-black/10"} px-3 py-2.5 text-center backdrop-blur-sm`}
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.1 * index, duration: 0.3 }}
								whileHover={{ scale: 1.05 }}
							>
								<motion.p 
									className={`text-2xl font-extrabold ${invert} tabular-nums`}
									key={segment.value}
									initial={{ scale: 1.2 }}
									animate={{ scale: 1 }}
									transition={{ duration: 0.3 }}
								>
									{segment.value}
								</motion.p>
								<p className={`text-[11px] font-semibold uppercase tracking-wide ${sub}`}>
									{segment.label}
								</p>
							</motion.div>
						))}
					</div>
					<motion.p 
						className={`text-sm flex items-center gap-2 ${sub}`}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.3 }}
					>
						<Lock className="h-4 w-4" aria-hidden />
						It'll be ready for you automatically
					</motion.p>
				</div>
			</motion.div>
		</motion.div>
	);
}
