# NextAuth Migration Plan: Comprehensive Analysis & Implementation

## Executive Summary

Your application currently uses a **hybrid authentication system** with significant security vulnerabilities and architectural inconsistencies. This plan migrates to a **robust, production-ready NextAuth v5 (Auth.js) implementation** that follows industry best practices.

---

## 🔍 Current State Analysis

### Critical Security Issues

1. **Insecure Password Hashing** ⚠️ **CRITICAL**
   - Using SHA256 (cryptographic hash, not password hash)
   - No salt, vulnerable to rainbow table attacks
   - Location: `apps/admin/src/app/api/auth/signup/route.ts:104`
   - **Impact**: Passwords can be easily cracked

2. **Mock Tokens in Production Code** ⚠️ **HIGH**
   - Hardcoded password "abc123" for all users
   - Mock token generation in signin route
   - Location: `apps/admin/src/app/api/auth/signin/route.ts:98-112`
   - **Impact**: Anyone can access any account

3. **Client-Side Token Storage** ⚠️ **HIGH**
   - Tokens stored in localStorage (XSS vulnerable)
   - No HttpOnly cookies
   - Location: `apps/admin/src/components/auth/SignInForm.tsx:48-58`
   - **Impact**: Tokens can be stolen via XSS attacks

4. **No Rate Limiting** ⚠️ **MEDIUM**
   - Auth endpoints unprotected against brute force
   - **Impact**: Account enumeration and brute force attacks

5. **Multiple Auth Systems** ⚠️ **MEDIUM**
   - NextAuth v4 partially configured
   - Custom JWT tokens
   - Mock tokens
   - Cookie-based auth
   - **Impact**: Confusion, maintenance burden, security gaps

### Architectural Issues

1. **Incomplete NextAuth Integration**
   - NextAuth configured but not used for actual authentication
   - Only EmailProvider configured (not used)
   - No Credentials provider for email/password
   - No database adapter (sessions in JWT only)

2. **Session Management Chaos**
   - localStorage tokens
   - Cookie tokens
   - NextAuth sessions (unused)
   - JWT tokens
   - **Result**: Inconsistent auth state across app

3. **Type Safety Gaps**
   - Session types partially extended
   - Missing platformRole in session
   - Inconsistent user object shapes

4. **Middleware Limitations**
   - Basic route protection only
   - No role-based access control
   - Doesn't leverage NextAuth middleware

---

## 🎯 Migration Goals

### Security Objectives
- ✅ Secure password hashing (bcrypt with proper salt rounds)
- ✅ HttpOnly, Secure, SameSite cookies
- ✅ CSRF protection via NextAuth
- ✅ Rate limiting on auth endpoints
- ✅ Remove all mock/test authentication code

### Architecture Objectives
- ✅ Single, unified auth system (NextAuth v5)
- ✅ Database-backed sessions (Prisma adapter)
- ✅ Server-only session management
- ✅ Proper TypeScript types throughout
- ✅ Role-based access control in middleware

### Developer Experience
- ✅ Simple `getServerSession()` API
- ✅ Type-safe session data
- ✅ Clear error messages
- ✅ Comprehensive testing

---

## 📋 Migration Plan: Step-by-Step

### Phase 1: Foundation & Security (Day 1)

#### Step 1.1: Upgrade to NextAuth v5 (Auth.js)
**Why**: NextAuth v5 is the modern, App Router-first version with better TypeScript support and improved security.

**Changes**:
- Upgrade `next-auth` to `@auth/core` and `next-auth@beta` (v5)
- Update import paths
- Migrate to new API structure

**Testing**:
- Verify NextAuth route handler works
- Test session endpoint

#### Step 1.2: Install Security Dependencies
**Why**: Need proper password hashing and rate limiting.

**Dependencies**:
```json
{
  "bcryptjs": "^2.4.3",
  "@types/bcryptjs": "^2.4.6",
  "rate-limiter-flexible": "^5.0.0"
}
```

