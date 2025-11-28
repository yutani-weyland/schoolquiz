'use client';

import { useSession } from 'next-auth/react';
import { can, type Action, type Resource } from '@/lib/permissions';

/**
 * Hook to check permissions in client components.
 * 
 * Usage:
 * const { can, isLoading } = usePermission();
 * 
 * if (can('create', 'quiz')) {
 *   // ...
 * }
 */
export function usePermission() {
    const { data: session, status } = useSession();
    const isLoading = status === 'loading';

    const checkPermission = (action: Action, resource: Resource) => {
        if (isLoading) return false;
        return can(session?.user, action, resource);
    };

    return {
        can: checkPermission,
        isLoading,
        user: session?.user,
        role: session?.user?.platformRole,
    };
}
