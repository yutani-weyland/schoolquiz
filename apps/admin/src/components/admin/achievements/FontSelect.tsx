'use client'

import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Popular fonts - expanded for different quiz categories
const DISPLAY_FONTS = [
  { name: 'System Default', value: 'system-ui', category: 'System' },
  // Clean & Modern (Science, Math, General)
  { name: 'Inter', value: 'Inter', category: 'Sans Serif' },
  { name: 'Space Grotesk', value: 'Space Grotesk', category: 'Sans Serif' },
  { name: 'Outfit', value: 'Outfit', category: 'Sans Serif' },
  { name: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans', category: 'Sans Serif' },
  { name: 'Roboto', value: 'Roboto', category: 'Sans Serif' },
  { name: 'Montserrat', value: 'Montserrat', category: 'Sans Serif' },
  { name: 'Poppins', value: 'Poppins', category: 'Sans Serif' },
  { name: 'Raleway', value: 'Raleway', category: 'Sans Serif' },
  { name: 'Lato', value: 'Lato', category: 'Sans Serif' },
  { name: 'DM Sans', value: 'DM Sans', category: 'Sans Serif' },
  { name: 'Work Sans', value: 'Work Sans', category: 'Sans Serif' },
  { name: 'Sora', value: 'Sora', category: 'Sans Serif' },
  { name: 'Manrope', value: 'Manrope', category: 'Sans Serif' },
  // Classic & Elegant (History, Literature)
  { name: 'Playfair Display', value: 'Playfair Display', category: 'Serif' },
  { name: 'Merriweather', value: 'Merriweather', category: 'Serif' },
  { name: 'Lora', value: 'Lora', category: 'Serif' },
  { name: 'Crimson Pro', value: 'Crimson Pro', category: 'Serif' },
  { name: 'Libre Baskerville', value: 'Libre Baskerville', category: 'Serif' },
  { name: 'PT Serif', value: 'PT Serif', category: 'Serif' },
  // Bold & Energetic (Sports, Action)
  { name: 'Bebas Neue', value: 'Bebas Neue', category: 'Display' },
  { name: 'Oswald', value: 'Oswald', category: 'Display' },
  { name: 'Righteous', value: 'Righteous', category: 'Display' },
  { name: 'Bungee', value: 'Bungee', category: 'Display' },
  { name: 'Black Ops One', value: 'Black Ops One', category: 'Display' },
  { name: 'Russo One', value: 'Russo One', category: 'Display' },
  { name: 'Fredoka One', value: 'Fredoka One', category: 'Display' },
  { name: 'Fugaz One', value: 'Fugaz One', category: 'Display' },
  { name: 'Impact', value: 'Impact', category: 'Display' },
  { name: 'Sigmar One', value: 'Sigmar One', category: 'Display' },
  { name: 'Jockey One', value: 'Jockey One', category: 'Display' },
  { name: 'Graduate', value: 'Graduate', category: 'Display' },
  // Futuristic & Tech (Science, Technology)
  { name: 'Orbitron', value: 'Orbitron', category: 'Futuristic' },
  { name: 'Audiowide', value: 'Audiowide', category: 'Futuristic' },
  { name: 'Rajdhani', value: 'Rajdhani', category: 'Futuristic' },
  { name: 'Exo 2', value: 'Exo 2', category: 'Futuristic' },
  { name: 'Titillium Web', value: 'Titillium Web', category: 'Futuristic' },
  { name: 'Aldrich', value: 'Aldrich', category: 'Futuristic' },
  { name: 'Electrolize', value: 'Electrolize', category: 'Futuristic' },
  { name: 'Share Tech', value: 'Share Tech', category: 'Futuristic' },
  { name: 'Quantico', value: 'Quantico', category: 'Futuristic' },
  // Fun & Creative (Art, Creative, Kids)
  { name: 'Press Start 2P', value: 'Press Start 2P', category: 'Display' },
  { name: 'Creepster', value: 'Creepster', category: 'Display' },
  { name: 'Freckle Face', value: 'Freckle Face', category: 'Display' },
  { name: 'Frijole', value: 'Frijole', category: 'Display' },
  { name: 'Knewave', value: 'Knewave', category: 'Display' },
  { name: 'Londrina Solid', value: 'Londrina Solid', category: 'Display' },
  { name: 'Nova Square', value: 'Nova Square', category: 'Display' },
  { name: 'Ribeye', value: 'Ribeye', category: 'Display' },
  { name: 'Stardos Stencil', value: 'Stardos Stencil', category: 'Display' },
  // Stylish & Modern (Music, Arts, Culture)
  { name: 'Syne', value: 'Syne', category: 'Display' },
  { name: 'Chakra Petch', value: 'Chakra Petch', category: 'Display' },
  { name: 'Saira', value: 'Saira', category: 'Display' },
  { name: 'Saira Condensed', value: 'Saira Condensed', category: 'Display' },
  { name: 'Nunito', value: 'Nunito', category: 'Sans Serif' },
  { name: 'Ubuntu', value: 'Ubuntu', category: 'Sans Serif' },
  { name: 'Fira Sans', value: 'Fira Sans', category: 'Sans Serif' },
]

interface FontSelectProps {
  value: string
  onChange: (font: string) => void
  label?: string
  className?: string
}

export function FontSelect({ value, onChange, label, className }: FontSelectProps) {
  const selectedFont = DISPLAY_FONTS.find(f => f.value === value) || DISPLAY_FONTS[0]
  const fontFamily = value === 'system-ui' 
    ? 'system-ui, -apple-system, sans-serif'
    : `"${value}", sans-serif`

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
          {label}
        </label>
      )}
      
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger 
          className="w-full h-9 text-xs"
          style={{ fontFamily }}
        >
          <SelectValue>
            <span className="truncate">{selectedFont.name}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {DISPLAY_FONTS.map((font) => {
            const optionFontFamily = font.value === 'system-ui'
              ? 'system-ui, -apple-system, sans-serif'
              : `"${font.value}", sans-serif`

            return (
              <SelectItem
                key={font.value}
                value={font.value}
                className="py-2.5"
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span
                      className="text-sm font-medium truncate flex-1"
                      style={{ fontFamily: optionFontFamily }}
                    >
                      {font.name}
                    </span>
                    <span
                      className="text-xs text-[hsl(var(--muted-foreground))] truncate"
                      style={{ fontFamily: optionFontFamily }}
                    >
                      Aa Bb Cc
                    </span>
                  </div>
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}

