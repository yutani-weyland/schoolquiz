/**
 * NextAuth v5 API Route Handler
 * Handles all NextAuth operations including sign in, sign out, session, etc.
 */

import { handlers } from '@schoolquiz/auth'

// Export handlers directly - NextAuth v5 handlers already have proper error handling
export const { GET, POST } = handlers

