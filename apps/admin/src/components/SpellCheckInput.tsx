"use client";

import { useState, useEffect, useRef } from 'react';
import Typo from 'typo-js';

interface SpellCheckInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  type?: 'input' | 'textarea';
}

export function SpellCheckInput({ 
  value, 
  onChange, 
  placeholder, 
  className = '', 
  rows = 2,
  type = 'input'
}: SpellCheckInputProps) {
  const [typo, setTypo] = useState<Typo | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');
  const [wordPosition, setWordPosition] = useState({ start: 0, end: 0 });
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    // Initialize spell checker with a simple fallback
    const initializeSpellChecker = async () => {
      try {
        // Try to initialize with a basic dictionary
        const spellChecker = new Typo('en_US');
        setTypo(spellChecker);
      } catch (error) {
        console.warn('Spell checker initialization failed, continuing without spell check:', error);
        // Set a mock typo object to prevent errors
        setTypo({
          check: () => true, // Always return true (no spell checking)
          suggest: () => [] // Return empty suggestions
        } as any);
      }
    };

    initializeSpellChecker();
  }, []);

  const checkSpelling = (text: string, cursorPosition: number) => {
    if (!typo) return;

    const words = text.split(/(\s+)/);
    let currentPos = 0;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordStart = currentPos;
      const wordEnd = currentPos + word.length;
      
      // Check if cursor is within this word
      if (cursorPosition >= wordStart && cursorPosition <= wordEnd) {
        const cleanWord = word.replace(/[^\w]/g, '');
        if (cleanWord.length > 2 && !typo.check(cleanWord)) {
          const wordSuggestions = typo.suggest(cleanWord).slice(0, 5);
          setSuggestions(wordSuggestions);
          setSelectedWord(cleanWord);
          setWordPosition({ start: wordStart, end: wordEnd });
          setShowSuggestions(true);
          return;
        }
      }
      currentPos = wordEnd;
    }
    
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Check spelling at cursor position
    setTimeout(() => {
      checkSpelling(newValue, e.target.selectionStart || 0);
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const applySuggestion = (suggestion: string) => {
    const beforeWord = value.substring(0, wordPosition.start);
    const afterWord = value.substring(wordPosition.end);
    const newValue = beforeWord + suggestion + afterWord;
    
    onChange(newValue);
    setShowSuggestions(false);
    
    // Focus back to input
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = wordPosition.start + suggestion.length;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        inputRef.current.focus();
      }
    }, 0);
  };

  const InputComponent = type === 'textarea' ? 'textarea' : 'input';
  const inputProps = type === 'textarea' ? { rows } : {};

  return (
    <div className="relative">
      <InputComponent
        ref={inputRef as any}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${className} ${showSuggestions ? 'ring-2 ring-red-300 dark:ring-red-600' : ''} rounded-lg`}
        {...inputProps}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-20 p-2 min-w-48">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Did you mean:
          </div>
          <div className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => applySuggestion(suggestion)}
                className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Ignore
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
