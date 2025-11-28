# Unified Authentication Migration Plan

## 🎯 Overview

This plan combines:
1. **NextAuth Integration** (from audit) - Properly use NextAuth throughout the app
2. **Security Migration** (from original plan) - Upgrade to secure password hashing, remove vulnerabilities

**Key Insight**: We must **properly integrate NextAuth first** before we can remove the custom auth systems. Otherwise, we'll break the app.

---

## 📋 Unified Phase Plan

### ✅ Phase 1: Foundation & Security (COMPLETED)

**Status**: ✅ DONE

- [x] Upgrade to NextAuth v4.24.5 (stable)
- [x] Install bcryptjs for secure password hashing
- [x] Create password utilities (`hashPassword`, `verifyPassword`)
- [x] Write comprehensive tests (16 tests passing)
- [x] Configure NextAuth with Credentials provider
- [x] Enhance session callback with platformRole

**Why this was first**: Security foundation must be in place before integration.

---

### 🔄 Phase 2: NextAuth Integration (CURRENT - DO THIS NEXT)

**Goal**: Properly integrate NextAuth throughout the app so it actually works.

**Why this is critical**: NextAuth is configured but not being used. We need to fix this before removing custom auth.

#### Step 2.1: Add SessionProvider ✅ HIGH PRIORITY
**Why**: Client components can't use NextAuth without this.

**Changes**:
- Add `SessionProvider` from `next-auth/react` to root layout
- Wrap app (can coexist with UserAccessProvider temporarily)

**Files**:
- `apps/admin/src/app/layout.tsx`

**Testing**:
- Verify `useSession()` works in client components
- Check browser console for errors

---

#### Step 2.2: Update SignInForm to Use NextAuth ✅ HIGH PRIORITY
**Why**: Currently uses custom API route. Must use NextAuth's `signIn()`.

**Changes**:
- Replace `fetch('/api/auth/signin')` with `signIn('credentials', ...)`
- Remove localStorage token storage
- Use NextAuth session state

**Files**:
- `apps/admin/src/components/auth/SignInForm.tsx`

**Testing**:
- Test signin flow
- Verify session is created
- Check redirect works

---

#### Step 2.3: Create Unified Auth Utilities ✅ HIGH PRIORITY
**Why**: Consolidate 3 different auth helpers into one that uses NextAuth.

**Changes**:
- Update `lib/auth.ts` to be the single source of truth
- All functions use `getServerSession(authOptions)`
- Mark `server-auth.ts` and `auth-helpers.ts` as deprecated

**Files**:
- `apps/admin/src/lib/auth.ts` (update)
- `apps/admin/src/lib/server-auth.ts` (deprecate)
- `apps/admin/src/lib/auth-helpers.ts` (deprecate)

**Testing**:
- Verify `getCurrentUser()` works in server components
- Test `requireAuth()` throws when not authenticated

---

#### Step 2.4: Update Server Components ✅ MEDIUM PRIORITY
**Why**: Some server components use wrong auth methods.

**Changes**:
- Replace `getServerAuthUser()` with `getServerSession()`
- Update `stats-server.ts` and similar files

**Files**:
- `apps/admin/src/app/stats/stats-server.ts`
- Any other server components using custom auth

**Testing**:
- Verify server components get correct user data
- Test protected pages

---

#### Step 2.5: Update Middleware ✅ MEDIUM PRIORITY
**Why**: Currently checks multiple token sources. Should only check NextAuth.

**Changes**:
- Use NextAuth's session cookie only
- Remove custom token fallbacks
- Can use `withAuth()` helper (optional)

**Files**:
- `apps/admin/src/middleware.ts`

**Testing**:
- Test unauthenticated redirect
- Test authenticated access
- Test public routes

---

### 🔄 Phase 3: Secure Signup & Remove Custom Routes

**Goal**: Secure the signup process and remove custom auth routes.

#### Step 3.1: Update Signup Route to Use bcrypt ✅ HIGH PRIORITY
**Why**: Currently uses insecure SHA256. Must use bcrypt.

