"use client";

import React from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
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
	// Fixed width, but flexible height for 2 lines
	const MIN_HEIGHT = 72;
	const WIDTH = 600;
	const RADIUS = MIN_HEIGHT / 2;
	const CIRCLE_SIZE = 80; // Bigger circle for tick

	// ALWAYS BLACK BUTTON with WHITE TEXT - simple as that!
	const buttonBg = "#0B0B0B";
	const buttonColor = "#FFFFFF";

	return (
		<LayoutGroup>
			<div className="relative flex items-center justify-center gap-4" style={{ minHeight: MIN_HEIGHT }}>
				{/* Button that smoothly narrows when circle appears */}
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
					className="select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 overflow-hidden"
					animate={{
						width: revealed ? WIDTH - CIRCLE_SIZE - 32 : WIDTH, // Narrow when circle appears
						transition: { 
							type: "spring", 
							stiffness: 300, 
							damping: 30,
							duration: 0.5
						}
					}}
					style={{
						borderRadius: RADIUS,
						minHeight: MIN_HEIGHT,
						maxWidth: '90vw',
						paddingInline: 40,
						paddingBlock: 20,
						background: buttonBg,
						color: buttonColor,
						boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)",
					}}
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
				>
					<AnimatePresence mode="wait">
						<motion.div
							key={revealed ? "answer" : "cta"}
							initial={{ opacity: 0, y: 5 }}
							animate={{ 
								opacity: 1, 
								y: 0,
								transition: { 
									duration: 0.35,
									ease: [0.22, 1, 0.36, 1]
								}
							}}
							exit={{ 
								opacity: 0, 
								y: -5,
								transition: { 
									duration: 0.25,
									ease: [0.22, 1, 0.36, 1]
								}
							}}
							className="text-2xl font-extrabold tracking-tight px-2 text-center"
							style={{
								lineHeight: '1.4',
								maxHeight: '4em',
								overflow: 'hidden',
								display: '-webkit-box',
								WebkitLineClamp: 2,
								WebkitBoxOrient: 'vertical',
							}}
						>
							{revealed ? answerText : "Reveal answer"}
						</motion.div>
					</AnimatePresence>
				</motion.button>

			{/* Circular check badge - slides in smoothly */}
			<AnimatePresence>
				{revealed && (
					<motion.button
						type="button"
						initial={{ 
							x: -20,
							scale: 0.8, 
							opacity: 0,
						}}
						animate={{
							x: 0,
							scale: 1,
							opacity: 1,
							transition: { 
								type: "spring", 
								stiffness: 300, 
								damping: 30,
								delay: 0.1
							},
						}}
						exit={{ 
							x: -20,
							scale: 0.8, 
							opacity: 0,
							transition: { 
								duration: 0.3,
								ease: [0.22, 1, 0.36, 1]
							}
						}}
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
						className="grid place-items-center cursor-pointer relative focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
						style={{
							width: CIRCLE_SIZE,
							height: CIRCLE_SIZE,
							borderRadius: "9999px",
							background: isMarkedCorrect ? "#0B0B0B" : "transparent",
							border: isMarkedCorrect 
								? "2px solid #0B0B0B"
								: "2px solid rgba(255, 255, 255, 0.5)",
							boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)",
						}}
						whileHover={{ scale: 1.08 }}
						whileTap={{ scale: 0.92 }}
						aria-label={isMarkedCorrect ? "Mark as incorrect" : "Mark as correct"}
					>
							<AnimatePresence mode="wait">
								{isMarkedCorrect && (
									<motion.div
										key="check"
										initial={{ scale: 0, rotate: -180 }}
										animate={{ scale: 1, rotate: 0 }}
										exit={{ scale: 0, rotate: 180 }}
										transition={{ type: "spring", bounce: 0.6, duration: 0.6 }}
									>
										<Check className="w-10 h-10 text-white" strokeWidth={3.5} aria-hidden="true" />
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					</motion.button>
				)}
			</AnimatePresence>
		</div>
		</LayoutGroup>
	);
}

