"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, MoreHorizontal } from "lucide-react";
import { textOn } from "@/lib/contrast";
import { formatWeek } from "@/lib/format";
import React from "react";

export type Quiz = {
	id: number;
	slug: string;
	title: string;
	blurb: string;
	weekISO: string;
	colorHex: string;
	status?: "available" | "coming_soon";
	tags?: string[];
};

interface QuizCardProps {
	quiz: Quiz;
}

export function QuizCard({ quiz }: QuizCardProps) {
	const text = textOn(quiz.colorHex);
	const invert = text === "white" ? "text-white" : "text-gray-900";
	const sub = text === "white" ? "text-white/90" : "text-gray-800/80";
	const footerMuted = quiz.status === "coming_soon" ? "opacity-70" : "";

	return (
		<Link
			href={quiz.status === "available" ? `/quizzes/${quiz.slug}/intro` : "#"}
			aria-label={`Play Quiz ${quiz.id}: ${quiz.title}`}
			prefetch
			className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 rounded-2xl"
			tabIndex={0}
			onClick={() => {
				try { 
					sessionStorage.setItem("quizzes.scrollY", String(window.scrollY));
					sessionStorage.setItem("quizzes.scrollParams", window.location.search);
				} catch {}
			}}
		>
			<motion.div
				layoutId={`quiz-bg-${quiz.id}`}
				className="rounded-2xl p-5 shadow-md transition hover:shadow-xl will-change-transform hover:-translate-y-0.5"
				style={{ backgroundColor: quiz.colorHex }}
				whileHover={{ scale: 1.01 }}
				whileTap={{ scale: 0.995 }}
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
			>
				<div className="flex items-start justify-between mb-3">
					<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${invert} bg-black/10 bg-clip-padding`}>
						#{quiz.id}
					</span>
					<span className={`inline-flex items-center gap-1 text-xs font-medium ${sub}`}>
						<Calendar className="h-4 w-4" aria-hidden />
						{formatWeek(quiz.weekISO)}
					</span>
				</div>
				<h3 className={`text-xl font-extrabold leading-snug line-clamp-3 ${invert}`}>{quiz.title}</h3>
				<p className={`mt-1 text-sm line-clamp-1 ${sub}`}>{quiz.blurb}</p>
				<div className={`mt-4 flex items-center justify-between ${footerMuted}`}>
					<button
						disabled={quiz.status === "coming_soon"}
						className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
							quiz.status === "coming_soon"
								? "bg-white/40 text-black/60 cursor-not-allowed"
								: text === "white"
								? "bg-white text-gray-900 hover:bg-white/90"
								: "bg-gray-900 text-white hover:bg-gray-800"
						}`}
					>
						{quiz.status === "coming_soon" ? "Coming soon" : "Play quiz"}
					</button>
					<button
						type="button"
						aria-label="More options"
						className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
							text === "white" ? "bg-white/15 text-white hover:bg-white/25" : "bg-black/5 text-gray-900 hover:bg-black/10"
						}`}
						onClick={(e) => {
							e.preventDefault();
							// TODO: open menu (copy/share)
						}}
					>
						<MoreHorizontal className="h-5 w-5" />
					</button>
				</div>
			</motion.div>
		</Link>
	);
}
