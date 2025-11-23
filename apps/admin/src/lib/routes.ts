export const ROUTES = {
    public: [
        '/',
        '/sign-in',
        '/sign-up',
        '/forgot-password',
        '/about',
        '/pricing',
    ],
    auth: {
        signIn: '/sign-in',
        signUp: '/sign-up',
    },
    admin: {
        root: '/admin',
        dashboard: '/admin/dashboard',
    },
    user: {
        dashboard: '/dashboard',
        quizzes: '/quizzes',
        createQuiz: '/create-quiz',
    },
} as const;

/**
 * Determines the default home route based on user role
 */
export function getHomeRouteForUser(role: string = 'teacher') {
    if (role === 'PlatformAdmin' || role === 'admin') {
        return ROUTES.admin.root;
    }
    return ROUTES.user.dashboard;
}

/**
 * Checks if a path is public
 */
export function isPublicRoute(path: string) {
    return ROUTES.public.some(route =>
        path === route || path.startsWith(`${route}/`)
    );
}
