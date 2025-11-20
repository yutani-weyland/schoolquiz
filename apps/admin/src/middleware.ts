import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware for authentication and route protection
 * 
 * This runs before the request is completed, allowing us to:
 * - Check authentication without opting routes into dynamic rendering
 * - Redirect unauthenticated users
 * - Preserve static rendering for public pages
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin routes - require authentication
  if (pathname.startsWith('/admin')) {
    // Check for authentication token in cookies or headers
    const authToken = request.cookies.get('next-auth.session-token') || 
                     request.cookies.get('__Secure-next-auth.session-token') ||
                     request.headers.get('authorization')?.replace('Bearer ', '')

    // If no auth token, redirect to sign-in
    if (!authToken) {
      const signInUrl = new URL('/sign-in', request.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }

    // For admin routes, we could also check for platform admin role here
    // But that requires a database query, which we want to avoid in middleware
    // So we'll do the role check in the layout instead
  }

  // Allow the request to continue
  return NextResponse.next()
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

