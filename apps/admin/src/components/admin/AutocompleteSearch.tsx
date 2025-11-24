'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AutocompleteSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  suggestions?: string[]
  onFetchSuggestions?: (query: string) => Promise<string[]>
  debounceMs?: number
  minChars?: number
  maxSuggestions?: number
}

export function AutocompleteSearch({
  value,
  onChange,
  placeholder = 'Search...',
  className,
  suggestions: staticSuggestions,
  onFetchSuggestions,
  debounceMs = 300,
  minChars = 2,
  maxSuggestions = 10,
}: AutocompleteSearchProps) {
  const [localSuggestions, setLocalSuggestions] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  // Filter static suggestions
  useEffect(() => {
    if (staticSuggestions && value.length >= minChars) {
      const filtered = staticSuggestions
        .filter(s => s.toLowerCase().includes(value.toLowerCase()))
        .slice(0, maxSuggestions)
      setLocalSuggestions(filtered)
      setIsOpen(filtered.length > 0)
    } else if (staticSuggestions) {
      setLocalSuggestions([])
      setIsOpen(false)
    }
  }, [value, staticSuggestions, minChars, maxSuggestions])

  // Fetch dynamic suggestions
  useEffect(() => {
    if (onFetchSuggestions && value.length >= minChars) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      setIsLoading(true)
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const results = await onFetchSuggestions(value)
          setLocalSuggestions(results.slice(0, maxSuggestions))
          setIsOpen(results.length > 0)
        } catch (error) {
          console.error('Error fetching suggestions:', error)
          setLocalSuggestions([])
          setIsOpen(false)
        } finally {
          setIsLoading(false)
        }
      }, debounceMs)
    } else if (onFetchSuggestions) {
      setLocalSuggestions([])
      setIsOpen(false)
      setIsLoading(false)
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [value, onFetchSuggestions, debounceMs, minChars, maxSuggestions])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = useCallback((suggestion: string) => {
    onChange(suggestion)
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }, [onChange])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || localSuggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < localSuggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < localSuggestions.length) {
          handleSelect(localSuggestions[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const allSuggestions = localSuggestions

  // Extract height classes from className to apply only to input
  const heightMatch = className?.match(/\bh-\d+\b/)
  const heightClass = heightMatch ? heightMatch[0] : null
  const classNameWithoutHeight = className?.replace(/\bh-\d+\b/g, '').trim() || ''

  return (
    <div ref={containerRef} className={cn('relative', classNameWithoutHeight)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))] z-10" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (allSuggestions.length > 0) {
              setIsOpen(true)
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-10 py-2 border border-[hsl(var(--border))] rounded-xl',
            'bg-[hsl(var(--input))] text-[hsl(var(--foreground))]',
            'placeholder:text-[hsl(var(--muted-foreground))]',
            'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]',
            'text-sm',
            heightClass
          )}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('')
              setIsOpen(false)
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && allSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[hsl(var(--popover))] border border-[hsl(var(--border))] rounded-xl shadow-lg max-h-60 overflow-auto">
          {allSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={cn(
                'w-full text-left px-4 py-2 text-sm hover:bg-[hsl(var(--muted))] transition-colors',
                'first:rounded-t-xl last:rounded-b-xl',
                index === selectedIndex && 'bg-[hsl(var(--muted))]'
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {isLoading && value.length >= minChars && (
        <div className="absolute z-50 w-full mt-1 bg-[hsl(var(--popover))] border border-[hsl(var(--border))] rounded-xl shadow-lg p-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Searching...
        </div>
      )}
    </div>
  )
}

