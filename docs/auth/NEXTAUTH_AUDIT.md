# NextAuth Integration Audit

## 🔍 Current State Analysis

### ✅ What's Working

1. **NextAuth Route Handler** ✅
   - Located at: `apps/admin/src/app/api/auth/[...nextauth]/route.ts`
   - Properly configured with `authOptions` from `@schoolquiz/auth`
   - Handles GET and POST requests

2. **NextAuth Configuration** ✅
   - `packages/auth/src/index.ts` has proper `authOptions`
   - Credentials provider configured
   - Session callback enhanced with user data
   - JWT callback configured

3. **Some Server Components Use NextAuth** ✅
   - `apps/admin/src/lib/auth.ts` uses `getServerSession(authOptions)` ✅
   - `getCurrentUser()` function properly uses NextAuth session

### ❌ Critical Issues

#### 1. **Multiple Auth Systems Running in Parallel** ⚠️ **CRITICAL**

**Problem**: Your app has **4 different authentication systems** running simultaneously:

1. **NextAuth** (configured but underutilized)
2. **Custom localStorage tokens** (SignInForm stores `authToken` in localStorage)
3. **Custom cookie tokens** (`server-auth.ts` reads `authToken` cookie)
4. **Custom header tokens** (`auth-helpers.ts` reads `X-User-Id` header)

**Impact**: 
- Confusion about which system is authoritative
- Security vulnerabilities (localStorage XSS risk)
- Inconsistent auth state across the app
- Maintenance nightmare

**Files Affected**:
- `apps/admin/src/lib/server-auth.ts` - Custom cookie-based auth
- `apps/admin/src/lib/auth-helpers.ts` - Custom header-based auth  
- `apps/admin/src/components/auth/SignInForm.tsx` - Uses localStorage
- `apps/admin/src/middleware.ts` - Checks multiple token sources

---

#### 2. **Client-Side: No SessionProvider** ⚠️ **HIGH**

**Problem**: No `SessionProvider` from `next-auth/react` in the app layout.

**Impact**: 
- Client components cannot use `useSession()` hook
- No client-side session access
- Components rely on localStorage instead

**Current State**:
```tsx
// apps/admin/src/app/layout.tsx
<UserAccessProvider>  // Custom context, not NextAuth
  {children}
</UserAccessProvider>
```

**Should Be**:
```tsx
<SessionProvider>  // NextAuth provider
  {children}
</SessionProvider>
```

---

#### 3. **SignInForm Uses Custom API, Not NextAuth** ⚠️ **HIGH**

**Problem**: `SignInForm.tsx` calls `/api/auth/signin` (custom route) instead of NextAuth's `signIn()`.

**Current Code**:
```tsx
// ❌ WRONG: Custom API route
const response = await fetch("/api/auth/signin", {
  method: "POST",
  body: JSON.stringify({ email, password }),
});

// ❌ WRONG: Stores token in localStorage
localStorage.setItem("authToken", data.token);
```

**Should Be**:
```tsx
// ✅ CORRECT: Use NextAuth
import { signIn } from 'next-auth/react'
await signIn('credentials', { email, password, redirect: false })
```

**Files**:
- `apps/admin/src/components/auth/SignInForm.tsx` (lines 29-73)
- `apps/admin/src/app/api/auth/signin/route.ts` (should be removed)

---

#### 4. **Server Components: Mixed Auth Methods** ⚠️ **MEDIUM**

**Problem**: Different server components use different auth methods.

**Current Usage**:
- ✅ `lib/auth.ts` - Uses `getServerSession()` (CORRECT)
- ❌ `lib/server-auth.ts` - Uses custom cookies (WRONG)
- ❌ `lib/auth-helpers.ts` - Uses custom headers (WRONG)
- ❌ `app/stats/stats-server.ts` - Uses `getServerAuthUser()` (WRONG)

**Files Using Wrong Methods**:
- `apps/admin/src/lib/server-auth.ts` - Entire file needs rewrite
- `apps/admin/src/lib/auth-helpers.ts` - Entire file needs rewrite
- `apps/admin/src/app/stats/stats-server.ts` - Line 136
- `apps/admin/src/app/api/user/subscription/route.ts` - Lines 15-48 (fallback to NextAuth but primary is custom)

---

#### 5. **API Routes: Custom Token Extraction** ⚠️ **MEDIUM**

**Problem**: API routes extract tokens manually instead of using NextAuth.

**Current Pattern**:
```tsx
// ❌ WRONG: Manual token extraction
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader.substring(7);
  // Parse mock tokens, extract userId, etc.
}
```

**Should Be**:
```tsx
// ✅ CORRECT: Use NextAuth
import { getServerSession } from 'next-auth'
import { authOptions } from '@schoolquiz/auth'

const session = await getServerSession(authOptions)
if (!session?.user) return new Response('Unauthorized', { status: 401 })
```

**Files Affected**:
- `apps/admin/src/app/api/user/subscription/route.ts`
- `apps/admin/src/app/api/stats/route.ts`
- `apps/admin/src/app/api/seasons/stats/route.ts`
- `apps/admin/src/app/api/private-leagues/route.ts`
- Many more API routes...

---

#### 6. **Middleware: Checks Multiple Sources** ⚠️ **MEDIUM**

