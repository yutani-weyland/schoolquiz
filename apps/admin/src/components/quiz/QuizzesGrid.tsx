"use client";

import React, { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { QuizCard, Quiz } from "./QuizCard";
import { SpeculationRules } from "@/components/SpeculationRules";

interface QuizzesGridProps {
	quizzes: Quiz[];
}

export function QuizzesGrid({ quizzes }: QuizzesGridProps) {
	const params = useSearchParams();
	const q = (params.get("q") ?? "").toLowerCase();
	const sort = params.get("sort") ?? "new";
	const tags = new Set((params.get("tags") ?? "").split(",").filter(Boolean));

	// Restore scroll position when navigating back
	useEffect(() => {
		try {
			const savedY = sessionStorage.getItem("quizzes.scrollY");
			if (savedY) {
				window.scrollTo(0, Number(savedY));
				sessionStorage.removeItem("quizzes.scrollY");
			}
		} catch {}
	}, []);

	let filtered = quizzes.filter((quiz) => {
		const matchesText = q
			? quiz.title.toLowerCase().includes(q) || (quiz.tags ?? []).some((t: string) => t.includes(q))
			: true;
		const matchesTags = tags.size > 0 ? (quiz.tags ?? []).some((t: string) => tags.has(t)) : true;
		return matchesText && matchesTags;
	});

	if (sort === "new") filtered = filtered.sort((a, b) => b.id - a.id);
	if (sort === "old") filtered = filtered.sort((a, b) => a.id - b.id);
	if (sort === "az") filtered = filtered.sort((a, b) => a.title.localeCompare(b.title));

	// Generate URLs for visible quiz cards (limit to top 8 to avoid excessive prerendering)
	// Prerender quiz intro pages for visible cards - this makes clicking feel instant
	const quizUrls = useMemo(() => {
		return filtered
			.slice(0, 8) // Limit to first 8 visible cards
			.map(quiz => `/quizzes/${quiz.slug}/intro`)
			.filter(Boolean);
	}, [filtered]);

	return (
		<>
			{/* Prerender quiz intro pages for visible cards */}
			<SpeculationRules 
				urls={quizUrls}
				eagerness="moderate" // Prerender on hover + after 2s of mouse inactivity
			/>
			<div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 mt-6">
				{filtered.map((quiz, index) => (
					<QuizCard key={quiz.id} quiz={quiz} index={index} />
				))}
			</div>
		</>
	);
}

