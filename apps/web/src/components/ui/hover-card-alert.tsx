"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface AverageScoreData {
	quizAverage?: number;
	userScore?: number;
	percentile?: number;
	privateLeagueAverage?: number;
	leagueName?: string;
	time?: number;
}

interface HoverCardAlertProps {
	averageScoreData: AverageScoreData;
	isOpen?: boolean;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	triggerRef?: React.RefObject<HTMLDivElement>;
	cursorPosition?: { x: number; y: number };
}

// Circular Progress Component (shared version)
function CircularProgress({
	value,
	size = 100,
	strokeWidth = 10,
	isDark = false,
	accentColor,
	total = 25,
}: {
	value: number;
	size?: number;
	strokeWidth?: number;
	isDark?: boolean;
	accentColor?: string;
	total?: number;
}) {
	const radius = size / 2 - strokeWidth;
	const circumference = Math.ceil(2 * Math.PI * radius);
	const progressPercentage = total ? (value / total) * 100 : value;
	const strokeDashoffset = circumference - (circumference * (progressPercentage / 100));
	const viewBox = `-${size * 0.125} -${size * 0.125} ${size * 1.25} ${size * 1.25}`;

	return (
		<div className="relative" style={{ width: size, height: size }}>
			<svg
				width={size}
				height={size}
				viewBox={viewBox}
				version="1.1"
				xmlns="http://www.w3.org/2000/svg"
				style={{ transform: "rotate(-90deg)" }}
				className="absolute inset-0"
			>
				{/* Base Circle */}
				<circle
					r={radius}
					cx={size / 2}
					cy={size / 2}
					fill="transparent"
					strokeWidth={strokeWidth}
					strokeDasharray={circumference}
					strokeDashoffset="0"
					className={isDark ? "stroke-white/20" : "stroke-gray-200"}
					style={{ transition: "stroke 700ms ease-in-out" }}
				/>

				{/* Progress */}
				<circle
					r={radius}
					cx={size / 2}
					cy={size / 2}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeDashoffset={strokeDashoffset}
					fill="transparent"
					strokeDasharray={circumference}
					style={{ 
						stroke: accentColor || (isDark ? "#fff" : "#000"),
						transition: "stroke-dashoffset 0.6s ease" 
					}}
				/>
			</svg>
			{/* Score Display - Centered number only */}
			<div 
				className="absolute inset-0 pointer-events-none flex items-center justify-center transition-colors duration-700 ease-in-out tracking-tight"
				style={{
					fontFamily: 'var(--app-font), system-ui, sans-serif',
					color: isDark ? "#fff" : "#000"
				}}
			>
				<span 
					className="font-bold tracking-tight transition-colors duration-700 ease-in-out"
					style={{
						fontSize: size * 0.34,
						fontWeight: 700,
						lineHeight: 0.85
					}}
				>
					{Math.round(value)}
				</span>
			</div>
		</div>
	);
}

