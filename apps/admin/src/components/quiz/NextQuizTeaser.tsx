"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Calendar } from "lucide-react";
import { textOn } from "@/lib/contrast";

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

	// Use a neutral blue-gray color similar to quiz cards
	const cardColor = "#94A3B8"; // slate-400
	const text = textOn(cardColor);
	const invert = text === "white" ? "text-white" : "text-gray-900";
	const sub = text === "white" ? "text-white/90" : "text-gray-800/80";

	return (
		<motion.div
			className="h-full"
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-50px" }}
			transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
		>
			<motion.div
				className="rounded-3xl p-7 sm:p-9 shadow-lg h-full min-h-[430px] flex flex-col relative overflow-hidden"
				style={{ 
					backgroundColor: cardColor,
					viewTransitionName: `quiz-next`,
					transformOrigin: 'center',
				}}
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
			>
				{/* Subtle gradient overlay on hover */}
				<motion.div
					className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/10 pointer-events-none rounded-3xl"
					initial={{ opacity: 0 }}
					whileHover={{ opacity: 1 }}
					transition={{ duration: 0.3 }}
				/>

				<div className="flex items-start justify-between mb-4 relative z-10">
					<motion.span
						className={`inline-flex items-center px-4 py-2 rounded-full text-base font-bold ${invert} bg-black/10 bg-clip-padding`}
						whileHover={{ scale: 1.05 }}
						transition={{ duration: 0.2 }}
					>
						Next week's quiz
					</motion.span>
					<span className={`inline-flex items-center gap-2 text-base font-medium ${sub}`}>
						<Calendar className="h-5 w-5" aria-hidden />
						{nextQuizDateLabel || "Next Monday"} · 7:00 AM
					</span>
				</div>

				<h3 className={`text-3xl sm:text-4xl font-extrabold leading-tight mb-5 ${invert} relative z-10 min-h-[4.5rem]`}>
					Next quiz unlocks soon
				</h3>

				<p className={`text-sm sm:text-base ${sub} leading-relaxed mb-5 relative z-10`}>
					Come back Monday morning to grab the freshest questions.
				</p>

				<div className="mb-7 relative z-10" aria-live="polite">
					<div className="grid grid-cols-3 gap-2.5 mb-4">
						{countdownSegments.map((segment) => (
							<div
								key={segment.label}
								className={`rounded-2xl border ${text === "white" ? "border-white/20 bg-white/10" : "border-black/20 bg-black/10"} px-3 py-2.5 text-center backdrop-blur-sm`}
							>
								<p className={`text-2xl font-extrabold ${invert} tabular-nums`}>
									{segment.value}
								</p>
								<p className={`text-[11px] font-semibold uppercase tracking-wide ${sub}`}>
									{segment.label}
								</p>
							</div>
						))}
					</div>
					<p className={`text-sm flex items-center gap-2 ${sub}`}>
						<Lock className="h-4 w-4" aria-hidden />
						Unlocks automatically when the quiz drops
					</p>
				</div>

				{/* Categories tags */}
				<motion.div
					className="flex flex-wrap gap-2.5 mb-7 relative z-10"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2, duration: 0.4 }}
				>
					{["???", "???", "???", "???", "???"].map((tag, index) => (
						<motion.span
							key={`${tag}-${index}`}
							className={`px-3 py-1.5 rounded-full text-xs font-semibold ${text === "white" ? "bg-white/20 text-white" : "bg-black/20 text-gray-900"} backdrop-blur-sm`}
							initial={{ opacity: 0, scale: 0.85 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: 0.08 * index, duration: 0.25 }}
							whileHover={{ scale: 1.05 }}
						>
							{tag}
						</motion.span>
					))}
				</motion.div>
			</motion.div>
		</motion.div>
	);
}