**Changes**:
- Import `hashPassword` from `@schoolquiz/auth`
- Replace SHA256 with bcrypt hashing
- Keep referral code processing

**Files**:
- `apps/admin/src/app/api/auth/signup/route.ts`

**Testing**:
- Test user signup
- Verify password is hashed with bcrypt
- Test duplicate email/phone
- Test referral code processing

---

#### Step 3.2: Remove Custom Signin Route ✅ HIGH PRIORITY
**Why**: No longer needed - NextAuth handles signin.

**Changes**:
- Delete `/api/auth/signin/route.ts`
- Remove mock user logic
- Update any references

**Files**:
- `apps/admin/src/app/api/auth/signin/route.ts` (DELETE)

**Testing**:
- Verify signin still works via NextAuth
- Check no broken imports

---

#### Step 3.3: Add Rate Limiting ✅ MEDIUM PRIORITY
**Why**: Protect against brute force attacks.

**Changes**:
- Add rate limiter to NextAuth signin endpoint
- Configure limits (5 attempts per 15 minutes per IP)
- Return 429 on limit exceeded

**Files**:
- `packages/auth/src/index.ts` (add to Credentials provider)
- Or middleware-level rate limiting

**Testing**:
- Test rate limiting triggers
- Test limit reset
- Test different IPs

---

### 🔄 Phase 4: Update API Routes

**Goal**: All API routes use NextAuth instead of custom tokens.

#### Step 4.1: Update API Routes to Use NextAuth ✅ HIGH PRIORITY
**Why**: Currently extract tokens manually. Should use NextAuth.

**Changes**:
- Replace `getUserFromToken()` with `getServerSession()`
- Remove custom token parsing
- Standardize error responses

**Files** (many):
- `apps/admin/src/app/api/user/subscription/route.ts`
- `apps/admin/src/app/api/stats/route.ts`
- `apps/admin/src/app/api/seasons/stats/route.ts`
- `apps/admin/src/app/api/private-leagues/route.ts`
- All other API routes using custom auth

**Testing**:
- Test each API route with authenticated user
- Test with unauthenticated user (should return 401)
- Verify user data is correct

---

### 🔄 Phase 5: Update Client Components

**Goal**: Client components use NextAuth session instead of localStorage.

#### Step 5.1: Update Client Components to Use useSession ✅ MEDIUM PRIORITY
**Why**: Currently check localStorage. Should use NextAuth.

**Changes**:
- Replace `localStorage.getItem('isLoggedIn')` with `useSession()`
- Remove localStorage auth checks
- Use NextAuth session data

**Files**:
- `apps/admin/src/components/quiz/QuizPlayer.tsx`
- Any other client components checking localStorage

**Testing**:
- Verify components get session data
- Test auth state changes
- Test signout

---

### 🔄 Phase 6: Prisma Adapter (Optional)

**Goal**: Switch from JWT sessions to database sessions.

#### Step 6.1: Add NextAuth Tables to Prisma Schema
**Why**: Prisma adapter requires specific tables.

**Changes**:
- Add `Account`, `Session`, `VerificationToken` models to schema
- Run migration

**Files**:
- `packages/db/prisma/schema.prisma`

**Testing**:
- Verify tables created
- Test session creation/retrieval

---

#### Step 6.2: Configure Prisma Adapter
**Why**: Database sessions enable session management and revocation.

**Changes**:
- Uncomment adapter in `authOptions`
- Configure PrismaAdapter

**Files**:
- `packages/auth/src/index.ts`

**Testing**:
- Verify sessions stored in database
- Test session retrieval
- Test signout (session deleted)

---

### 🔄 Phase 7: Cleanup & Final Testing

**Goal**: Remove all legacy auth code and verify everything works.

#### Step 7.1: Remove Legacy Auth Code ✅ HIGH PRIORITY
**Why**: Eliminate confusion and security risks.

