import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/about',
  '/pricing'
]

// Define routes that are always public (assets, api, etc)
const isPublicStatic = (path: string) => {
  return (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/static') ||
    path.includes('.') // Files like favicon.ico, robots.txt
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Skip middleware for static files and API routes
  if (isPublicStatic(pathname)) {
    return NextResponse.next()
  }

  // 2. Check for auth token (check multiple sources)
  const authToken = request.cookies.get('next-auth.session-token') ||
    request.cookies.get('__Secure-next-auth.session-token') ||
    request.cookies.get('authToken') || // Custom auth token from localStorage-based auth
    request.headers.get('authorization')?.replace('Bearer ', '')

  const isAuthenticated = !!authToken
  const isPublicPage = publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))

  // 3. Handle Unauthenticated Users
  if (!isAuthenticated && !isPublicPage) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // 4. Handle Authenticated Users on Public Auth Pages
  // Let client-side handle redirects based on user role (admin -> /admin, others -> /quizzes)
  // Don't redirect here - let the sign-in form or home page handle role-based redirects
  if (isAuthenticated && (pathname === '/sign-in' || pathname === '/sign-up')) {
    // Let client-side redirect handle this to check platformRole
    return NextResponse.next()
  }

  // 5. Admin Route Protection
  // Note: Detailed role checking (Teacher vs Admin) is best done in the Layout 
  // or via a server-side utility since middleware has limited access to the DB.
  // However, we can ensure they are at least logged in (handled above).

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

