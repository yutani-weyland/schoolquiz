import { type User } from 'next-auth';

export type Role = 'Student' | 'Teacher' | 'OrgAdmin' | 'PlatformAdmin';

export type Resource =
    | 'quiz'
    | 'league'
    | 'user'
    | 'organisation'
    | 'analytics'
    | 'billing'
    | 'system';

export type Action =
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | 'manage'
    | 'play'
    | 'join'
    | 'publish';

type PermissionRules = {
    [K in Role]: Partial<Record<Resource, Action[]>>;
};

/**
 * Centralized Permission Definitions
 * 
 * Defines what each role can do for each resource.
 * 'manage' implies all actions.
 */
export const PERMISSIONS: PermissionRules = {
    Student: {
        quiz: ['read', 'play'],
        league: ['read', 'join'],
        user: ['read', 'update'], // Can update own profile
    },
    Teacher: {
        quiz: ['read', 'play', 'create', 'update', 'delete', 'publish'],
        league: ['read', 'join', 'create', 'manage'],
        user: ['read', 'update'],
        organisation: ['read'],
    },
    OrgAdmin: {
        quiz: ['read', 'play', 'create', 'update', 'delete', 'publish', 'manage'],
        league: ['read', 'join', 'create', 'manage'],
        user: ['read', 'update', 'create', 'delete'], // Manage org users
        organisation: ['read', 'update', 'manage'],
        billing: ['read', 'manage'],
        analytics: ['read'],
    },
    PlatformAdmin: {
        quiz: ['manage'],
        league: ['manage'],
        user: ['manage'],
        organisation: ['manage'],
        analytics: ['manage'],
        billing: ['manage'],
        system: ['manage'],
    },
};

/**
 * Check if a user has permission to perform an action on a resource.
 * 
 * @param user - The user object (from session)
 * @param action - The action to perform
 * @param resource - The resource to act upon
 * @returns boolean
 */
export function can(user: User | null | undefined, action: Action, resource: Resource): boolean {
    if (!user || !user.platformRole) {
        return false;
    }

    const role = user.platformRole as Role;
    const rolePermissions = PERMISSIONS[role];

    if (!rolePermissions) {
        return false;
    }

    const resourcePermissions = rolePermissions[resource];

    if (!resourcePermissions) {
        return false;
    }

    // 'manage' grants all permissions
    if (resourcePermissions.includes('manage')) {
        return true;
    }

    return resourcePermissions.includes(action);
}

/**
 * Check if a role string is a valid Role
 */
export function isValidRole(role: string): role is Role {
    return ['Student', 'Teacher', 'OrgAdmin', 'PlatformAdmin'].includes(role);
}
