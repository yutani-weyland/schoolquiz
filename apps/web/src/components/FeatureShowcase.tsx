"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, GraduationCap, Sparkles, Users, Calendar, Award, Maximize2, MessageSquare } from "lucide-react";

interface Feature {
	id: number;
	icon: React.ReactNode;
	title: string;
	description: string;
	image: string;
}

const features: Feature[] = [
	{
		id: 1,
		icon: <GraduationCap className="w-6 h-6" />,
		title: "Made by Teachers",
		description: "Handcrafted by educators, not algorithms. Questions that actually resonate with students.",
		image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=600&fit=crop&q=80"
	},
	{
		id: 2,
		icon: <Sparkles className="w-6 h-6" />,
		title: "Zero AI Slop",
		description: "Authentic, human-created content that students can trust. No generic filler, just genuine engagement.",
		image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop&q=80"
	},
	{
		id: 3,
		icon: <ShieldCheck className="w-6 h-6" />,
		title: "Culture Meets Curriculum",
		description: "Mix of current affairs, pop culture, sport, and subjects—balanced and engaging.",
		image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop&q=80"
	},
	{
		id: 4,
		icon: <Users className="w-6 h-6" />,
		title: "Brings Groups Together",
		description: "No heads in laptops. Real conversations, collaboration, and classroom bonding.",
		image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=600&fit=crop&q=80"
	},
	{
		id: 5,
		icon: <Maximize2 className="w-6 h-6" />,
		title: "Presenter Mode",
		description: "Designed for big screens—project and engage entire tutor groups effortlessly.",
		image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop&q=80"
	},
	{
		id: 6,
		icon: <Calendar className="w-6 h-6" />,
		title: "Drops Every Monday",
		description: "Reliable weekly delivery—no scrambling for content, ever.",
		image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop&q=80"
	},
	{
		id: 7,
		icon: <Award className="w-6 h-6" />,
		title: "Full Back Catalogue",
		description: "Access to all past quizzes—longevity and reliability you can count on.",
		image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop&q=80"
	},
	{
		id: 8,
		icon: <MessageSquare className="w-6 h-6" />,
		title: "Shoutouts & Submissions",
		description: "Submit questions and get featured shoutouts to your school, teacher, or student (subject to approval).",
		image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&q=80"
	}
];

export function FeatureShowcase() {
	const [selectedFeature, setSelectedFeature] = useState(features[0]);

	return (
		<section className="py-32 px-4 bg-white dark:bg-gray-900">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="text-center mb-24">
					<h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
						Why The School Quiz?
					</h2>
					<p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
						Built for real connections—quizzes that bring students together, not isolate them behind screens
					</p>
				</div>

				{/* Interactive Feature Display */}
				<div className="grid lg:grid-cols-2 gap-12 items-start">
					{/* Feature List */}
					<div className="space-y-4">
						{features.map((feature, index) => (
							<motion.button
								key={feature.id}
								onClick={() => setSelectedFeature(feature)}
								className={`w-full text-left group relative overflow-hidden rounded-2xl p-6 border-2 transition-all duration-300 ${
									selectedFeature.id === feature.id
										? "border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
										: "border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-800"
								}`}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.05 }}
							>
								{/* Selected indicator gradient */}
								{selectedFeature.id === feature.id && (
									<motion.div
										className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ duration: 0.3 }}
									/>
								)}
								
								<div className="relative flex items-start gap-4">
									<div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
										selectedFeature.id === feature.id
											? "bg-blue-600 dark:bg-blue-500 text-white scale-110"
											: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400"
									}`}>
										{feature.icon}
									</div>
									<div className="flex-1 min-w-0">
										<h3 className={`text-xl font-bold mb-2 transition-colors ${
											selectedFeature.id === feature.id
												? "text-blue-600 dark:text-blue-400"
												: "text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400"
										}`}>
											{feature.title}
										</h3>
										<p className={`text-base leading-relaxed transition-colors ${
											selectedFeature.id === feature.id
												? "text-gray-700 dark:text-gray-300"
												: "text-gray-600 dark:text-gray-400"
										}`}>
											{feature.description}
										</p>
									</div>
								</div>
							</motion.button>
						))}
					</div>

					{/* Feature Detail Display with Image */}
					<div className="sticky top-24">
						<AnimatePresence mode="wait">
							<motion.div
								key={selectedFeature.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
								transition={{ duration: 0.3 }}
								className="relative"
							>
								{/* Image Container */}
								<div className="relative overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
									<motion.img
										src={selectedFeature.image}
										alt={selectedFeature.title}
										className="w-full h-[500px] object-cover"
										initial={{ scale: 1.1 }}
										animate={{ scale: 1 }}
										transition={{ duration: 0.5 }}
									/>
									{/* Gradient overlay for better text readability */}
									<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
									
									{/* Feature info overlay */}
									<div className="absolute bottom-0 left-0 right-0 p-8 text-white">
										<motion.div
											className="inline-flex items-center gap-3 mb-4 bg-white/20 backdrop-blur-md rounded-2xl px-4 py-3"
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.2 }}
										>
											<div className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center">
												{selectedFeature.icon}
											</div>
											<span className="font-semibold text-lg">{selectedFeature.title}</span>
										</motion.div>
										<motion.p
											className="text-lg leading-relaxed font-medium"
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.3 }}
										>
											{selectedFeature.description}
										</motion.p>
									</div>
								</div>
							</motion.div>
						</AnimatePresence>
					</div>
				</div>
			</div>
		</section>
	);
}
