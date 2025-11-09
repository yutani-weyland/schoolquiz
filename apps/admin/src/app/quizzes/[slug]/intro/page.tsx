"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import QuizIntro from "@/components/quiz/QuizIntro";
import { Quiz } from "@/components/quiz/QuizCard";
import { getQuizColor } from '@/lib/colors';

const DATA: Quiz[] = [
	{ id: 279, slug: "279", title: "Shape Up, Pumpkins, Famous First Words, Crazes, and Next In Sequence.", blurb: "A weekly selection mixing patterns, pop culture and logic.", weekISO: "2024-01-15", colorHex: getQuizColor(279), status: "available" },
	{ id: 278, slug: "278", title: "Opposite Day, Lights, Common Ground, Robots Etc, and First Ladies.", blurb: "Wordplay meets trivia.", weekISO: "2024-01-08", colorHex: getQuizColor(278), status: "available" },
	{ id: 277, slug: "277", title: "Back to the Past, Name That Nation, Name the Other, Analog Games, and What Does It Stand For?", blurb: "History, geography and acronyms.", weekISO: "2024-01-01", colorHex: getQuizColor(277), status: "available" },
	{ id: 276, slug: "276", title: "Holiday Trivia, Winter Sports, Year End Review, and Festive Fun.", blurb: "Seasonal mixed bag.", weekISO: "2023-12-25", colorHex: getQuizColor(276), status: "coming_soon" },
	{ id: 275, slug: "275", title: "Movie Magic, Tech Trends, Sports Moments, and Pop Culture.", blurb: "Headlines and highlights.", weekISO: "2023-12-18", colorHex: getQuizColor(275), status: "available" },
	{ id: 274, slug: "274", title: "World Wonders, Historical Events, Science Facts, and Geography.", blurb: "Curiosities around the world.", weekISO: "2023-12-11", colorHex: getQuizColor(274), status: "available" }
];

export default function QuizIntroPage() {
	const params = useParams();
	const router = useRouter();
	const slug = String(params?.slug ?? "");
	const quiz = DATA.find((q) => q.slug === slug);
	
	useEffect(() => {
		if (!quiz) {
			router.replace("/quizzes");
		}
	}, [quiz, router]);

	if (!quiz) return null;

	const isNewest = DATA[0].slug === quiz.slug;

	return <QuizIntro quiz={quiz} isNewest={isNewest} />;
}
