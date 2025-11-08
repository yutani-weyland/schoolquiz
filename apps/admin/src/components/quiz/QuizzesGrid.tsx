"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { QuizCard, Quiz } from "./QuizCard";

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

	return (
		<div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 mt-6">
			{filtered.map((quiz) => (
				<QuizCard key={quiz.id} quiz={quiz} />
			))}
		</div>
	);
}