**Testing**:
- Verify bcrypt hashing works
- Test rate limiter

#### Step 1.3: Create Password Utilities
**Why**: Centralize secure password hashing/verification.

**File**: `packages/auth/src/password.ts`
- `hashPassword(password: string): Promise<string>`
- `verifyPassword(password: string, hash: string): Promise<boolean>`

**Testing**:
- Unit tests for password hashing
- Verify salt rounds (12+)
- Test timing attack resistance

---

### Phase 2: NextAuth Configuration (Day 1-2)

#### Step 2.1: Install Prisma Adapter
**Why**: Database-backed sessions are more secure and allow session management.

**Changes**:
- Install `@auth/prisma-adapter`
- Configure adapter in auth options
- Create session/account/verification tables (if needed)

**Testing**:
- Verify sessions stored in database
- Test session retrieval

#### Step 2.2: Configure Credentials Provider
**Why**: Support email/password authentication (your primary method).

**Changes**:
- Add Credentials provider
- Implement authorize function with password verification
- Handle user lookup (User model, fallback to Teacher for legacy)

**Testing**:
- Test sign in with valid credentials
- Test sign in with invalid credentials
- Test user not found
- Test password mismatch

#### Step 2.3: Enhance Session Callback
**Why**: Include all necessary user data in session.

**Current Issues**:
- Missing `platformRole`
- Inconsistent organisation data
- Legacy Teacher model fallback not optimal

**Changes**:
- Fetch complete user data with organisations
- Include platformRole
- Handle multiple organisations (primary vs active)
- Cache session data in JWT to reduce DB queries

**Testing**:
- Verify session contains all required fields
- Test with users in multiple organisations
- Test legacy Teacher users

#### Step 2.4: Configure JWT Callback
**Why**: Store user ID and essential data in JWT to reduce DB queries.

**Changes**:
- Store userId, email, platformRole in token
- Refresh token on session access (if needed)

**Testing**:
- Verify JWT contains correct data
- Test token expiration

---

### Phase 3: Database Migration (Day 2)

#### Step 3.1: Add NextAuth Tables (if needed)
**Why**: Prisma adapter requires specific table structure.

**Check**: Verify if tables exist or need creation:
- `Account` (OAuth accounts)
- `Session` (user sessions)
- `VerificationToken` (email verification)

**Testing**:
- Verify tables created
- Test session creation/retrieval

#### Step 3.2: Migrate Existing Passwords
**Why**: Current SHA256 hashes need to be migrated to bcrypt.

**Strategy**:
- Create migration script
- Hash existing passwords with bcrypt
- Mark users for password reset on next login (optional)

**Testing**:
- Verify password migration
- Test login with migrated passwords

---

### Phase 4: Update Auth Routes (Day 2-3)

#### Step 4.1: Replace Signup Route
**Why**: Use NextAuth's signup flow or create secure custom route.

**Changes**:
- Use bcrypt for password hashing
- Create user via Prisma
- Use NextAuth's `signIn()` for automatic session creation
- Remove JWT token generation

**Testing**:
- Test user signup
- Verify password hashed correctly
- Test duplicate email/phone
- Test referral code processing

#### Step 4.2: Remove Custom Signin Route
**Why**: NextAuth handles signin via Credentials provider.

**Changes**:
- Delete `/api/auth/signin/route.ts`
- Update frontend to use NextAuth signin
- Remove mock user logic

**Testing**:
- Verify signin works via NextAuth
- Test error handling

#### Step 4.3: Add Rate Limiting
**Why**: Protect against brute force attacks.

**Implementation**:
- Rate limiter on signin endpoint
- Configurable limits (e.g., 5 attempts per 15 minutes per IP)
- Return 429 on limit exceeded

**Testing**:
- Test rate limiting triggers
- Test limit reset
- Test different IPs

---

### Phase 5: Frontend Migration (Day 3)

