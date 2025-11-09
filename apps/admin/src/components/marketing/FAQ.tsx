"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContentCard } from "@/components/layout/ContentCard";
import { motion } from "framer-motion";

type FAQItem = {
	question: string;
	answer: string;
};

type Category = {
	name: string;
	faqs: FAQItem[];
};

const categories: Category[] = [
	{
		name: "Getting Started",
		faqs: [
			{
				question: "Who is this quiz for?",
				answer:
					"It's designed for high school students—Year 9 to Year 12, or roughly 14–18 years old. I'm based in NSW, Australia, so the content is tailored to Australian high school students.",
			},
			{
				question: "How often do new quizzes come out?",
				answer:
					"Nope! Quizzes drop every Monday throughout the year, including during school holidays. The weekly schedule keeps going even when school's out.",
			},
		],
	},
	{
		name: "Premium",
		faqs: [
			{
				question: "What do I get with premium?",
				answer:
					"Premium unlocks unlimited access to all past quizzes, achievements, the ability to submit questions (and get shoutouts!), private leaderboards, streaks tracking, and the chance to vote on upcoming categories. It's the full School Quiz experience.",
			},
			{
				question: "Can I submit my own questions?",
				answer:
					"Yes! Premium subscribers can submit questions, and if yours gets featured in a quiz, we'll give you a shoutout and a special contributor achievement for your profile.",
			},
			{
				question: "Can I vote on what topics appear next?",
				answer:
					"Absolutely. Complete the current week's quiz as a premium subscriber to unlock the ability to vote on which category you'd like to see featured next week.",
			},
		],
	},
	{
		name: "How It Works",
		faqs: [
			{
				question: "How should it be played?",
				answer:
					"You'll need a host (usually the teacher) to read out the questions using the presenter mode. Sometimes I let students run it in my class, but the whole class works together as a team—it's designed to be a social experience where everyone collaborates. With premium, you can compete against other classes in your school.",
			},
			{
				question: 'What do the stats like "75% got it right" mean?',
				answer:
					"Those numbers come from everyone using the site—across all schools. It's real-time data from everyone who's completed the quiz, not just your school.",
			},
		],
	},
	{
		name: "Future Plans",
		faqs: [
			{
				question: "Will you expand to other year levels?",
				answer:
					"Possibly! If there's enough interest, I'd love to create versions for other age groups. Let me know if that's something you'd like to see.",
			},
		],
	},
];

export default function FAQ() {
	const [activeCategory, setActiveCategory] = useState(categories[0].name);
	const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
	const observerRef = useRef<IntersectionObserver | null>(null);

	// Smooth scroll to category on selection
	const scrollToCategory = (categoryName: string) => {
		setActiveCategory(categoryName);
		const element = categoryRefs.current[categoryName];
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	};

	// Update active category based on scroll position
	useEffect(() => {
		// Create intersection observer to track which category is in view
		observerRef.current = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						// Find the category name from the element
						const categoryElement = entry.target as HTMLElement;
						const categoryName = categoryElement.dataset.category;
						if (categoryName) {
							setActiveCategory(categoryName);
						}
						break;
					}
				}
			},
			{
				threshold: 0.3, // Trigger when 30% of the section is visible
				rootMargin: "-80px 0px -80% 0px", // Account for sticky header
			}
		);

		// Observe all category sections
		Object.values(categoryRefs.current).forEach((ref) => {
			if (ref && observerRef.current) {
				observerRef.current.observe(ref);
			}
		});

		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect();
			}
		};
	}, []);

	return (
		<PageContainer maxWidth="6xl">
			<PageHeader
				title="Frequently Asked Questions"
				subtitle="Everything you need to know about The School Quiz"
				centered
			/>

			<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
				{/* Category Navigation Sidebar */}
				<div className="lg:col-span-1">
					<ContentCard padding="md" rounded="3xl" className="sticky top-24">
						<div className="space-y-2">
							{categories.map((category, index) => (
								<motion.button
									key={category.name}
									onClick={() => scrollToCategory(category.name)}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: index * 0.05 }}
									className={`w-full text-left px-4 py-3 rounded-2xl transition-all duration-200 ${
										activeCategory === category.name
											? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold shadow-sm"
											: "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
									}`}
								>
									{category.name}
								</motion.button>
							))}
						</div>
					</ContentCard>
				</div>

				{/* FAQ Content */}
				<div className="lg:col-span-3">
					<div className="space-y-6">
						{categories.map((category, categoryIndex) => (
							<motion.div
								key={category.name}
								ref={(el) => (categoryRefs.current[category.name] = el)}
								id={category.name.toLowerCase().replace(/\s+/g, "-")}
								data-category={category.name}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: categoryIndex * 0.1 }}
							>
							<ContentCard padding="lg" rounded="3xl" delay={categoryIndex * 0.05}>
								<h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
									{category.name}
								</h3>
								<div className="space-y-3">
									{category.faqs.map((faq, index) => (
										<FAQItem
											key={index}
											question={faq.question}
											answer={faq.answer}
											delay={index * 0.05}
										/>
									))}
								</div>
							</ContentCard>
							</motion.div>
						))}
					</div>
				</div>
			</div>
		</PageContainer>
	);
}

function FAQItem({ question, answer, delay = 0 }: { question: string; answer: string; delay?: number }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay, type: 'spring', stiffness: 200, damping: 20 }}
			className="rounded-3xl border border-gray-200/50 dark:border-gray-800/50 bg-white dark:bg-gray-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
		>
			<button
				type="button"
				className="w-full flex items-center justify-between p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-3xl transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
				aria-controls={`faq-answer-${question}`}
			>
				<span className="text-base font-semibold text-gray-900 dark:text-white pr-8 flex-1">
					{question}
				</span>
				<motion.div
					animate={{ rotate: isOpen ? 180 : 0 }}
					transition={{ duration: 0.2 }}
				>
					<ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
				</motion.div>
			</button>

			<motion.div
				id={`faq-answer-${question}`}
				initial={false}
				animate={{
					height: isOpen ? 'auto' : 0,
					opacity: isOpen ? 1 : 0,
				}}
				transition={{ duration: 0.3, ease: 'easeInOut' }}
				className="overflow-hidden"
			>
				<div className="px-5 pb-5 pt-0">
					<p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
						{answer}
					</p>
				</div>
			</motion.div>
		</motion.div>
	);
}

