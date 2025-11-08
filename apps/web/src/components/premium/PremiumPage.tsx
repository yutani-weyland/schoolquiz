"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, ChevronUp, Star, Trophy, BarChart3, Zap } from "lucide-react";

type Plan = "monthly" | "yearly";

interface Feature {
	icon: React.ComponentType<{ className?: string }>;
	text: string;
	description: string;
	preview: string;
}

export default function PremiumPage() {
	const [plan, setPlan] = useState<Plan>("monthly");
	const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

	const monthlyPrice = 5;
	const yearlyPrice = 50;

	const features: Feature[] = [
		{ 
			icon: Star, 
			text: "Back catalogue and special edition quizzes",
			description: "Access over 200+ past quizzes and exclusive special editions you won't find anywhere else.",
			preview: "Quiz Library"
		},
		{ 
			icon: Trophy, 
			text: "Achievements & trophy cabinet",
			description: "Track your class's progress with achievements, badges, and a personalized trophy cabinet.",
			preview: "Trophy View"
		},
		{ 
			icon: BarChart3, 
			text: "Advanced class analytics & insights",
			description: "Get detailed analytics on student performance, question difficulty, and class engagement.",
			preview: "Analytics Dashboard"
		},
		{ 
			icon: Zap, 
			text: "Streaks",
			description: "Build momentum with streak tracking. Watch your class engagement grow week after week.",
			preview: "Streak Counter"
		},
		{ 
			icon: Star, 
			text: "Invite other premium members to private leaderboards",
			description: "Teachers can create school-wide competitions, parents may choose to invite other families.",
			preview: "Team Leaderboards"
		},
		{ 
			icon: Trophy, 
			text: "Vote on categories and receive shoutouts in the quiz",
			description: "Have your say on what categories appear next, and get recognized in the quiz itself.",
			preview: "Category Voting"
		},
		{ 
			icon: Star, 
			text: "Weekly email with the latest quiz reflecting current affairs, education and entertainment",
			description: "Stay up-to-date with weekly quizzes covering the latest in current affairs, education, and entertainment.",
			preview: "Weekly Quiz Email"
		},
	];

	const faqs = [
		{
			question: "Can I cancel anytime?",
			answer: "Yes, cancel anytime from your account settings.",
		},
		{
			question: "Do schools get discounts?",
			answer: "Contact us at hello@theschoolquiz.com.au for school pricing.",
		},
		{
			question: "Is my data safe?",
			answer: "Absolutely! We use privacy by design principles—no student details are kept. All data is encrypted and securely hosted in Australia.",
		},
	];

	return (
		<main className="min-h-screen bg-gray-50 dark:bg-[#1A1A1A] pt-24 pb-16 px-6">
			<div className="mx-auto max-w-7xl">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="text-center mb-12"
				>
				<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
					Upgrade to Premium
				</h1>
				<p className="text-lg text-gray-600 dark:text-gray-400">
					Support development and unlock advanced quiz features
				</p>
				</motion.div>

				{/* Two Column Layout: Pricing Card + Feature Preview */}
				<div className="grid lg:grid-cols-2 gap-8 mb-12">
					{/* Plan Card */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.5, delay: 0.1 }}
						className="border border-gray-200 dark:border-gray-800 rounded-lg p-8 bg-white dark:bg-gray-900 h-fit relative"
					>
						{/* Plan Toggle - Top Right */}
						<div className="absolute top-8 right-8">
							<div className="inline-flex rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-1">
								<button
									type="button"
									onClick={() => setPlan("monthly")}
									className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all relative ${
										plan === "monthly"
											? "bg-blue-600 text-white"
											: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
									}`}
								>
									$5/mo
								</button>
								<button
									type="button"
									onClick={() => setPlan("yearly")}
									className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all relative ${
										plan === "yearly"
											? "bg-blue-600 text-white"
											: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
									}`}
								>
									$50/yr
									{plan === "yearly" && (
										<span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
											17%
										</span>
									)}
								</button>
							</div>
						</div>

						<div className="mb-6">
							<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
								Teacher/Parent Premium
							</h2>
							<div className="flex items-baseline gap-2">
								<span className="text-4xl font-bold text-gray-900 dark:text-white">
									${plan === "monthly" ? monthlyPrice : yearlyPrice}
								</span>
								<span className="text-gray-500 dark:text-gray-400">
									/{plan === "monthly" ? "mo" : "yr"}
								</span>
							</div>
							{plan === "yearly" && (
								<div className="mt-2">
									<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium">
										Save 17% vs monthly
									</span>
								</div>
							)}
							<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
								Cancel anytime
							</p>
						</div>

						<div className="space-y-3 mb-6">
							{features.map((feature, idx) => (
								<div 
									key={idx} 
									className="flex items-start gap-3 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg -m-2"
									onMouseEnter={() => setHoveredFeature(idx)}
									onMouseLeave={() => setHoveredFeature(null)}
								>
									<feature.icon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
									<span className="text-gray-700 dark:text-gray-300 text-sm">
										{feature.text}
									</span>
								</div>
							))}
						</div>

					<button
						type="button"
						className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-colors"
						onClick={() => {
							console.log(`Checkout with ${plan} plan`);
						}}
					>
						Upgrade
					</button>
					</motion.div>

					{/* Feature Preview Panel */}
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.5, delay: 0.2 }}
						className="border border-gray-200 dark:border-gray-800 rounded-lg p-8 bg-white dark:bg-gray-900 sticky top-24 h-fit"
					>
						<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
							Feature Preview
						</h3>
						<AnimatePresence mode="wait">
							{hoveredFeature !== null ? (
								<motion.div
									key={hoveredFeature}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									transition={{ duration: 0.2 }}
								>
									<div className="flex items-center gap-3 mb-4">
										{React.createElement(features[hoveredFeature].icon, { className: "w-8 h-8 text-blue-600 dark:text-blue-400" })}
										<h4 className="text-lg font-semibold text-gray-900 dark:text-white">
											{features[hoveredFeature].preview}
										</h4>
									</div>
									<p className="text-gray-600 dark:text-gray-400 mb-6">
										{features[hoveredFeature].description}
									</p>
									<div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl overflow-hidden ring-4 ring-blue-200 dark:ring-blue-800 shadow-xl">
										<div className="aspect-[4/3] flex items-center justify-center text-white">
											<p className="text-lg font-semibold text-center px-4">
												{features[hoveredFeature].preview}
											</p>
										</div>
									</div>
								</motion.div>
							) : (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="text-center py-12"
								>
									<div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-8 mb-4 border-2 border-dashed border-blue-300 dark:border-blue-700">
										<p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
											Preview will appear here
										</p>
									</div>
									<p className="text-gray-500 dark:text-gray-400">
										Hover over a feature to see a preview
									</p>
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				</div>

				{/* FAQ */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.4 }}
					className="mb-8"
				>
					<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
						Frequently Asked Questions
					</h2>
					<div className="space-y-3">
						{faqs.map((faq, idx) => (
							<FAQItem key={idx} question={faq.question} answer={faq.answer} />
						))}
					</div>
				</motion.div>

				{/* Footer */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.5, delay: 0.5 }}
					className="text-center"
				>
					<a
						href="/"
						className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
					>
						← Back to home
					</a>
				</motion.div>
			</div>
		</main>
	);
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
	const [isOpen, setIsOpen] = React.useState(false);

	return (
		<div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
			<button
				type="button"
				className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
				onClick={() => setIsOpen(!isOpen)}
			>
				<span className="font-medium text-gray-900 dark:text-white">{question}</span>
				{isOpen ? (
					<ChevronUp className="w-5 h-5 text-gray-400" />
				) : (
					<ChevronDown className="w-5 h-5 text-gray-400" />
				)}
			</button>
			{isOpen && (
				<div className="px-4 pb-4">
					<p className="text-sm text-gray-600 dark:text-gray-400">{answer}</p>
				</div>
			)}
		</div>
	);
}

