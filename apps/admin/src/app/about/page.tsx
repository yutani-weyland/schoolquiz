"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { Footer } from "@/components/Footer";

export default function AboutPage() {
	return (
		<PageLayout headerFadeLogo={true}>
			<div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="text-center mb-12 sm:mb-16 md:mb-20 max-w-4xl mx-auto pt-8"
				>
					<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
						About The School Quiz
					</h1>
					<p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
						A weekly quiz for Australian schools that's fun, reliable, and ready every Monday.
					</p>
				</motion.div>

				{/* Main Content - Card-based layout */}
				<div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 md:space-y-10">
					{/* Why I Built This Section */}
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
						className="flex flex-col p-6 sm:p-8 md:p-10 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900"
					>
						<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
							Why I Built This
						</h2>
						
						<div className="space-y-5 sm:space-y-6 text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
							<p>
								I'm Andy. I've been a high school teacher for more than a decade, first in the UK and now in Australia. Across every school and year group I've taught, one thing has stayed exactly the same: finding a good quiz was way harder than it should've been.
							</p>
							
							<p>
								So I made my own.
							</p>
							
							<p>
								For years I'd dig through newspapers and online trivia, rewrite half the questions, tweak the difficulty, add jokes, and stitch everything together into something I could actually run with my classes. Eventually I became "the quiz guy" in my department. One year my end-of-year trivia spread so far around the school that my students walked in and told me the Art faculty had already played it that morning. Flattering… but also deeply unhelpful for the next hour.
							</p>
						</div>
					</motion.div>

					{/* The Problem Section */}
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
						className="flex flex-col p-6 sm:p-8 md:p-10 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900"
					>
						<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
							The Problem
						</h2>
						
						<div className="space-y-5 sm:space-y-6 text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
							<p>
								Then came the big quiz platforms. Kahoot, Blooket and the rest had their moment, and they were great in parts, but classrooms changed. BYOD meant every quiz suddenly involved thirty screens and a room full of quiet clicking. Even as a computing teacher, I missed the noise, the teamwork, the back-and-forth of an actual room doing something together.
							</p>
							
							<p>
								Then AI-generated quizzes started appearing everywhere—quick to make, but often messy or too easy. Students would point out repeating answers, odd difficulty, or the same multiple-choice pattern. Fair feedback.
							</p>
							
							<p>
								Around the same time, I became a parent. My spare time evaporated and I started leaning on pre-made quizzes again… and the old frustrations came straight back.
							</p>
						</div>
					</motion.div>

					{/* The Moment It Clicked Section */}
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
						className="flex flex-col p-6 sm:p-8 md:p-10 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900"
					>
						<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
							The Moment It Clicked
						</h2>
						
						<div className="space-y-5 sm:space-y-6 text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
							<p>
								One night at the local bowlo, after I'd talked about this idea for far too long, a mate cut me off mid-sentence:
							</p>
							
							<p className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white italic border-l-4 border-blue-600 dark:border-blue-400 pl-4 sm:pl-6 my-4 sm:my-6">
								"So you basically want a pub-quiz format for kids?"
							</p>
							
							<p>
								Exactly right. Simple. Fun. Team-based. Good content. Something you can run without everyone disappearing behind a laptop.
							</p>
						</div>
					</motion.div>

					{/* What The School Quiz Aims To Be Section */}
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
						className="flex flex-col p-6 sm:p-8 md:p-10 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900"
					>
						<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
							What The School Quiz Aims To Be
						</h2>
						
						<div className="space-y-5 sm:space-y-6 text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
							<p>
								A weekly quiz that's:
							</p>
							
							<ul className="space-y-3 list-none pl-0 my-4">
								<li className="flex items-baseline gap-3">
									<span className="text-blue-600 dark:text-blue-400 font-semibold flex-shrink-0 leading-none">•</span>
									<span><strong className="text-gray-900 dark:text-white">Social, not silent</strong></span>
								</li>
								<li className="flex items-baseline gap-3">
									<span className="text-blue-600 dark:text-blue-400 font-semibold flex-shrink-0 leading-none">•</span>
									<span><strong className="text-gray-900 dark:text-white">Teacher-led,</strong> with the whole class working together</span>
								</li>
								<li className="flex items-baseline gap-3">
									<span className="text-blue-600 dark:text-blue-400 font-semibold flex-shrink-0 leading-none">•</span>
									<span><strong className="text-gray-900 dark:text-white">Topical and reliable,</strong> landing every Monday morning</span>
								</li>
								<li className="flex items-baseline gap-3">
									<span className="text-blue-600 dark:text-blue-400 font-semibold flex-shrink-0 leading-none">•</span>
									<span><strong className="text-gray-900 dark:text-white">Built for Australian students,</strong> not repurposed from an overseas template</span>
								</li>
								<li className="flex items-baseline gap-3">
									<span className="text-blue-600 dark:text-blue-400 font-semibold flex-shrink-0 leading-none">•</span>
									<span><strong className="text-gray-900 dark:text-white">Screen-light, fast,</strong> and easy to run in any room</span>
								</li>
								<li className="flex items-baseline gap-3">
									<span className="text-blue-600 dark:text-blue-400 font-semibold flex-shrink-0 leading-none">•</span>
									<span><strong className="text-gray-900 dark:text-white">Consistent in difficulty and quality</strong>—no AI slop, no chaos</span>
								</li>
							</ul>
							
							<p>
								It's the quiz I always wished existed.
							</p>
						</div>
					</motion.div>

					{/* Built With Teachers (and Students) Section */}
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
						className="flex flex-col p-6 sm:p-8 md:p-10 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900"
					>
						<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
							Built With Teachers (and Students)
						</h2>
						
						<div className="space-y-5 sm:space-y-6 text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
							<p>
								A lot of the features have come from conversations with colleagues. The People's Round wasn't even my idea—another teacher listened to me ramble and said, "Well obviously you need a People's Round." She was right, and it went straight in. Other teacher and student ideas will keep shaping the platform over time.
							</p>
							
							<p>
								That's how The School Quiz started, and that's how it'll keep growing: simple, reliable, and made for real classrooms.
							</p>
						</div>
					</motion.div>

					{/* A Quick Favour Section */}
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
						className="flex flex-col p-6 sm:p-8 md:p-10 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900"
					>
						<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
							A Quick Favour
						</h2>
						
						<div className="space-y-5 sm:space-y-6 text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
							<p>
								If your students enjoy the quiz each week, consider supporting it. Subscribing helps keep it running and lets me keep building new rounds, features, and ideas—far easier than the whole "delete cookies/incognito mode" routine.
							</p>
							
							<p>
								Anyway, I hope it gives you and your class a solid half hour with your students each week. Something simple, reliable, and genuinely enjoyable.
							</p>
							
							<div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-200/60 dark:border-gray-700/60">
								<p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-3">
									Thanks for being part of it.
								</p>
								<p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
									Andy
								</p>
							</div>
						</div>
					</motion.div>

					{/* CTA Section */}
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
						className="text-center mt-8 sm:mt-10"
					>
						<Link
							href="/contact"
							className="inline-flex items-center justify-center h-12 px-4 sm:px-6 bg-[#3B82F6] text-white rounded-full text-sm sm:text-base font-medium hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
						>
							Contact me
						</Link>
					</motion.div>
				</div>
			</div>
			
			<Footer />
		</PageLayout>
	);
}