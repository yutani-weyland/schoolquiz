"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RotatingTextProps {
	text: string[];
	duration?: number;
	transition?: {
		duration: number;
		ease: string | number[];
	};
	className?: string;
}

export function RotatingText({ 
	text, 
	duration = 3000,
	transition = { duration: 0.5, ease: "easeInOut" },
	className = ""
}: RotatingTextProps) {
	const [currentIndex, setCurrentIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentIndex((prevIndex) => (prevIndex + 1) % text.length);
		}, duration);

		return () => clearInterval(interval);
	}, [text.length, duration]);

	return (
		<span className={`inline-block relative ${className}`} style={{ 
			overflow: "hidden",
			verticalAlign: "bottom",
			minHeight: "1.2em",
			display: "inline-flex",
			alignItems: "center"
		}}>
			<AnimatePresence mode="wait">
				<motion.span
					key={currentIndex}
					initial={{ y: "50%", opacity: 0 }}
					animate={{ y: "0%", opacity: 1 }}
					exit={{ y: "-50%", opacity: 0 }}
					transition={{
						duration: transition.duration,
						ease: transition.ease
					}}
					className="inline-block"
					style={{
						position: "relative"
					}}
				>
					{text[currentIndex]}
				</motion.span>
			</AnimatePresence>
		</span>
	);
}

