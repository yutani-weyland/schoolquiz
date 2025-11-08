import React from 'react';

interface HeatmapData {
  category: string;
  difficulty: number;
  successRate: number;
  questionCount: number;
}

interface QualityHeatmapProps {
  data: HeatmapData[];
}

export function QualityHeatmap({ data }: QualityHeatmapProps) {
  const difficulties = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'];
  const categories = [...new Set(data.map(item => item.category))];

  const getHeatmapValue = (category: string, difficulty: number) => {
    const item = data.find(d => d.category === category && d.difficulty === difficulty);
    return item || { successRate: 0, questionCount: 0 };
  };

  const getColorClass = (successRate: number) => {
    if (successRate >= 80) return 'bg-green-500';
    if (successRate >= 60) return 'bg-yellow-500';
    if (successRate >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTextColor = (successRate: number) => {
    if (successRate >= 80) return 'text-white';
    if (successRate >= 60) return 'text-white';
    if (successRate >= 40) return 'text-white';
    return 'text-white';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Content Quality Heatmap</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Success rate by category and difficulty</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">80%+</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">60-79%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">40-59%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">&lt;40%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-2">
                  Category
                </th>
                {difficulties.map((difficulty, index) => (
                  <th key={difficulty} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-2 px-2">
                    <div className="flex flex-col items-center">
                      <span>{difficulty}</span>
                      <span className="text-gray-400">({index + 1})</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category}>
                  <td className="py-3 pr-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {category}
                    </span>
                  </td>
                  {difficulties.map((_, difficultyIndex) => {
                    const difficulty = difficultyIndex + 1;
                    const heatmapValue = getHeatmapValue(category, difficulty);
                    const { successRate, questionCount } = heatmapValue;
                    
                    return (
                      <td key={difficulty} className="px-2 py-3 text-center">
                        <div 
                          className={`w-16 h-12 rounded flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform ${getColorClass(successRate)}`}
                          title={`${category} - ${difficulties[difficultyIndex]}: ${successRate.toFixed(1)}% success rate (${questionCount} questions)`}
                        >
                          <span className={`text-xs font-bold ${getTextColor(successRate)}`}>
                            {successRate > 0 ? `${successRate.toFixed(0)}%` : '-'}
                          </span>
                          {questionCount > 0 && (
                            <span className={`text-xs ${getTextColor(successRate)} opacity-75`}>
                              ({questionCount})
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
