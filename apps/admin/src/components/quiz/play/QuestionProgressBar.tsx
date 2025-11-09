import React from "react";
import RailProgress from "../../progress/RailProgress";
import { QuizQuestion } from "./types";

interface QuestionProgressBarProps {
  total: number;
  currentIndex: number;
  sections?: number[];
  roundColors: string[];
  isDarkText: boolean;
  backgroundColor: string;
  correctAnswers: Set<number>;
  incorrectAnswers: Set<number>;
  attemptedAnswers: Set<number>;
  viewedQuestions: Set<number>;
  questions: QuizQuestion[];
  showPlusOne: boolean;
  onSelect: (questionNumber: number) => void;
  isMouseActive: boolean;
}

export function QuestionProgressBar({
  total,
  currentIndex,
  sections,
  roundColors,
  isDarkText,
  backgroundColor,
  correctAnswers,
  incorrectAnswers,
  attemptedAnswers,
  viewedQuestions,
  questions,
  showPlusOne,
  onSelect,
  isMouseActive,
}: QuestionProgressBarProps) {
  return (
    <RailProgress
      total={total}
      current={currentIndex + 1}
      sections={sections}
      roundColors={roundColors}
      isDark={isDarkText}
      backgroundColor={backgroundColor}
      correctAnswers={correctAnswers}
      incorrectAnswers={incorrectAnswers}
      attemptedAnswers={attemptedAnswers}
      viewedQuestions={viewedQuestions}
      questions={questions}
      showPlusOne={showPlusOne}
      onSelect={onSelect}
      isMouseActive={isMouseActive}
    />
  );
}
