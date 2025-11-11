import React, { useState } from "react";
import { Clock, EyeOff } from "lucide-react";
import { QuizRound } from "./types";

interface QuizStatusBarProps {
  currentScreen: "round-intro" | "question";
  currentRound?: QuizRound;
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
  const hiddenSizing = "w-14 h-14 min-w-[56px] min-h-[56px] px-0";
  const visibleSizing = "px-6 py-3.5 gap-3";
  const baseColors =
    textColor === "white"
      ? "bg-white/20 text-white hover:bg-white/28 backdrop-blur-sm"
      : "bg-black/10 text-gray-900 hover:bg-black/15 backdrop-blur-sm";

  return (
    <button
      className={`text-lg font-semibold tabular-nums flex items-center cursor-pointer rounded-full transition-colors duration-150 ${
        isTimerHidden ? `justify-center ${hiddenSizing}` : `justify-start ${visibleSizing}`
      } ${baseColors}`}
      onClick={() => onToggleHidden(!isTimerHidden)}
      onMouseEnter={() => {
        if (!isTimerHidden) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center">
        {isTimerHidden || (isHovered && !isTimerHidden) ? (
          <EyeOff className="w-5 h-5 sm:w-6 sm:h-6" />
        ) : (
          <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
        )}
      </div>
      {!isTimerHidden && <span className="flex-shrink-0 whitespace-nowrap">{formatTime(timer)}</span>}
    </button>
  );
}

export function QuizStatusBar({
  currentScreen,
  currentRound,
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

  return (
    <>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 z-40 pt-24 pb-3 px-4 sm:px-6">
        <div className="flex flex-row gap-3 sm:gap-4 items-center justify-center flex-nowrap">
          {currentScreen === "question" && currentRound && (
            <div
              className={`relative rounded-full text-lg font-semibold flex items-center gap-3 transition-colors duration-200 ${
                textColor === "white"
                  ? "bg-white/20 text-white hover:bg-white/28"
                  : "bg-black/10 text-gray-900 hover:bg-black/15"
              } px-6 py-3.5 backdrop-blur-sm`}
            >
              <span className="whitespace-nowrap">{currentRound.title}</span>
            </div>
          )}

          <div
            className={`relative rounded-full font-semibold flex items-center gap-4 transition-colors duration-200 whitespace-nowrap ${
              textColor === "white"
                ? "bg-white/20 text-white hover:bg-white/28"
                : "bg-black/10 text-gray-900 hover:bg-black/15"
            } px-12 py-6 backdrop-blur-sm`}
            aria-label={`Score: ${score} out of ${totalQuestions}`}
          >
            <span className="text-2xl font-medium opacity-90">Score:</span>
            <span className="text-5xl font-bold tabular-nums leading-none" style={{ letterSpacing: "-0.045em" }}>
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
      </div>
    </>
  );
}
