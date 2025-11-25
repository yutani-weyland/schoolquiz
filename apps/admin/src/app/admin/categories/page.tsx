"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader, Card, Input, Button } from '@/components/admin/ui';

// Spring configurations (from @schoolquiz/ui)
const springs = {
  micro: { type: "spring" as const, stiffness: 380, damping: 28, mass: 0.8 },
  gentle: { type: "spring" as const, stiffness: 200, damping: 25, mass: 1 },
  snappy: { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.5 }
};

// Transition presets (from @schoolquiz/ui)
const transitions = {
  fast: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const },
  medium: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const },
  slow: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  easeOut: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
  easeInOut: { duration: 0.24, ease: [0.45, 0, 0.40, 1] as const }
};

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
    <div className="space-y-6">
      <PageHeader
        title="Category Library"
        description="Browse and manage question categories"
      />

      {/* Search and Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">All</Button>
            <Button variant="outline" size="sm">Popular</Button>
            <Button variant="outline" size="sm">Recent</Button>
          </div>
        </div>
      </Card>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.medium, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                  style={{ backgroundColor: category.color }}
                />
                <div className="flex-1 ml-3">
                  <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                    {category.name}
                  </h3>
                  <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                  {category.questionCount} questions
                </span>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={springs.micro}
                >
                  <Button variant="secondary" size="sm">
                    Insert to Round
                  </Button>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[hsl(var(--muted-foreground))]">No categories found matching your search.</p>
        </div>
      )}
    </div>
  );
}
