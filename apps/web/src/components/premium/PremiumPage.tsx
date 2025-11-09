"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, ChevronUp, Star, Trophy, BarChart3, Zap, Users, Building2, TrendingDown, Percent, Sparkles } from "lucide-react";

type Plan = "monthly" | "yearly";
type PricingType = "individual" | "organization";

interface Feature {
	icon: React.ComponentType<{ className?: string }>;
	text: string;
	description: string;
	preview: string;
	image?: string; // Optional screenshot/image URL
}

export default function PremiumPage() {
	const [plan, setPlan] = useState<Plan>("monthly");
	const [pricingType, setPricingType] = useState<PricingType>("individual");
	const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
	const [teacherCount, setTeacherCount] = useState(10);

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

	// Progressive discount calculation - smooth curve instead of fixed tiers
	const calculateDiscount = (count: number): number => {
		if (count <= 1) return 0;
		if (count <= 5) return Math.min(5, (count - 1) * 1.25); // 0-5% for 1-5 licenses
		if (count <= 10) return 5 + (count - 5) * 1; // 5-10% for 5-10 licenses
		if (count <= 25) return 10 + (count - 10) * 0.67; // 10-20% for 10-25 licenses
		if (count <= 50) return 20 + (count - 25) * 0.4; // 20-30% for 25-50 licenses
		if (count <= 100) return 30 + (count - 50) * 0.2; // 30-40% for 50-100 licenses
		return Math.min(50, 40 + (count - 100) * 0.1); // Up to 50% for 100+ licenses
	};

	// Organization pricing with progressive discounts
	const orgPricing = useMemo(() => {
		const basePrice = plan === "monthly" ? monthlyPrice : yearlyPrice / 12;
		const discountPercent = calculateDiscount(teacherCount);
		
		const totalBase = teacherCount * basePrice;
		const discountAmount = totalBase * (discountPercent / 100);
		const total = totalBase - discountAmount;
		const perTeacher = basePrice * (1 - discountPercent / 100);
		const savings = discountAmount;

		return { totalBase, discountAmount, total, perTeacher, discountPercent, savings };
	}, [teacherCount, plan, monthlyPrice, yearlyPrice]);

	// Get discount tier label
	const getDiscountTier = (count: number): { label: string; color: string; icon: React.ReactNode } => {
		if (count >= 50) return { label: "District", color: "purple", icon: <Building2 className="w-5 h-5" /> };
		if (count >= 10) return { label: "School", color: "blue", icon: <Users className="w-5 h-5" /> };
		return { label: "Small Team", color: "gray", icon: <Users className="w-5 h-5" /> };
	};

	const discountTier = useMemo(() => getDiscountTier(teacherCount), [teacherCount]);

	const faqs = [
		{
			question: "Can I cancel anytime?",
			answer: "Yes, cancel anytime from your account settings.",
		},
		{
			question: "Do schools get discounts?",
			answer: "Yes! Schools and organizations get automatic volume discounts. The more licenses you purchase, the bigger the discount. Use the slider above to see your savings.",
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
				<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-3">
					Upgrade to Premium
				</h1>
				<p className="text-lg text-gray-600 dark:text-gray-400">
					Support development and unlock advanced quiz features
				</p>
				</motion.div>

				{/* Pricing Type Toggle */}
				<div className="flex justify-center mb-8">
					<div className="inline-flex rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-1">
						<button
							type="button"
							onClick={() => setPricingType("individual")}
							className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
								pricingType === "individual"
									? "bg-blue-600 text-white"
									: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
							}`}
						>
							Individual
						</button>
						<button
							type="button"
							onClick={() => setPricingType("organization")}
							className={`px-6 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
								pricingType === "organization"
									? "bg-blue-600 text-white"
									: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
							}`}
						>
							<Building2 className="w-4 h-4" />
							Organization
							{pricingType === "organization" && (
								<span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
									Bulk Discounts
								</span>
							)}
						</button>
					</div>
				</div>

				{/* Two Column Layout: Pricing Card + Feature Preview */}
				<div className="grid lg:grid-cols-2 gap-8 mb-12">
					{/* Plan Card */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.5, delay: 0.1 }}
						className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 sm:p-6 bg-white dark:bg-gray-900 h-fit relative"
					>
						{/* Plan Toggle - Top Right */}
						<div className="absolute top-5 right-5 sm:top-6 sm:right-6">
							<div className="inline-flex rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-1">
								<button
									type="button"
									onClick={() => setPlan("monthly")}
									className={`px-3 py-1 rounded-full text-xs font-semibold transition-all relative ${
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
									className={`px-3 py-1 rounded-full text-xs font-semibold transition-all relative ${
										plan === "yearly"
											? "bg-blue-600 text-white"
											: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
									}`}
								>
									$50/yr
									{plan === "yearly" && (
										<span className="absolute -top-1.5 -right-1.5 bg-green-500 text-white text-[10px] font-bold px-1 py-0.5 rounded-full">
											17%
										</span>
									)}
								</button>
							</div>
						</div>

						<AnimatePresence mode="wait">
							{pricingType === "individual" ? (
								<motion.div
									key="individual"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
								>
									<div className="mb-4">
										<h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
											Teacher/Parent Premium
										</h2>
										<div className="flex items-baseline gap-2">
											<span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
												${plan === "monthly" ? monthlyPrice : yearlyPrice}
											</span>
											<span className="text-gray-500 dark:text-gray-400 text-sm">
												/{plan === "monthly" ? "mo" : "yr"}
											</span>
										</div>
										{plan === "yearly" && (
											<div className="mt-1.5">
												<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium">
													Save 17% vs monthly
												</span>
											</div>
										)}
										<p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
											Cancel anytime
										</p>
									</div>

									<div className="space-y-2 mb-4">
										{features.map((feature, idx) => (
											<div 
												key={idx} 
												className="flex items-start gap-2.5 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 p-1.5 rounded-lg -m-1.5"
												onMouseEnter={() => setHoveredFeature(idx)}
												onMouseLeave={() => setHoveredFeature(null)}
											>
												<feature.icon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
												<span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
													{feature.text}
												</span>
											</div>
										))}
									</div>

									<button
										type="button"
										className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-sm transition-colors"
										onClick={() => {
											console.log(`Checkout with ${plan} plan`);
										}}
									>
										Upgrade
									</button>
								</motion.div>
							) : (
								<motion.div
									key="organization"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="space-y-6"
								>
									<div className="mb-4">
										<h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
											<Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
											Organization & School Plans
										</h2>
										<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
											Get Premium for your entire school or organization. The more licenses you add, the bigger the discount!
										</p>
									</div>

									{/* Slider Section */}
									<div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5 mb-4 border border-gray-200 dark:border-gray-700">
										<div className="flex items-center justify-between mb-4">
											<label className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
												{discountTier.icon}
												Number of Licenses
											</label>
											<div className="text-right">
												<motion.div
													key={teacherCount}
													initial={{ scale: 1.1 }}
													animate={{ scale: 1 }}
													className="text-3xl font-bold text-blue-600 dark:text-blue-400"
												>
													{teacherCount}
												</motion.div>
												<div className="text-xs text-gray-500 dark:text-gray-400">
													{teacherCount === 1 ? "license" : "licenses"}
												</div>
											</div>
										</div>

										<input
											type="range"
											min="1"
											max="200"
											value={teacherCount}
											onChange={(e) => setTeacherCount(parseInt(e.target.value))}
											className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-600"
											style={{
												background: `linear-gradient(to right, 
													rgb(37 99 235) 0%, 
													rgb(37 99 235) ${((teacherCount - 1) / 199) * 100}%, 
													rgb(229 231 235) ${((teacherCount - 1) / 199) * 100}%, 
													rgb(229 231 235) 100%)`,
											}}
										/>
										<div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
											<span>1</span>
											<span>50</span>
											<span>100</span>
											<span>150</span>
											<span>200</span>
										</div>

										{orgPricing.discountPercent > 0 && (
											<motion.div
												initial={{ opacity: 0, scale: 0.9 }}
												animate={{ opacity: 1, scale: 1 }}
												className="mt-4 flex items-center justify-center gap-2"
											>
												<div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold text-sm ${
													discountTier.color === "purple"
														? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
														: discountTier.color === "blue"
														? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
														: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
												}`}>
													<Percent className="w-4 h-4" />
													{orgPricing.discountPercent.toFixed(1)}% Volume Discount
												</div>
												<span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
													<Sparkles className="w-3 h-3" />
													{discountTier.label} Plan
												</span>
											</motion.div>
										)}
									</div>

									{/* Pricing Breakdown */}
									<div className="space-y-2 mb-4">
										<div className="flex items-center justify-between py-1.5 border-b border-gray-200 dark:border-gray-700">
											<span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
												{teacherCount} × ${plan === "monthly" ? monthlyPrice : (yearlyPrice / 12).toFixed(2)}/{plan === "monthly" ? "mo" : "mo"}
											</span>
											<span className="font-semibold text-sm text-gray-900 dark:text-white">
												${orgPricing.totalBase.toFixed(2)}
											</span>
										</div>

										{orgPricing.discountPercent > 0 && (
											<motion.div
												initial={{ opacity: 0, x: -10 }}
												animate={{ opacity: 1, x: 0 }}
												className="flex items-center justify-between py-1.5 border-b border-gray-200 dark:border-gray-700"
											>
												<span className="text-xs sm:text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
													<TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
													Discount ({orgPricing.discountPercent.toFixed(1)}%)
												</span>
												<span className="font-semibold text-sm text-green-600 dark:text-green-400">
													-${orgPricing.discountAmount.toFixed(2)}
												</span>
											</motion.div>
										)}

										<div className="flex items-center justify-between pt-1.5">
											<span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
												Total per {plan === "monthly" ? "month" : "year"}
											</span>
											<motion.span
												key={orgPricing.total}
												initial={{ scale: 1.1 }}
												animate={{ scale: 1 }}
												className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400"
											>
												${orgPricing.total.toFixed(2)}
											</motion.span>
										</div>

										<div className="pt-1.5 border-t border-gray-200 dark:border-gray-700 text-center">
											<p className="text-xs text-gray-600 dark:text-gray-400">
												<span className="font-semibold text-gray-900 dark:text-white">
													${orgPricing.perTeacher.toFixed(2)}
												</span>{" "}
												per license per {plan === "monthly" ? "month" : "year"}
											</p>
										</div>
									</div>

									<div className="space-y-2 mb-4">
										{features.map((feature, idx) => (
											<div 
												key={idx} 
												className="flex items-start gap-2.5 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 p-1.5 rounded-lg -m-1.5"
												onMouseEnter={() => setHoveredFeature(idx)}
												onMouseLeave={() => setHoveredFeature(null)}
											>
												<feature.icon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
												<span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
													{feature.text}
												</span>
											</div>
										))}
									</div>

									<button
										type="button"
										className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-sm transition-colors"
										onClick={() => {
											console.log(`Checkout with ${plan} plan for ${teacherCount} licenses`);
										}}
									>
										Get Organization Plan
									</button>
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>

					{/* Feature Preview Panel */}
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.5, delay: 0.2 }}
						className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 sm:p-6 bg-white dark:bg-gray-900 sticky top-24 h-fit"
					>
						<h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
							Feature Preview
						</h3>
						<AnimatePresence mode="wait">
							{hoveredFeature !== null ? (
								<motion.div
									key={hoveredFeature}
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.95 }}
									transition={{ duration: 0.2 }}
									className="space-y-4"
								>
									{/* Feature Header */}
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
											{React.createElement(features[hoveredFeature].icon, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" })}
										</div>
										<div className="flex-1 min-w-0">
											<h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
												{features[hoveredFeature].preview}
											</h4>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
												{features[hoveredFeature].description}
											</p>
										</div>
									</div>

									{/* Feature Image/Screenshot */}
									<div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-lg">
										{features[hoveredFeature].image ? (
											<img
												src={features[hoveredFeature].image}
												alt={features[hoveredFeature].preview}
												className="w-full h-auto object-cover"
											/>
										) : (
											<div className="aspect-video flex items-center justify-center p-8">
												<div className="text-center space-y-2">
													<div className="w-16 h-16 mx-auto rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
														{React.createElement(features[hoveredFeature].icon, { className: "w-8 h-8 text-blue-600 dark:text-blue-400" })}
													</div>
													<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
														{features[hoveredFeature].preview}
													</p>
													<p className="text-xs text-gray-500 dark:text-gray-500">
														Screenshot coming soon
													</p>
												</div>
											</div>
										)}
									</div>
								</motion.div>
							) : (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="text-center py-8 sm:py-12"
								>
									<div className="bg-gradient-to-br from-blue-50 to-gray-50 dark:from-blue-900/10 dark:to-gray-800/50 rounded-xl p-8 sm:p-12 mb-3 border border-gray-200 dark:border-gray-700">
										<div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
											<Star className="w-8 h-8 text-blue-600 dark:text-blue-400" />
										</div>
										<p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
											Hover over a feature
										</p>
										<p className="text-xs text-gray-500 dark:text-gray-400">
											to see a preview
										</p>
									</div>
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

