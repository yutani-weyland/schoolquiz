import React, { useState } from 'react';
import { Safari } from './ui/shadcn-io/safari';
import confetti from 'canvas-confetti';

export default function QuizSafariPreview() {
  const [showAnswer, setShowAnswer] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [showAnswer3, setShowAnswer3] = useState(false);
  const [isChecked3, setIsChecked3] = useState(false);
  const [score, setScore] = useState(1); // Start with 1 point from question 1

  const handleAnswerReveal = () => {
    setShowAnswer(true);
  };

  const handleAnswerReveal3 = () => {
    setShowAnswer3(true);
  };

  const handleCheckboxClick = () => {
    if (!isChecked) {
      setIsChecked(true);
      setScore(prev => prev + 1);
      
      // Full-screen confetti celebration
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { x: 0.5, y: 0.5 },
        startVelocity: 30,
        gravity: 0.6,
        ticks: 200,
        colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
        shapes: ['circle', 'square', 'star'],
        scalar: 1.2,
        drift: 0.1
      });
    }
  };

  const handleCheckboxClick3 = () => {
    if (!isChecked3) {
      setIsChecked3(true);
      setScore(prev => prev + 1);
      
      // Full-screen confetti celebration
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { x: 0.5, y: 0.5 },
        startVelocity: 30,
        gravity: 0.6,
        ticks: 200,
        colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
        shapes: ['circle', 'square', 'star'],
        scalar: 1.2,
        drift: 0.1
      });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Browser-like header */}
        <div className="bg-gray-100 dark:bg-gray-700 px-6 py-4 flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          <div className="flex-1 bg-white dark:bg-gray-600 rounded-xl px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
            theschoolquiz.com.au/quiz/42
          </div>
        </div>

        {/* Quiz content */}
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            {/* Category and Question Counter */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="bg-purple-500 text-white px-6 py-3 rounded-full text-lg font-bold">
                  TikTok Trends
                </div>
                <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Round 1 of 5
                        </div>
                  <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Score: {score}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-8">
              {/* Question 1 - Answered */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center text-base font-bold flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-xl font-medium text-gray-900 dark:text-white mb-4">
                    What colour is directly opposite purple on a traditional RYB colour wheel?
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 px-5 py-3 rounded-full font-medium text-lg">
                      A Yellow
                    </div>
                    <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-base text-gray-500 dark:text-gray-400 mt-3">71% got this correct</p>
                </div>
              </div>

              {/* Question 2 - Current Question */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center text-base font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-xl font-medium text-gray-900 dark:text-white mb-4">
                    What's the name of the AI chatbot that went viral for being "unhinged"?
                  </p>
                  
                  <div className="h-16 flex items-center transition-all duration-300">
                    {!showAnswer ? (
                      <button
                        onClick={handleAnswerReveal}
                        className="bg-black dark:bg-gray-900 text-white px-8 py-4 rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-4 text-lg h-12"
                      >
                        <span className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center text-sm font-bold">A</span>
                        Reveal answer
                      </button>
                    ) : (
                      <div className="flex items-center gap-4 h-12 animate-fadeIn">
                        <div className="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 px-5 py-3 rounded-full font-medium text-lg h-12 flex items-center">
                          A Character.AI
                        </div>
                        {/* Circular tickbox */}
                        <button
                          onClick={handleCheckboxClick}
                          className={`w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                            isChecked 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-blue-500 bg-white hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-gray-700'
                          }`}
                        >
                          {isChecked && (
                            <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Question 3 - Not answered */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center text-base font-bold flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-xl font-medium text-gray-900 dark:text-white mb-4">
                    Which TikTok trend involved users pretending to be stuck in different decades?
                  </p>
                  
                  <div className="h-16 flex items-center transition-all duration-300">
                    {!showAnswer3 ? (
                      <button
                        onClick={handleAnswerReveal3}
                        className="bg-black dark:bg-gray-900 text-white px-8 py-4 rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-4 text-lg h-12"
                      >
                        <span className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center text-sm font-bold">A</span>
                        Reveal answer
                      </button>
                    ) : (
                      <div className="flex items-center gap-4 h-12 animate-fadeIn">
                        <div className="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 px-5 py-3 rounded-full font-medium text-lg h-12 flex items-center">
                          A Time Travel Challenge
                        </div>
                        {/* Circular tickbox */}
                        <button
                          onClick={handleCheckboxClick3}
                          className={`w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                            isChecked3 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-blue-500 bg-white hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-gray-700'
                          }`}
                        >
                          {isChecked3 && (
                            <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}