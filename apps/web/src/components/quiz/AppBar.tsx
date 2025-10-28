"use client";

import React from "react";
import { Timer } from "./Timer";
import { ChevronLeft, Clock, EyeOff } from "lucide-react";

export function AppBar({
	title,
	score,
	outOf,
	showTimer,
	onToggleTimer,
	startedAt,
	onExit,
}: {
	title: string;
	score: number;
	outOf: number;
	showTimer: boolean;
	onToggleTimer: () => void;
	startedAt: number;
	onExit: () => void;
}) {
	return (
		<header className="container py-[var(--space-2)] flex items-center justify-between gap-3">
			<div className="flex items-center gap-2">
				<button
					onClick={onExit}
					className="icon-btn rounded-full bg-black/10 hover:bg-black/15 transition"
					aria-label="Exit quiz"
				>
					<ChevronLeft className="h-5 w-5" />
				</button>
				<span className="text-sm opacity-80 hidden sm:inline">Exit</span>
			</div>

			<h1 className="text-headline font-bold tracking-tight text-center truncate max-w-md">
				{title}
			</h1>

			<div className="flex items-center gap-2">
				<span className="rounded-full bg-black text-white px-3 py-1.5 text-sm font-semibold whitespace-nowrap">
					{score} / {outOf}
				</span>
				<button
					onClick={onToggleTimer}
					className="rounded-full bg-black/10 px-3 py-1.5 text-sm hidden sm:flex items-center gap-1.5 hover:bg-black/15 transition"
					title={showTimer ? "Hide timer" : "Show timer"}
				>
					{showTimer ? <EyeOff className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
					<span className="hidden md:inline">{showTimer ? "Hide" : "Timer"}</span>
				</button>
				{showTimer && <Timer startedAt={startedAt} />}
			</div>
		</header>
	);
}

