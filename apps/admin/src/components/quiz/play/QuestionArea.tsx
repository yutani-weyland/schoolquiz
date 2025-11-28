import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import AnswerReveal from "../AnswerReveal";
import { QuizQuestion, QuizRound } from "./types";

interface QuestionAreaProps {
  screen: "round-intro" | "question";
  round?: QuizRound;
  question?: QuizQuestion;
  currentIndex: number;
  totalQuestions: number;
  textColor: string;
  quizColor: string;
  finaleRoundNumber: number;
  isAnswerRevealed: boolean;
  isMarkedCorrect: boolean;
  isQuestionAnswered: boolean;
  isMouseMoving: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  onStartRound: () => void;
  onRevealAnswer: () => void;
  onHideAnswer: () => void;
  onMarkCorrect: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onUnmarkCorrect: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onFinish?: () => void;
}

export function QuestionArea({
  screen,
  round,
  question,
  currentIndex,
  totalQuestions,
  textColor,
  quizColor,
  finaleRoundNumber,
  isAnswerRevealed,
  isMarkedCorrect,
  isQuestionAnswered,
  isMouseMoving,
  canGoNext,
  canGoPrevious,
  onStartRound,
  onRevealAnswer,
  onHideAnswer,
  onMarkCorrect,
  onUnmarkCorrect,
  onNext,
  onPrevious,
  onFinish,
}: QuestionAreaProps) {
  if (!question) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {screen === "round-intro" && round ? (
        <RoundIntro key={`round-${round.number}`} round={round} textColor={textColor} onStart={onStartRound} finaleRoundNumber={finaleRoundNumber} />
      ) : (
        <PresenterMode
          key={`question-${currentIndex}`}
          question={question}
          currentIndex={currentIndex}
          totalQuestions={totalQuestions}
          isAnswerRevealed={isAnswerRevealed}
          isMarkedCorrect={isMarkedCorrect}
          isQuestionAnswered={isQuestionAnswered}
          textColor={textColor}
          quizColor={quizColor}
          onRevealAnswer={onRevealAnswer}
          onHideAnswer={onHideAnswer}
          onMarkCorrect={onMarkCorrect}
          onUnmarkCorrect={onUnmarkCorrect}
          onNext={onNext}
          onPrevious={onPrevious}
          canGoNext={canGoNext}
          canGoPrevious={canGoPrevious}
          isMouseMoving={isMouseMoving}
          finaleRoundNumber={finaleRoundNumber}
          onFinish={onFinish}
        />
      )}
    </AnimatePresence>
  );
}

interface RoundIntroProps {
  round: QuizRound;
  textColor: string;
  onStart: () => void;
  finaleRoundNumber: number;
}

function RoundIntro({ round, textColor, onStart, finaleRoundNumber }: RoundIntroProps) {
  const heading = round.title;
  const description = round.blurb;
  const ctaLabel = "Let's go!";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-full flex flex-col items-center justify-center px-8 md:px-16 lg:px-24 py-12 transition-colors duration-300 ease-in-out"
    >
      <div className="max-w-4xl w-full text-center space-y-8">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className={`font-extrabold text-balance tracking-tight mb-6 transition-colors duration-300 ease-in-out ${
            textColor === "white" ? "text-white" : "text-gray-900"
          }`}
          style={{ 
            fontSize: 'clamp(2rem, min(6vw, 8vh), 4rem)',
            lineHeight: '1.1',
            marginBottom: 'clamp(1.5rem, 3vh, 2.5rem)'
          }}
        >
          {heading}
        </motion.h1>

        {description && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }}>
            <p
              className={`mb-12 opacity-70 transition-colors duration-300 ease-in-out ${
                textColor === "white" ? "text-white" : "text-gray-900"
              }`}
              style={{
                fontSize: 'clamp(0.875rem, min(1.125rem, 2.5vh), 1.25rem)',
                marginBottom: 'clamp(1.5rem, 3vh, 3rem)'
              }}
            >
              {description}
            </p>
          </motion.div>
        )}

        <motion.button
          onClick={onStart}
          className={`rounded-full font-bold transition-colors duration-300 ease-in-out ${
            textColor === "white" ? "bg-white text-gray-900 hover:bg-white/90" : "bg-gray-900 text-white hover:bg-gray-800"
          }`}
          style={{
            fontSize: "clamp(1rem, 2vw, 1.5rem)",
            padding: "clamp(0.75rem, 1.5vw, 1.25rem) clamp(2rem, 4vw, 2.5rem)",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {ctaLabel}
        </motion.button>
      </div>
    </motion.div>
  );
}

