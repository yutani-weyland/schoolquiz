import React from 'react';

interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
  color: string;
  description: string;
}

interface QuestionLifecycleFunnelProps {
  data: FunnelStage[];
}

export function QuestionLifecycleFunnel({ data }: QuestionLifecycleFunnelProps) {
  const total = data.reduce((sum, stage) => sum + stage.count, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Question Lifecycle</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Flow from draft to published</p>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {data.map((stage, index) => {
            const width = (stage.count / total) * 100;
            const isLastStage = index === data.length - 1;
            
            return (
              <div key={stage.stage} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {stage.stage}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {stage.count.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      ({stage.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="relative">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8 overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                      style={{ 
                        width: `${width}%`,
                        backgroundColor: stage.color,
                        opacity: 0.8
                      }}
                    >
                      <span className="text-xs font-medium text-white">
                        {stage.count > 0 && `${stage.count}`}
                      </span>
                    </div>
                  </div>
                  
                  {/* Arrow pointing to next stage */}
                  {!isLastStage && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stage.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Questions</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {total.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Published</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {data.find(s => s.stage === 'Published')?.count.toLocaleString() || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">In Use</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {data.find(s => s.stage === 'Used in Quiz')?.count.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
