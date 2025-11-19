"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

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
		<section className="bg-white dark:bg-[#0F1419] py-16 sm:py-20">
			<div className="mx-auto max-w-6xl px-6">
				<header className="mx-auto max-w-3xl text-center mb-16">
					<h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
						Frequently Asked Questions
					</h2>
					<p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
						Everything you need to know about The School Quiz
					</p>
				</header>

				<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
					{/* Category Navigation Sidebar */}
					<div className="lg:col-span-1">
						<div className="sticky top-24 space-y-2">
							{categories.map((category) => (
								<button
									key={category.name}
									onClick={() => scrollToCategory(category.name)}
									className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
										activeCategory === category.name
											? "bg-gray-100 dark:bg-[#1A1F2E] font-semibold text-neutral-900 dark:text-white"
											: "text-neutral-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
									}`}
								>
									{category.name}
								</button>
							))}
						</div>
					</div>

					{/* FAQ Content */}
					<div className="lg:col-span-3">
						<div className="space-y-8">
							{categories.map((category) => (
								<div
									key={category.name}
									ref={(el) => (categoryRefs.current[category.name] = el)}
									id={category.name.toLowerCase().replace(/\s+/g, "-")}
									data-category={category.name}
								>
									<h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
										{category.name}
									</h3>
									<div className="space-y-3">
										{category.faqs.map((faq, index) => (
											<FAQItem
												key={index}
												question={faq.question}
												answer={faq.answer}
											/>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="rounded-2xl border border-gray-200 dark:border-[#2D3748] bg-white dark:bg-[#1A1F2E] overflow-hidden">
			<button
				type="button"
				className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl transition-colors"
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
				aria-controls={`faq-answer-${question}`}
			>
				<span className="text-lg font-semibold text-neutral-900 dark:text-white pr-8">
					{question}
				</span>
				{isOpen ? (
					<ChevronUp className="h-5 w-5 text-neutral-600 dark:text-neutral-400 flex-shrink-0" />
				) : (
					<ChevronDown className="h-5 w-5 text-neutral-600 dark:text-neutral-400 flex-shrink-0" />
				)}
			</button>

			<div
				id={`faq-answer-${question}`}
				className={`overflow-hidden transition-all duration-300 ease-in-out ${
					isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
				}`}
			>
				<div className="px-6 pb-6">
					<p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
						{answer}
					</p>
				</div>
			</div>
		</div>
	);
}