export function HoverCardAlert({ averageScoreData, isOpen: externalIsOpen, onMouseEnter, onMouseLeave, triggerRef, cursorPosition }: HoverCardAlertProps) {
	const [internalIsOpen, setInternalIsOpen] = React.useState(false);
	const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
	const { quizAverage, userScore, percentile, privateLeagueAverage, leagueName } = averageScoreData;

	// Calculate percentile text
	const getPercentileText = (percentile?: number) => {
		if (percentile === undefined) return null;
		if (percentile >= 90) return "Top 10%";
		if (percentile >= 75) return "Top 25%";
		if (percentile >= 50) return "Top 50%";
		return `${100 - percentile}th percentile`;
	};

	// Calculate position relative to cursor
	const [position, setPosition] = React.useState({ top: 0, left: 0 });
	
	const updatePosition = React.useCallback(() => {
		if (cursorPosition && cursorPosition.x > 0 && cursorPosition.y > 0) {
			// Position tooltip directly over cursor with minimal offset
			setPosition({
				top: cursorPosition.y + 10,
				left: cursorPosition.x
			});
		} else if (triggerRef?.current) {
			// Fallback to center of trigger if no cursor data
			const rect = triggerRef.current.getBoundingClientRect();
			setPosition({
				top: rect.bottom + 8,
				left: rect.left + rect.width / 2
			});
		}
	}, [triggerRef, cursorPosition]);
	
	React.useEffect(() => {
		if (isOpen) {
			updatePosition();
			window.addEventListener('scroll', updatePosition, true);
			window.addEventListener('resize', updatePosition);
			return () => {
				window.removeEventListener('scroll', updatePosition, true);
				window.removeEventListener('resize', updatePosition);
			};
		}
	}, [isOpen, updatePosition, cursorPosition]);

	return (
		<>
			<AnimatePresence>
				{isOpen && quizAverage !== undefined && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: -5 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: -5 }}
						transition={{ duration: 0.2 }}
						className="fixed z-50 w-80 rounded-2xl p-6 shadow-2xl border pointer-events-auto"
						style={{
							backgroundColor: '#000000',
							borderColor: 'rgba(255, 255, 255, 0.2)',
							top: `${position.top}px`,
							left: `${position.left}px`,
							transform: (() => {
								const tooltipWidth = 320; // w-80 = 320px
								if (position.left + tooltipWidth > window.innerWidth) {
									return 'translateX(-100%)'; // Right edge - align right
								} else if (position.left < tooltipWidth) {
									return 'translateX(0)'; // Left edge - align left
								}
								return 'translateX(-50%)'; // Center on cursor
							})()
						}}
						onMouseEnter={() => {
							if (externalIsOpen === undefined) setInternalIsOpen(true);
							onMouseEnter?.();
						}}
						onMouseLeave={() => {
							if (externalIsOpen === undefined) setInternalIsOpen(false);
							onMouseLeave?.();
						}}
					>
						{/* Metric Label */}
						<div className="text-sm font-medium text-white/70 mb-2">
							Average score (all subscribers)
						</div>

						{/* Main Content - Large Value with CircularProgress */}
						<div className="flex items-center justify-between mb-3">
							{/* Large Score Number */}
							<div className="flex-1">
								<div className="text-4xl font-bold text-white mb-1">
									{quizAverage.toFixed(1)}
								</div>
								<div className="text-sm text-white/60">
									out of 25
								</div>
							</div>

							{/* CircularProgress Component */}
							<div className="flex-shrink-0">
								<CircularProgress 
									value={quizAverage} 
									size={80} 
									strokeWidth={6} 
									isDark={true}
									accentColor="#FFE135"
									total={25}
								/>
							</div>
						</div>

						{/* Percentile Indicator */}
						{percentile !== undefined && (
							<div className="flex items-center gap-2 text-sm text-white/70 pt-2 border-t border-white/20 mb-2">
								<TrendingUp className="w-4 h-4 text-yellow-400" />
								<span>
									You&apos;re in the <span className="font-semibold text-white">{getPercentileText(percentile)}</span>
									{userScore !== undefined && (
										<span className="text-white/60"> ({userScore} points)</span>
									)}
								</span>
							</div>
						)}

						{/* Time Display */}
						{averageScoreData.time !== undefined && (
							<div className="pt-2 border-t border-white/20">
								<div className="text-xs font-medium text-white/60 mb-1">Time</div>
								<div className="text-lg font-mono font-semibold text-white">
									{(() => {
										const totalSeconds = averageScoreData.time || 0;
										const mins = Math.floor(totalSeconds / 60);
										const secs = totalSeconds % 60;
										return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
									})()}
								</div>
							</div>
						)}

						{/* Private League Average (if available) */}
						{privateLeagueAverage !== undefined && leagueName && (
							<div className="mt-4 pt-4 border-t border-white/20">
								<div className="text-xs font-medium text-white/60 mb-2">{leagueName}</div>
								<div className="flex items-center justify-between">
									<div>
										<div className="text-2xl font-bold text-yellow-400">
											{privateLeagueAverage.toFixed(1)}
										</div>
										<div className="text-xs text-white/60">
											league average
										</div>
									</div>
									<div className="flex-shrink-0">
										<CircularProgress 
											value={privateLeagueAverage} 
											size={60} 
											strokeWidth={5} 
											isDark={true}
											accentColor="#FFE135"
											total={25}
										/>
									</div>
								</div>
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}

