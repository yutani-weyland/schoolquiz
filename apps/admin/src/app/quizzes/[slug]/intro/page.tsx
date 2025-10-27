"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { textOn } from "@/lib/contrast";
import { formatWeek } from "@/lib/format";
import { Quiz } from "@/components/quiz/QuizCard";

const DATA: Quiz[] = [
	{ id: 279, slug: "279", title: "Shape Up, Pumpkins, Famous First Words, Crazes, and Next In Sequence.", blurb: "A weekly selection mixing patterns, pop culture and logic.", weekISO: "2024-01-15", colorHex: "#FFE135", status: "available" },
	{ id: 278, slug: "278", title: "Opposite Day, Lights, Common Ground, Robots Etc, and First Ladies.", blurb: "Wordplay meets trivia.", weekISO: "2024-01-08", colorHex: "#FF69B4", status: "available" },
	{ id: 277, slug: "277", title: "Back to the Past, Name That Nation, Name the Other, Analog Games, and What Does It Stand For?", blurb: "History, geography and acronyms.", weekISO: "2024-01-01", colorHex: "#39FF14", status: "available" },
	{ id: 276, slug: "276", title: "Holiday Trivia, Winter Sports, Year End Review, and Festive Fun.", blurb: "Seasonal mixed bag.", weekISO: "2023-12-25", colorHex: "#00E5FF", status: "coming_soon" },
	{ id: 275, slug: "275", title: "Movie Magic, Tech Trends, Sports Moments, and Pop Culture.", blurb: "Headlines and highlights.", weekISO: "2023-12-18", colorHex: "#FF10F0", status: "available" },
	{ id: 274, slug: "274", title: "World Wonders, Historical Events, Science Facts, and Geography.", blurb: "Curiosities around the world.", weekISO: "2023-12-11", colorHex: "#FF7F00", status: "available" }
];

export default function QuizIntroPage() {
	const params = useParams();
	const router = useRouter();
	const slug = String(params?.slug ?? "");
	const quiz = DATA.find((q) => q.slug === slug);
	useEffect(() => {
		if (!quiz) {
			router.replace("/quizzes");
			return;
		}

		// Disable scroll restoration for the intro page
		window.history.scrollRestoration = "manual";
		window.scrollTo(0, 0);
	}, [quiz, router]);

	if (!quiz) return null;

	const tone = textOn(quiz.colorHex);
	const text = tone === "white" ? "text-white" : "text-gray-900";
	const sub = tone === "white" ? "text-white/90" : "text-gray-800/80";

	function onBack() {
		router.back();
	}

	return (
		<motion.main
			layoutId={`quiz-bg-${quiz.id}`}
			className="min-h-dvh w-full grid place-items-center px-6 fixed inset-0"
			style={{ backgroundColor: quiz.colorHex }}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.2 }}
		>
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3, staggerChildren: 0.04 }}
				className="max-w-3xl mx-auto text-center"
			>
				<motion.h1 
					initial={{ opacity: 0, y: 6 }} 
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
					className={`font-extrabold ${text} text-5xl md:text-7xl xl:text-8xl mb-4`}
				>
					{quiz.title}
				</motion.h1>
				<motion.p 
					initial={{ opacity: 0, y: 6 }} 
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.08 }}
					className={`mx-auto max-w-prose ${sub} text-lg md:text-xl mb-8`}
				>
					{quiz.blurb}
				</motion.p>
				<motion.div 
					initial={{ opacity: 0, y: 6 }} 
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.12 }}
					className="flex items-center justify-center gap-3 mb-8"
				>
					<button 
						autoFocus 
						className={`px-6 py-3 rounded-full font-semibold transition ${tone === "white" ? "bg-white text-gray-900 hover:bg-white/90" : "bg-gray-900 text-white hover:bg-gray-800"}`}
					>
						Start
					</button>
					<button 
						onClick={onBack}
						className={`px-6 py-3 rounded-full font-semibold transition ${tone === "white" ? "text-white hover:bg-white/10" : "text-gray-900 hover:bg-black/5"}`}
					>
						Back
					</button>
				</motion.div>
				<motion.div 
					initial={{ opacity: 0, y: 6 }} 
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.16 }}
					className={`flex items-center justify-center gap-2 ${sub}`}
				>
					<Calendar className="h-4 w-4" aria-hidden />
					{formatWeek(quiz.weekISO)} • Estimated 10–12 mins
				</motion.div>
			</motion.div>
		</motion.main>
	);
}
