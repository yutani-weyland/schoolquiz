"use client";

import { useEffect, useState, ReactNode, Children, isValidElement } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function AnimatedList({ children, delay = 1000 }: { children: ReactNode | ReactNode[]; delay?: number }) {
	const [currentIndex, setCurrentIndex] = useState(0);
	
	// Convert children to array
	const childrenArray = Children.toArray(children);
	const childrenCount = childrenArray.length;

	useEffect(() => {
		if (currentIndex < childrenCount - 1) {
			const timeout = setTimeout(() => {
				setCurrentIndex(prev => prev + 1);
			}, delay);

			return () => clearTimeout(timeout);
		}
	}, [currentIndex, childrenCount, delay]);

	// Reset when children change (but not on every render)
	useEffect(() => {
		setCurrentIndex(0);
	}, [childrenCount]);

	return (
		<div className="relative flex flex-col gap-2">
			<AnimatePresence mode="popLayout">
				{childrenArray.slice(0, currentIndex + 1).map((child, index) => {
					const key = isValidElement(child) && child.key ? child.key : index;
					return (
						<motion.div
							key={key}
							initial={{ opacity: 0, y: 20, scale: 0.9 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, scale: 0.9, y: -20 }}
							transition={{
								type: "spring",
								stiffness: 300,
								damping: 30,
							}}
						>
							{child}
						</motion.div>
					);
				})}
			</AnimatePresence>
		</div>
	);
}

