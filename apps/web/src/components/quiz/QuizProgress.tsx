"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

type Round = {
	label: string;
	count: number;
};

type Props = {
	total: number;
	currentIndex: number;
	rounds?: Round[];
	timeText?: string;
	correctCount: number;
	textColor: "white" | "black";
	onSegmentClick?: (index: number) => void;
};

export default function QuizProgress({
	total,
	currentIndex,
	rounds,
	timeText,
	correctCount,
	textColor,
	onSegmentClick,
}: Props) {
	if (!total || total === 0) {
		return null;
	}

	const pct = ((currentIndex + 1) / total) * 100;
	const segs = Array.from({ length: total }, (_, i) => i);

	const isDark = textColor === "white";

	return (
		<div className="sticky top-0 z-50 w-full">
			<div className="mx-auto mt-4 flex items-center gap-3 px-6 max-w-6xl">
				{/* Timer pill */}
				{timeText && (
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						className="px-4 py-2 h-10 rounded-full grid place-items-center text-sm font-bold shadow-lg backdrop-blur-sm flex items-center gap-2"
						style={{
							background: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
							color: textColor,
						}}
						aria-live="polite"
					>
						<Clock className="h-4 w-4" />
						{timeText}
					</motion.div>
				)}

				{/* Segmented bar */}
				<div className="relative flex-1 h-5 rounded-full overflow-hidden backdrop-blur-sm shadow-lg"
					 style={{ background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)" }}>
					{/* Progress glow */}
					<motion.div
						className="absolute inset-y-0 left-0 z-0"
						style={{
							background: isDark
								? "linear-gradient(90deg, rgba(99,102,241,.3), rgba(168,85,247,.3))"
								: "linear-gradient(90deg, rgba(59,130,246,.25), rgba(147,51,234,.25))",
						}}
						initial={{ width: 0 }}
						animate={{ width: `${pct}%` }}
						transition={{ type: "spring", stiffness: 160, damping: 24 }}
					/>
					{/* Ticks */}
					<div
						className="relative z-10 grid h-full"
						style={{ gridTemplateColumns: `repeat(${total}, 1fr)`, gap: "1px" }}
					>
						{segs.map((i) => {
							const isComplete = i < currentIndex;
							const isCurrent = i === currentIndex;
							return (
								<button
									key={i}
									type="button"
									onClick={() => onSegmentClick?.(i)}
									aria-label={`Question ${i + 1} ${isComplete ? "completed" : isCurrent ? "current" : "pending"}`}
									className="h-full transition-all hover:brightness-110"
									style={{
										background: isComplete
											? isDark
												? "rgba(99, 102, 241, 0.5)"
												: "rgba(59, 130, 246, 0.4)"
											: isCurrent
											? isDark
												? "rgba(255, 255, 255, 0.6)"
												: "rgba(0, 0, 0, 0.3)"
											: "transparent",
									}}
								/>
							);
						})}
					</div>
				</div>

				{/* Score pill */}
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					className="px-4 py-2 h-10 rounded-full grid place-items-center text-sm font-bold shadow-lg backdrop-blur-sm"
					style={{
						background: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
						color: textColor,
					}}
				>
					{correctCount} / {total}
				</motion.div>
			</div>

			{/* Round labels under bar */}
			{rounds && rounds.length > 0 && (
				<div className="mx-auto px-6 mt-2 max-w-6xl flex gap-2 text-[11px] uppercase tracking-wide font-bold"
					 style={{ color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.4)" }}>
					{rounds.map((r, i) => (
						<div key={i} className="flex-1 text-center">
							{r.label}
						</div>
					))}
				</div>
			)}
		</div>
	);
}

