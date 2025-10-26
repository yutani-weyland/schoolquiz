import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccessibility } from "@schoolquiz/ui";
import { springs, transitions } from "@schoolquiz/ui";

export const AccessibilityPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    shouldReduceMotion,
    setShouldReduceMotion,
    fontFamily,
    setFontFamily,
    theme,
    setTheme,
    textSize,
    setTextSize
  } = useAccessibility();

  return (
    <>
      <motion.button
        className="fixed bottom-4 left-4 bg-white rounded-full shadow-lg p-3 border border-gray-200 hover:shadow-xl transition-shadow"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={springs.micro}
        aria-label="Accessibility settings"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-20 left-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={transitions.medium}
          >
            <h3 className="font-semibold text-gray-900 mb-3">Accessibility</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Font
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value as "default" | "dyslexic")}
                  className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="default">Default (Hyperlegible)</option>
                  <option value="dyslexic">OpenDyslexic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Theme
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as "default" | "high-contrast")}
                  className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="default">Default</option>
                  <option value="high-contrast">High Contrast</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Text Size
                </label>
                <select
                  value={textSize}
                  onChange={(e) => setTextSize(e.target.value as "normal" | "large")}
                  className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={shouldReduceMotion}
                    onChange={(e) => setShouldReduceMotion(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Reduce motion</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
