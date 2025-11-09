import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import AnswerReveal from "../AnswerReveal";
import { QuizQuestion, QuizRound, QuizThemeMode } from "./types";

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
}: MobileGridLayoutProps) {
  const roundLookup = useMemo(() => {
    return rounds.reduce<Record<number, QuizRound>>((map, round) => {
      map[round.number] = round;
      return map;
    }, {});
  }, [rounds]);

  const getRoundAccent = (roundNumber: number) => {
    const palette = [
      baseColor,
      "#2DD4BF",
      "#F97316",
      "#FACC15",
      "#C084FC",
    ];
    return roundNumber === finaleRoundNumber
      ? palette[palette.length - 1]
      : palette[(roundNumber - 1) % palette.length] || baseColor;
  };

  const getQuestionStatus = (question: QuizQuestion): "idle" | "revealed" | "correct" | "incorrect" => {
    if (correctAnswers.has(question.id)) return "correct";
    if (incorrectAnswers.has(question.id)) return "incorrect";
    if (revealedAnswers.has(question.id)) return "revealed";
    return "idle";
  };

  const totalCorrect = correctAnswers.size;
  const textIsLight = textColor === "white";
  const revealTextColor = textIsLight ? "white" : "black";
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
      el.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
      onActiveQuestionSync?.();
    });
  }, [activeQuestionId, onActiveQuestionSync]);

  return (
    <div
      className="relative min-h-dvh overflow-hidden"
      style={{
        background: pageBackground,
        color: textIsLight ? "#fffef5" : "var(--color-text)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{ background: pageBackground }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <header
          className="sticky top-0 z-30 px-5 pb-6 pt-8 transition-[padding,backdrop-filter] duration-500 ease-out sm:px-8 md:px-12"
          style={{
            background: "transparent",
            color: textIsLight ? "#fffef5" : "var(--color-text)",
          }}
        >
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                {quizNumberLabel && (
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${pillBackgroundClass} ${pillTextClass}`}
                  >
                    {quizNumberLabel}
                  </span>
                )}
                {formattedWeek && (
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${pillBackgroundClass} ${pillTextClass}`}
                  >
                    <CalendarDays className="h-4 w-4" />
                    {formattedWeek}
                  </span>
                )}
              </div>
            </div>
            <h1
              className="font-extrabold leading-tight"
              style={{ fontSize: "clamp(2.4rem, 2rem + 1.4vw, 3.2rem)" }}
            >
              {quizTitle}
            </h1>
            {quizTags.length ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {quizTags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center rounded-full px-3.5 py-1.5 font-medium transition-colors duration-200 ${pillBackgroundClass} ${pillTextClass}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </header>

        <main
          className="relative flex-1 px-5 pb-36 pt-8 sm:px-8 sm:pb-40 md:px-12 md:pb-44 lg:px-16"
          style={{
            paddingBottom: "max(18vh, 190px)",
            transition: "padding 0.4s ease",
            background: "transparent",
          }}
        >
          <section className="quiz-grid-layout">
            {questions.map((question, index) => {
              const status = getQuestionStatus(question);
              const round = roundLookup[question.roundNumber];
              const accentColor = getRoundAccent(question.roundNumber);
              const roundLabel = round ? round.title || `Round ${question.roundNumber}` : `Round ${question.roundNumber}`;
              const isFinale = question.roundNumber === finaleRoundNumber;
              const showRoundIntro =
                index === 0 || questions[index - 1].roundNumber !== question.roundNumber;

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
                borderColor: "rgba(255,255,255,0.4)",
                color: textIsLight ? "rgba(17,17,17,0.9)" : "var(--color-text)",
                boxShadow: "none",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
              };

              const statusStyle: React.CSSProperties = {};

              return (
                <React.Fragment key={question.id}>
                  {showRoundIntro && round && (
                    <motion.section
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="mb-6 w-full rounded-[26px] border px-7 py-7 sm:px-9 sm:py-8"
                      style={{
                        background: `color-mix(in srgb, ${accentColor} 18%, rgba(255,255,255,0.95) 82%)`,
                        borderColor: `color-mix(in srgb, ${accentColor} 20%, rgba(255,255,255,0.7))`,
                        boxShadow: `0 12px 28px ${accentColor?.concat("2b") ?? "rgba(17,17,17,0.08)"}`,
                      }}
                      aria-label={`Round ${round.number} overview`}
                    >
                      <div className="flex flex-col gap-4">
                        <span
                          className="inline-flex w-fit items-center gap-3 rounded-full px-7 py-3 text-[clamp(1.15rem,1.05rem+0.45vw,1.55rem)] font-semibold tracking-tight text-left sm:px-8 sm:py-3.5 sm:text-[clamp(1.3rem,1.15rem+0.4vw,1.7rem)]"
                          style={{
                            background: accentColor,
                            color: "#0f0f0f",
                            boxShadow: accentColor ? `0 12px 24px ${accentColor}29` : "0 12px 24px rgba(17,17,17,0.08)",
                          }}
                        >
                          <span className="opacity-90">
                            Round {round.number}: <span className="font-bold">{round.title || `Round ${round.number}`}</span>
                          </span>
                        </span>
                        {round.blurb && (
                          <p className="text-left text-[clamp(1rem,0.9rem+0.5vw,1.2rem)] leading-relaxed text-black/68">
                            {round.blurb}
                          </p>
                        )}
                      </div>
                    </motion.section>
                  )}

                  <motion.article
                    id={`mobile-question-${question.id}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: Math.min(index * 0.03, 0.24),
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="group relative flex flex-col gap-7 overflow-hidden rounded-[26px] border px-7 sm:px-9 py-8 sm:py-10 transition-[transform,box-shadow] duration-200 will-change-transform"
                    style={{ ...baseCardStyle, ...statusStyle, scrollMarginTop: "120px", boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)" }}
                    aria-label={`${roundLabel} question`}
                  >
                    <div className="flex flex-col gap-6 w-full">
                      <h2
                        className="text-left font-extrabold tracking-tight text-balance w-full"
                        style={{
                          fontSize: "clamp(2rem, 1.4rem + 2.2vw, 3rem)",
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
          </section>
        </main>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed bottom-6 right-6 z-40 sm:bottom-8 sm:right-8"
        >
          <div
            className="pointer-events-auto rounded-full px-5 py-3 text-[clamp(1rem,0.95rem+0.35vw,1.25rem)] font-semibold tracking-[0.08em] sm:px-6 sm:py-3.5"
            style={{
              background: textIsLight ? "rgba(0,0,0,0.72)" : "rgba(17,17,17,0.9)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            Score {totalCorrect}/{questions.length}
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
