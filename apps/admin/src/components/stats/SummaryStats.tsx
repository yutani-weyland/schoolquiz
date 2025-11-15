'use client';

import { motion } from 'framer-motion';
import { BarChart3, Target, CheckCircle, Trophy, TrendingUp } from 'lucide-react';

interface SummaryStatsProps {
  summary: {
    averageScore: number;
    totalQuestionsAttempted: number;
    totalQuizzesPlayed: number;
    totalCorrectAnswers: number;
    perfectScores: number;
  };
}

export function SummaryStats({ summary }: SummaryStatsProps) {
  const stats = [
    {
      label: 'Average score',
      value: `${summary.averageScore.toFixed(1)}%`,
      description: 'Average score per quiz',
      icon: BarChart3,
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
      iconBg: 'bg-blue-600',
    },
    {
      label: 'Total points',
      value: summary.totalCorrectAnswers.toString(),
      description: 'All questions you\'ve answered correctly',
      icon: Target,
      bgColor: 'bg-green-500',
      textColor: 'text-white',
      iconBg: 'bg-green-600',
    },
    {
      label: 'Questions attempted',
      value: summary.totalQuestionsAttempted.toString(),
      description: 'Total questions you\'ve answered',
      icon: CheckCircle,
      bgColor: 'bg-purple-500',
      textColor: 'text-white',
      iconBg: 'bg-purple-600',
    },
    {
      label: 'Perfect scores',
      value: summary.perfectScores.toString(),
      description: 'Quizzes where you scored 100%',
      icon: Trophy,
      bgColor: 'bg-yellow-500',
      textColor: 'text-white',
      iconBg: 'bg-yellow-600',
    },
    {
      label: 'Quizzes played',
      value: summary.totalQuizzesPlayed.toString(),
      description: 'Total quizzes completed',
      icon: TrendingUp,
      bgColor: 'bg-orange-500',
      textColor: 'text-white',
      iconBg: 'bg-orange-600',
    },
  ];

  // Slight rotation angles for each card (in degrees)
  const rotations = [-1, 0.75, -0.5, 1, -0.75];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const rotation = rotations[index] || 0;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: rotation }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 200, damping: 15 }}
            whileHover={{ rotate: rotation + (rotation > 0 ? 0.5 : -0.5), scale: 1.02 }}
            className={`${stat.bgColor} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow text-center`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className={`${stat.iconBg} rounded-lg p-1.5`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className={`text-xs font-medium ${stat.textColor} opacity-90`}>{stat.label}</span>
            </div>
            <div className={`text-4xl sm:text-5xl md:text-6xl font-bold ${stat.textColor} mb-1`}>
              {stat.value}
            </div>
            <div className={`text-xs sm:text-sm ${stat.textColor} opacity-75`}>
              {stat.description}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

