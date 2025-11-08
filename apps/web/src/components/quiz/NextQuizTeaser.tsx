"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Calendar } from "lucide-react";

export function NextQuizTeaser() {
	const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
	const [showVoteTooltip, setShowVoteTooltip] = useState(false);

	useEffect(() => {
		const calculateTimeLeft = () => {
			const now = new Date();
			const nextMonday = new Date(now);
			
			// Find next Monday
			const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
			nextMonday.setDate(now.getDate() + daysUntilMonday);
			nextMonday.setHours(7, 0, 0, 0);
			
			// If it's Monday but past 7am, go to next Monday
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
			}
		};

		calculateTimeLeft();
		const timer = setInterval(calculateTimeLeft, 1000);

		return () => clearInterval(timer);
	}, []);

	return (
		<motion.div
			className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 rounded-3xl group"
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-50px" }}
			transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
		>
			<motion.div
				className="rounded-3xl p-6 sm:p-8 shadow-lg h-full min-h-[420px] flex flex-col relative overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600"
				whileHover={{ 
					rotate: 1.4,
					scale: 1.02, 
					boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
				}}
				transition={{ 
					type: "spring",
					stiffness: 300,
					damping: 25
				}}
			>
				{/* Subtle pattern background */}
				<div className="absolute inset-0 opacity-5 dark:opacity-10" style={{
					backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
				}} />

				<div className="flex items-start justify-between mb-4 relative z-10">
					<motion.span
						className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700"
					>
						Coming Monday
					</motion.span>
					<span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400">
						<Calendar className="h-4 w-4" aria-hidden />
						7:00 AM
					</span>
				</div>

				<h3 className="text-xl sm:text-2xl font-extrabold leading-tight mb-4 text-gray-900 dark:text-white min-h-[4rem] relative z-10">
					Next Week's Quiz
				</h3>

				{/* Countdown Timer - Matches quiz card layout */}
				<div className="mb-4 relative z-10">
					<div className="py-4">
						<div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tabular-nums mb-2">
							{timeLeft.days}d {String(timeLeft.hours).padStart(2, "0")}h {String(timeLeft.minutes).padStart(2, "0")}m
						</div>
						<div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
							<Lock className="h-4 w-4" />
							Until next quiz
						</div>
					</div>
				</div>

				{/* Mystery tags */}
				<motion.div
					className="flex flex-wrap gap-2 mb-6 relative z-10"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2, duration: 0.4 }}
				>
					{["???", "???", "???", "???", "???"].map((tag, index) => (
						<div key={index} className="relative">
							<motion.span
								className={`px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-help ${
									index === 2 ? "ring-1 ring-gray-300 dark:ring-gray-600" : ""
								}`}
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.3 + 0.1 * index, duration: 0.3 }}
								whileHover={index === 2 ? { scale: 1.05 } : {}}
								onMouseEnter={() => index === 2 && setShowVoteTooltip(true)}
								onMouseLeave={() => index === 2 && setShowVoteTooltip(false)}
							>
								{tag}
							</motion.span>
							
							{/* Tooltip for voting hint */}
							{index === 2 && showVoteTooltip && (
								<motion.div
									initial={{ opacity: 0, y: -5 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -5 }}
									className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium rounded-lg shadow-lg whitespace-nowrap z-50"
								>
									You vote on this! 🗳️
									<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 dark:bg-white rotate-45" />
								</motion.div>
							)}
						</div>
					))}
				</motion.div>

				<div className="mt-auto relative z-10">
					<div className="flex items-center justify-between">
						<button
							disabled
							className="px-6 py-2.5 rounded-full text-base font-semibold bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
						>
							Not yet available
						</button>
						<div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500">
							<Lock className="h-5 w-5" />
						</div>
					</div>
				</div>
			</motion.div>
		</motion.div>
	);
}

