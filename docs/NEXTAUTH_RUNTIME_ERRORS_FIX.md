# NextAuth Runtime Errors - Fix Guide

## 🔧 Common Issues & Fixes

### Issue 1: SessionProvider Error
**Error**: `Error: useSession must be used within a SessionProvider`

**Fix**: ✅ **FIXED** - Created `SessionProviderWrapper` client component

**What was wrong**: `SessionProvider` from `next-auth/react` is a client component but was being used directly in a server component layout.

**Solution**: Created `apps/admin/src/providers/SessionProviderWrapper.tsx` as a client component wrapper.

---

### Issue 2: Missing NEXTAUTH_SECRET
**Error**: `[next-auth][error][NO_SECRET] Please define a `secret` in production`

**Fix**: Add `NEXTAUTH_SECRET` to your `.env.local` file

**Steps**:
1. Check if `.env.local` exists in project root
2. Add or update:
   ```bash
   NEXTAUTH_SECRET="your-secret-key-here-min-32-chars"
   ```
3. Generate a secure secret:
   ```bash
   openssl rand -base64 32
   ```
4. Run `pnpm sync-env` to copy to `apps/admin/.env.local`
5. Restart dev server

**File**: `.env.local` in project root

---

### Issue 3: SignIn Redirect Not Working
**Error**: Sign in succeeds but redirect doesn't happen or goes to wrong page

**Current Code** (in SignInForm):
```tsx
router.push(redirectUrl);
router.refresh();
```

**Potential Issues**:
- `router.refresh()` might not be needed
- Session might not be available immediately after signIn

**Fix**: Use `window.location.href` for full page reload (ensures session cookie is set):
```tsx
// After successful signIn
if (result?.ok) {
  const callbackUrl = searchParams.get('callbackUrl');
  const redirectUrl = callbackUrl || '/quizzes';
  window.location.href = redirectUrl; // Full page reload
}
```

---

### Issue 4: "Invalid credentials" Error
**Error**: Sign in always fails with "Invalid email or password"

**Possible Causes**:
1. User doesn't exist in database
2. Password hash is SHA256 (old format) - needs migration
3. Credentials provider not working

**Debug Steps**:
1. Check browser console for detailed error
2. Check server logs for NextAuth debug output
3. Verify user exists in database:
   ```sql
   SELECT id, email, "passwordHash" FROM users WHERE email = 'test@example.com';
   ```
4. Check if password hash starts with `$2a$` or `$2b$` (bcrypt) or is 64 hex chars (SHA256)

**Fix**: 
- For new users: Signup will use bcrypt (once we update signup route)
- For existing users: Need password migration (Phase 7)

---

### Issue 5: Session Not Available After SignIn
**Error**: `useSession()` returns `null` or `status: "unauthenticated"` after sign in

**Possible Causes**:
1. Session cookie not being set
2. Cookie domain/path issues
3. NextAuth secret mismatch

**Debug Steps**:
1. Check browser DevTools → Application → Cookies
2. Look for `next-auth.session-token` cookie
3. Verify cookie domain and path are correct
4. Check if `NEXTAUTH_URL` matches your app URL

**Fix**: 
- Ensure `NEXTAUTH_URL` in `.env.local` matches your dev server URL
- Default should be `http://localhost:3001` (or your port)

---

### Issue 6: TypeScript Errors
**Error**: Type errors with NextAuth types

**Fix**: Types should be properly extended in `packages/auth/src/index.ts`

If you see type errors:
1. Rebuild the auth package: `cd packages/auth && pnpm build`
2. Restart TypeScript server in your IDE
3. Check that `@schoolquiz/auth` is properly built

---

## 🧪 Quick Test Checklist

After fixing issues, test:

1. **SessionProvider**:
   ```tsx
   // In any client component
   import { useSession } from 'next-auth/react'
   const { data: session } = useSession()
   console.log('Session:', session)
   ```
   Should not throw "must be used within SessionProvider" error

2. **Sign In**:
   - Go to `/sign-in`
   - Enter email/password
   - Should redirect to `/quizzes` or callback URL
   - Should see session cookie in DevTools

3. **Session Access**:
   - After sign in, check if `useSession()` returns user data
   - Check server components can use `getSession()`

---

## 🚨 If Still Getting Errors

1. **Check Browser Console** - Look for specific error messages
2. **Check Server Logs** - Next.js dev server output
3. **Check Network Tab** - Look for failed API calls to `/api/auth/*`
4. **Verify Environment Variables**:
   ```bash
   # In apps/admin directory
   cat .env.local | grep NEXTAUTH
   ```

5. **Clear Cookies** - Delete all cookies and try again
6. **Restart Dev Server** - Sometimes fixes caching issues

---

## 📝 Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| `NO_SECRET` | Missing NEXTAUTH_SECRET | Add to .env.local |
| `useSession must be used within SessionProvider` | SessionProvider not wrapping app | ✅ Fixed with wrapper |
| `Invalid credentials` | Wrong password or user not found | Check database, verify password hash |
| `JWT_SESSION_ERROR` | Session token invalid | Clear cookies, sign in again |
| `CALLBACK_CREDENTIALS_ERROR` | Credentials provider error | Check authorize function in authOptions |

---

## 🔍 Debug Mode

NextAuth has debug mode enabled in development. Check server logs for detailed error messages.

To see more details, the auth config has:
```typescript
debug: process.env.NODE_ENV === 'development',
```

This will log detailed information about auth flow.

---

**If you're still seeing errors, share:**
1. The exact error message
2. Browser console output
3. Server logs
4. Which page/action triggers the error

