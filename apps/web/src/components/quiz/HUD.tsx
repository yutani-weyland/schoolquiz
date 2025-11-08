"use client";

import React from "react";

export function HUD({
	total,
	current,
	segments,
	onJump,
}: {
	total: number;
	current: number;
	segments: number[];
	onJump: (i: number) => void;
}) {
	const items = Array.from({ length: total }, (_, i) => i);
	const pct = Math.min(100, ((current + 1) / total) * 100);

	return (
		<div className="container">
			<div className="h-3 rounded-full bg-black/10 relative overflow-hidden">
				<div
					className="absolute inset-y-0 left-0 bg-black/30 transition-[width] duration-300"
					style={{ width: `${pct}%` }}
				/>
				<div
					className="absolute inset-0 grid"
					style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}
				>
					{items.map((i) => (
						<button
							key={i}
							onClick={() => onJump(i)}
							aria-label={`Question ${i + 1}`}
							className={`h-full border-r border-black/10 hover:bg-black/10 transition ${
								i === current ? "bg-black/10" : ""
							}`}
						/>
					))}
				</div>
			</div>
			<div
				className="mt-1 grid text-[11px] uppercase tracking-wide opacity-70"
				style={{
					gridTemplateColumns: segments.map((n) => `repeat(${n},1fr)`).join(" "),
				}}
			>
				{segments.map((_, idx) => (
					<div key={idx} className="col-span-full text-center">
						R{idx + 1}
					</div>
				))}
			</div>
		</div>
	);
}