**Files to Remove/Update**:
- `apps/admin/src/lib/server-auth.ts` (DELETE or rewrite)
- `apps/admin/src/lib/auth-helpers.ts` (DELETE or rewrite)
- Remove localStorage auth utilities
- Remove mock user constants

**Testing**:
- Verify no broken imports
- Test all auth flows work

---

#### Step 7.2: Migrate Existing Passwords
**Why**: Current SHA256 hashes need to be migrated to bcrypt.

**Changes**:
- Create migration script
- Hash existing passwords with bcrypt
- Mark users for password reset (optional)

**Files**:
- New migration script

**Testing**:
- Verify password migration
- Test login with migrated passwords

---

#### Step 7.3: Comprehensive Testing
**Why**: Ensure everything works end-to-end.

**Test Cases**:
1. Signup flow (new user, duplicate email, referral code)
2. Signin flow (valid/invalid credentials, rate limiting)
3. Session management (persistence, refresh, signout)
4. Route protection (public, protected, admin routes)
5. API routes (authenticated, unauthenticated)
6. Client components (session access, auth state)

---

## 🔄 Execution Order (Recommended)

### Immediate (Do Now):
1. ✅ Phase 1: Foundation (DONE)
2. 🔄 **Phase 2: NextAuth Integration** (START HERE)
   - 2.1: Add SessionProvider
   - 2.2: Update SignInForm
   - 2.3: Unified auth utilities
   - 2.4: Update server components
   - 2.5: Update middleware

### Next (After Phase 2):
3. Phase 3: Secure Signup & Remove Custom Routes
4. Phase 4: Update API Routes
5. Phase 5: Update Client Components

### Later (Optional):
6. Phase 6: Prisma Adapter (if you want database sessions)
7. Phase 7: Cleanup & Final Testing

---

## ⚠️ Important Notes

### No Conflicts - They Complement Each Other

**Original Migration Plan** focused on:
- Security (bcrypt, rate limiting)
- Removing custom routes
- Migrating passwords

**Audit Recommendations** focused on:
- Properly using NextAuth (SessionProvider, signIn, getServerSession)
- Consolidating auth utilities
- Updating all components

**They work together**:
- Phase 2 (Integration) must come **before** Phase 3 (Remove Custom Routes)
- We need NextAuth working properly before we can delete `/api/auth/signin`
- We need SessionProvider before we can update client components

### Why This Order Matters

1. **Foundation first** (Phase 1) ✅ - Security utilities ready
2. **Integration second** (Phase 2) - Make NextAuth actually work
3. **Migration third** (Phase 3-5) - Remove custom auth, secure signup
4. **Enhancement fourth** (Phase 6) - Optional improvements
5. **Cleanup last** (Phase 7) - Remove all legacy code

---

## ✅ Verification Checklist

After completing all phases:

- [ ] No `localStorage.getItem('authToken')` anywhere
- [ ] No `localStorage.getItem('isLoggedIn')` anywhere
- [ ] All server components use `getServerSession()`
- [ ] All API routes use `getServerSession()`
- [ ] Client components use `useSession()` hook
- [ ] `SessionProvider` wraps the app
- [ ] SignInForm uses `signIn()` from NextAuth
- [ ] Signup uses bcrypt for password hashing
- [ ] Custom `/api/auth/signin` route removed
- [ ] Middleware only checks NextAuth cookies
- [ ] All auth utilities consolidated
- [ ] Rate limiting on signin
- [ ] All tests passing

---

## 🚀 Ready to Start?

**Current Status**: Phase 1 complete, ready for Phase 2

**Next Step**: Phase 2.1 - Add SessionProvider to root layout

This unified plan ensures we:
1. ✅ Have secure password utilities (done)
2. 🔄 Properly integrate NextAuth (next)
3. ⏳ Secure signup and remove custom routes
4. ⏳ Update everything to use NextAuth
5. ⏳ Clean up legacy code

No conflicts - just a logical progression! 🎯

