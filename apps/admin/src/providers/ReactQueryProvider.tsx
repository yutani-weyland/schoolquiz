'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

export function ReactQueryProvider({ children }: { children: ReactNode }) {
    // Create a client with optimized defaults
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Cache data for 5 minutes by default
                        staleTime: 5 * 60 * 1000,
                        // Keep unused data in cache for 10 minutes
                        gcTime: 10 * 60 * 1000,
                        // Retry failed requests once
                        retry: 1,
                        // Refetch on window focus for fresh data
                        refetchOnWindowFocus: true,
                        // Don't refetch on mount if data is fresh
                        refetchOnMount: false,
                    },
                },
            })
    )

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
