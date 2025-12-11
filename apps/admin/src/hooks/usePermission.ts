'use client';

import { useSession } from 'next-auth/react';
import { can, type Action, type Resource, type AppUser } from '@/lib/permissions';

// ...

export function usePermission() {
    const { data: session, status } = useSession();
    const isLoading = status === 'loading';

    const checkPermission = (action: Action, resource: Resource) => {
        if (isLoading) return false;
        return can(session?.user as AppUser | undefined, action, resource);
    };

    return {
        can: checkPermission,
        isLoading,
        user: session?.user,
        role: (session?.user as AppUser | undefined)?.platformRole,
    };
}
