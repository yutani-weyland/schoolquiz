import React from "react";
import { motion } from "framer-motion";
import { springs } from "@schoolquiz/ui";

interface ScoreCounterProps {
  score: number;
  total: number;
}

export const ScoreCounter: React.FC<ScoreCounterProps> = ({ score, total }) => {
  return (
    <motion.div
      className="fixed top-4 right-4 bg-white rounded-lg shadow-lg px-4 py-2 border border-gray-200"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.micro}
    >
      <div className="text-sm text-gray-600">Score</div>
      <motion.div
        className="text-2xl font-bold text-gray-900"
        key={score}
        initial={{ scale: 1.2, color: "#059669" }}
        animate={{ scale: 1, color: "#111827" }}
        transition={springs.snappy}
      >
        {score}/{total}
      </motion.div>
    </motion.div>
  );
};
