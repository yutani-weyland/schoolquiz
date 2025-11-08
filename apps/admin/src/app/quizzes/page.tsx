import React from "react";
import { Quiz } from "@/components/quiz/QuizCard";
import { QuizFilters } from "@/components/quiz/QuizFilters";
import { QuizzesGrid } from "@/components/quiz/QuizzesGrid";

// Server component
export default async function QuizzesPage() {
	// Mock data for now
	const quizzes: Quiz[] = [
		{ id: 279, slug: "279", title: "Shape Up, Pumpkins, Famous First Words, Crazes, and Next In Sequence.", blurb: "A weekly selection mixing patterns, pop culture and logic.", weekISO: "2024-01-15", colorHex: "#FFE135", status: "available", tags: ["patterns", "pop-culture"] },
		{ id: 278, slug: "278", title: "Opposite Day, Lights, Common Ground, Robots Etc, and First Ladies.", blurb: "Wordplay meets trivia.", weekISO: "2024-01-08", colorHex: "#FF69B4", status: "available", tags: ["wordplay"] },
		{ id: 277, slug: "277", title: "Back to the Past, Name That Nation, Name the Other, Analog Games, and What Does It Stand For?", blurb: "History, geography and acronyms.", weekISO: "2024-01-01", colorHex: "#39FF14", status: "available", tags: ["history", "geo"] },
		{ id: 276, slug: "276", title: "Holiday Trivia, Winter Sports, Year End Review, and Festive Fun.", blurb: "Seasonal mixed bag.", weekISO: "2023-12-25", colorHex: "#00E5FF", status: "coming_soon", tags: ["seasonal"] },
		{ id: 275, slug: "275", title: "Movie Magic, Tech Trends, Sports Moments, and Pop Culture.", blurb: "Headlines and highlights.", weekISO: "2023-12-18", colorHex: "#FF10F0", status: "available", tags: ["movies", "tech"] },
		{ id: 274, slug: "274", title: "World Wonders, Historical Events, Science Facts, and Geography.", blurb: "Curiosities around the world.", weekISO: "2023-12-11", colorHex: "#FF7F00", status: "available", tags: ["science", "geo"] }
	];

	const allTags = Array.from(new Set(quizzes.flatMap((q) => (q.tags ?? []) as string[])));

	return (
		<div className="min-h-dvh pt-20 pb-16">
			<h1 className="text-5xl md:text-6xl font-extrabold text-neutral-900 dark:text-white text-center mb-8">Past Quizzes</h1>
			<QuizFilters allTags={allTags} />
			<div className="max-w-6xl mx-auto px-4">
				<QuizzesGrid quizzes={quizzes} />
			</div>
		</div>
	);
}
