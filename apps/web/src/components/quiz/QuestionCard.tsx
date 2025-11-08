"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

export function QuestionCard({
	text,
	onCorrect,
	onNext,
	onPrev,
	mode,
	isFirst,
	isLast,
}: {
	text: string;
	onCorrect: () => void;
	onNext: () => void;
	onPrev: () => void;
	mode: "presenter" | "flow";
	isFirst: boolean;
	isLast: boolean;
}) {
	return (
		<article className="w-full max-w-[var(--maxw)] mx-auto bg-white/75 backdrop-blur rounded-xl2 p-[var(--space-6)] shadow-soft">
			<h2 className="text-display font-extrabold tracking-tight text-balance mb-[var(--space-4)]">
				{text}
			</h2>

			<div className="mt-[var(--space-4)] flex flex-wrap items-center gap-[var(--space-2)]">
				<button
					onClick={onCorrect}
					className="rounded-full bg-black text-white px-5 py-2.5 font-semibold hover:bg-black/90 transition inline-flex items-center gap-2"
				>
					<Check className="h-4 w-4" />
					Mark correct & next
				</button>

				<button
					onClick={onNext}
					disabled={isLast}
					className="rounded-full bg-black/10 px-5 py-2.5 font-semibold hover:bg-black/15 transition inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Skip
					<ChevronRight className="h-4 w-4" />
				</button>

				{mode === "presenter" && (
					<button
						onClick={onPrev}
						disabled={isFirst}
						className="rounded-full bg-black/10 px-5 py-2.5 font-semibold hover:bg-black/15 transition inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<ChevronLeft className="h-4 w-4" />
						Prev
					</button>
				)}
			</div>
		</article>
	);
}

