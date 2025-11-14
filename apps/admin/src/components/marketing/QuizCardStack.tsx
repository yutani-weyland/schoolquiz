"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CardStack } from "@/components/ui/card-stack";
import { formatWeek } from "@/lib/format";
import { textOn } from "@/lib/contrast";
import { cn } from "@/lib/utils";
import { Play, Calendar } from "lucide-react";
import type { Quiz } from "@/components/quiz/QuizCard";

interface QuizCardStackProps {
  quizzes: Quiz[];
}

export function QuizCardStack({ quizzes }: QuizCardStackProps) {
  // Show more cards on larger screens: 5 on mobile, 7 on tablet, 8 on desktop
  const [cardCount, setCardCount] = React.useState(5);
  
  React.useEffect(() => {
    const updateCardCount = () => {
      if (window.innerWidth >= 1024) {
        setCardCount(8); // Desktop: 8 cards
      } else if (window.innerWidth >= 640) {
        setCardCount(7); // Tablet: 7 cards
      } else {
        setCardCount(5); // Mobile: 5 cards
      }
    };
    
    updateCardCount();
    window.addEventListener('resize', updateCardCount);
    return () => window.removeEventListener('resize', updateCardCount);
  }, []);
  
  const displayQuizzes = quizzes.slice(0, cardCount);
  
  return (
    <section className="w-full py-16 px-4 sm:px-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center">
          <CardStack className="mb-8">
            {displayQuizzes.map((quiz) => {
              const text = textOn(quiz.colorHex);
              const formattedDate = formatWeek(quiz.weekISO);
              
              // Get first 5 tags, truncate long ones
              const displayTags = (quiz.tags || []).slice(0, 5).map(tag => {
                // Truncate tags that are too long
                if (tag.length > 15) {
                  return tag.substring(0, 12) + '...';
                }
                return tag;
              });
              
              const invert = text === "white" ? "text-white" : "text-gray-900";
              const sub = text === "white" ? "text-white/90" : "text-gray-800/80";
              
              return (
                <div
                  key={quiz.id}
                  className={cn(
                    "rounded-3xl shadow-lg h-full w-full flex flex-col relative overflow-hidden",
                    // Fixed padding at breakpoints for predictable scaling
                    "p-4",
                    "sm:p-6",
                    "md:p-7",
                    "lg:p-9",
                    "xl:p-10",
                    // Remove fixed min-height, let aspect ratio handle it
                    "aspect-[5/7.5]"
                  )}
                  style={{ 
                    backgroundColor: quiz.colorHex,
                  }}
                >
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/10 pointer-events-none rounded-3xl opacity-0" />
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-5 lg:mb-6">
                      <div className="flex items-center gap-2 sm:gap-3 flex-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full font-bold whitespace-nowrap",
                            "px-2.5 sm:px-3 md:px-3.5 lg:px-4 xl:px-5",
                            "py-1 sm:py-1.5 md:py-2",
                            "text-sm sm:text-sm md:text-base lg:text-lg xl:text-xl",
                            invert,
                            "bg-black/10 bg-clip-padding"
                          )}
                        >
                          #{quiz.id}
                        </span>
                      </div>
                      <span className={cn(
                        "inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5 font-medium flex-shrink-0",
                        "text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl",
                        sub
                      )}>
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7" aria-hidden />
                        {formattedDate}
                      </span>
                    </div>
                    
                    <h3 className={cn(
                      "font-extrabold leading-tight",
                      "text-xl sm:text-2xl md:text-3xl lg:text-5xl xl:text-6xl",
                      "mb-2 sm:mb-3 md:mb-4 lg:mb-5",
                      invert,
                      "relative z-10"
                    )}>
                      {quiz.title}
                    </h3>
                    
                    {quiz.blurb && (
                      <p className={cn(
                        "line-clamp-2 sm:line-clamp-none",
                        "text-base sm:text-base md:text-lg lg:text-xl xl:text-2xl",
                        "mb-3 sm:mb-4 md:mb-5 lg:mb-6",
                        "leading-relaxed",
                        sub
                      )}>
                        {quiz.blurb}
                      </p>
                    )}
                    
                    {/* Categories tags - exactly 5 */}
                    {displayTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 mb-3 sm:mb-4 md:mb-5 lg:mb-6">
                        {displayTags.map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                          className={cn(
                            "rounded-full font-medium",
                            "px-2 sm:px-2.5 md:px-3 lg:px-4 xl:px-5",
                            "py-1 sm:py-1.5 md:py-2",
                            "text-sm sm:text-sm md:text-base lg:text-lg xl:text-xl",
                            text === "white" ? "bg-white/20 text-white" : "bg-black/10 text-gray-900"
                          )}
                        >
                          {tag}
                        </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Play button */}
                    <Link
                      href={`/quizzes/${quiz.slug}/intro`}
                      className={cn(
                        "inline-flex items-center justify-center mt-auto rounded-full w-full",
                        "gap-1.5 sm:gap-2",
                        "px-4 sm:px-5 md:px-6 lg:px-7 xl:px-8",
                        "py-3 sm:py-3.5 md:py-4 lg:py-5 xl:py-6",
                        "font-semibold text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl",
                        "transition-all duration-200",
                        "hover:scale-105 active:scale-95",
                        "overflow-hidden"
                      )}
                      style={{
                        backgroundColor: text === "white" ? "rgba(255, 255, 255, 0.9)" : "rgb(17, 24, 39)",
                        color: text === "white" ? "rgb(17, 24, 39)" : "white",
                      }}
                      onMouseEnter={(e) => {
                        if (text === "white") {
                          e.currentTarget.style.backgroundColor = "white";
                        } else {
                          e.currentTarget.style.backgroundColor = "rgb(31, 41, 55)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (text === "white") {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
                        } else {
                          e.currentTarget.style.backgroundColor = "rgb(17, 24, 39)";
                        }
                      }}
                    >
                      <Play className="w-3 h-3 sm:w-4 sm:h-4 md:w-4 md:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 fill-current flex-shrink-0" />
                      Play quiz
                    </Link>
                  </div>
                </div>
              );
            })}
          </CardStack>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mt-12"
        >
          <Link
            href="/quizzes"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-blue-600 dark:bg-blue-500 text-white font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Explore the quiz collection
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
