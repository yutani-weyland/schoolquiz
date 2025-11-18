'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AccordionSectionProps {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export function AccordionSection({
  title,
  icon,
  children,
  defaultOpen = false,
  className = '',
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={`border border-gray-200/50 dark:border-gray-700/50 rounded-xl overflow-hidden bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)] ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-500 dark:text-gray-400">{icon}</span>}
          <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 pt-0 border-t border-gray-200/50 dark:border-gray-700/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

