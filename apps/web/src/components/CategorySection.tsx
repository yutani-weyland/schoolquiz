import React from "react";
import { motion } from "framer-motion";
import { QuestionCard } from "./QuestionCard";
import { transitions } from "@schoolquiz/ui";

interface CategorySectionProps {
  category: {
    id: string;
    title: string;
    blurb: string;
    accent_color: string;
    round_number: number;
  };
  questions: Array<{
    id: string;
    question_text: string;
    answer: string;
    points: number;
  }>;
  onAnswer: (questionId: string, isCorrect: boolean) => void;
  statsEnabled?: boolean;
  nationalStats?: Record<string, number>;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  questions,
  onAnswer,
  statsEnabled = false,
  nationalStats = {}
}) => {
  return (
    <motion.section
      className="mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.medium}
    >
      <div className="flex items-center mb-6">
        <div 
          className="w-1 h-8 rounded-full mr-4"
          style={{ backgroundColor: category.accent_color }}
        />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Round {category.round_number}: {category.title}
          </h2>
          <p className="text-gray-600 mt-1">{category.blurb}</p>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              ...transitions.fast,
              delay: index * 0.1
            }}
          >
            <QuestionCard
              question={question}
              onAnswer={(isCorrect) => onAnswer(question.id, isCorrect)}
              accentColor={category.accent_color}
              statsEnabled={statsEnabled}
              nationalPercentage={nationalStats[question.id]}
            />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};
