/**
 * useApiQuery - Standardized data fetching hook
 * 
 * Provides consistent loading, error, and caching behavior for API calls.
 * Designed to work with Next.js API routes and can be easily extended for database integration.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseApiQueryOptions<T> {
	/** Function that returns a promise for the API call */
	fetchFn: () => Promise<T>;
	/** Whether to automatically fetch on mount (default: true) */
	enabled?: boolean;
	/** Cache key for request deduplication (optional) */
	cacheKey?: string;
	/** Stale time in milliseconds (default: 0 = always refetch) */
	staleTime?: number;
	/** Retry configuration */
	retry?: {
		/** Number of retries (default: 0) */
		count?: number;
		/** Delay between retries in ms (default: 1000) */
		delay?: number;
	};
	/** Callback when data is successfully fetched */
	onSuccess?: (data: T) => void;
	/** Callback when fetch fails */
	onError?: (error: Error) => void;
}

export interface UseApiQueryResult<T> {
	/** The fetched data */
	data: T | null;
	/** Whether the request is in progress */
	loading: boolean;
	/** Error object if request failed */
	error: Error | null;
	/** Manually trigger a refetch */
	refetch: () => Promise<void>;
	/** Clear the error state */
	clearError: () => void;
}

// Simple in-memory cache for request deduplication
const requestCache = new Map<string, {
	data: any;
	timestamp: number;
	pending: Promise<any> | null;
}>();

/**
 * Standardized API query hook
 */
export function useApiQuery<T>({
	fetchFn,
	enabled = true,
	cacheKey,
	staleTime = 0,
	retry = { count: 0, delay: 1000 },
	onSuccess,
	onError,
}: UseApiQueryOptions<T>): UseApiQueryResult<T> {
	// All hooks must be called unconditionally and in the same order every render
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<Error | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const mountedRef = useRef(true);
	const initializedRef = useRef(false);

	// Store callbacks in refs to avoid dependency issues
	const onSuccessRef = useRef(onSuccess);
	const onErrorRef = useRef(onError);
	const fetchFnRef = useRef(fetchFn);
	const retryCountRef = useRef(retry.count ?? 0);
	const retryDelayRef = useRef(retry.delay ?? 1000);

	// Update refs when values change
	useEffect(() => {
		onSuccessRef.current = onSuccess;
		onErrorRef.current = onError;
		fetchFnRef.current = fetchFn;
		retryCountRef.current = retry.count ?? 0;
		retryDelayRef.current = retry.delay ?? 1000;
	}, [fetchFn, onSuccess, onError, retry.count, retry.delay]);

	const performFetch = useCallback(async (isRetry = false): Promise<void> => {
		// Check cache if cacheKey is provided
		if (cacheKey && !isRetry) {
			const cached = requestCache.get(cacheKey);
			if (cached) {
				const age = Date.now() - cached.timestamp;
				if (age < staleTime) {
					// Cache is still fresh
					if (mountedRef.current) {
						setData(cached.data);
						setLoading(false);
						setError(null);
						onSuccessRef.current?.(cached.data);
					}
					return;
				}
				// Check if there's a pending request
				if (cached.pending) {
					try {
						const result = await cached.pending;
						if (mountedRef.current) {
							setData(result);
							setLoading(false);
							setError(null);
							onSuccessRef.current?.(result);
						}
						return;
					} catch (err) {
						// Pending request failed, continue with new request
					}
				}
			}
		}

		// Abort previous request if any
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		// Create new abort controller
		abortControllerRef.current = new AbortController();

		if (mountedRef.current && !isRetry) {
			setLoading(true);
			setError(null);
		}

		let retryCount = 0;

		const attemptFetch = async (): Promise<T> => {
			try {
				const result = await fetchFnRef.current();
				
				// Check if request was aborted
				if (abortControllerRef.current?.signal.aborted) {
					throw new Error('Request aborted');
				}

				// Update cache if cacheKey is provided
				if (cacheKey) {
					requestCache.set(cacheKey, {
						data: result,
						timestamp: Date.now(),
						pending: null,
					});
				}

				return result;
			} catch (err) {
				const error = err instanceof Error ? err : new Error('Unknown error');

				// Retry logic
				if (retryCount < retryCountRef.current) {
					retryCount++;
					await new Promise(resolve => setTimeout(resolve, retryDelayRef.current));
					return attemptFetch();
				}

				throw error;
			}
		};

		try {
			// Create pending promise for cache deduplication
			const pendingPromise = attemptFetch();
			if (cacheKey) {
				const cached = requestCache.get(cacheKey);
				if (cached) {
					cached.pending = pendingPromise;
				} else {
					requestCache.set(cacheKey, {
						data: null,
						timestamp: 0,
						pending: pendingPromise,
					});
				}
			}

			const result = await pendingPromise;

			if (mountedRef.current) {
				setData(result);
				setLoading(false);
				setError(null);
				onSuccessRef.current?.(result);
			}
		} catch (err) {
			if (abortControllerRef.current?.signal.aborted) {
				// Request was aborted, don't update state
				return;
			}

			const error = err instanceof Error ? err : new Error('Unknown error');
			if (mountedRef.current) {
				setError(error);
				setLoading(false);
				onErrorRef.current?.(error);
			}
		} finally {
			// Clear pending promise from cache
			if (cacheKey) {
				const cached = requestCache.get(cacheKey);
				if (cached) {
					cached.pending = null;
				}
			}
		}
	}, [cacheKey, staleTime]);

	// Initialize loading state and fetch on mount if enabled
	useEffect(() => {
		if (!initializedRef.current) {
			setLoading(enabled);
			initializedRef.current = true;
			if (enabled) {
				performFetch();
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Only run once on mount

	// Handle enabled changes after initialization
	useEffect(() => {
		if (initializedRef.current && enabled && !loading && !data && !error) {
			// If enabled changes to true after initialization and we have no data, fetch
			performFetch();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [enabled]); // Only depend on enabled, not on performFetch to avoid loops

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			mountedRef.current = false;
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, []);

	const refetch = useCallback(async () => {
		await performFetch(true);
	}, [performFetch]);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	return {
		data,
		loading,
		error,
		refetch,
		clearError,
	};
}

/**
 * Helper to clear cache for a specific key
 */
export function clearApiCache(cacheKey: string): void {
	requestCache.delete(cacheKey);
}

/**
 * Helper to clear all cache
 */
export function clearAllApiCache(): void {
	requestCache.clear();
}

