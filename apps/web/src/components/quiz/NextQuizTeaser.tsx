"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Calendar } from "lucide-react";

const CATEGORY_VOTE_URL = "/vote";

export function NextQuizTeaser() {
	const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
	const [nextQuizDateLabel, setNextQuizDateLabel] = useState<string>("");

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

	return (
		<motion.div
			className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 rounded-3xl group"
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-50px" }}
			transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
		>
			<motion.div
				className="rounded-3xl p-7 sm:p-9 shadow-md h-full min-h-[430px] flex flex-col relative overflow-hidden bg-gray-50 dark:bg-[#1A1F2E] border border-dashed border-gray-300 dark:border-[#2D3748]"
				whileHover={{
					rotate: 0.8,
					scale: 1.01,
					boxShadow: "0 18px 36px -14px rgba(15, 23, 42, 0.18)",
				}}
				transition={{
					type: "spring",
					stiffness: 280,
					damping: 26,
				}}
			>
				<div className="absolute inset-0 opacity-[0.08] dark:opacity-[0.14]" style={{
					backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.35\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
				}} />

				<div className="flex items-start justify-between mb-5 relative z-10">
					<motion.span
						className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold text-blue-700 bg-blue-50/90 dark:text-blue-200 dark:bg-blue-500/20"
						whileHover={{ scale: 1.05 }}
					>
						Next week's quiz
					</motion.span>
					<span className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
						<Calendar className="h-4 w-4" aria-hidden />
						{nextQuizDateLabel || "Next Monday"} · 7:00 AM
					</span>
				</div>

				<h3 className="text-2xl sm:text-3xl font-bold leading-tight mb-3 text-gray-900 dark:text-white relative z-10">
					Next quiz unlocks soon
				</h3>

				<p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-5 relative z-10">
					Come back Monday morning to grab the freshest questions. While you wait, help shape the line-up.
				</p>

				<div className="mb-5 relative z-10" aria-live="polite">
					<div className="grid grid-cols-3 gap-2.5">
						{countdownSegments.map((segment) => (
							<div
								key={segment.label}
								className="rounded-2xl border border-gray-200/80 dark:border-[#2D3748]/70 bg-white dark:bg-white/5 px-3 py-2.5 text-center"
							>
								<p className="text-2xl font-extrabold text-gray-900 dark:text-white tabular-nums">
									{segment.value}
								</p>
								<p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
									{segment.label}
								</p>
							</div>
						))}
					</div>
					<p className="mt-3 text-sm flex items-center gap-2 text-gray-500 dark:text-gray-400">
						<Lock className="h-4 w-4" aria-hidden />
						Unlocks automatically when the quiz drops
					</p>
				</div>

				<motion.div
					className="flex flex-wrap gap-2.5 mb-6 relative z-10"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.15, duration: 0.4 }}
				>
					{["???", "???", "???", "???", "???"].map((tag, index) => (
						<motion.span
							key={`${tag}-${index}`}
							className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-200/80 text-gray-600 dark:bg-[#252B3A]/80 dark:text-gray-200"
							initial={{ opacity: 0, scale: 0.85 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: 0.08 * index, duration: 0.25 }}
							whileHover={{ scale: 1.05 }}
						>
							{tag}
						</motion.span>
					))}
				</motion.div>

				<div className="mt-auto relative z-10">
					<motion.a
						href={CATEGORY_VOTE_URL}
						className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-blue-700 border border-blue-200 bg-white hover:border-blue-400 hover:bg-blue-50 dark:text-blue-200 dark:border-blue-500/50 dark:bg-transparent dark:hover:bg-blue-500/10 transition"
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.97 }}
					>
						<span role="img" aria-label="ballot box">🗳️</span>
						<span>Vote on the next category</span>
					</motion.a>

					<div className="mt-4 h-9" />
				</div>
			</motion.div>
		</motion.div>
	);
}

