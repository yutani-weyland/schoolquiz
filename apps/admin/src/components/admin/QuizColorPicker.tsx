'use client'

import { useState } from 'react'
import { Palette } from 'lucide-react'
import { quizColors } from '@/lib/colors'

interface QuizColorPickerProps {
  value: string
  onChange: (color: string) => void
  disabled?: boolean
}

export function QuizColorPicker({ value, onChange, disabled }: QuizColorPickerProps) {
  const [showCustom, setShowCustom] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        <label className="text-sm font-medium text-[hsl(var(--foreground))]">
          Quiz Card Color
        </label>
      </div>
      
      {/* Preset Colors - Compact Grid */}
      <div className="flex flex-wrap gap-2">
        {quizColors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => {
              onChange(color)
              setShowCustom(false)
            }}
            disabled={disabled}
            className={`
              w-8 h-8 rounded-lg border-2 transition-all
              ${value === color
                ? 'border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary))]/20 scale-110'
                : 'border-[hsl(var(--border))] hover:scale-105 hover:border-[hsl(var(--foreground))]/30'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
        
        {/* Custom Color Toggle */}
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          disabled={disabled}
          className={`
            w-8 h-8 rounded-lg border-2 border-dashed transition-all
            ${showCustom || (!quizColors.includes(value) && value)
              ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5'
              : 'border-[hsl(var(--border))] hover:border-[hsl(var(--foreground))]/30'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            flex items-center justify-center
          `}
          title="Custom color"
        >
          <span className="text-xs text-[hsl(var(--muted-foreground))]">+</span>
        </button>
      </div>

      {/* Custom Color Input - Compact */}
      {showCustom && (
        <div className="flex items-center gap-2 pt-2 border-t border-[hsl(var(--border))]">
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-8 h-8 rounded border border-[hsl(var(--border))] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <input
            type="text"
            value={value || ''}
            onChange={(e) => {
              const val = e.target.value
              if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val) || val === '') {
                onChange(val || '')
              }
            }}
            onBlur={(e) => {
              if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(e.target.value) && e.target.value !== '') {
                // Reset if invalid
                onChange('')
              }
            }}
            disabled={disabled}
            placeholder="#FFE135"
            className="flex-1 h-8 px-2 text-sm border border-[hsl(var(--border))] rounded bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))] disabled:opacity-50"
          />
        </div>
      )}
    </div>
  )
}

