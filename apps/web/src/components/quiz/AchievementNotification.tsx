"use client";

import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Achievement {
	id: string;
	name: string;
	description: string;
	icon: string;
	iconColor: string;
	rarity: number; // Percentage of players who have this (0-100)
	unlockedAt?: Date;
	artworkSrc?: string;
	artworkAlt?: string;
}

interface AchievementNotificationProps {
	achievement: Achievement;
	onDismiss: () => void;
	textColor: "white" | "black";
	durationMs?: number;
}

export function AchievementNotification({
	achievement,
	onDismiss,
	textColor,
	durationMs = 6000,
}: AchievementNotificationProps) {
	return (
		<motion.figure
			initial={{ opacity: 0, scale: 0.9, y: -10 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.9, y: -10 }}
			transition={{
				type: "spring",
				stiffness: 300,
				damping: 30,
			}}
			className={cn(
				"relative mx-auto w-full max-w-[380px] overflow-hidden rounded-2xl p-4",
				"transition-all duration-200 ease-in-out",
				"shadow-xl",
				textColor === "white"
					? "bg-white backdrop-blur-md border border-gray-200/50"
					: "bg-gray-900 backdrop-blur-md border border-gray-700/50"
			)}
		>
			{/* Dismiss button */}
			<button
				onClick={(e) => {
					e.stopPropagation();
					onDismiss();
				}}
				className={cn(
					"absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 z-10",
					"hover:scale-110",
					textColor === "white"
						? "bg-gray-200/80 hover:bg-gray-300/90 text-gray-700"
						: "bg-gray-700/80 hover:bg-gray-600/90 text-gray-200"
				)}
				aria-label="Dismiss achievement"
			>
				<X className="w-3.5 h-3.5" />
			</button>

			<div className="flex flex-row items-start gap-3.5 pr-7">
				{/* Icon / Artwork */}
				<div
					className={cn(
						"flex h-16 w-16 items-center justify-center flex-shrink-0 overflow-hidden",
						achievement.artworkSrc
							? "rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
							: "rounded-xl shadow-md border border-black/5 dark:border-white/10 bg-white"
					)}
					style={{
						background: achievement.artworkSrc ? undefined : achievement.iconColor,
					}}
					aria-hidden={achievement.artworkSrc ? undefined : true}
				>
					{achievement.artworkSrc ? (
						<img
							src={achievement.artworkSrc}
							alt={achievement.artworkAlt ?? `${achievement.name} badge artwork`}
							className="h-full w-full object-cover"
							loading="lazy"
						/>
					) : (
						<span className="text-3xl drop-shadow-sm" role="img" aria-label={achievement.name}>
							{achievement.icon}
						</span>
					)}
				</div>

				<div className="flex flex-col overflow-hidden flex-1 min-w-0 gap-1">
					{/* Title row */}
					<div className="flex flex-row items-center gap-2 flex-wrap">
						<span className={cn(
							"text-base font-bold",
							textColor === "white" ? "text-gray-900" : "text-white"
						)}>
							{achievement.name}
						</span>
						<span className={cn(
							"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
							textColor === "white"
								? "bg-gray-100 text-gray-700"
								: "bg-gray-800 text-gray-200"
						)}>
							{achievement.rarity}% have this
						</span>
					</div>
					
					{/* Description */}
					<p className={cn(
						"text-sm leading-relaxed",
						textColor === "white" ? "text-gray-700" : "text-gray-300"
					)}>
						{achievement.description}
					</p>
					
					{/* Timestamp */}
					{achievement.unlockedAt && (
						<p className={cn(
							"text-xs mt-0.5",
							textColor === "white" ? "text-gray-500" : "text-gray-500"
						)}>
							{achievement.unlockedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} {achievement.unlockedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
						</p>
					)}
				</div>
			</div>
			
			{/* Lifespan progress bar */}
			<div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/5">
				<motion.div
					className="h-full rounded-full"
					style={{
						backgroundColor: textColor === "white" ? "#111827" : "#F3F4F6",
					}}
					initial={{ width: "0%" }}
					animate={{ width: "100%" }}
					transition={{ duration: durationMs / 1000, ease: "linear" }}
				/>
			</div>
		</motion.figure>
	);
}

