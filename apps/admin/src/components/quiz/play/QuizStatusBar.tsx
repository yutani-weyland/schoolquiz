import React, { useState } from "react";
import { Clock, EyeOff } from "lucide-react";
import { QuizRound } from "./types";

interface QuizStatusBarProps {
  currentScreen: "round-intro" | "question";
  currentRound?: QuizRound;
  currentQuestion?: { submittedBy?: string; roundNumber?: number };
  textColor: string;
  score: number;
  totalQuestions: number;
  showPlusOne: boolean;
  plusOneKey: number;
  isTimerRunning: boolean;
  timer: number;
  formatTime: (seconds: number) => string;
  averageScoreData: {
    quizAverage?: number;
    userScore?: number;
    percentile?: number;
    privateLeagueAverage?: number;
    leagueName?: string;
    time?: number;
  };
}

function TimerPill({
  isTimerHidden,
  onToggleHidden,
  timer,
  formatTime,
  textColor,
}: {
  isTimerHidden: boolean;
  onToggleHidden: (value: boolean) => void;
  timer: number;
  formatTime: (seconds: number) => string;
  textColor: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const baseColors =
    textColor === "white"
      ? "bg-white/20 text-white hover:bg-white/28 backdrop-blur-sm"
      : "bg-black/10 text-gray-900 hover:bg-black/15 backdrop-blur-sm";

  return (
    <button
      className={`font-semibold tabular-nums flex items-center cursor-pointer rounded-full transition-colors duration-300 ease-in-out ${
        isTimerHidden ? `justify-center` : `justify-start`
      } ${baseColors}`}
      style={{
        fontSize: "clamp(0.875rem, 1.5vw, 1.125rem)",
        padding: isTimerHidden 
          ? "clamp(0.75rem, 1.2vw, 0.875rem)"
          : "clamp(0.5rem, 1.2vw, 0.875rem) clamp(1rem, 2vw, 1.5rem)",
        gap: isTimerHidden ? 0 : "clamp(0.5rem, 1vw, 0.75rem)",
        width: isTimerHidden ? "clamp(3rem, 5vw, 3.5rem)" : "auto",
        height: isTimerHidden ? "clamp(3rem, 5vw, 3.5rem)" : "auto",
        minWidth: isTimerHidden ? "clamp(3rem, 5vw, 3.5rem)" : "auto",
        minHeight: isTimerHidden ? "clamp(3rem, 5vw, 3.5rem)" : "auto",
      }}
      onClick={() => onToggleHidden(!isTimerHidden)}
      onMouseEnter={() => {
        if (!isTimerHidden) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="relative flex-shrink-0 flex items-center justify-center"
        style={{
          width: "clamp(1.25rem, 2vw, 1.75rem)",
          height: "clamp(1.25rem, 2vw, 1.75rem)",
        }}
      >
        {isTimerHidden || (isHovered && !isTimerHidden) ? (
          <EyeOff style={{ width: "clamp(1rem, 1.5vw, 1.5rem)", height: "clamp(1rem, 1.5vw, 1.5rem)" }} />
        ) : (
          <Clock style={{ width: "clamp(1rem, 1.5vw, 1.5rem)", height: "clamp(1rem, 1.5vw, 1.5rem)" }} />
        )}
      </div>
      {!isTimerHidden && <span className="flex-shrink-0 whitespace-nowrap">{formatTime(timer)}</span>}
    </button>
  );
}

export function QuizStatusBar({
  currentScreen,
  currentRound,
  currentQuestion,
  textColor,
  score,
  totalQuestions,
  showPlusOne: _showPlusOne,
  plusOneKey: _plusOneKey,
  isTimerRunning,
  timer,
  formatTime,
  averageScoreData: _averageScoreData,
}: QuizStatusBarProps) {
  const [isTimerHidden, setIsTimerHidden] = useState(false);

  // Format submission text
  const formatSubmissionText = (submittedBy?: string): string | null => {
    if (!submittedBy) return null;
    // Format: "Submitted by '[Teacher Name]' from '[School Name]'"
    const parts = submittedBy.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      return `Submitted by '${parts[0]}' from '${parts.slice(1).join(', ')}'`;
    }
    return `Submitted by '${submittedBy}'`;
  };

  const submissionText = currentQuestion?.submittedBy 
    ? formatSubmissionText(currentQuestion.submittedBy)
    : null;
  
  const isPeoplesRound = currentQuestion?.roundNumber === 5;

  // Score pill styling - matches other pills for consistency
  const scorePillClass = textColor === "white"
    ? "bg-white/20 text-white hover:bg-white/28 backdrop-blur-sm"
    : "bg-black/10 text-gray-900 hover:bg-black/15 backdrop-blur-sm";

  return (
    <>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 pt-24 pb-3 px-4 sm:px-6">
        <div className="flex flex-col gap-2 items-center">
          {/* Top row: Round title, Score, Timer */}
          <div className="flex flex-row gap-3 sm:gap-4 items-center justify-center flex-nowrap">
            {currentScreen === "question" && currentRound && (
              <div
                className={`relative rounded-full font-semibold flex items-center gap-3 transition-colors duration-300 ease-in-out ${
                  textColor === "white"
                    ? "bg-white/20 text-white hover:bg-white/28"
                    : "bg-black/10 text-gray-900 hover:bg-black/15"
                } backdrop-blur-sm`}
                style={{
                  fontSize: "clamp(0.875rem, 1.5vw, 1.125rem)",
                  padding: "clamp(0.5rem, 1.2vw, 0.875rem) clamp(1rem, 2vw, 1.5rem)",
                }}
              >
                <span className="whitespace-nowrap">
                  {isPeoplesRound ? "The People's Round" : currentRound.title}
                </span>
              </div>
            )}

          <div
            className={`relative rounded-full font-semibold flex items-center transition-colors duration-300 ease-in-out whitespace-nowrap ${scorePillClass} backdrop-blur-sm`}
            style={{
              gap: "clamp(0.5rem, min(1.5vw, 2vh), 1rem)",
              padding: "clamp(0.5rem, min(1.5vw, 2.5vh), 1.5rem) clamp(1rem, min(3vw, 4vh), 3rem)",
            }}
            aria-label={`Score: ${score} out of ${totalQuestions}`}
          >
            <span className="font-medium opacity-90" style={{ fontSize: "clamp(0.875rem, min(2vw, 3vh), 1.5rem)" }}>Score:</span>
            <span className="font-bold tabular-nums leading-none" style={{ fontSize: "clamp(1.25rem, min(4vw, 5vh), 3rem)", letterSpacing: "-0.045em" }}>
              {score} / {totalQuestions}
            </span>
          </div>

            {isTimerRunning && (
              <TimerPill
                isTimerHidden={isTimerHidden}
                onToggleHidden={setIsTimerHidden}
                timer={timer}
                formatTime={formatTime}
                textColor={textColor}
              />
            )}
          </div>

          {/* Submission pill - below timer, only for People's Round */}
          {isPeoplesRound && submissionText && (
            <div
              className={`relative rounded-full font-medium flex items-center transition-colors duration-300 ease-in-out ${
                textColor === "white"
                  ? "bg-white/15 text-white"
                  : "bg-black/8 text-gray-700"
              } backdrop-blur-sm`}
              style={{
                fontSize: "clamp(0.75rem, 1.2vw, 1rem)",
                padding: "clamp(0.375rem, 1vw, 0.625rem) clamp(0.75rem, 1.5vw, 1.25rem)",
              }}
            >
              <span className="whitespace-nowrap">{submissionText}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
