import React from 'react';
import Iphone15Pro from './ui/shadcn-io/iphone-15-pro';

export default function QuizPhonePreview() {
  return (
    <div className="relative">
                  <Iphone15Pro 
                    width={150} 
                    height={300} 
                    className="mx-auto"
                  />
      
      {/* Quiz content overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-24 h-36 bg-white dark:bg-[#1A1F2E] rounded-2xl p-2 shadow-lg">
          <div className="text-center">
            <div className="text-xs font-bold text-gray-900 dark:text-white mb-2">
              Round 1: TikTok Trends
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 mb-3">
              Question 3 of 5
            </div>
            <div className="text-xs font-medium text-gray-900 dark:text-white mb-4 leading-tight">
              What was the most viral TikTok trend of 2023?
            </div>
            <div className="space-y-2">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 text-xs text-center">
                Teams discuss & answer
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2 text-xs text-center">
                Reveal Answer
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
