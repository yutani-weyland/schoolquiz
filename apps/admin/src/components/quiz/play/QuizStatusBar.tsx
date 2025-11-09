import React, { useRef, useState } from "react";
import { Clock, EyeOff, Info } from "lucide-react";
import { HoverCardAlert } from "@/components/ui/hover-card-alert";
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
  averageScoreData,
}: QuizStatusBarProps) {
  const scoreRef = useRef<HTMLDivElement>(null);
  const [isScoreHovered, setIsScoreHovered] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isRoundTitleHovered, setIsRoundTitleHovered] = useState(false);
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
              onMouseEnter={() => setIsRoundTitleHovered(true)}
              onMouseLeave={() => setIsRoundTitleHovered(false)}
            >
              <Info className="w-5 h-5 flex-shrink-0" />
              <span className="whitespace-nowrap">{currentRound.title}</span>
              {isRoundTitleHovered && currentRound.blurb && (
                <div
                  className="absolute top-full left-full ml-2 mt-2 px-4 py-2.5 rounded-lg w-80 pointer-events-none z-50 whitespace-normal bg-black/95 backdrop-blur-sm shadow-xl border border-white/10"
                  style={{ fontFamily: "var(--app-font), system-ui, sans-serif" }}
                >
                  <div className="font-medium text-white relative text-base">{currentRound.blurb}</div>
                </div>
              )}
            </div>
          )}

          <div
            ref={scoreRef}
            onMouseEnter={() => setIsScoreHovered(true)}
            onMouseLeave={() => setIsScoreHovered(false)}
            onMouseMove={(event) => setCursorPosition({ x: event.clientX, y: event.clientY })}
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

      <HoverCardAlert
        averageScoreData={averageScoreData}
        isOpen={isScoreHovered}
        onMouseEnter={() => setIsScoreHovered(true)}
        onMouseLeave={() => setIsScoreHovered(false)}
        triggerRef={scoreRef}
        cursorPosition={cursorPosition}
      />
    </>
  );
}
