"use client";

import React, { useState, useEffect } from 'react';

export default function QuizSafariPreview() {
	const [isMobile, setIsMobile] = useState(false);
	const [isMounted, setIsMounted] = useState(false);
	
	// Check if mobile
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted) {
		return (
			<div className="w-full max-w-5xl mx-auto">
				{isMobile ? (
					<div className="relative mx-auto" style={{ width: '375px', maxWidth: '100%' }}>
						<div className="bg-black rounded-[3rem] p-2 shadow-2xl">
							<div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-50"></div>
							<div className="bg-gray-300 rounded-[2.5rem] overflow-hidden relative" style={{ height: '667px' }}>
								{/* Placeholder for video */}
							</div>
						</div>
					</div>
				) : (
					<div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden relative" style={{ height: '800px' }}>
						<div className="bg-gray-100 dark:bg-gray-700 px-6 py-4 flex items-center gap-3">
							<div className="flex gap-2">
								<div className="w-3 h-3 bg-red-400 rounded-full"></div>
								<div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
								<div className="w-3 h-3 bg-green-400 rounded-full"></div>
							</div>
							<div className="flex-1 bg-white dark:bg-gray-600 rounded-xl px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
								theschoolquiz.com.au/quiz/42
							</div>
						</div>
						<div className="relative bg-gray-300" style={{ height: 'calc(800px - 60px)' }}>
							{/* Placeholder for video */}
						</div>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="w-full max-w-5xl mx-auto">
			{isMobile ? (
				<div className="relative mx-auto" style={{ width: '375px', maxWidth: '100%' }}>
					{/* iPhone bezel */}
					<div className="bg-black rounded-[3rem] p-2 shadow-2xl">
						{/* Notch */}
						<div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-50"></div>
						{/* Screen - placeholder for video */}
						<div className="bg-gray-300 rounded-[2.5rem] overflow-hidden relative" style={{ height: '667px' }}>
							{/* Placeholder for video */}
						</div>
					</div>
				</div>
			) : (
				<div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden relative" style={{ height: '800px' }}>
					{/* Browser header */}
					<div className="bg-gray-100 dark:bg-gray-700 px-6 py-4 flex items-center gap-3">
						<div className="flex gap-2">
							<div className="w-3 h-3 bg-red-400 rounded-full"></div>
							<div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
							<div className="w-3 h-3 bg-green-400 rounded-full"></div>
						</div>
						<div className="flex-1 bg-white dark:bg-gray-600 rounded-xl px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
							theschoolquiz.com.au/quiz/42
						</div>
					</div>

					{/* Placeholder for video */}
					<div className="relative bg-gray-300" style={{ height: 'calc(800px - 60px)' }}>
						{/* Placeholder for video - will be replaced with embedded video later */}
					</div>
				</div>
			)}
		</div>
	);
}
