import { NextAuthOptions } from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import { prisma } from '@schoolquiz/db'

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      schoolId: string
      schoolName: string
    }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'email') {
        // Check if user exists in our database
        const teacher = await prisma.teacher.findUnique({
          where: { email: user.email! },
          include: { school: true }
        })
        
        if (!teacher) {
          // User doesn't exist, deny sign in
          return false
        }
        
        // Update last login
        await prisma.teacher.update({
          where: { id: teacher.id },
          data: { lastLoginAt: new Date() }
        })
        
        return true
      }
      return true
    },
    async session({ session, token }) {
      if (token.sub) {
        const teacher = await prisma.teacher.findUnique({
          where: { id: token.sub },
          include: { school: true }
        })
        
        if (teacher) {
          session.user = {
            id: teacher.id,
            email: teacher.email,
            name: teacher.name,
            role: teacher.role,
            schoolId: teacher.schoolId,
            schoolName: teacher.school.name,
          }
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
  },
  session: {
    strategy: 'jwt',
  },
}

// Helper functions for role-based access control
export type Role = 'admin' | 'editor' | 'teacher' | 'viewer'

export function requireAuth() {
  // This will be implemented in the API routes
  throw new Error('requireAuth must be used in API route context')
}

export function withRole(roles: Role[]) {
  // This will be implemented in the API routes
  throw new Error('withRole must be used in API route context')
}

export function scopeBySchool(query: any, schoolId: string) {
  // This will be implemented in the API routes
  throw new Error('scopeBySchool must be used in API route context')
}
