import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Flag } from "lucide-react";
import AnswerReveal from "../AnswerReveal";
import { QuizQuestion, QuizRound, QuizThemeMode } from "./types";
import { textOn } from "@/lib/contrast";

interface MobileGridLayoutProps {
  questions: QuizQuestion[];
  rounds: QuizRound[];
  revealedAnswers: Set<number>;
  correctAnswers: Set<number>;
  incorrectAnswers: Set<number>;
  textColor: string;
  themeMode: QuizThemeMode;
  backgroundColor: string;
  onRevealAnswer: (id: number) => void;
  onHideAnswer: (id: number) => void;
  onMarkCorrect: (id: number, event?: React.MouseEvent<HTMLButtonElement>) => void;
  onUnmarkCorrect: (id: number) => void;
  quizTitle: string;
  baseColor: string;
  finaleRoundNumber: number;
  activeQuestionId?: number;
  onActiveQuestionSync?: () => void;
  quizSlug?: string;
  weekISO?: string;
  onFinish?: () => void;
}

export function MobileGridLayout({
  questions,
  rounds,
  revealedAnswers,
  correctAnswers,
  incorrectAnswers,
  textColor,
  themeMode,
  backgroundColor,
  onRevealAnswer,
  onHideAnswer,
  onMarkCorrect,
  onUnmarkCorrect,
  quizTitle,
  baseColor,
  finaleRoundNumber,
  activeQuestionId,
  onActiveQuestionSync,
  quizSlug,
  weekISO,
  onFinish,
}: MobileGridLayoutProps) {
  const [visibleRoundTitle, setVisibleRoundTitle] = useState<number | null>(null);
  const roundTitleRefs = useRef<Map<number, HTMLElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const roundLookup = useMemo(() => {
    return rounds.reduce<Record<number, QuizRound>>((map, round) => {
      map[round.number] = round;
      return map;
    }, {});
  }, [rounds]);

  // Optimized: Track which round title is currently visible on screen
  // Use throttling and memoization to reduce calculations
  const checkVisibleRoundTitles = useCallback(() => {
    const visibleRounds: number[] = [];
    const viewportTop30 = window.innerHeight * 0.3;
    const viewportTop50 = window.innerHeight * 0.5;
    
    roundTitleRefs.current.forEach((element, roundNumber) => {
      if (!element) return;
      
      const rect = element.getBoundingClientRect();
      const isVisible = rect.top >= 0 && rect.top <= viewportTop30;
      
      if (isVisible) {
        visibleRounds.push(roundNumber);
      }
    });
    
    // If a round title is visible, hide the floating pill
    if (visibleRounds.length > 0) {
      setVisibleRoundTitle((prev) => prev !== null ? null : prev);
      return;
    }
    
    // Find the current round based on questions in viewport - optimized
    // Only check questions that are likely in viewport
    let currentRound: number | null = null;
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    
    // Binary search optimization: find first question in viewport
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const el = document.getElementById(`mobile-question-${question.id}`);
      if (!el) continue;
      
      const rect = el.getBoundingClientRect();
      if (rect.top >= 0 && rect.top <= viewportTop50) {
        currentRound = question.roundNumber;
        break; // Found first visible question, no need to continue
      }
    }
    
    setVisibleRoundTitle((prev) => prev !== currentRound ? currentRound : prev);
  }, [questions]);

  useEffect(() => {
    // Throttle scroll handler to reduce calculations
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          checkVisibleRoundTitles();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    checkVisibleRoundTitles(); // Initial check
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [checkVisibleRoundTitles]);

  // Memoize round accent color calculation
  const getRoundAccent = useMemo(() => {
    const palette = [
      "#2DD4BF", // Round 1 - teal (different from quiz color)
      "#F97316", // Round 2 - orange
      "#FACC15", // Round 3 - yellow
      "#8B5CF6", // Round 4 - purple
      "#C084FC", // Finale - lavender
    ];
    return (roundNumber: number) => {
      return roundNumber === finaleRoundNumber
        ? palette[palette.length - 1]
        : palette[(roundNumber - 1) % palette.length] || "#2DD4BF";
    };
  }, [finaleRoundNumber]);

  // Memoize question status calculation
  const getQuestionStatus = useCallback((question: QuizQuestion): "idle" | "revealed" | "correct" | "incorrect" => {
    if (correctAnswers.has(question.id)) return "correct";
    if (incorrectAnswers.has(question.id)) return "incorrect";
    if (revealedAnswers.has(question.id)) return "revealed";
    return "idle";
  }, [correctAnswers, incorrectAnswers, revealedAnswers]);

  const totalCorrect = correctAnswers.size;
  const textIsLight = textColor === "white";
  const revealTextColor = textIsLight ? "white" : "black";
  const allQuestionsAnswered = questions.every(q => 
    correctAnswers.has(q.id) || incorrectAnswers.has(q.id)
  );
  const pageBackground =
    themeMode === "colored"
      ? baseColor
      : backgroundColor || "var(--color-bg)";

  const quizNumberLabel = quizSlug ? `#${quizSlug}` : null;
  const quizTags = rounds.map((round) => round.title?.trim()).filter(Boolean).slice(0, 4);

  const isDarkTheme = themeMode === "dark";
  const pillBackgroundClass = isDarkTheme
    ? "bg-white/25 hover:bg-white/30"
    : "bg-black/10 hover:bg-black/15";
  const pillTextClass = isDarkTheme ? "text-white" : "text-gray-900";

  const formatWeekLabel = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  const formattedWeek = formatWeekLabel(weekISO);

  useEffect(() => {
    if (!activeQuestionId) return;
    const el = document.getElementById(`mobile-question-${activeQuestionId}`);
    if (!el) {
      onActiveQuestionSync?.();
      return;
    }
    requestAnimationFrame(() => {
      // Find the question index to determine if it's the first question
      const questionIndex = questions.findIndex(q => q.id === activeQuestionId);
      const isFirstQuestion = questionIndex === 0;
      
      // If first question, scroll to top; otherwise center it
      if (isFirstQuestion) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      }
      onActiveQuestionSync?.();
    });
  }, [activeQuestionId, onActiveQuestionSync, questions]);

  return (
    <div
      ref={scrollContainerRef}
      className="relative min-h-dvh overflow-hidden transition-colors duration-300 ease-in-out"
      style={{
        background: pageBackground,
        color: textIsLight ? "#fffef5" : "var(--color-text)",
        paddingBottom: "env(safe-area-inset-bottom)",
        transition: "background-color 300ms ease-in-out, color 300ms ease-in-out",
      }}
    >
      <div
        className="absolute inset-0 transition-colors duration-300 ease-in-out"
        style={{ 
          background: pageBackground,
          transition: "background-color 300ms ease-in-out",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <header
          className="sticky top-0 z-30 px-6 pb-6 pt-8 transition-[padding,backdrop-filter] duration-500 ease-out sm:px-8 md:px-12"
          style={{
            background: "transparent",
            color: textIsLight ? "#fffef5" : "var(--color-text)",
          }}
        >
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                {quizNumberLabel && (
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ease-in-out ${pillBackgroundClass} ${pillTextClass}`}
                  >
                    {quizNumberLabel}
                  </span>
                )}
                {formattedWeek && (
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 ease-in-out ${pillBackgroundClass} ${pillTextClass}`}
                  >
                    <CalendarDays className="h-4 w-4" />
                    {formattedWeek}
                  </span>
                )}
              </div>
            </div>
            <h1
              className="font-extrabold leading-tight px-1"
              style={{ fontSize: "clamp(2.4rem, 2rem + 1.4vw, 3.2rem)" }}
            >
              {quizTitle}
            </h1>
            {quizTags.length ? (
              <div className="flex flex-wrap items-center gap-2 text-sm px-1">
                {quizTags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center rounded-full px-3.5 py-1.5 font-medium transition-colors duration-300 ease-in-out ${pillBackgroundClass} ${pillTextClass}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </header>

        <main
          className="relative flex-1 px-6 pb-36 pt-10 sm:px-8 sm:pb-40 sm:pt-12 md:px-12 md:pb-44"
          style={{
            paddingBottom: "max(18vh, 190px)",
            transition: "padding 0.4s ease",
            background: "transparent",
          }}
        >
          {/* Fade-out overlay at top - mobile only */}
          <div
            className="fixed top-0 left-0 right-0 z-10 pointer-events-none md:hidden"
            style={{
              height: '60px',
              background: `linear-gradient(to bottom, ${pageBackground} 0%, ${pageBackground} 75%, rgba(0,0,0,0) 100%)`,
              transition: "background 300ms ease-in-out",
            }}
            aria-hidden="true"
          />
          <section className="quiz-grid-layout quiz-grid-single-column mx-auto max-w-5xl w-full">
            {questions.map((question, index) => {
              // Early return optimization: skip rendering if question data is invalid
              if (!question || !question.id) return null;
              const status = getQuestionStatus(question);
              const round = roundLookup[question.roundNumber];
              const accentColor = getRoundAccent(question.roundNumber);
              // Always show "The People's Round" for round 5
              const roundLabel = question.roundNumber === 5 
                ? "The People's Round"
                : (round ? round.title || `Round ${question.roundNumber}` : `Round ${question.roundNumber}`);
              const isFinale = question.roundNumber === finaleRoundNumber;
              const showRoundIntro =
                index === 0 || questions[index - 1].roundNumber !== question.roundNumber;
              
              // Generate subtle deterministic angle for questions (much smaller)
              // Range: -0.5 to +0.5 degrees
              const getQuestionAngle = (qIndex: number): number => {
                // Use question index to create subtle variation
                const baseAngle = ((qIndex % 3) - 1) * 0.25;
                return Math.max(-0.5, Math.min(0.5, baseAngle));
              };
              
              const questionAngle = getQuestionAngle(index);

              const surfaceAccent = accentColor || "#ffffff";
              const baseSurface = `color-mix(in srgb, #ffffff 92%, ${surfaceAccent} 8%)`;
              const numberCircleStyle: React.CSSProperties = {
                background: accentColor
                  ? `color-mix(in srgb, ${accentColor} 72%, #ffffff 28%)`
                  : "rgba(255,255,255,0.82)",
                color: accentColor ? `color-mix(in srgb, #0f0f0f 85%, ${accentColor} 15%)` : "#0f0f0f",
                borderColor: accentColor
                  ? `color-mix(in srgb, ${accentColor} 45%, rgba(255,255,255,0.6))`
                  : "rgba(17,17,17,0.18)",
                boxShadow: accentColor ? `0 16px 32px ${accentColor}2b` : "0 12px 28px rgba(17,17,17,0.1)",
              };

              const baseCardStyle: React.CSSProperties = {
                background: baseSurface,
                borderColor: `color-mix(in srgb, ${accentColor} 15%, rgba(255,255,255,0.4))`,
                borderWidth: '2px',
                color: textIsLight ? "rgba(17,17,17,0.9)" : "var(--color-text)",
                boxShadow: accentColor 
                  ? `0 18px 40px rgba(15, 23, 42, 0.08), 0 0 0 1px ${accentColor}20`
                  : "0 18px 40px rgba(15, 23, 42, 0.08)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                transition: "background-color 300ms ease-in-out, color 300ms ease-in-out, border-color 300ms ease-in-out",
              };

              const statusStyle: React.CSSProperties = {};

              // Memoize expensive style calculations
              const roundShadowMemo = useMemo(() => {
                if (!showRoundIntro || !round) return `0 12px 28px ${accentColor?.concat("2b") ?? "rgba(17,17,17,0.08)"}, 0 0 0 1px ${accentColor?.concat("40") ?? "rgba(17,17,17,0.1)"}`;
                const shadowOpacity = 0.18 + (round.number % 3) * 0.04;
                const shadowColor = accentColor ? `${accentColor}${Math.round(shadowOpacity * 255).toString(16).padStart(2, '0')}` : 'rgba(17,17,17,0.18)';
                const shadowColorSecondary = accentColor ? `${accentColor}${Math.round(shadowOpacity * 0.6 * 255).toString(16).padStart(2, '0')}` : 'rgba(17,17,17,0.1)';
                return `0 20px 40px ${shadowColor}, 0 8px 16px ${shadowColorSecondary}, 0 0 0 1px ${accentColor?.concat("40") ?? "rgba(17,17,17,0.1)"}`;
              }, [showRoundIntro, round, accentColor]);

              return (
                <React.Fragment key={question.id}>
                  {showRoundIntro && round && (
                    <motion.section
                      ref={(el) => {
                        if (el) {
                          roundTitleRefs.current.set(round.number, el);
                        } else {
                          roundTitleRefs.current.delete(round.number);
                        }
                      }}
                      initial={{ opacity: 0, y: 20, scale: 0.96 }}
                      animate={{ opacity: 1, y: -4, scale: 1 }}
                      transition={{ 
                        duration: 0.5, 
                        ease: [0.22, 1, 0.36, 1],
                        y: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
                      }}
                      className="mb-2 sm:mb-4 w-full rounded-[26px] border px-7 py-7 sm:px-9 sm:py-8 transition-all duration-300 ease-in-out relative"
                      style={{
                        gridColumn: '1 / -1',
                        background: `color-mix(in srgb, ${accentColor} 25%, rgba(255,255,255,0.95) 75%)`,
                        borderColor: `color-mix(in srgb, ${accentColor} 35%, rgba(255,255,255,0.7))`,
                        borderWidth: '2px',
                        boxShadow: roundShadowMemo,
                        transition: "background-color 300ms ease-in-out, border-color 300ms ease-in-out, box-shadow 300ms ease-in-out",
                      }}
                      aria-label={`Round ${round.number} overview`}
                    >
                      <div className="flex flex-col gap-6">
                        <h2
                          className="font-extrabold tracking-tight"
                          style={{
                            color: accentColor,
                            fontSize: 'clamp(2.75rem, 7vw, 4.5rem)',
                            lineHeight: '0.9',
                          }}
                        >
                          {round.number === 5 
                            ? "The People's Round"
                            : `Round ${round.number}: ${round.title || `Round ${round.number}`}`}
                        </h2>
                        {round.blurb && (
                          <p 
                            className="text-left text-[clamp(1rem,0.9rem+0.5vw,1.2rem)] leading-relaxed"
                            style={{
                              color: textOn(accentColor) === "black" ? "rgba(15, 15, 15, 0.68)" : "rgba(255, 255, 255, 0.85)"
                            }}
                          >
                            {round.blurb}
                          </p>
                        )}
                      </div>
                    </motion.section>
                  )}

                  <motion.article
                    id={`mobile-question-${question.id}`}
                    initial={{ opacity: 0, y: 16, rotate: questionAngle * 0.7 }}
                    animate={{ opacity: 1, y: 0, rotate: questionAngle }}
                    transition={{
                      duration: 0.4,
                      delay: Math.min(index * 0.03, 0.24),
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="group relative flex flex-col gap-8 overflow-hidden rounded-[26px] border px-7 sm:px-9 py-8 sm:py-10 transition-[transform,box-shadow] duration-200 transition-colors duration-300 ease-in-out will-change-transform"
                    style={{ ...baseCardStyle, ...statusStyle, scrollMarginTop: "120px", boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)" }}
                    aria-label={`${roundLabel} question`}
                  >
                    <div className="flex flex-col gap-8 w-full">
                      <h2
                        className="text-left font-extrabold tracking-tight text-balance w-full"
                        style={{
                          fontSize: "clamp(1.5rem, 1.2rem + 2vw, 2.5rem)",
                          lineHeight: 1.12,
                          textAlign: "left",
                        }}
                      >
                        {`${index + 1}. ${question.question}`}
                      </h2>

                      {isFinale && question.submittedBy && (
                        <motion.p
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 0.92, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.2 }}
                          className="text-left text-sm font-medium"
                          style={{
                            color: textIsLight ? "rgba(255,255,255,0.75)" : "rgba(17,17,17,0.7)",
                          }}
                        >
                          {formatSubmittedBy(question)}
                        </motion.p>
                      )}

                      <div className="pointer-events-auto w-full">
                        <AnswerReveal
                          size="compact"
                          answerText={question.answer}
                          revealed={revealedAnswers.has(question.id)}
                          onReveal={() => onRevealAnswer(question.id)}
                          onHide={() => onHideAnswer(question.id)}
                          accentColor={accentColor}
                          textColor={revealTextColor}
                          className={isDarkTheme ? "outline outline-2 outline-white/80" : undefined}
                          isMarkedCorrect={correctAnswers.has(question.id)}
                          isMarkedIncorrect={incorrectAnswers.has(question.id)}
                          onMarkCorrect={(event) => onMarkCorrect(question.id, event)}
                          onUnmarkCorrect={() => onUnmarkCorrect(question.id)}
                        />
                      </div>
                    </div>
                  </motion.article>
                </React.Fragment>
              );
            })}

            {/* Finish Button - At end of content, only show if not all questions answered */}
            {!allQuestionsAnswered && onFinish && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex justify-center mt-8 mb-4"
              >
                <motion.button
                  onClick={onFinish}
                  className={`rounded-full font-semibold flex items-center gap-2 sm:gap-3 transition-colors duration-300 ease-in-out whitespace-nowrap backdrop-blur-sm ${
                    textIsLight
                      ? "bg-white/20 text-white hover:bg-white/28"
                      : "bg-black/10 text-gray-900 hover:bg-black/15"
                  } px-5 py-2.5 sm:px-6 sm:py-3`}
                  aria-label="Finish quiz"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Flag className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base font-medium">Finish</span>
                </motion.button>
              </motion.div>
            )}
          </section>
        </main>

        {/* Floating Round Indicator Pill - Mobile Only */}
        <AnimatePresence>
          {visibleRoundTitle !== null && typeof window !== 'undefined' && window.innerWidth < 768 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed left-5 z-50 pointer-events-none md:hidden flex items-center"
              style={{
                top: '12px', // Match QuizHeader py-3 top padding - buttons are centered in flex container with items-center
                height: '48px', // Match button height (h-12 = 48px)
              }}
            >
              {(() => {
                const currentRound = rounds.find(r => r.number === visibleRoundTitle);
                const roundAccent = getRoundAccent(visibleRoundTitle || 1);
                const roundLabel = currentRound 
                  ? (currentRound.number === 5 
                      ? "The People's Round"
                      : `Round ${currentRound.number}: ${currentRound.title || `Round ${currentRound.number}`}`)
                  : `Round ${visibleRoundTitle}`;
                
                return (
                  <div
                    className="pointer-events-auto rounded-full px-4 py-2.5 text-sm font-semibold tracking-tight backdrop-blur-sm border transition-colors duration-300 ease-in-out"
                    style={{
                      background: `color-mix(in srgb, ${roundAccent} 85%, rgba(255,255,255,0.95) 15%)`,
                      borderColor: `color-mix(in srgb, ${roundAccent} 40%, rgba(255,255,255,0.6))`,
                      color: textOn(roundAccent) === "black" ? "#0f0f0f" : "#ffffff",
                      boxShadow: `0 8px 16px ${roundAccent}29, 0 0 0 1px ${roundAccent}30`,
                      height: '48px', // Match header button height
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {roundLabel}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Score Display - Bottom right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed bottom-6 right-6 z-40 sm:bottom-8 sm:right-8"
        >
          <div
            className={`pointer-events-auto rounded-full font-semibold flex items-center gap-2 sm:gap-3 md:gap-4 transition-colors duration-300 ease-in-out whitespace-nowrap backdrop-blur-sm ${
              textIsLight
                ? "bg-white/20 text-white hover:bg-white/28"
                : "bg-black/10 text-gray-900 hover:bg-black/15"
            } px-5 py-2.5 sm:px-8 sm:py-4 md:px-12 md:py-6`}
            aria-label={`Score: ${totalCorrect} out of ${questions.length}`}
          >
            <span className="text-sm sm:text-lg md:text-2xl font-medium opacity-90 leading-normal">Score:</span>
            <span className="text-xl sm:text-3xl md:text-5xl font-bold tabular-nums leading-none" style={{ letterSpacing: "-0.045em" }}>
              {totalCorrect} / {questions.length}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function formatSubmittedBy(question: QuizQuestion): string | null {
  if (!question.submittedBy) return null;

  if (question.submissionDisplayStyle === "anonymous") {
    return null;
  }

  if (question.submissionDisplayStyle === "first_name") {
    const parts = question.submittedBy.split(",").map((part) => part.trim());
    if (parts.length === 1) {
      return `Submitted by ${parts[0]}`;
    }
    return `Submitted by ${parts[0]} from ${parts.slice(1).join(", ")}`;
  }

  const parts = question.submittedBy.split(",").map((part) => part.trim());
  if (parts.length === 1) {
    return `Submitted by ${parts[0]}`;
  }
  const namePart = parts[0];
  const firstName = namePart.split(" ").slice(-1)[0];
  const schoolName = parts.slice(1).join(", ");
  return `Submitted by ${firstName} from ${schoolName}`;
}
