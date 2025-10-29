"use client";

import React from "react";
import { motion } from "framer-motion";
import { AnimatedTooltip } from "../AnimatedTooltip";

type Question = {
	question: string;
	answer: string;
};

type Props = {
	total: number;
	currentIndex: number;
	correctCount: number;
	textColor: "white" | "black";
	onSegmentClick?: (index: number) => void;
	questions?: Question[];
	baseColor?: string;
};

export default function QuizProgress({
	total,
	currentIndex,
	correctCount,
	textColor,
	onSegmentClick,
	questions,
	baseColor = "#FFE135",
}: Props) {
	if (!total || total === 0) {
		return null;
	}

	const segs = Array.from({ length: total }, (_, i) => i);
	const isDark = textColor === "white";

	// Round colors matching presenter mode and grid view
	const roundColors = [
		baseColor, // Round 1 uses quiz base color
		"#9b87f5", // Round 2 - Purple
		"#10b981", // Round 3 - Green
		"#f59e0b", // Round 4 - Amber
		"#ec4899", // Round 5 - Pink
	];

	const getRoundColor = (questionIndex: number) => {
		const roundIndex = Math.floor(questionIndex / 5); // 0-4 for 5 rounds
		return roundColors[roundIndex] || baseColor;
	};

	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 w-full pb-safe" style={{ overflow: "visible" }}>
			<div className="mx-auto flex items-center gap-4 px-6 py-4 max-w-6xl backdrop-blur-md rounded-t-3xl"
				 style={{ background: isDark ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.4)", overflow: "visible" }}>
				
				{/* Score - Large and prominent */}
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					className="px-6 py-3 rounded-full text-xl font-black shadow-xl"
					style={{
						background: isDark ? "rgba(255, 255, 255, 0.95)" : "rgba(0, 0, 0, 0.85)",
						color: isDark ? "#000" : "#fff",
					}}
				>
					Score: {correctCount}
				</motion.div>

				{/* 25-segment progress bar */}
				<div className="relative flex-1" style={{ minHeight: "12px", overflow: "visible" }}>
					{/* Background bar with overflow-hidden for visual effect */}
					<div className="absolute inset-0 h-3 rounded-full overflow-hidden shadow-inner"
						 style={{ background: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)" }}>
					</div>
					{/* Tooltip-enabled segments grid - no overflow clipping */}
					<div
						className="relative z-10 grid h-full"
						style={{ gridTemplateColumns: `repeat(${total}, 1fr)`, gap: "2px" }}
					>
					{segs.map((i) => {
						const isComplete = i < currentIndex;
						const isCurrent = i === currentIndex;
						const roundColor = getRoundColor(i);
						const question = questions?.[i];
						
						// Helper function to convert hex to rgba
						const hexToRgba = (hex: string, alpha: number) => {
							const r = parseInt(hex.slice(1, 3), 16);
							const g = parseInt(hex.slice(3, 5), 16);
							const b = parseInt(hex.slice(5, 7), 16);
							return `rgba(${r}, ${g}, ${b}, ${alpha})`;
						};
						
						// Show question preview in tooltip for all questions
						let tooltipContent = `Q${i + 1}`;
						if (question?.question) {
							const truncated = question.question.length > 40 
								? question.question.slice(0, 40) + "..." 
								: question.question;
							tooltipContent = `Q${i + 1}: ${truncated}`;
						}
						
							return (
								<div key={i} className="relative" style={{ minHeight: "12px" }}>
									<AnimatedTooltip content={tooltipContent} position="top" className="w-full h-full block">
										<button
											type="button"
											onClick={() => onSegmentClick?.(i)}
											aria-label={`Question ${i + 1} ${isComplete ? "completed" : isCurrent ? "current" : "pending"}`}
											className="w-full h-full transition-all hover:brightness-125 hover:scale-110 rounded-sm"
											style={{
												background: isComplete || isCurrent
													? hexToRgba(roundColor, 0.95)
													: hexToRgba(roundColor, 0.15),
												opacity: isCurrent ? 1 : isComplete ? 0.95 : 0.45,
												border: isCurrent ? `2px solid ${hexToRgba(roundColor, 1)}` : 'none',
												boxShadow: isCurrent ? `0 0 10px ${hexToRgba(roundColor, 0.6)}` : 'none',
												minHeight: "12px"
											}}
										/>
									</AnimatedTooltip>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}

