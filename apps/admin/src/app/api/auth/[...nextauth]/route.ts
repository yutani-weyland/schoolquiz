/**
 * NextAuth API Route Handler
 * Handles all NextAuth operations including sign in, sign out, session, etc.
 */

import NextAuth from 'next-auth'
import { authOptions } from '@schoolquiz/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

