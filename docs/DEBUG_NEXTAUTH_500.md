# Debugging NextAuth 500 Error

## Current Issue
`/api/auth/session` returns 500 error on page load (before sign in)

## Error Message
```
GET http://localhost:3001/api/auth/session 500 (Internal Server Error)
[next-auth][error][CLIENT_FETCH_ERROR] There is a problem with the server configuration
```

## Possible Causes

1. **Database Connection Issue**
   - Prisma client might not be initialized
   - DATABASE_URL might be invalid
   - Database might be unreachable

2. **Session Callback Error**
   - Session callback might be throwing an error
   - Database query might be failing
   - Token validation might be failing

3. **NextAuth Configuration Issue**
   - Missing or invalid NEXTAUTH_SECRET
   - Invalid authOptions structure
   - Provider configuration error

## Debug Steps

### 1. Check Server Terminal
Look for error messages in the terminal where `pnpm dev` is running. Look for:
- `[NextAuth] Session callback error:`
- Prisma connection errors
- Any stack traces

### 2. Test Database Connection
```bash
cd packages/db
pnpm prisma db pull  # Test connection
```

### 3. Check Environment Variables
```bash
cd apps/admin
cat .env.local | grep -E "NEXTAUTH|DATABASE"
```

### 4. Test NextAuth Endpoint Directly
```bash
curl http://localhost:3001/api/auth/providers
# Should return JSON, not 500
```

### 5. Add More Logging
Add console.log to session callback to see what's happening:
```typescript
async session({ session, token }: any) {
  console.log('[NextAuth] Session callback called', { 
    hasSession: !!session, 
    hasToken: !!token, 
    tokenSub: token?.sub 
  })
  // ... rest of callback
}
```

## Quick Fix: Disable Session Callback Temporarily

If you need to get the app working immediately, you can temporarily disable the database query in the session callback:

```typescript
async session({ session, token }: any) {
  // Temporarily return session without database query
  if (token?.sub && session?.user) {
    session.user.id = token.sub
  }
  return session
}
```

This will allow the app to load, but won't have full user data in the session.

## Next Steps

1. Check server terminal for actual error
2. Verify DATABASE_URL is correct
3. Test database connection
4. Add more logging if needed

