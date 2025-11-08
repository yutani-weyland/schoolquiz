"use client";

import React from "react";
import { motion } from "framer-motion";

interface SubmissionAttributionProps {
	submittedBy?: string;
	displayStyle?: 'full' | 'first_name' | 'anonymous';
}

export function SubmissionAttribution({ submittedBy, displayStyle = 'full' }: SubmissionAttributionProps) {
	if (!submittedBy) return null;

	// Format attribution text based on display style
	const getAttributionText = (): string => {
		switch (displayStyle) {
			case 'anonymous':
				return "submitted by a community member";
			case 'first_name':
				const firstName = submittedBy.split(' ')[0];
				return `submitted by ${firstName}`;
			case 'full':
			default:
				return `submitted by ${submittedBy}`;
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ 
				opacity: [0, 0.6, 0.6, 0],
				y: [20, -20, -40, -60]
			}}
			transition={{ 
				duration: 3,
				times: [0, 0.2, 0.8, 1],
				ease: "easeOut"
			}}
			className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
		>
			<span className="text-xs opacity-60 italic text-gray-600 dark:text-gray-400">
				{getAttributionText()}
			</span>
		</motion.div>
	);
}

