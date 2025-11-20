"use client";

import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { textOn } from "@/lib/contrast";
import { formatWeek } from "@/lib/format";

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

interface QuizCardPreviewProps {
	quiz: Quiz;
	isNewest?: boolean;
}

export function QuizCardPreview({ quiz, isNewest = false }: QuizCardPreviewProps) {
	const text = textOn(quiz.colorHex);
	const invert = text === "white" ? "text-white" : "text-gray-900";
	const sub = text === "white" ? "text-white/90" : "text-gray-800/80";
	const formattedDate = formatWeek(quiz.weekISO);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="h-full"
		>
			<div
				className="block rounded-3xl p-7 shadow-lg h-full min-h-[430px] flex flex-col relative overflow-hidden cursor-default"
				style={{
					backgroundColor: quiz.colorHex,
				}}
			>
				{/* Header */}
				<div className="flex items-start justify-between mb-6">
					<div>
						<h3 className={`text-2xl md:text-3xl font-extrabold ${invert} mb-2`}>
							Quiz #{quiz.id}
						</h3>
						<div className="flex items-center gap-2 text-sm">
							<Calendar className={`w-4 h-4 ${sub}`} />
							<span className={sub}>{formattedDate}</span>
						</div>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 flex flex-col">
					<h2 className={`text-3xl md:text-4xl font-extrabold ${invert} leading-tight mb-4`}>
						{quiz.title}
					</h2>
					{quiz.blurb && (
						<p className={`text-lg ${sub} mb-6`}>
							{quiz.blurb}
						</p>
					)}
				</div>

				{/* Footer */}
				<div className="mt-auto pt-6 border-t border-current/20">
					{quiz.status === "coming_soon" ? (
						<p className={`text-sm ${sub} opacity-70`}>Coming soon</p>
					) : (
						<p className={`text-sm font-medium ${invert}`}>Available now</p>
					)}
				</div>
			</div>
		</motion.div>
	);
}



