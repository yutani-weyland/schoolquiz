"use client";

import React from "react";
import { Sparkles, Shield, Users, CalendarDays, BookOpen, GraduationCap } from "lucide-react";

const features = [
	{
		icon: GraduationCap,
		title: "Made by a Teacher",
		desc: "I write every quiz myself and trial it with real classes. It's built for the room, not for clicks.",
	},
	{
		icon: Sparkles,
		title: "No AI Slop",
		desc: "Every question is hand-made. Clear wording, checked facts, and no filler.",
	},
	{
		icon: Shield,
		title: "Culture Meets Curriculum",
		desc: "Current affairs, pop culture, sport, and syllabus-friendly topics—balanced and engaging.",
	},
	{
		icon: Users,
		title: "Brings Groups Together",
		desc: "Heads up, not heads down. Short, lively rounds that spark talk and teamwork.",
	},
	{
		icon: CalendarDays,
		title: "New Quiz Every Monday",
		desc: "Reliable weekly drop. You'll never scramble for content mid-lesson again.",
	},
	{
		icon: BookOpen,
		title: "Full Back Catalogue",
		desc: "Browse past quizzes and reuse the ones that landed with your students.",
	},
];

export default function WhySection() {
	return (
		<section className="bg-neutral-50 dark:bg-neutral-900 py-16 sm:py-20">
			<div className="mx-auto max-w-6xl px-6">
				<header className="mx-auto max-w-3xl text-center">
					<h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
						Why The School Quiz?
					</h2>
					<p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
						I build this for real classrooms—quizzes that get students talking, laughing, and learning together.
					</p>
				</header>
				<div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
					{features.map(({ icon: Icon, title, desc }) => (
						<article
							key={title}
							className="rounded-2xl bg-white dark:bg-neutral-800 p-6 sm:p-7 ring-1 ring-black/5 dark:ring-white/10 shadow-sm transition hover:shadow-md motion-safe:hover:-translate-y-0.5"
						>
							<div
								className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4"
								aria-hidden="true"
							>
								<Icon className="h-5 w-5" />
							</div>
							<h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>
							<p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{desc}</p>
						</article>
					))}
				</div>
			</div>
			<style>{`
				@media (prefers-reduced-motion: reduce) {
					article { transform: none !important; transition: none !important; }
				}
			`}</style>
		</section>
	);
}

