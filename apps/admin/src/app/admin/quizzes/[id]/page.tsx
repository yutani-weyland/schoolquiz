"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springs, transitions } from "@schoolquiz/ui";

interface Question {
  id: string;
  question_text: string;
  answer: string;
  points: number;
}

interface Category {
  id: string;
  title: string;
  blurb: string;
  accent_color: string;
  round_number: number;
  type: "standard" | "quick-fire";
  questions: Question[];
}

const accentColors = [
  { value: "#F4A261", label: "History", name: "round-1" },
  { value: "#7FB3FF", label: "Science", name: "round-2" },
  { value: "#F7A8C0", label: "Pop Culture", name: "round-3" },
  { value: "#9EE6B4", label: "Sport", name: "round-4" },
  { value: "#F7D57A", label: "Civics", name: "round-5" }
];

export default async function QuizComposer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [categories, setCategories] = useState<Category[]>([
    {
      id: "cat-1",
      title: "",
      blurb: "",
      accent_color: "#F4A261",
      round_number: 1,
      type: "standard",
      questions: []
    },
    {
      id: "cat-2", 
      title: "",
      blurb: "",
      accent_color: "#7FB3FF",
      round_number: 2,
      type: "standard",
      questions: []
    },
    {
      id: "cat-3",
      title: "",
      blurb: "",
      accent_color: "#F7A8C0", 
      round_number: 3,
      type: "standard",
      questions: []
    },
    {
      id: "cat-4",
      title: "",
      blurb: "",
      accent_color: "#9EE6B4",
      round_number: 4,
      type: "standard",
      questions: []
    },
    {
      id: "cat-5",
      title: "",
      blurb: "",
      accent_color: "#F7D57A",
      round_number: 5,
      type: "standard",
      questions: []
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState("");

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, ...updates } : cat
    ));
  };

  const addQuestion = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category && category.questions.length < 5) {
      const newQuestion: Question = {
        id: `q-${Date.now()}`,
        question_text: "",
        answer: "",
        points: 1
      };
      updateCategory(categoryId, {
        questions: [...category.questions, newQuestion]
      });
    }
  };

  const updateQuestion = (categoryId: string, questionId: string, updates: Partial<Question>) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      const updatedQuestions = category.questions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      );
      updateCategory(categoryId, { questions: updatedQuestions });
    }
  };

  const removeQuestion = (categoryId: string, questionId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      const updatedQuestions = category.questions.filter(q => q.id !== questionId);
      updateCategory(categoryId, { questions: updatedQuestions });
    }
  };

  const canPublish = categories.every(cat => 
    cat.title && cat.blurb && cat.questions.length === 5 &&
    cat.questions.every(q => q.question_text && q.answer)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <input
            type="text"
            placeholder="Quiz title..."
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            className="text-3xl font-bold bg-transparent border-none outline-none placeholder-gray-400"
          />
          <p className="text-gray-600 mt-2">Build your 5×5 quiz structure</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quiz Builder */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...transitions.medium, delay: index * 0.1 }}
                >
                  <div className="flex items-center mb-4">
                    <div 
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: category.accent_color }}
                    />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Round {category.round_number}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={category.title}
                        onChange={(e) => updateCategory(category.id, { title: e.target.value })}
                        placeholder="Category title"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Accent Color
                      </label>
                      <select
                        value={category.accent_color}
                        onChange={(e) => updateCategory(category.id, { accent_color: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {accentColors.map(color => (
                          <option key={color.value} value={color.value}>
                            {color.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={category.blurb}
                      onChange={(e) => updateCategory(category.id, { blurb: e.target.value })}
                      placeholder="Brief description of this category"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        Questions ({category.questions.length}/5)
                      </h4>
                      {category.questions.length < 5 && (
                        <button
                          onClick={() => addQuestion(category.id)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          + Add Question
                        </button>
                      )}
                    </div>

                    {category.questions.map((question, qIndex) => (
                      <motion.div
                        key={question.id}
                        className="p-4 bg-gray-50 rounded-lg"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={springs.micro}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">
                            Q{qIndex + 1}
                          </span>
                          <button
                            onClick={() => removeQuestion(category.id, question.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          type="text"
                          value={question.question_text}
                          onChange={(e) => updateQuestion(category.id, question.id, { question_text: e.target.value })}
                          placeholder="Question text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                        />
                        <input
                          type="text"
                          value={question.answer}
                          onChange={(e) => updateQuestion(category.id, question.id, { answer: e.target.value })}
                          placeholder="Answer"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Publish Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Publish</h3>
              
              <div className="space-y-4">
                <button
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  disabled
                >
                  Save Draft
                </button>
                
                <button
                  className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  disabled
                >
                  Schedule (Next Monday 07:00 AEST)
                </button>
                
                <button
                  className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                    canPublish
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  disabled={!canPublish}
                >
                  Publish Now
                </button>
                
                <button
                  className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                  disabled
                >
                  Archive
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Validation</h4>
                <div className="space-y-2 text-sm">
                  {categories.map((cat, index) => (
                    <div key={cat.id} className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        cat.title && cat.blurb && cat.questions.length === 5
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`} />
                      <span className="text-gray-600">
                        Round {index + 1}: {cat.questions.length}/5 questions
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