#### Step 5.1: Update SignInForm Component
**Why**: Use NextAuth's `signIn()` instead of custom API.

**Changes**:
- Replace fetch to `/api/auth/signin` with `signIn('credentials', {...})`
- Remove localStorage token storage
- Use NextAuth's session state
- Handle NextAuth errors

**Testing**:
- Test signin flow
- Test error display
- Test redirect after signin

#### Step 5.2: Update SignUp Component
**Why**: Integrate with NextAuth or secure custom route.

**Changes**:
- Update to use new signup route
- Remove token storage
- Use NextAuth session after signup

**Testing**:
- Test signup flow
- Test validation errors
- Test success redirect

#### Step 5.3: Add SessionProvider
**Why**: Enable client-side session access.

**Changes**:
- Wrap app with `SessionProvider` from `next-auth/react`
- Update to use `useSession()` hook
- Remove custom UserAccessContext (or integrate)

**Testing**:
- Verify session available in components
- Test session refresh
- Test signout

#### Step 5.4: Remove localStorage Auth Code
**Why**: Eliminate XSS vulnerability.

**Changes**:
- Remove all `localStorage.setItem('authToken', ...)`
- Remove `localStorage.getItem('authToken')`
- Update components to use NextAuth session

**Testing**:
- Verify no localStorage auth tokens
- Test auth state persistence

---

### Phase 6: Middleware & Route Protection (Day 3-4)

#### Step 6.1: Update Middleware
**Why**: Leverage NextAuth middleware for route protection.

**Changes**:
- Use `withAuth()` from NextAuth
- Implement role-based access control
- Protect `/admin/*` routes (PlatformAdmin only)
- Handle redirects properly

**Testing**:
- Test unauthenticated access
- Test authenticated but wrong role
- Test correct role access
- Test public routes

#### Step 6.2: Create Auth Utilities
**Why**: Reusable server-side auth helpers.

**Files**:
- `apps/admin/src/lib/auth.ts` - `getServerSession()`, `requireAuth()`, `requireRole()`
- Update existing auth helpers to use NextAuth

**Testing**:
- Test in Server Components
- Test in API routes
- Test in Server Actions

---

### Phase 7: Cleanup & Testing (Day 4)

#### Step 7.1: Remove Legacy Auth Code
**Why**: Eliminate confusion and security risks.

**Files to Remove/Update**:
- `apps/admin/src/lib/auth-helpers.ts` (update to use NextAuth)
- `apps/admin/src/lib/server-auth.ts` (update to use NextAuth)
- `apps/admin/src/app/api/auth/signin/route.ts` (delete)
- Mock user constants
- Custom JWT logic

**Testing**:
- Verify no broken imports
- Test all auth flows work

#### Step 7.2: Update Type Definitions
**Why**: Ensure type safety throughout.

**Changes**:
- Extend NextAuth types properly
- Update all user type references
- Fix TypeScript errors

**Testing**:
- Run `tsc --noEmit`
- Verify no type errors

#### Step 7.3: Comprehensive Testing
**Why**: Ensure everything works end-to-end.

**Test Cases**:
1. **Signup Flow**
   - New user signup
   - Duplicate email/phone
   - Invalid email format
   - Password requirements
   - Referral code processing

2. **Signin Flow**
   - Valid credentials
   - Invalid email
   - Invalid password
   - User not found
   - Rate limiting

3. **Session Management**
   - Session persistence
   - Session refresh
   - Signout
   - Multiple tabs

4. **Route Protection**
   - Public routes accessible
   - Protected routes redirect
   - Admin routes require PlatformAdmin
   - Role-based access

5. **Edge Cases**
   - Legacy Teacher users
   - Users in multiple organisations
   - Expired sessions
   - Concurrent requests

---

## 🔒 Security Improvements Summary

