"use client";

import React from "react";
import { SiteHeader } from "@/components/SiteHeader";
import NextQuizCountdown from "@/components/NextQuizCountdown";
import { RotatingText } from "@/components/RotatingText";
import HeroCTA from "@/components/HeroCTA";
import WhySection from "@/components/marketing/WhySection";
import QuizSafariPreview from "@/components/QuizSafariPreview";
import { LockedFeature } from "@/components/access/LockedFeature";
import { useUserAccess } from "@/contexts/UserAccessContext";
import Link from "next/link";

export default function HomePage() {
	const { isVisitor, isFree, isPremium, userName } = useUserAccess();
	
	return (
		<>
			<SiteHeader fadeLogo={true} />
			<main className="min-h-screen">
				{/* Notch Component */}
				<NextQuizCountdown />

				{/* Hero Section */}
				<section className="min-h-screen flex flex-col items-center justify-center px-4 pt-32 relative">
					<div className="max-w-4xl mx-auto text-center mb-16">
						<h1
							className="text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 dark:text-white mb-10 pb-4"
							id="headline"
						>
							A weekly quiz for<br />
							high school{" "}
							<span className="text-blue-600 dark:text-blue-400 inline-block min-h-[1.2em]">
								<RotatingText
									text={["students", "tutor groups", "homerooms"]}
									duration={3000}
									transition={{ duration: 0.5, ease: "easeInOut" }}
								/>
							</span>
						</h1>

						<p
							className="text-lg md:text-xl text-gray-600 dark:text-[#DCDCDC] mb-12 max-w-4xl mx-auto"
							id="description"
						>
							The School Quiz blends general knowledge, educational content, and entertainment - covering music, sport, movies, current affairs, pop culture, and topics relevant to high school students. No insanely hard questions, no AI slop. Just a solid quiz that drops every Monday morning.
						</p>

					<div id="buttons">
						<HeroCTA />
					</div>
				</div>

					{/* Safari Preview Peeking from Bottom */}
					<div className="w-full px-4 mt-4 mb-8">
						<div className="max-w-6xl mx-auto">
							<QuizSafariPreview />
						</div>
					</div>
				</section>

				{/* Premium Preview Section for Free Users */}
				{(isFree || isVisitor) && (
					<section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
						<div className="max-w-6xl mx-auto">
							<h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
								{isVisitor ? 'Unlock More Features' : 'Upgrade to Premium'}
							</h2>
							<div className="grid md:grid-cols-2 gap-6">
								<LockedFeature
									tierRequired="free"
									tooltipText="Join your school, class or mates"
									className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
								>
									<div className="text-center">
										<div className="text-4xl mb-4">👥</div>
										<h3 className="text-xl font-semibold mb-2">Private Leagues</h3>
										<p className="text-gray-600 dark:text-gray-400">
											Join your school, class or mates
										</p>
									</div>
								</LockedFeature>
								<LockedFeature
									tierRequired="premium"
									tooltipText="View advanced analytics and insights"
									className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
								>
									<div className="text-center">
										<div className="text-4xl mb-4">📈</div>
										<h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
										<p className="text-gray-600 dark:text-gray-400">
											Category accuracy, streaks, performance over time
										</p>
									</div>
								</LockedFeature>
							</div>
						</div>
					</section>
				)}

				{/* Why The School Quiz Section */}
				<WhySection />

				{/* Spacer between Sections and Footer */}
				<div className="py-6"></div>

				<footer className="bg-gray-50 dark:bg-[#1A1A1A] py-12 px-4">
					<div className="max-w-6xl mx-auto">
						<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
							{/* Logo */}
							<div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
								The School Quiz
							</div>

							{/* Navigation Links */}
							<div className="flex flex-col md:flex-row gap-8 md:gap-12">
								<div className="flex flex-col gap-3">
									<Link href="/quizzes" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
										Quizzes
									</Link>
									<Link href="/about" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
										About
									</Link>
									<Link href="/contact" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
										Contact
									</Link>
								</div>
								<div className="flex flex-col gap-3">
									<Link href="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
										Privacy
									</Link>
									<Link href="/terms" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
										Terms
									</Link>
									<Link href="/help" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
										Help
									</Link>
								</div>
							</div>
						</div>

						{/* Copyright */}
						<div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
							<p>&copy; 2026 The School Quiz. All rights reserved.</p>
						</div>
					</div>
				</footer>
			</main>

			<style jsx>{`
				@keyframes fadeIn {
					from {
						opacity: 0;
						transform: translateY(10px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				.animate-fadeIn {
					animation: fadeIn 0.3s ease-out;
				}
			`}</style>
		</>
	);
}