**Problem**: Middleware checks for NextAuth cookies but also falls back to custom tokens.

**Current Code**:
```tsx
// ❌ Checks multiple sources (confusing)
const authToken = 
  request.cookies.get('next-auth.session-token') ||
  request.cookies.get('authToken') ||  // Custom token
  request.headers.get('authorization')?.replace('Bearer ', '')
```

**Should Be**:
```tsx
// ✅ Use NextAuth middleware helper
import { withAuth } from 'next-auth/middleware'
// Or check NextAuth session cookie only
```

**File**: `apps/admin/src/middleware.ts` (lines 32-36)

---

#### 7. **Client Components: localStorage Checks** ⚠️ **LOW**

**Problem**: Client components check `localStorage.getItem('isLoggedIn')` instead of NextAuth session.

**Example**:
```tsx
// ❌ WRONG: localStorage check
const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
```

**Should Be**:
```tsx
// ✅ CORRECT: NextAuth session
import { useSession } from 'next-auth/react'
const { data: session, status } = useSession()
const loggedIn = status === 'authenticated'
```

**Files**:
- `apps/admin/src/components/quiz/QuizPlayer.tsx` (line 375)
- Many other client components

---

## 📋 Required Fixes (Priority Order)

### Phase 1: Foundation (CRITICAL)

1. **Add SessionProvider to Root Layout**
   - Wrap app with `SessionProvider` from `next-auth/react`
   - Remove or integrate `UserAccessProvider`

2. **Update SignInForm to Use NextAuth**
   - Replace `fetch('/api/auth/signin')` with `signIn('credentials', ...)`
   - Remove localStorage token storage
   - Use NextAuth's session state

3. **Create Unified Auth Utilities**
   - Consolidate `lib/auth.ts`, `lib/server-auth.ts`, `lib/auth-helpers.ts`
   - All should use `getServerSession(authOptions)`
   - Remove custom token extraction logic

### Phase 2: Server Components (HIGH)

4. **Update All Server Components**
   - Replace `getServerAuthUser()` calls with `getServerSession()`
   - Update `stats-server.ts` and similar files

5. **Update Middleware**
   - Use NextAuth's `withAuth()` or check only NextAuth cookies
   - Remove custom token fallbacks

### Phase 3: API Routes (HIGH)

6. **Update All API Routes**
   - Replace `getUserFromToken()` with `getServerSession()`
   - Remove custom token parsing
   - Standardize error responses

### Phase 4: Client Components (MEDIUM)

7. **Update Client Components**
   - Replace `localStorage.getItem('isLoggedIn')` with `useSession()`
   - Remove localStorage auth checks
   - Use NextAuth session data

### Phase 5: Cleanup (LOW)

8. **Remove Legacy Code**
   - Delete `/api/auth/signin/route.ts` (custom route)
   - Remove `lib/server-auth.ts` (or rewrite to use NextAuth)
   - Remove `lib/auth-helpers.ts` (or rewrite to use NextAuth)
   - Remove localStorage auth utilities

---

## 🎯 Recommended Approach

### Step 1: Create Unified Auth Helper

Create a single source of truth for auth:

```typescript
// apps/admin/src/lib/auth.ts (UPDATE THIS FILE)
import { getServerSession } from 'next-auth'
import { authOptions } from '@schoolquiz/auth'

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function requireSession() {
  const session = await getSession()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  return session
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session?.user?.id) return null
  
  // Fetch from DB if needed (or use session.user data)
  // ...
}
```

### Step 2: Update SignInForm

```typescript
// apps/admin/src/components/auth/SignInForm.tsx
import { signIn } from 'next-auth/react'

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  
  try {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    
    if (result?.error) {
      setError(result.error)
    } else {
      router.push('/quizzes')
    }
  } catch (error) {
    setError('Sign in failed')
  } finally {
    setLoading(false)
  }
}
```

### Step 3: Add SessionProvider

```typescript
// apps/admin/src/app/layout.tsx
import { SessionProvider } from 'next-auth/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
```

### Step 4: Update API Routes

```typescript
// Example: apps/admin/src/app/api/user/subscription/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@schoolquiz/auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Use session.user.id instead of extracting from token
  const userId = session.user.id
  // ...
}
```

---

## ✅ Verification Checklist

After fixes, verify:

- [ ] No `localStorage.getItem('authToken')` anywhere
- [ ] No `localStorage.getItem('isLoggedIn')` anywhere
- [ ] All server components use `getServerSession()`
- [ ] All API routes use `getServerSession()`
- [ ] Client components use `useSession()` hook
- [ ] `SessionProvider` wraps the app
- [ ] SignInForm uses `signIn()` from NextAuth
- [ ] Middleware only checks NextAuth cookies
- [ ] Custom `/api/auth/signin` route removed
- [ ] All auth utilities consolidated

---

## 🚀 Next Steps

1. **Review this audit** - Confirm understanding
2. **Start with Phase 1** - Foundation fixes (SessionProvider, SignInForm)
3. **Test incrementally** - Verify each phase before proceeding
4. **Complete all phases** - Full NextAuth integration

---

**Status**: ⚠️ **NextAuth is configured but NOT properly integrated throughout the app**

**Priority**: 🔴 **HIGH** - Multiple auth systems create security risks and confusion

