'use client'

import { useEffect } from 'react'

/**
 * SpeculationRules component that uses the Speculation Rules API
 * to prerender pages before users click on links.
 * 
 * This makes navigation feel instant (0ms perceived latency) because
 * the page is already rendered in a background tab/process.
 * 
 * Browser support: Chrome 109+, Edge 109+
 * Falls back gracefully in unsupported browsers.
 */
interface SpeculationRule {
  source: 'list' | 'document'
  urls: string[]
  requires?: string[]
  eagerness?: 'conservative' | 'moderate' | 'eager' | 'immediate'
}

interface SpeculationRulesProps {
  /**
   * URLs to prerender. Can be relative or absolute.
   * Relative URLs are resolved against the current origin.
   * If not provided, will use document rules (prerender all same-origin links).
   */
  urls?: string[]
  
  /**
   * Eagerness level:
   * - 'conservative': Only prerender on hover/focus (default)
   * - 'moderate': Prerender on hover/focus + after 2s of mouse inactivity
   * - 'eager': Prerender on hover/focus + after 200ms of mouse inactivity
   * - 'immediate': Prerender immediately when the page loads
   */
  eagerness?: 'conservative' | 'moderate' | 'eager' | 'immediate'
  
  /**
   * Whether to use document rules instead of list rules.
   * Document rules prerender based on link patterns in the DOM.
   * List rules prerender specific URLs.
   * If urls is not provided, this defaults to true.
   */
  useDocumentRules?: boolean
}

export function SpeculationRules({ 
  urls, 
  eagerness = 'conservative',
  useDocumentRules 
}: SpeculationRulesProps) {
  // If no URLs provided, default to document rules
  const shouldUseDocumentRules = useDocumentRules ?? (!urls || urls.length === 0)
  useEffect(() => {
    // Check if browser supports Speculation Rules API
    if (typeof HTMLScriptElement.prototype.supports === 'function') {
      const supportsSpeculationRules = HTMLScriptElement.prototype.supports('speculationrules')
      if (!supportsSpeculationRules) {
        return // Browser doesn't support Speculation Rules API
      }
    } else {
      // Fallback: Check for Chrome/Edge user agent (basic check)
      // In production, you might want to use feature detection libraries
      const userAgent = navigator.userAgent
      const isChrome = /Chrome/.test(userAgent) && !/Edg/.test(userAgent)
      const isEdge = /Edg/.test(userAgent)
      const isSupported = isChrome || isEdge
      
      if (!isSupported) {
        return // Browser likely doesn't support Speculation Rules API
      }
    }

    // Remove any existing speculation rules script
    const existingScript = document.querySelector('script[type="speculationrules"]')
    if (existingScript) {
      existingScript.remove()
    }

    // Create speculation rules
    const rule: SpeculationRule = shouldUseDocumentRules
      ? {
          source: 'document',
          eagerness,
        }
      : {
          source: 'list',
          urls: (urls || []).map(url => {
            // Convert relative URLs to absolute
            if (url.startsWith('/')) {
              return `${window.location.origin}${url}`
            }
            return url
          }),
          eagerness,
        }

    // Create and inject the script tag
    const script = document.createElement('script')
    script.type = 'speculationrules'
    script.textContent = JSON.stringify({ prerender: [rule] })
    document.head.appendChild(script)

    // Cleanup: remove script when component unmounts
    return () => {
      const scriptToRemove = document.querySelector('script[type="speculationrules"]')
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [urls, eagerness, shouldUseDocumentRules])

  // This component doesn't render anything
  return null
}

/**
 * Hook version for programmatic use
 */
export function useSpeculationRules(
  urls: string[],
  eagerness: 'conservative' | 'moderate' | 'eager' | 'immediate' = 'conservative'
) {
  useEffect(() => {
    if (typeof HTMLScriptElement.prototype.supports === 'function') {
      const supportsSpeculationRules = HTMLScriptElement.prototype.supports('speculationrules')
      if (!supportsSpeculationRules) {
        return
      }
    }

    const existingScript = document.querySelector('script[type="speculationrules"]')
    if (existingScript) {
      existingScript.remove()
    }

    const rule: SpeculationRule = {
      source: 'list',
      urls: urls.map(url => {
        if (url.startsWith('/')) {
          return `${window.location.origin}${url}`
        }
        return url
      }),
      eagerness,
    }

    const script = document.createElement('script')
    script.type = 'speculationrules'
    script.textContent = JSON.stringify({ prerender: [rule] })
    document.head.appendChild(script)

    return () => {
      const scriptToRemove = document.querySelector('script[type="speculationrules"]')
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [urls, eagerness])
}
