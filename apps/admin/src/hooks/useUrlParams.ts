import { useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * Hook to sync state with URL search params and localStorage
 */
export function useUrlParams<T extends Record<string, string>>(
  defaultParams: T,
  storageKey?: string
) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get initial values from URL or localStorage
  const getInitialParams = useCallback((): T => {
    const urlParams: Partial<T> = {}
    const keys = Object.keys(defaultParams) as Array<keyof T>

    // First, try to get from URL
    keys.forEach(key => {
      const value = searchParams.get(String(key))
      if (value !== null) {
        urlParams[key] = value as T[keyof T]
      }
    })

    // If URL has params, use them (URL takes precedence)
    if (Object.keys(urlParams).length > 0) {
      return { ...defaultParams, ...urlParams }
    }

    // Otherwise, try localStorage
    if (storageKey && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          return { ...defaultParams, ...parsed }
        }
      } catch (error) {
        console.error('Failed to parse stored params:', error)
      }
    }

    return defaultParams
  }, [searchParams, defaultParams, storageKey])

  // Update URL params
  const updateParams = useCallback((updates: Partial<T>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })

    // Update URL
    router.push(`?${params.toString()}`, { scroll: false })

    // Update localStorage
    if (storageKey && typeof window !== 'undefined') {
      try {
        const current = getInitialParams()
        const updated = { ...current, ...updates }
        localStorage.setItem(storageKey, JSON.stringify(updated))
      } catch (error) {
        console.error('Failed to save params to localStorage:', error)
      }
    }
  }, [router, searchParams, storageKey, getInitialParams])

  return {
    params: getInitialParams(),
    updateParams,
  }
}

