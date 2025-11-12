"use client";

import React from "react";
import Link from "next/link";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContentCard } from "@/components/layout/ContentCard";

export default function AboutPage() {
	const handleExploreClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
		if (typeof window !== 'undefined') {
			const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
			if (!isLoggedIn) {
				e.preventDefault();
				// Redirect logged-out users to latest quiz intro page
				window.location.href = '/quizzes/12/intro';
			}
		}
	};

	return (
		<PageLayout headerFadeLogo={true}>
			<PageContainer maxWidth="2xl">
				{/* Header */}
				<PageHeader
					title={
						<>
							About <span className="text-blue-600 dark:text-blue-400">The School Quiz</span>
						</>
					}
					subtitle="I'm on a mission to deliver fun, engaging quizzes that teachers can rely on, week after week."
					centered
				/>

				{/* Two Column Layout with Photo */}
				<div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 lg:gap-16 mb-12 sm:mb-16 md:mb-20">
					{/* My Story */}
					<ContentCard padding="lg" rounded="3xl" delay={0.1} hoverAnimation={false}>
						<h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
							My Story
						</h2>
						<p className="text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
							Hi, I'm Andy. I've been a high school teacher for a decade, and I've seen firsthand how a great quiz can transform a classroom. After years of cobbling together questions from different sources, I decided to build what I wish existed—a quiz platform that delivers consistently high-quality content, every single week.
						</p>
					</ContentCard>

					{/* Photo Placeholder */}
					<div className="flex items-center">
						<div className="relative w-full">
							<div className="aspect-[4/3] bg-blue-600 dark:bg-blue-800 rounded-3xl overflow-hidden ring-4 ring-blue-200 dark:ring-blue-800 shadow-xl">
								<div className="w-full h-full flex items-center justify-center text-white text-4xl md:text-5xl font-bold">
									Running the Quiz
								</div>
							</div>
							{/* Placeholder indicator */}
							<div className="absolute -bottom-3 -right-3 bg-yellow-400 text-yellow-900 text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
								Photo Coming Soon
							</div>
						</div>
					</div>

					{/* My Mission */}
					<ContentCard padding="lg" rounded="3xl" delay={0.2} hoverAnimation={false}>
						<h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
							My Mission
						</h2>
						<div className="space-y-4">
							<p className="text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
								I believe that learning should be engaging, authentic, and fun. My mission is simple:
							</p>
							<ul className="space-y-3 text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
								<li className="flex items-start gap-3">
									<span className="text-blue-600 dark:text-blue-400 font-bold mt-1">•</span>
									<span><strong>Provide a fully playable quiz each week.</strong> I get it—I was a trainee teacher once upon a time. You need something ready to go, every single week, without fail.</span>
								</li>
								<li className="flex items-start gap-3">
									<span className="text-blue-600 dark:text-blue-400 font-bold mt-1">•</span>
									<span>Deliver consistently high-quality content with no AI-generated slop. Every question is handcrafted and thoughtfully chosen.</span>
								</li>
								<li className="flex items-start gap-3">
									<span className="text-blue-600 dark:text-blue-400 font-bold mt-1">•</span>
									<span>Make analytics accessible. Question difficulty is data-driven, and you can see insights like how many people got each answer right in real-time.</span>
								</li>
							</ul>
						</div>
					</ContentCard>
				</div>

				{/* Additional Sections */}
				<ContentCard padding="xl" rounded="3xl" delay={0.3} hoverAnimation={false}>
					<div className="text-center space-y-4 sm:space-y-6">
						<h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
							Join Me on This Journey
						</h2>
						<p className="text-base md:text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
							If you'd like to increase engagement, have some fun during your tutor time/homegroup (or whatever your school calls it), please come join in.
						</p>
						<div className="pt-6">
							<Link 
								href="/quizzes"
								onClick={handleExploreClick}
								className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-all hover:scale-105 shadow-lg hover:shadow-xl"
							>
								Explore the Quizzes
							</Link>
						</div>
					</div>
				</ContentCard>
			</PageContainer>
		</PageLayout>
	);
}

