import React from 'react';

interface CoverageData {
  subject: string;
  categories: {
    name: string;
    count: number;
    color: string;
  }[];
  totalCount: number;
}

interface QuestionBankCoverageProps {
  data: CoverageData[];
}

export function QuestionBankCoverage({ data }: QuestionBankCoverageProps) {
  const totalQuestions = data.reduce((sum, subject) => sum + subject.totalCount, 0);
  
  const getSubjectColor = (subject: string) => {
    const colors = {
      'Science': '#10B981',
      'Geography': '#3B82F6', 
      'History': '#8B5CF6',
      'Math': '#F59E0B',
      'Literature': '#EF4444',
      'Current Affairs': '#06B6D4',
      'Arts': '#EC4899'
    };
    return colors[subject as keyof typeof colors] || '#6B7280';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Question Bank Coverage</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Questions by subject and category</p>
          </div>
          <a 
            href="/question-bank" 
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            View bank →
          </a>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {data.map((subject) => (
            <div key={subject.subject} className="group">
              {/* Subject Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getSubjectColor(subject.subject) }}
                  />
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {subject.subject}
                  </h4>
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {subject.totalCount} questions
                </span>
              </div>

              {/* Category Treemap */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {subject.categories.map((category) => {
                  const percentage = (category.count / subject.totalCount) * 100;
                  const size = Math.max(percentage * 2, 20); // Minimum size
                  
                  return (
                    <div
                      key={category.name}
                      className="relative group/category cursor-pointer hover:scale-105 transition-transform"
                      style={{ 
                        backgroundColor: category.color,
                        opacity: 0.8,
                        minHeight: `${size}px`
                      }}
                      title={`${category.name}: ${category.count} questions (${percentage.toFixed(1)}% of ${subject.subject})`}
                    >
                      <div className="absolute inset-0 flex flex-col justify-center items-center p-2">
                        <span className="text-xs font-medium text-white text-center leading-tight">
                          {category.name}
                        </span>
                        <span className="text-xs text-white opacity-75 mt-1">
                          {category.count}
                        </span>
                      </div>
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover/category:bg-opacity-20 transition-all duration-200 rounded" />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Questions</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {totalQuestions.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Subjects</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {data.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Categories</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {data.reduce((sum, subject) => sum + subject.categories.length, 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg/Subject</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {Math.round(totalQuestions / data.length)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
