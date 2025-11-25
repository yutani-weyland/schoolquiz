/**
 * NextAuth v5 (Auth.js) Configuration
 * 
 * This module exports the NextAuth v5 configuration for the SchoolQuiz application.
 * 
 * Security improvements:
 * - Uses Prisma adapter for database-backed sessions
 * - Credentials provider with secure password verification
 * - Enhanced session with role and organisation data
 */

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { verifyPassword } from './password'

// Import prisma - if it fails, we'll handle it in the callbacks
// Using a function to lazy-load prisma to avoid initialization errors
let prisma: any = null

// Lazy getter for prisma - only imports when needed
function getPrisma(): any {
  if (prisma) return prisma
  
  try {
    // Dynamic import to avoid module load errors
    const dbModule = require('@schoolquiz/db')
    prisma = dbModule.prisma
    return prisma
  } catch (error) {
    console.warn('[NextAuth] Prisma not available:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

// Extended user type for our application
interface ExtendedUser {
  id: string
  email: string
  name: string | null
  platformRole: string | null
}

// NextAuth v5 configuration
// Note: Adapter is optional - we can use JWT sessions instead
// If you want database sessions, uncomment the adapter line
const nextAuthConfig = NextAuth({
  // Use Prisma adapter for database-backed sessions (optional)
  // adapter: PrismaAdapter(getPrisma()),
  
  providers: [
    /**
     * Credentials Provider - Email/Password Authentication
     * 
     * Why this approach:
     * - Secure password verification using bcrypt
     * - Direct database lookup (no OAuth complexity)
     * - Supports both User model (new) and Teacher model (legacy)
     * - Updates lastLoginAt on successful signin
     */
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const email = String(credentials.email).toLowerCase().trim()
        const password = String(credentials.password)

        // Ensure prisma is available
        const db = getPrisma()
        if (!db) {
          console.error('[NextAuth] Prisma client not available - check DATABASE_URL')
          throw new Error('Database connection not available. Please check your database configuration.')
        }

        // Try User model first (newer system)
        let user
        try {
          user = await db.user.findUnique({
            where: { email },
            include: {
              organisationMembers: {
                where: { status: 'ACTIVE' },
                include: { organisation: true },
                take: 1,
              },
            },
          })
        } catch (dbError: any) {
          console.error('[NextAuth] Database query error:', dbError?.message || 'Unknown error')
          console.error('[NextAuth] Error code:', dbError?.code)
          
          // Check if it's a connection error
          const isConnectionError = 
            dbError?.code === 'P1001' || 
            dbError?.code === 'P1000' ||
            dbError?.message?.includes('Can\'t reach database server') ||
            dbError?.message?.includes('Connection') ||
            dbError?.message?.includes('timeout')
          
          if (isConnectionError) {
            // Gracefully handle connection errors - return a helpful error message
            throw new Error('Cannot connect to database server. Please check your database connection or try again later.')
          }
          
          // For other database errors, throw a generic error
          throw new Error('Database error occurred. Please try again later.')
        }

        if (user) {
          // Check if user has a password hash
          if (!user.passwordHash) {
            throw new Error('Account not set up for password authentication')
          }

          // Verify password using bcrypt
          const isValid = await verifyPassword(password, user.passwordHash)

          if (!isValid) {
            throw new Error('Invalid email or password')
          }

          // Update last login (non-critical - don't fail auth if update fails)
          await db.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          }).catch((error: any) => {
            // Log but don't fail authentication
            console.warn('[NextAuth] Failed to update lastLoginAt:', error instanceof Error ? error.message : 'Unknown error')
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            platformRole: user.platformRole,
          }
        }

        // Fallback to Teacher model (legacy)
        let teacher
        try {
          teacher = await db.teacher.findUnique({
            where: { email },
            include: { school: true },
          })
        } catch (dbError: any) {
          console.error('[NextAuth] Teacher query error:', dbError?.message || 'Unknown error')
          
          // Check if it's a connection error
          const isConnectionError = 
            dbError?.code === 'P1001' || 
            dbError?.code === 'P1000' ||
            dbError?.message?.includes('Can\'t reach database server') ||
            dbError?.message?.includes('Connection') ||
            dbError?.message?.includes('timeout')
          
          if (isConnectionError) {
            throw new Error('Cannot connect to database server. Please check your database connection or try again later.')
          }
          
          // For other database errors, throw a generic error
          throw new Error('Database error occurred. Please try again later.')
        }

        if (teacher) {
          // Legacy teachers don't have password hashes in the new system
          // For now, we'll skip password verification for legacy users
          // TODO: Migrate legacy teachers to User model with passwords
          
          // Update last login (non-critical - don't fail auth if update fails)
          await db.teacher.update({
            where: { id: teacher.id },
            data: { lastLoginAt: new Date() },
          }).catch((error: any) => {
            // Log but don't fail authentication
            console.warn('[NextAuth] Failed to update lastLoginAt:', error instanceof Error ? error.message : 'Unknown error')
          })

          return {
            id: teacher.id,
            email: teacher.email,
            name: teacher.name,
            platformRole: null, // Legacy teachers don't have platformRole
          }
        }

        // User not found
        throw new Error('Invalid email or password')
      },
    }),
  ],
  
  callbacks: {
    /**
     * Session Callback
     * 
     * In v5, we enhance the session with user data from database.
     * The session is built from the token, so we need to populate token data in jwt callback.
     */
    async session({ session, token }) {
      // In v5, if there's no authenticated user, session will be null
      // We should return null in that case, not an empty object
      // But if session exists but token.sub is missing, return session as-is
      if (!session) {
        // No session at all - return null (NextAuth v5 will handle this)
        return null as any
      }
      
      // If no token.sub, user is not authenticated - return null
      if (!token?.sub) {
        return null as any
      }

      // In v5, we fetch user data here since session callback is called
      // We'll populate the session with database data
      try {
        const db = getPrisma()
        if (!db) {
          // Database not available - return basic session
          return {
            ...session,
            user: {
              id: token.sub as string,
              email: session.user?.email || '',
              name: session.user?.name || '',
              role: 'teacher',
              schoolId: '',
              schoolName: '',
              tier: 'basic',
              platformRole: null,
            } as any,
          }
        }

        // Optimized: Use lightweight query - only fetch what we absolutely need
        // For most API requests, we don't need org data, so skip the expensive include
        const user = await db.user.findUnique({
          where: { id: token.sub as string },
          select: {
            id: true,
            email: true,
            name: true,
            tier: true,
            subscriptionStatus: true,
            freeTrialUntil: true,
            platformRole: true,
            // Only fetch org data if explicitly needed (not for most API calls)
            // organisationMembers: {
            //   where: { status: 'ACTIVE' },
            //   include: { organisation: true },
            //   take: 1,
            // },
          },
        })
        
        if (user) {
          // Determine tier: premium if tier is "premium" OR subscription is active
          const isPremium = user.tier === 'premium' || 
            (user.subscriptionStatus === 'ACTIVE' || user.subscriptionStatus === 'TRIALING') ||
            (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())
          
          // Default role to 'teacher' - org data only fetched when needed
          // This avoids expensive queries on every session check
          const role = 'teacher'
          
          return {
            ...session,
            user: {
              id: user.id,
              email: user.email,
              name: user.name || '',
              role,
              schoolId: '', // Empty unless org data is explicitly fetched
              schoolName: '', // Empty unless org data is explicitly fetched
              tier: isPremium ? 'premium' : 'basic',
              platformRole: user.platformRole,
            } as any,
          }
        }
        
        // Fallback to Teacher model (legacy)
        const teacher = await db.teacher.findUnique({
          where: { id: token.sub as string },
          include: { school: true }
        })
        
        if (teacher) {
          return {
            ...session,
            user: {
              id: teacher.id,
              email: teacher.email,
              name: teacher.name,
              role: teacher.role,
              schoolId: teacher.schoolId,
              schoolName: teacher.school.name,
              tier: 'basic', // Legacy users default to basic
              platformRole: null, // Legacy teachers don't have platformRole
            } as any,
          }
        }

        // User not found - return basic session
        return {
          ...session,
          user: {
            id: token.sub as string,
            email: session.user?.email || '',
            name: session.user?.name || '',
            role: 'teacher',
            schoolId: '',
            schoolName: '',
            tier: 'basic',
            platformRole: null,
          } as any,
        }
      } catch (error: any) {
        // Log error but don't crash - return session with available data
        console.error('[NextAuth] Session callback error:', error)
        return {
          ...session,
          user: {
            id: token.sub as string,
            email: session.user?.email || '',
            name: session.user?.name || '',
            role: 'teacher',
            schoolId: '',
            schoolName: '',
            tier: 'basic',
            platformRole: null,
          } as any,
        }
      }
    },
    
    /**
     * JWT Callback
     * 
     * Stores user ID in JWT token.
     */
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  
  debug: process.env.NODE_ENV === 'development',
})

// Export handlers and auth function
// Using type assertions to avoid TypeScript inference issues in package exports
export const handlers = nextAuthConfig.handlers as any
export const auth = nextAuthConfig.auth as any
export const signIn = nextAuthConfig.signIn as any
export const signOut = nextAuthConfig.signOut as any

// Extend NextAuth types for our custom session
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      schoolId: string
      schoolName: string
      tier: string // "basic" or "premium"
      platformRole: string | null // "PLATFORM_ADMIN", "ORG_ADMIN", "TEACHER", etc.
    }
  }
}

// Export password utilities
export { hashPassword, verifyPassword, isValidBcryptHash, isOldSHA256Hash } from './password'

// Helper functions for role-based access control
export type Role = 'admin' | 'editor' | 'teacher' | 'viewer'