interface PresenterModeProps {
  question: QuizQuestion;
  currentIndex: number;
  totalQuestions: number;
  isAnswerRevealed: boolean;
  isMarkedCorrect: boolean;
  isQuestionAnswered: boolean;
  textColor: string;
  quizColor: string;
  onRevealAnswer: () => void;
  onHideAnswer: () => void;
  onMarkCorrect: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onUnmarkCorrect: () => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isMouseMoving: boolean;
  finaleRoundNumber: number;
  onFinish?: () => void;
}

function PresenterMode({
  question,
  currentIndex,
  totalQuestions,
  isAnswerRevealed,
  isMarkedCorrect,
  isQuestionAnswered,
  textColor,
  quizColor,
  onRevealAnswer,
  onHideAnswer,
  onMarkCorrect,
  onUnmarkCorrect,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  isMouseMoving,
  finaleRoundNumber,
  onFinish,
}: PresenterModeProps) {
  const [hasAnswered, setHasAnswered] = useState(false);
  const questionTextRef = useRef<HTMLParagraphElement>(null);
  const mainContainerRef = useRef<HTMLElement>(null);
  const [revealButtonPosition, setRevealButtonPosition] = useState({ top: 0, left: 0 });
  const [questionScale, setQuestionScale] = useState(1);
  const [isPositionCalculated, setIsPositionCalculated] = useState(false);

  const handleMarkCorrectWithFeedback = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onMarkCorrect(event);
      setTimeout(() => setHasAnswered(true), 500);
    },
    [onMarkCorrect]
  );

  const handleUnmarkCorrectWithFeedback = useCallback(() => {
    onUnmarkCorrect();
    setTimeout(() => setHasAnswered(true), 500);
  }, [onUnmarkCorrect]);

  useEffect(() => {
    setHasAnswered(false);
  }, [question.id]);

  // Optimized: Memoize position update function and reduce DOM queries
  const updatePosition = useCallback(() => {
    const questionEl = questionTextRef.current;
    if (!questionEl) return;

    const questionRect = questionEl.getBoundingClientRect();
    const computedLineHeight = parseFloat(window.getComputedStyle(questionEl).lineHeight || "0");
    const approxLines = computedLineHeight > 0 ? Math.round(questionRect.height / computedLineHeight) : 1;

    // Update scale based on line count
    let newScale = 1;
    if (approxLines > 6) {
      newScale = 0.78;
    } else if (approxLines > 5) {
      newScale = 0.85;
    } else if (approxLines > 4) {
      newScale = 0.9;
    }
    setQuestionScale((prev) => prev !== newScale ? newScale : prev);

    // Cache DOM queries - only query once per update
    const scorePillEl = document.querySelector('[aria-label*="Score:"]') as HTMLElement | null;
    let spacing = 60;

    if (scorePillEl) {
      const scorePillRect = scorePillEl.getBoundingClientRect();
      const topSpacing = questionRect.top - scorePillRect.bottom;
      spacing = Math.max(40, topSpacing);
    }

    // Get actual button element if it exists to measure real dimensions
    const buttonEl = document.querySelector('[aria-pressed]') as HTMLElement | null;
    const isMobile = window.innerWidth < 768;
    let buttonHeight = isMobile ? 72 : 88; // Default estimate
    let buttonWidth = 0;
    
    if (buttonEl) {
      const buttonRect = buttonEl.getBoundingClientRect();
      buttonHeight = buttonRect.height || buttonHeight;
      buttonWidth = buttonRect.width || 0;
    }

    // Calculate position with cached values
    const buttonPadding = 40;
    const minBottomPadding = 20;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const maxTop = viewportHeight - buttonHeight - buttonPadding - minBottomPadding;
    const desiredTop = questionRect.bottom + spacing;
    const minTop = 100;
    let finalTop = Math.max(minTop, Math.min(desiredTop, maxTop));
    
    const buttonLeft = viewportWidth / 2;
    const halfButtonWidth = buttonWidth > 0 ? buttonWidth / 2 : 200;
    const minLeft = halfButtonWidth + 20;
    const maxLeft = viewportWidth - halfButtonWidth - 20;
    const finalLeft = Math.max(minLeft, Math.min(maxLeft, buttonLeft));

    setRevealButtonPosition((prev) => {
      if (prev.top === finalTop && prev.left === finalLeft) return prev;
      return { top: finalTop, left: finalLeft };
    });

    setIsPositionCalculated(true);
  }, []);

  useEffect(() => {
    setIsPositionCalculated(false);

    // Throttled resize/scroll handler
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    let ticking = false;
    
    const debouncedUpdatePosition = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!ticking) {
          requestAnimationFrame(() => {
            updatePosition();
            ticking = false;
          });
          ticking = true;
        }
      }, 150);
    };

    // Initial position calculations - reduced from 2 to 1
    const timer1 = setTimeout(updatePosition, 100);

    window.addEventListener("resize", debouncedUpdatePosition, { passive: true });
    window.addEventListener("scroll", debouncedUpdatePosition, { passive: true });

    // Only observe question text element, not the entire container
    const observer = new ResizeObserver(() => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updatePosition();
          ticking = false;
        });
        ticking = true;
      }
    });
    
    if (questionTextRef.current) {
      observer.observe(questionTextRef.current);
    }

    return () => {
      clearTimeout(timer1);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      window.removeEventListener("resize", debouncedUpdatePosition);
      window.removeEventListener("scroll", debouncedUpdatePosition);
      observer.disconnect();
    };
  }, [question.question, updatePosition]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="grid min-h-full relative"
      style={{ gridTemplateRows: "1fr auto", minHeight: "calc(100vh - 120px)", paddingBottom: "env(safe-area-inset-bottom)" }}
      role="main"
      aria-label="Quiz presenter"
    >
      <PresenterNavigation
        textColor={textColor}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        isMouseMoving={isMouseMoving}
        isQuestionAnswered={isQuestionAnswered}
        hasAnswered={hasAnswered}
        onNext={onNext}
        onPrevious={onPrevious}
        isLastQuestion={currentIndex === totalQuestions - 1}
        onFinish={onFinish}
      />

      <main
        ref={mainContainerRef}
        className="relative overflow-y-auto px-4 sm:px-6 md:px-8 transition-colors duration-300 ease-in-out"
        style={{ 
          paddingTop: "env(safe-area-inset-top)", 
          paddingBottom: "env(safe-area-inset-bottom)", 
          minHeight: "100vh",
          backgroundColor: "transparent" // Ensure transparent background to inherit from parent
        }}
        aria-live="polite"
      >
        <div
          className="fixed left-0 right-0 flex justify-center z-30"
          style={{ top: "46%", transform: "translateY(-50%)", padding: "0 1.5rem" }}
        >
          <div className="max-w-[92ch] md:max-w-[108ch] lg:max-w-[128ch] xl:max-w-[150ch] text-center [text-wrap:balance] w-full mx-16 sm:mx-20 md:mx-24 lg:mx-28 px-4 sm:px-6 pt-16 sm:pt-20">
            <motion.p
              ref={questionTextRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0 }}
              className={`font-extrabold leading-[1.05] break-words [overflow-wrap:anywhere] transition-colors duration-300 ease-in-out ${
                textColor === "white" ? "text-white" : "text-gray-900"
              }`}
              style={{
                fontSize: "clamp(20px, min(3.4vw + 0.9rem, (100vh - 360px) / 3), 50px)",
                marginBottom: "clamp(24px, 4vh, 48px)",
                transform: `scale(${questionScale})`,
                transformOrigin: "center top",
              }}
            >
              {question.question}
            </motion.p>
          </div>
        </div>

        {isPositionCalculated && (
          <motion.div
            className="fixed flex justify-center z-30"
            style={{ 
              transform: "translateX(-50%)", 
              overflow: "visible",
              maxWidth: "calc(100vw - 40px)",
              width: "auto"
            }}
            initial={{ opacity: 0, top: revealButtonPosition.top, left: revealButtonPosition.left }}
            animate={{
              opacity: 1,
              top: revealButtonPosition.top,
              left: revealButtonPosition.left,
            }}
            transition={{
              opacity: { duration: 0.25, ease: "easeOut" },
              top: { type: "spring", stiffness: 260, damping: 28 },
              left: { type: "spring", stiffness: 260, damping: 28 },
            }}
          >
            <div style={{ maxWidth: "100%", width: "auto" }}>
              <AnswerReveal
                answerText={question.answer}
                revealed={isAnswerRevealed}
                onReveal={onRevealAnswer}
                onHide={onHideAnswer}
                accentColor={quizColor}
                textColor={textColor === "white" ? "white" : "black"}
                className={textColor === "white" ? "outline outline-2 outline-white/80" : undefined}
                isMarkedCorrect={isMarkedCorrect}
                isMarkedIncorrect={isQuestionAnswered && !isMarkedCorrect}
                onMarkCorrect={handleMarkCorrectWithFeedback}
                onUnmarkCorrect={handleUnmarkCorrectWithFeedback}
              />
            </div>
          </motion.div>
        )}
      </main>
    </motion.div>
  );
}

