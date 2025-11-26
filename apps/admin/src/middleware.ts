import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/about',
  '/pricing',
  '/quizzes' // Allow /quizzes - the page itself handles auth and redirects visitors
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

  // 2. Check for NextAuth session cookie
  // NextAuth v5 uses 'authjs.session-token' in development
  // Also check legacy NextAuth cookie names for compatibility
  const hasSessionCookie = 
    request.cookies.get('authjs.session-token') ||
    request.cookies.get('__Secure-authjs.session-token') ||
    request.cookies.get('next-auth.session-token') ||
    request.cookies.get('__Secure-next-auth.session-token') ||
    request.cookies.get('authToken') // Legacy custom auth token

  const isAuthenticated = !!hasSessionCookie
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

  // OPTIMIZATION: Add bfcache-friendly headers to enable back/forward cache
  // This improves navigation performance when users go back/forward
  const response = NextResponse.next()
  
  // Only add bfcache headers for HTML pages (not API routes or static files)
  if (!isPublicStatic(pathname) && !pathname.startsWith('/api')) {
    // Allow pages to be cached in bfcache
    // Don't set cache-control: no-store as it prevents bfcache
    response.headers.set('Cache-Control', 'private, max-age=0, must-revalidate')
    
    // Explicitly allow bfcache (though browsers may still block if other conditions aren't met)
    // The main blocker was cache-control: no-store, which we're now avoiding
  }

  return response
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

