"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { springs, transitions } from "@schoolquiz/ui";

const categories = [
  {
    id: "history",
    name: "Australian History",
    description: "Questions about Australia's historical events, figures, and milestones",
    color: "#F4A261",
    questionCount: 15
  },
  {
    id: "science",
    name: "Science & Technology", 
    description: "Scientific concepts, discoveries, and technological advancements",
    color: "#7FB3FF",
    questionCount: 23
  },
  {
    id: "pop-culture",
    name: "Pop Culture",
    description: "Music, movies, TV shows, and entertainment from Australia and beyond",
    color: "#F7A8C0",
    questionCount: 18
  },
  {
    id: "sport",
    name: "Sport",
    description: "Australian sports, athletes, and sporting achievements",
    color: "#9EE6B4",
    questionCount: 12
  },
  {
    id: "civics",
    name: "Civics & Government",
    description: "Australian political system, government, and civic responsibilities",
    color: "#F7D57A",
    questionCount: 20
  }
];

export default function CategoryLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Category Library</h1>
          <p className="text-gray-600 mt-2">Browse and manage question categories</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                All
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Popular
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Recent
              </button>
            </div>
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category, index) => (
            <motion.div
              key={category.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transitions.medium, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                  style={{ backgroundColor: category.color }}
                />
                <div className="flex-1 ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {category.questionCount} questions
                </span>
                <motion.button
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={springs.micro}
                >
                  Insert to Round
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No categories found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