| Issue | Current | After Migration |
|-------|---------|-----------------|
| Password Hashing | SHA256 (insecure) | bcrypt (12+ rounds) |
| Token Storage | localStorage (XSS risk) | HttpOnly cookies |
| Session Management | Multiple systems | NextAuth unified |
| Rate Limiting | None | 5 attempts/15min |
| CSRF Protection | Partial | Full (NextAuth) |
| Mock Auth Code | In production | Removed |
| Type Safety | Partial | Complete |

---

## 📊 Migration Checklist

### Phase 1: Foundation
- [ ] Upgrade to NextAuth v5
- [ ] Install security dependencies (bcrypt, rate-limiter)
- [ ] Create password utilities
- [ ] Write tests for password hashing

### Phase 2: NextAuth Config
- [ ] Install Prisma adapter
- [ ] Configure Credentials provider
- [ ] Enhance session callback
- [ ] Configure JWT callback
- [ ] Test authentication flow

### Phase 3: Database
- [ ] Add NextAuth tables (if needed)
- [ ] Create password migration script
- [ ] Migrate existing passwords
- [ ] Test database operations

### Phase 4: Auth Routes
- [ ] Update signup route (secure)
- [ ] Remove custom signin route
- [ ] Add rate limiting
- [ ] Test all routes

### Phase 5: Frontend
- [ ] Update SignInForm
- [ ] Update SignUp component
- [ ] Add SessionProvider
- [ ] Remove localStorage code
- [ ] Test UI flows

### Phase 6: Middleware
- [ ] Update middleware with NextAuth
- [ ] Implement role-based protection
- [ ] Create auth utilities
- [ ] Test route protection

### Phase 7: Cleanup
- [ ] Remove legacy auth code
- [ ] Update type definitions
- [ ] Comprehensive testing
- [ ] Documentation

---

## 🚀 Implementation Order

**Recommended Sequence** (to minimize breaking changes):

1. **Phase 1** - Foundation (can be done in parallel with existing system)
2. **Phase 2** - NextAuth Config (test alongside existing auth)
3. **Phase 3** - Database (prepare for migration)
4. **Phase 4** - Auth Routes (replace one at a time)
5. **Phase 5** - Frontend (update components incrementally)
6. **Phase 6** - Middleware (final protection layer)
7. **Phase 7** - Cleanup (remove old code)

---

## ⚠️ Risks & Mitigation

### Risk 1: Breaking Existing Users
**Mitigation**: 
- Run password migration script
- Support both old and new auth during transition
- Provide password reset flow

### Risk 2: Session Loss During Migration
**Mitigation**:
- Migrate during low-traffic period
- Clear communication to users
- Quick rollback plan

### Risk 3: Type Errors
**Mitigation**:
- Incremental migration
- Fix types as you go
- Comprehensive TypeScript checks

---

## 📝 Next Steps

1. **Review this plan** - Ensure it aligns with your requirements
2. **Approve migration** - Confirm you want to proceed
3. **Start Phase 1** - Begin with foundation work
4. **Test incrementally** - Verify each phase before proceeding

---

## 🎓 Why This Approach is Better

### Security
- **bcrypt** is industry standard for password hashing (vs SHA256)
- **HttpOnly cookies** prevent XSS token theft (vs localStorage)
- **Rate limiting** prevents brute force attacks
- **CSRF protection** built into NextAuth

### Architecture
- **Single auth system** eliminates confusion
- **Database sessions** enable session management and revocation
- **Server-only** session management is more secure
- **Type safety** catches errors at compile time

### Developer Experience
- **Simple API**: `getServerSession()` everywhere
- **Type-safe**: Full TypeScript support
- **Well-documented**: NextAuth has extensive docs
- **Maintainable**: One system to maintain

### Production Ready
- **Battle-tested**: NextAuth used by thousands of apps
- **Scalable**: Database sessions scale better than JWT
- **Flexible**: Easy to add OAuth providers later
- **Standards-compliant**: Follows OAuth 2.0 / OpenID Connect

---

Ready to proceed? Let's start with Phase 1! 🚀

