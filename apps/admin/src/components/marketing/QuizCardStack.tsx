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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            A new quiz every week
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Explore our back catalogue of weekly quizzes and discover past challenges
          </p>
        </motion.div>
        
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
                    "rounded-3xl p-4 sm:p-7 md:p-9 shadow-lg h-full flex flex-col relative overflow-hidden",
                    "min-h-[320px] sm:min-h-[430px]"
                  )}
                  style={{ 
                    backgroundColor: quiz.colorHex,
                  }}
                >
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/10 pointer-events-none rounded-3xl opacity-0" />
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 flex-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold",
                            invert,
                            "bg-black/10 bg-clip-padding whitespace-nowrap"
                          )}
                        >
                          #{quiz.id}
                        </span>
                      </div>
                      <span className={cn(
                        "inline-flex items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base font-medium flex-shrink-0",
                        sub
                      )}>
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" aria-hidden />
                        {formattedDate}
                      </span>
                    </div>
                    
                    <h3 className={cn(
                      "text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight mb-2 sm:mb-4 md:mb-5",
                      invert,
                      "relative z-10 min-h-[2.5rem] sm:min-h-[3.5rem] md:min-h-[4.5rem]"
                    )}>
                      {quiz.title}
                    </h3>
                    
                    {quiz.blurb && (
                      <p className={cn(
                        "text-xs sm:text-sm md:text-base mb-3 sm:mb-5 md:mb-7 line-clamp-2 sm:line-clamp-none",
                        sub
                      )}>
                        {quiz.blurb}
                      </p>
                    )}
                    
                    {/* Categories tags - exactly 5 */}
                    {displayTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-2.5 mb-auto">
                        {displayTags.map((tag, index) => (
                          <span
                            key={`${tag}-${index}`}
                            className={cn(
                              "px-2 sm:px-3 md:px-3.5 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium",
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
                        "inline-flex items-center justify-center gap-1.5 sm:gap-2 mt-auto",
                        "px-4 sm:px-5 md:px-6 lg:px-8 py-2 sm:py-2.5 md:py-3 rounded-full",
                        "font-semibold text-xs sm:text-sm md:text-base",
                        "transition-all duration-200",
                        "hover:scale-105 active:scale-95"
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
                      <Play className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:w-5 fill-current" />
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
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            View All Quizzes
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