function PresenterNavigation({
  textColor,
  canGoNext,
  canGoPrevious,
  isMouseMoving,
  isQuestionAnswered,
  hasAnswered,
  onNext,
  onPrevious,
  isLastQuestion,
  onFinish,
}: {
  textColor: string;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isMouseMoving: boolean;
  isQuestionAnswered: boolean;
  hasAnswered: boolean;
  onNext: () => void;
  onPrevious: () => void;
  isLastQuestion: boolean;
  onFinish?: () => void;
}) {
  const shouldShowFullOpacity = isMouseMoving || isQuestionAnswered;
  const arrowOpacity = shouldShowFullOpacity ? 1 : 0.2;

  return (
    <>
      <div className="fixed left-4 sm:left-8 z-40" style={{ top: "45%", transform: "translateY(-50%)" }}>
        <AnimatePresence>
          {canGoPrevious && (
            <motion.button
              onClick={onPrevious}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: arrowOpacity, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              whileHover={{ opacity: 1, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className={`p-3 sm:p-4 rounded-full transition-colors duration-300 ease-in-out ${
                textColor === "white" ? "bg-white/15 hover:bg-white/25 text-white" : "bg-black/10 hover:bg-black/15 text-gray-900"
              }`}
              whileTap={{ scale: 0.95 }}
              aria-label="Previous question"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed right-4 sm:right-8 z-40 flex flex-col gap-3" style={{ top: "45%", transform: "translateY(-50%)" }}>
        {/* Next/Finish Button */}
        {!isLastQuestion && (
          <motion.button
            onClick={onNext}
            disabled={!canGoNext}
            animate={{
              opacity: canGoNext ? arrowOpacity : 0.1,
              x: hasAnswered && canGoNext ? [0, 12, -12, 0] : 0,
            }}
            whileHover={canGoNext ? { opacity: 1, scale: 1.05 } : {}}
            transition={{
              duration: hasAnswered ? 0.8 : 0.3,
              ease: hasAnswered ? "easeInOut" : "easeOut",
              repeat: hasAnswered && canGoNext ? Infinity : 0,
              repeatDelay: hasAnswered ? 1.2 : 0,
            }}
            className={`p-3 sm:p-4 rounded-full transition-colors duration-700 ease-in-out ${
              canGoNext
                ? textColor === "white"
                  ? "bg-white/15 hover:bg-white/25 text-white"
                  : "bg-black/10 hover:bg-black/15 text-gray-900"
                : "opacity-30 cursor-not-allowed"
            }`}
            whileTap={canGoNext ? { scale: 0.95 } : {}}
            aria-label="Next question"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </motion.button>
        )}
        
        {/* Finish Button - Only show at the end of the quiz */}
        {isLastQuestion && onFinish && (
          <motion.button
            onClick={onFinish}
            animate={{
              opacity: arrowOpacity,
            }}
            whileHover={{ opacity: 1, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className={`p-3 sm:p-4 rounded-full transition-colors duration-300 ease-in-out ${
              textColor === "white"
                ? "bg-white/15 hover:bg-white/25 text-white"
                : "bg-black/10 hover:bg-black/15 text-gray-900"
            }`}
            whileTap={{ scale: 0.95 }}
            aria-label="Finish quiz"
          >
            <Flag className="h-5 w-5 sm:h-6 sm:w-6" />
          </motion.button>
        )}
        
        {/* Last question: show flag only (fallback if onFinish not provided) */}
        {isLastQuestion && !onFinish && (
          <motion.button
            onClick={onNext}
            disabled={!canGoNext}
            animate={{
              opacity: canGoNext ? arrowOpacity : 0.1,
            }}
            whileHover={canGoNext ? { opacity: 1, scale: 1.05 } : {}}
            transition={{ duration: 0.3 }}
            className={`p-3 sm:p-4 rounded-full transition-colors duration-700 ease-in-out ${
              canGoNext
                ? textColor === "white"
                  ? "bg-white/15 hover:bg-white/25 text-white"
                  : "bg-black/10 hover:bg-black/15 text-gray-900"
                : "opacity-30 cursor-not-allowed"
            }`}
            whileTap={canGoNext ? { scale: 0.95 } : {}}
            aria-label="Finish quiz"
          >
            <Flag className="h-5 w-5 sm:h-6 sm:w-6" />
          </motion.button>
        )}
      </div>
    </>
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
