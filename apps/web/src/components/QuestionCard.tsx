import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springs, transitions } from "@schoolquiz/ui";

interface QuestionCardProps {
  question: {
    id: string;
    question_text: string;
    answer: string;
    points: number;
  };
  onAnswer: (isCorrect: boolean) => void;
  accentColor: string;
  statsEnabled?: boolean;
  nationalPercentage?: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onAnswer,
  accentColor,
  statsEnabled = false,
  nationalPercentage
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [userAnswer, setUserAnswer] = useState<boolean | null>(null);

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleAnswer = (isCorrect: boolean) => {
    setUserAnswer(isCorrect);
    onAnswer(isCorrect);
  };

  return (
    <motion.div
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.fast}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex-1">
          {question.question_text}
        </h3>
        <span className="text-sm text-gray-500 ml-4">
          {question.points} point{question.points !== 1 ? 's' : ''}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {!isRevealed ? (
          <motion.button
            key="reveal"
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            onClick={handleReveal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileTap={{ scale: 0.98 }}
            transition={springs.micro}
          >
            Reveal answer
          </motion.button>
        ) : (
          <motion.div
            key="answer"
            className="space-y-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ ...transitions.medium, ease: [0.22, 1, 0.36, 1] }}
          >
            <div 
              className="p-4 rounded-lg text-white font-medium"
              style={{ backgroundColor: accentColor }}
            >
              {question.answer}
            </div>

            {statsEnabled && nationalPercentage !== undefined && (
              <motion.div
                className="text-sm text-gray-600 text-center"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, ...transitions.fast }}
              >
                {nationalPercentage}% got this correct (national)
              </motion.div>
            )}

            <div className="flex gap-3">
              <motion.button
                className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors"
                onClick={() => handleAnswer(true)}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
                transition={springs.micro}
              >
                ✓ Got it right
              </motion.button>
              <motion.button
                className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
                onClick={() => handleAnswer(false)}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
                transition={springs.micro}
              >
                ✗ Got it wrong
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
