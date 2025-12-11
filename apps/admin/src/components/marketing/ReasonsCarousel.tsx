"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getModernColor } from "@/lib/colors";
import { textOn } from "@/lib/contrast";
import { cn } from "@/lib/utils";

export function ReasonsCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);

    const reasons = [
        {
            title: "Born out of frustration",
            subline: "Designed by a teacher who wanted something better than the usual mix of clumsy Kahoots, generic quiz content, and weekly trivia that never seems to match what students actually know or care about.",
            pills: ["Teacher-built", "Carefully curated", "Well balanced", "No AI slop"],
            colorHex: getModernColor(0),
        },
        {
            title: "Written by a high school teacher",
            subline: "After a decade in the classroom, I've learnt that genuine relationships are the foundation of engaged learning. This quiz has been shaped by years of conversations with students and refined through their feedback.",
            pills: ["10 years experience", "Student-informed", "Relationship-focused", "Teacher-written"],
            colorHex: getModernColor(1),
        },
        {
            title: "No AI",
            subline: "Discussing the recent phenomenon of 'AI slop' (Macquarie Dictionary 2025 Word of the Year). Students are a bit bored of AI-generated content and think it's lazy. Every question here is written by hand, with care.",
            pills: ["Hand-written", "No AI slop", "Thoughtfully crafted", "Human-made"],
            aiSlopLink: "https://www.abc.net.au/news/2025-01-28/macquarie-dictionary-word-of-the-year-ai-slop/103400000",
            colorHex: getModernColor(2),
        },
        {
            title: "Made for an Aussie classroom",
            subline: "Featuring Australian current affairs, local events, sport, and the things young people are talking about right now.",
            pills: ["Current events", "What's buzzing in Aus", "Headlines of the week", "Sport & big moments"],
            hasFlag: true,
            colorHex: getModernColor(3),
        },
        {
            title: "Built for pastoral time",
            subline: "Works for tutor groups, quick check-ins, and everything in between. Flexible and low-pressure. Start, pause, resume. Perfect for connection in short bursts.",
            pills: ["Flexible start/pause/resume", "Pastoral", "Short-window friendly", "Zero prep"],
            colorHex: getModernColor(4),
        },
        {
            title: "Easy to run",
            subline: "Switch between presenter mode, Quick View, or a printable PDF. However you teach, it's ready to go with zero setup.",
            pills: ["Presenter mode", "Quick View", "Printable PDF", "Zero setup"],
            colorHex: getModernColor(5),
        },
        {
            title: "Balanced for high school students",
            subline: "Designed for Aussie teenagers with a fair difficulty curve. Accessible, clever, and fun, with fresh topics and rotating categories each week to keep it engaging for everyone.",
            pills: ["Fair difficulty", "Not brutal", "Balanced for students", "Varied each week"],
            colorHex: getModernColor(6),
        },
        {
            title: "Curriculum aware",
            subline: "Subject-based questions (history, geography, science, sport) reflect content students actually study across Australian secondary curriculums, not left-field trivia.",
            pills: ["History", "Geography", "Science", "Sport", "Culture", "English", "Maths"],
            colorHex: getModernColor(7),
        },
        {
            title: "Cultural events",
            subline: "Celebrating the diversity of Australia. From Aboriginal and Torres Strait Islander culture and history to key cultural moments, festivals, and national observances across the year.",
            pills: ["Aboriginal culture", "Torres Strait Islander", "Cultural awareness"],
            aboriginalTheme: true,
            colorHex: getModernColor(8),
        },
        {
            title: "Social, not silent",
            subline: "Built for real interaction. No heads in laptops. Just conversation, teamwork, and a bit of fun that supports connection and wellbeing.",
            pills: ["Class connection", "Social", "Fun", "Wellbeing"],
            colorHex: getModernColor(9),
        },
        {
            title: "Healthy competition",
            subline: "Use the public leaderboard or create your own leagues for houses, cohorts, or mentor groups. The overall goals are connection and engagement. Competition that stays friendly.",
            pills: ["Public leaderboard", "Private leagues"],
            colorHex: getModernColor(10),
        },
        {
            title: "Fresh every week",
            subline: "Topical, consistent, and reliable. A new quiz drops every Monday morning, so you're never scrambling for content mid-lesson. Replay past quizzes or dip back into older ones whenever you need.",
            pills: ["Topical", "Consistent", "Reliable", "Replayable"],
            colorHex: getModernColor(11),
        },
        {
            title: "Classroom-safe content",
            subline: "Every question is written and curated with care. Clear, precise, and age-appropriate. No surprises, no awkward moments.",
            pills: ["Age-appropriate", "Checked", "Classroom-safe"],
            colorHex: getModernColor(0),
        },
        {
            title: "Zero setup",
            subline: "No logins, no apps, no downloads. Just open and run it with your class.",
            pills: ["No logins", "No apps", "No downloads", "Instant start"],
            colorHex: getModernColor(1),
        },
    ];

    // Show 3 cards at a time on desktop, 1 on mobile
    const cardsToShow = 3;
    const maxIndex = Math.max(0, reasons.length - cardsToShow);

    const goToNext = () => {
        setIsAutoScrolling(false);
        setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
    };

    const goToPrevious = () => {
        setIsAutoScrolling(false);
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
    };

    const goToIndex = (index: number) => {
        setIsAutoScrolling(false);
        // When clicking a dot, show that card as the first visible card
        const targetIndex = Math.min(index, maxIndex);
        setCurrentIndex(targetIndex);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                goToPrevious();
            } else if (e.key === "ArrowRight") {
                goToNext();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [maxIndex]);

    // Get visible cards based on current index
    const visibleReasons = reasons.slice(currentIndex, currentIndex + cardsToShow);
    // On mobile, show only one card
    const mobileVisibleReasons = reasons.slice(currentIndex, currentIndex + 1);

    return (
        <motion.section
            className="w-full py-16 sm:py-20 md:py-24 px-6 sm:px-8 md:px-12 lg:px-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10 sm:mb-12">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        The story behind The School Quiz
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Created by a classroom teacher who saw a gap between what students enjoy and what most quizzes deliver.
                    </p>
                </div>

                {/* Carousel Container */}
                <div className="relative group">
                    {/* Desktop: 3 cards */}
                    <div className="hidden md:grid md:grid-cols-3 gap-6 md:gap-8 relative">
                        {/* Navigation Arrows - Subtle, only visible on hover */}
                        <button
                            onClick={goToPrevious}
                            disabled={currentIndex === 0}
                            className={`absolute -left-4 sm:-left-6 md:-left-8 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/40 dark:border-gray-700/40 shadow-lg transition-all z-10 opacity-0 group-hover:opacity-100 ${currentIndex === 0
                                ? "cursor-not-allowed opacity-0"
                                : "hover:bg-white dark:hover:bg-gray-900 hover:shadow-xl hover:scale-110"
                                }`}
                            aria-label="Previous"
                        >
                            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300" />
                        </button>
                        <button
                            onClick={goToNext}
                            disabled={currentIndex >= maxIndex}
                            className={`absolute -right-4 sm:-right-6 md:-right-8 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/40 dark:border-gray-700/40 shadow-lg transition-all z-10 opacity-0 group-hover:opacity-100 ${currentIndex >= maxIndex
                                ? "cursor-not-allowed opacity-0"
                                : "hover:bg-white dark:hover:bg-gray-900 hover:shadow-xl hover:scale-110"
                                }`}
                            aria-label="Next"
                        >
                            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300" />
                        </button>
                        <AnimatePresence>
                            {visibleReasons.map((reason, idx) => {
                                // More varied and pronounced rotations for friendliness
                                const rotations = [-2.5, 2, -1.8];
                                const baseRotation = rotations[idx] || (idx % 2 === 0 ? -2 : 1.5);
                                // Determine text color based on background
                                const textColor = textOn(reason.colorHex);
                                const isLightText = textColor === "white";
                                return (
                                    <motion.div
                                        key={`${currentIndex}-${idx}`}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0, rotate: baseRotation }}
                                        exit={{ opacity: 0, x: -20 }}
                                        whileHover={{ rotate: baseRotation * 0.3, scale: 1.02, y: -4 }}
                                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 }}
                                        className="flex flex-col p-7 md:p-8 rounded-2xl border border-white/20"
                                        style={{
                                            backgroundColor: reason.colorHex,
                                        }}
                                    >
                                        <div>
                                            {/* Heading */}
                                            <h3 className={cn(
                                                "text-lg md:text-xl font-semibold mb-3 leading-tight",
                                                isLightText
                                                    ? "text-white drop-shadow-lg"
                                                    : "text-gray-900"
                                            )}>
                                                {reason.title}
                                            </h3>

                                            {/* Subline */}
                                            <p className={cn(
                                                "text-sm md:text-base mb-4 leading-relaxed",
                                                isLightText
                                                    ? "text-white/90 drop-shadow-md"
                                                    : "text-gray-800"
                                            )}>
                                                {reason.aiSlopLink ? (
                                                    <>
                                                        {reason.subline.split("'AI slop'").map((part, idx) => {
                                                            if (idx === 0) return part;
                                                            return (
                                                                <React.Fragment key={idx}>
                                                                    <a
                                                                        href={reason.aiSlopLink}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className={cn(
                                                                            "underline hover:no-underline font-medium",
                                                                            isLightText ? "text-white" : "text-gray-900"
                                                                        )}
                                                                        title="Read about 'AI slop' - Macquarie Dictionary 2025 Word of the Year"
                                                                    >
                                                                        'AI slop'
                                                                    </a>
                                                                    {part}
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </>
                                                ) : (
                                                    reason.subline
                                                )}
                                            </p>

                                            {/* Pills */}
                                            <div className="mt-auto flex flex-wrap gap-1.5">
                                                {reason.pills.map((pill) => (
                                                    <span
                                                        key={pill}
                                                        className={cn(
                                                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border",
                                                            isLightText
                                                                ? "bg-white/20 text-white border-white/30 backdrop-blur-sm"
                                                                : "bg-white/90 text-gray-900 border-white/50"
                                                        )}
                                                    >
                                                        {pill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Mobile: 1 card */}
                    <div className="md:hidden relative group">
                        {/* Navigation Arrows for Mobile - Subtle */}
                        <button
                            onClick={goToPrevious}
                            disabled={currentIndex === 0}
                            className={`absolute -left-4 sm:-left-6 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-md transition-all z-10 ${currentIndex === 0
                                ? "opacity-30 cursor-not-allowed"
                                : "hover:bg-white dark:hover:bg-gray-900 hover:shadow-lg active:scale-95"
                                }`}
                            aria-label="Previous"
                        >
                            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300" />
                        </button>
                        <button
                            onClick={goToNext}
                            disabled={currentIndex >= maxIndex}
                            className={`absolute -right-4 sm:-right-6 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-md transition-all z-10 ${currentIndex >= maxIndex
                                ? "opacity-30 cursor-not-allowed"
                                : "hover:bg-white dark:hover:bg-gray-900 hover:shadow-lg active:scale-95"
                                }`}
                            aria-label="Next"
                        >
                            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300" />
                        </button>
                        <AnimatePresence>
                            {mobileVisibleReasons.map((reason) => {
                                // Vary rotation based on card index for friendliness
                                const mobileRotations = [-2.5, 2, -1.8, 1.5, -2, 1.8, -1.5, 2.2, -2.2, 1.2, -1.2];
                                const mobileRotation = mobileRotations[currentIndex % mobileRotations.length] || (currentIndex % 2 === 0 ? -2 : 1.5);
                                // Determine text color based on background
                                const textColor = textOn(reason.colorHex);
                                const isLightText = textColor === "white";
                                return (
                                    <motion.div
                                        key={currentIndex}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0, rotate: mobileRotation }}
                                        exit={{ opacity: 0, x: -20 }}
                                        whileHover={{ rotate: mobileRotation * 0.3, scale: 1.02, y: -4 }}
                                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                        className="flex flex-col p-7 md:p-8 rounded-2xl border border-white/20"
                                        style={{
                                            backgroundColor: reason.colorHex,
                                        }}
                                    >
                                        <div>
                                            {/* Heading */}
                                            <h3 className={cn(
                                                "text-lg md:text-xl font-semibold mb-3 leading-tight",
                                                isLightText
                                                    ? "text-white drop-shadow-lg"
                                                    : "text-gray-900"
                                            )}>
                                                {reason.title}
                                            </h3>

                                            {/* Subline */}
                                            <p className={cn(
                                                "text-sm md:text-base mb-4 leading-relaxed",
                                                isLightText
                                                    ? "text-white/90 drop-shadow-md"
                                                    : "text-gray-800"
                                            )}>
                                                {reason.aiSlopLink ? (
                                                    <>
                                                        {reason.subline.split("'AI slop'").map((part, idx) => {
                                                            if (idx === 0) return part;
                                                            return (
                                                                <React.Fragment key={idx}>
                                                                    <a
                                                                        href={reason.aiSlopLink}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className={cn(
                                                                            "underline hover:no-underline font-medium",
                                                                            isLightText ? "text-white" : "text-gray-900"
                                                                        )}
                                                                        title="Read about 'AI slop' - Macquarie Dictionary 2025 Word of the Year"
                                                                    >
                                                                        'AI slop'
                                                                    </a>
                                                                    {part}
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </>
                                                ) : (
                                                    reason.subline
                                                )}
                                            </p>

                                            {/* Pills */}
                                            <div className="mt-auto flex flex-wrap gap-1.5">
                                                {reason.pills.map((pill) => (
                                                    <span
                                                        key={pill}
                                                        className={cn(
                                                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border",
                                                            isLightText
                                                                ? "bg-white/20 text-white border-white/30 backdrop-blur-sm"
                                                                : "bg-white/90 text-gray-900 border-white/50"
                                                        )}
                                                    >
                                                        {pill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Dot Indicators */}
                    <div className="flex justify-center gap-2 mt-6 sm:mt-8">
                        {reasons.map((_, index) => {
                            // Highlight dot if it's in the visible range
                            const isVisible = index >= currentIndex && index < currentIndex + cardsToShow;
                            const isFirstVisible = index === currentIndex;

                            return (
                                <button
                                    key={index}
                                    onClick={() => goToIndex(index)}
                                    className={`h-2 rounded-full transition-all duration-200 ${isFirstVisible
                                        ? "w-8 bg-gray-900 dark:bg-gray-100"
                                        : isVisible
                                            ? "w-3 bg-gray-500 dark:bg-gray-400"
                                            : "w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                                        }`}
                                    aria-label={`Go to reason ${index + 1}`}
                                />
                            );
                        })}
                    </div>

                    {/* Find out more button */}
                    <div className="flex justify-center mt-8 sm:mt-10">
                        <Link
                            href="/about"
                            className="inline-flex items-center justify-center h-12 px-4 sm:px-6 bg-[#3B82F6] text-white rounded-full text-sm sm:text-base font-medium hover:bg-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
                        >
                            Find out more
                        </Link>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
