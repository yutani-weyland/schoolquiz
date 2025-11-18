'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Check } from 'lucide-react'

// Popular 2025 display fonts (open source, Google Fonts)
const DISPLAY_FONTS = [
  { name: 'System Default', value: 'system-ui', category: 'System' },
  
  // Sans Serif
  { name: 'Inter', value: 'Inter', category: 'Sans Serif' },
  { name: 'Space Grotesk', value: 'Space Grotesk', category: 'Sans Serif' },
  { name: 'Outfit', value: 'Outfit', category: 'Sans Serif' },
  { name: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans', category: 'Sans Serif' },
  { name: 'Onest', value: 'Onest', category: 'Sans Serif' },
  { name: 'Sora', value: 'Sora', category: 'Sans Serif' },
  { name: 'Manrope', value: 'Manrope', category: 'Sans Serif' },
  { name: 'DM Sans', value: 'DM Sans', category: 'Sans Serif' },
  { name: 'Work Sans', value: 'Work Sans', category: 'Sans Serif' },
  { name: 'Roboto', value: 'Roboto', category: 'Sans Serif' },
  { name: 'Open Sans', value: 'Open Sans', category: 'Sans Serif' },
  { name: 'Montserrat', value: 'Montserrat', category: 'Sans Serif' },
  { name: 'Poppins', value: 'Poppins', category: 'Sans Serif' },
  { name: 'Nunito', value: 'Nunito', category: 'Sans Serif' },
  { name: 'Raleway', value: 'Raleway', category: 'Sans Serif' },
  { name: 'Source Sans Pro', value: 'Source Sans Pro', category: 'Sans Serif' },
  { name: 'Ubuntu', value: 'Ubuntu', category: 'Sans Serif' },
  { name: 'Lato', value: 'Lato', category: 'Sans Serif' },
  { name: 'Fira Sans', value: 'Fira Sans', category: 'Sans Serif' },
  { name: 'Noto Sans', value: 'Noto Sans', category: 'Sans Serif' },
  
  // Display - Bold & Edgy
  { name: 'Bebas Neue', value: 'Bebas Neue', category: 'Display' },
  { name: 'Oswald', value: 'Oswald', category: 'Display' },
  { name: 'Righteous', value: 'Righteous', category: 'Display' },
  { name: 'Bungee', value: 'Bungee', category: 'Display' },
  { name: 'Black Ops One', value: 'Black Ops One', category: 'Display' },
  { name: 'Orbitron', value: 'Orbitron', category: 'Display' },
  { name: 'Audiowide', value: 'Audiowide', category: 'Display' },
  { name: 'Press Start 2P', value: 'Press Start 2P', category: 'Display' },
  { name: 'Rubik Glitch', value: 'Rubik Glitch', category: 'Display' },
  { name: 'Syne', value: 'Syne', category: 'Display' },
  { name: 'Chakra Petch', value: 'Chakra Petch', category: 'Display' },
  { name: 'Russo One', value: 'Russo One', category: 'Display' },
  { name: 'Bungee Shade', value: 'Bungee Shade', category: 'Display' },
  { name: 'Bungee Inline', value: 'Bungee Inline', category: 'Display' },
  { name: 'Bungee Hairline', value: 'Bungee Hairline', category: 'Display' },
  { name: 'Creepster', value: 'Creepster', category: 'Display' },
  { name: 'Fascinate', value: 'Fascinate', category: 'Display' },
  { name: 'Fascinate Inline', value: 'Fascinate Inline', category: 'Display' },
  { name: 'Faster One', value: 'Faster One', category: 'Display' },
  { name: 'Freckle Face', value: 'Freckle Face', category: 'Display' },
  { name: 'Fredoka One', value: 'Fredoka One', category: 'Display' },
  { name: 'Frijole', value: 'Frijole', category: 'Display' },
  { name: 'Fugaz One', value: 'Fugaz One', category: 'Display' },
  { name: 'Graduate', value: 'Graduate', category: 'Display' },
  { name: 'Griffy', value: 'Griffy', category: 'Display' },
  { name: 'Iceberg', value: 'Iceberg', category: 'Display' },
  { name: 'Iceland', value: 'Iceland', category: 'Display' },
  { name: 'Impact', value: 'Impact', category: 'Display' },
  { name: 'Jockey One', value: 'Jockey One', category: 'Display' },
  { name: 'Knewave', value: 'Knewave', category: 'Display' },
  { name: 'Londrina Outline', value: 'Londrina Outline', category: 'Display' },
  { name: 'Londrina Shadow', value: 'Londrina Shadow', category: 'Display' },
  { name: 'Londrina Sketch', value: 'Londrina Sketch', category: 'Display' },
  { name: 'Londrina Solid', value: 'Londrina Solid', category: 'Display' },
  { name: 'Megrim', value: 'Megrim', category: 'Display' },
  { name: 'Metal', value: 'Metal', category: 'Display' },
  { name: 'Metal Mania', value: 'Metal Mania', category: 'Display' },
  { name: 'Monofett', value: 'Monofett', category: 'Display' },
  { name: 'Monoton', value: 'Monoton', category: 'Display' },
  { name: 'Nosifer', value: 'Nosifer', category: 'Display' },
  { name: 'Nova Square', value: 'Nova Square', category: 'Display' },
  { name: 'Orbitron', value: 'Orbitron', category: 'Display' },
  { name: 'Plaster', value: 'Plaster', category: 'Display' },
  { name: 'Ribeye', value: 'Ribeye', category: 'Display' },
  { name: 'Ribeye Marrow', value: 'Ribeye Marrow', category: 'Display' },
  { name: 'Rye', value: 'Rye', category: 'Display' },
  { name: 'Seymour One', value: 'Seymour One', category: 'Display' },
  { name: 'Sigmar One', value: 'Sigmar One', category: 'Display' },
  { name: 'Stalinist One', value: 'Stalinist One', category: 'Display' },
  { name: 'Stardos Stencil', value: 'Stardos Stencil', category: 'Display' },
  { name: 'Wallpoet', value: 'Wallpoet', category: 'Display' },
  { name: 'Wendy One', value: 'Wendy One', category: 'Display' },
  { name: 'Zilla Slab Highlight', value: 'Zilla Slab Highlight', category: 'Display' },
  
  // Futuristic & Tech
  { name: 'Rajdhani', value: 'Rajdhani', category: 'Futuristic' },
  { name: 'Exo 2', value: 'Exo 2', category: 'Futuristic' },
  { name: 'Titillium Web', value: 'Titillium Web', category: 'Futuristic' },
  { name: 'Aldrich', value: 'Aldrich', category: 'Futuristic' },
  { name: 'Electrolize', value: 'Electrolize', category: 'Futuristic' },
  { name: 'Share Tech', value: 'Share Tech', category: 'Futuristic' },
  { name: 'Share Tech Mono', value: 'Share Tech Mono', category: 'Futuristic' },
  { name: 'VT323', value: 'VT323', category: 'Futuristic' },
  { name: 'Quantico', value: 'Quantico', category: 'Futuristic' },
  { name: 'Sarpanch', value: 'Sarpanch', category: 'Futuristic' },
  { name: 'Saira', value: 'Saira', category: 'Futuristic' },
  { name: 'Saira Condensed', value: 'Saira Condensed', category: 'Futuristic' },
  { name: 'Saira Extra Condensed', value: 'Saira Extra Condensed', category: 'Futuristic' },
  { name: 'Saira Semi Condensed', value: 'Saira Semi Condensed', category: 'Futuristic' },
  { name: 'Saira Stencil One', value: 'Saira Stencil One', category: 'Futuristic' },
  
  // Retro & Vintage
  { name: 'Butcherman', value: 'Butcherman', category: 'Retro' },
  { name: 'Ewert', value: 'Ewert', category: 'Retro' },
  { name: 'Flamenco', value: 'Flamenco', category: 'Retro' },
  { name: 'Gravitas One', value: 'Gravitas One', category: 'Retro' },
  
  // Serif
  { name: 'Libre Baskerville', value: 'Libre Baskerville', category: 'Serif' },
  { name: 'PT Serif', value: 'PT Serif', category: 'Serif' },
  { name: 'Source Serif Pro', value: 'Source Serif Pro', category: 'Serif' },
]

interface FontBrowserProps {
  isOpen: boolean
  onClose: () => void
  currentFont: string
  currentColor?: string
  onSelectFont: (font: string) => void
  onSelectColor?: (color: string) => void
  label: string
}

export function FontBrowser({
  isOpen,
  onClose,
  currentFont,
  currentColor = '#000000',
  onSelectFont,
  onSelectColor,
  label,
}: FontBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = Array.from(new Set(DISPLAY_FONTS.map(f => f.category)))

  const filteredFonts = DISPLAY_FONTS.filter(font => {
    const matchesSearch = font.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || font.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleFontSelect = (fontValue: string) => {
    onSelectFont(fontValue)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {label}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Browse and select from popular 2025 display fonts
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Search and Filters */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search fonts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      !selectedCategory
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === category
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFonts.map((font) => {
                    const isSelected = currentFont === font.value
                    const fontFamily = font.value === 'system-ui' 
                      ? 'system-ui, -apple-system, sans-serif'
                      : `"${font.value}", sans-serif`

                    return (
                      <button
                        key={font.value}
                        onClick={() => handleFontSelect(font.value)}
                        className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div
                          className="text-2xl font-bold mb-2"
                          style={{ fontFamily }}
                        >
                          {font.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {font.category}
                        </div>
                        <div
                          className="text-sm text-gray-600 dark:text-gray-400 mt-2"
                          style={{ fontFamily }}
                        >
                          The quick brown fox jumps over the lazy dog
                        </div>
                      </button>
                    )
                  })}
                </div>

                {filteredFonts.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      No fonts found matching "{searchQuery}"
                    </p>
                  </div>
                )}
              </div>

              {/* Color Picker Footer */}
              {onSelectColor && (
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Font Color
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={currentColor}
                      onChange={(e) => onSelectColor(e.target.value)}
                      className="w-16 h-16 rounded-lg border-2 border-gray-300 dark:border-gray-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentColor}
                      onChange={(e) => onSelectColor(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="#000000"
                    />
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-700"
                      style={{ backgroundColor: currentColor }}
                    />
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

