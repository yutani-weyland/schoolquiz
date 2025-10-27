"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

type Props = {
	answerText: string;
	revealed: boolean;
	onReveal: () => void;
	onHide: () => void;
	disabled?: boolean;
	accentColor: string;
	textColor: "white" | "black";
	isMarkedCorrect?: boolean;
	onMarkCorrect?: () => void;
	onUnmarkCorrect?: () => void;
};

export default function AnswerReveal({
	answerText,
	revealed,
	onReveal,
	onHide,
	disabled,
	accentColor,
	textColor,
	isMarkedCorrect,
	onMarkCorrect,
	onUnmarkCorrect,
}: Props) {
	// One source of truth for sizes → prevents layout jank
	const HEIGHT = 64;
	const RADIUS = HEIGHT / 2;

	// Calculate inverted colors
	const buttonBg = revealed
		? textColor === "white"
			? "#0B0B0B"
			: "#FFFFFF"
		: accentColor;
	const buttonColor = revealed
		? textColor === "white"
			? "#FFFFFF"
			: "#0B0B0B"
		: textColor === "white"
		? "#FFFFFF"
		: "#0B0B0B";

	return (
		<div className="relative flex items-center justify-center gap-4" style={{ minHeight: HEIGHT }}>
			{/* Wide button that accommodates both states */}
			<motion.button
				type="button"
				disabled={disabled}
				onClick={() => {
					if (!revealed) {
						onReveal();
					} else {
						onHide();
					}
				}}
				aria-pressed={revealed}
				className="select-none focus:outline-none shadow-lg ring-1 ring-black/5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--quiz-ring)] min-w-[400px]"
				style={{
					borderRadius: RADIUS,
					height: HEIGHT,
					paddingInline: 40,
					background: buttonBg,
					color: buttonColor,
				}}
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
			>
				<AnimatePresence mode="wait">
					<motion.span
						key={revealed ? "answer" : "cta"}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1, transition: { duration: 0.2 } }}
						exit={{ opacity: 0, transition: { duration: 0.15 } }}
						className="text-2xl md:text-3xl font-bold tracking-tight"
					>
						{revealed ? answerText : "Reveal answer"}
					</motion.span>
				</AnimatePresence>
			</motion.button>

			{/* Circular check badge appears AFTER reveal */}
			<AnimatePresence>
				{revealed && (
					<motion.button
						type="button"
						initial={{ scale: 0.6, opacity: 0, filter: "blur(8px)" }}
						animate={{
							scale: 1,
							opacity: 1,
							filter: "blur(0px)",
							transition: { type: "spring", stiffness: 420, damping: 30 },
						}}
						exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.12 } }}
						onClick={() => {
							if (isMarkedCorrect) {
								onUnmarkCorrect?.();
							} else {
								onMarkCorrect?.();
							}
						}}
						className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--quiz-ring)] rounded-full"
					>
						<motion.div
							className="grid place-items-center cursor-pointer"
							style={{
								width: HEIGHT,
								height: HEIGHT,
								borderRadius: "9999px",
								background: isMarkedCorrect
									? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
									: textColor === "white"
									? "#0B0B0B"
									: "#FFFFFF",
								color: textColor === "white" ? "#FFFFFF" : "#0B0B0B",
								boxShadow: isMarkedCorrect
									? "0 4px 14px rgba(16,185,129,0.4), inset 0 0 0 3px #10b981"
									: "0 4px 14px rgba(0,0,0,0.3), inset 0 0 0 3px #3B6CFF",
							}}
							whileHover={{ scale: 1.08 }}
							whileTap={{ scale: 0.92 }}
							aria-label={isMarkedCorrect ? "Mark as incorrect" : "Mark as correct"}
						>
							<AnimatePresence mode="wait">
								{isMarkedCorrect ? (
									<motion.div
										key="check"
										initial={{ scale: 0, rotate: -180 }}
										animate={{ scale: 1, rotate: 0 }}
										exit={{ scale: 0, rotate: 180 }}
										transition={{ type: "spring", bounce: 0.6, duration: 0.6 }}
									>
										<Check className="w-7 h-7 text-white" strokeWidth={4} aria-hidden="true" />
									</motion.div>
								) : (
									<motion.div
										key="question"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										className="text-2xl font-bold"
										style={{ color: textColor === "white" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.4)" }}
									>
										?
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					</motion.button>
				)}
			</AnimatePresence>
		</div>
	);
}

