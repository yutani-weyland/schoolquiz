import React from 'react';

interface ActivityData {
  date: string;
  count: number;
  teachers: string[];
}

interface TeacherActivityHeatmapProps {
  data: ActivityData[];
}

export function TeacherActivityHeatmap({ data }: TeacherActivityHeatmapProps) {
  const maxCount = Math.max(...data.map(d => d.count));
  
  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (count <= maxCount * 0.25) return 'bg-green-200 dark:bg-green-900';
    if (count <= maxCount * 0.5) return 'bg-green-300 dark:bg-green-800';
    if (count <= maxCount * 0.75) return 'bg-green-400 dark:bg-green-700';
    return 'bg-green-500 dark:bg-green-600';
  };

  const getTextColor = (count: number) => {
    if (count === 0) return 'text-gray-400 dark:text-gray-600';
    if (count <= maxCount * 0.5) return 'text-gray-700 dark:text-gray-300';
    return 'text-white';
  };

  // Group data by weeks
  const weeks = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Teacher Activity</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Daily quiz creation and editing activity</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-600 dark:text-gray-400">Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-200 dark:bg-green-900 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-300 dark:bg-green-800 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-400 dark:bg-green-700 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-500 dark:bg-green-600 rounded-sm"></div>
            </div>
            <span className="text-gray-600 dark:text-gray-400">More</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="overflow-x-auto">
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={day.date}
                    className={`w-3 h-3 rounded-sm cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all ${getIntensity(day.count)}`}
                    title={`${day.date}: ${day.count} activities by ${day.teachers.join(', ')}`}
                  >
                    <span className={`text-xs ${getTextColor(day.count)}`}>
                      {day.count > 0 && day.count}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Activities</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {data.reduce((sum, day) => sum + day.count, 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Active Days</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {data.filter(day => day.count > 0).length}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg/Day</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {(data.reduce((sum, day) => sum + day.count, 0) / data.length).toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Peak Day</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {maxCount}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
