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
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface QuizCardStackProps {
  quizzes: Quiz[];
}

export function QuizCardStack({ quizzes }: QuizCardStackProps) {
  // Show more cards on larger screens: 5 on mobile, 7 on tablet, 8 on desktop
  const [cardCount, setCardCount] = React.useState(5);
  const [currentQuizStreak, setCurrentQuizStreak] = React.useState(0);
  
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

  // Fetch user's streak data
  React.useEffect(() => {
    const fetchStreak = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        const userId = localStorage.getItem('userId');
        
        if (!authToken || !userId) {
          // User not logged in, no streak to show
          return;
        }

        const response = await fetch('/api/stats', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'X-User-Id': userId,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentQuizStreak(data.streaks?.currentQuizStreak || 0);
        }
      } catch (error) {
        console.error('Failed to fetch streak:', error);
      }
    };

    fetchStreak();
  }, []);
  
  const displayQuizzes = quizzes.slice(0, cardCount);
  const showFireAnimation = currentQuizStreak >= 3;
  
  return (
    <section className="w-full py-16 px-4 sm:px-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center">
          <CardStack className="mb-8">
            {displayQuizzes.map((quiz, index) => {
              const text = textOn(quiz.colorHex);
              const formattedDate = formatWeek(quiz.weekISO);
              const isLastQuiz = index === displayQuizzes.length - 1;
              const shouldShowFire = showFireAnimation && isLastQuiz;
              
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
              
              // Only the top card (last in array, first visually) should be interactive
              const isTopCard = index === displayQuizzes.length - 1;
              
              const cardContent = (
                <div
                  className={cn(
                    "rounded-3xl shadow-lg h-full w-full flex flex-col relative overflow-hidden",
                    // Larger padding for bigger feel
                    "p-5",
                    "sm:p-7",
                    "md:p-8",
                    "lg:p-9",
                    "xl:p-9",
                    "2xl:p-9",
                    "aspect-[5/8]",
                    // Clickability cues - only for top card
                    isTopCard && "cursor-pointer transition-shadow duration-300 hover:shadow-xl hover:ring-2 hover:ring-white/30",
                    !isTopCard && "pointer-events-none"
                  )}
                  style={{ 
                    backgroundColor: quiz.colorHex,
                  }}
                >
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/10 pointer-events-none rounded-3xl opacity-0" />
                  
                  {/* Fire animation overlay - only on last quiz when streak >= 3 */}
                  {shouldShowFire && (
                    <div className="absolute bottom-0 left-0 right-0 pointer-events-none rounded-b-3xl z-[5] flex items-end justify-center overflow-hidden">
                      <div className="w-full h-1/3 flex items-end justify-center">
                        <DotLottieReact
                          src="/fire-streak.lottie"
                          loop
                          autoplay
                          className="w-full h-full"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="relative z-10 flex flex-col h-full min-h-0 overflow-hidden">
                  {/* Small microcopy - clickability cue with bounce animation - only on top card */}
                  {isTopCard && (
                    <motion.div 
                      className={cn(
                        "text-xs sm:text-sm font-medium opacity-60 mb-1 text-center flex-shrink-0",
                        sub
                      )}
                      animate={{
                        y: [0, -3, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      Tap to preview quiz →
                    </motion.div>
                  )}
                  
                  <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3 flex-shrink-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap min-w-0">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full font-bold whitespace-nowrap",
                          "px-2.5 sm:px-3 md:px-4",
                          "py-1 sm:py-1.5",
                          "text-sm sm:text-base md:text-lg",
                          invert,
                          "bg-black/10 bg-clip-padding"
                        )}
                      >
                        #{quiz.id}
                      </span>
                    </div>
                    <span className={cn(
                      "inline-flex items-center gap-1 font-medium flex-shrink-0",
                      "text-xs sm:text-sm md:text-base",
                      sub
                    )}>
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-4 md:w-4 flex-shrink-0" aria-hidden />
                      <span className="whitespace-nowrap">{formattedDate}</span>
                    </span>
                  </div>
                  
                  <h3 className={cn(
                    "font-extrabold leading-tight flex-shrink-0",
                    "text-2xl sm:text-3xl md:text-4xl lg:text-4xl",
                    "mb-2 sm:mb-3",
                    invert,
                    "relative z-10"
                  )}>
                    {quiz.title}
                  </h3>
                  
                  {quiz.blurb && (
                    <p className={cn(
                      "line-clamp-2 flex-shrink-0",
                      "text-sm sm:text-base md:text-lg",
                      "mb-2 sm:mb-3",
                      "leading-relaxed",
                      sub
                    )}>
                      {quiz.blurb}
                    </p>
                  )}
                  
                  {/* Categories tags - exactly 5 */}
                  {displayTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-auto flex-shrink-0">
                      {displayTags.map((tag, tagIndex) => (
                      <span
                        key={`${tag}-${tagIndex}`}
                        className={cn(
                          "rounded-full font-medium whitespace-nowrap",
                          "px-2.5 sm:px-3",
                          "py-1 sm:py-1.5",
                          "text-xs sm:text-sm md:text-base",
                          text === "white" ? "bg-white/20 text-white" : "bg-black/10 text-gray-900"
                        )}
                      >
                        {tag}
                      </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Play button - visual only, card handles click */}
                  <div
                    className={cn(
                      "inline-flex items-center justify-center mt-auto rounded-full w-full flex-shrink-0",
                      "gap-2",
                      "px-4 sm:px-5 md:px-6",
                      "py-2.5 sm:py-3 md:py-4",
                      "font-semibold text-sm sm:text-base md:text-lg",
                      "pointer-events-none"
                    )}
                    style={{
                      backgroundColor: text === "white" ? "rgba(255, 255, 255, 0.9)" : "rgb(17, 24, 39)",
                      color: text === "white" ? "rgb(17, 24, 39)" : "white",
                    }}
                  >
                    <Play className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 fill-current flex-shrink-0" />
                    Play quiz
                  </div>
                  </div>
                </div>
              );
              
              // Only wrap top card in Link
              if (isTopCard) {
                return (
                  <Link
                    key={quiz.id}
                    href={`/quizzes/${quiz.slug}/intro`}
                    className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                  >
                    {cardContent}
                  </Link>
                );
              }
              
              // Other cards are just visual
              return (
                <div key={quiz.id}>
                  {cardContent}
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
          className="text-center mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <Link
            href="/quizzes"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB] transition-colors"
          >
            Browse past quizzes
          </Link>
          <Link
            href={quizzes.length > 0 ? `/quizzes/${quizzes[quizzes.length - 1].slug}/intro` : "/quizzes"}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB] transition-colors"
          >
            Play the latest
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
