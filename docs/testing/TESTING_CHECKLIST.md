# Testing Checklist - Premium User & Tier Detection

## Pre-Testing Setup

- [ ] **Run the reset script** in your database (Supabase SQL Editor or psql):
  ```sql
  -- Paste contents of scripts/RESET_TEST_DATA.sql
  ```
  - Verify you see success messages: "✅ Created premium user", "✅ Created organisation"

- [ ] **Restart your development server**:
  ```bash
  # Stop current server (Ctrl+C)
  # Then restart:
  cd apps/admin
  npm run dev
  # or
  pnpm dev
  ```

## Testing Steps

### 1. Clear Browser State
- [ ] **Clear browser cache and localStorage**:
  - Open DevTools (F12)
  - Go to Application tab → Clear storage → Clear site data
  - Or use Incognito/Private window for clean test

### 2. Sign In
- [ ] **Navigate to sign-in page** (`/sign-in`)
- [ ] **Sign in with test user**:
  - Email: `premium@test.com`
  - Password: (use your auth system's password - may need to set it first or use mock auth)

### 3. Check Console Logs
- [ ] **Open browser DevTools Console** (F12 → Console tab)
- [ ] **Look for these log messages** (in order):
  - `[UserAccessContext] Session still loading, waiting...` (initially)
  - `[UserAccessContext] Running tier determination...` (when session loads)
  - `[UserAccessContext] Session tier check:` (showing session data)
  - Either:
    - `[UserAccessContext] Using tier from session: premium` ✅
    - OR `[UserAccessContext] Session tier not available, fetching from API` → then `[UserAccessContext] Got tier from API: premium` ✅

### 4. Verify Tier Detection
- [ ] **Check the computed value logs**:
  - Should see: `[UserAccessContext] Computed value: {tier: 'premium', isPremium: true, isLoggedIn: true, ...}`
  - Should NOT see: `tier: 'visitor'` or `tier: 'free'`

### 5. Check SiteHeader Menu
- [ ] **Open the menu** (click menu icon in header)
- [ ] **Verify menu shows correct state**:
  - Console should show: `[SiteHeader Menu] Rendering menu with: {isPremium: true, tier: 'premium', ...}`
  - Menu should show premium features/options
  - Should NOT show visitor/free tier options

### 6. Test Premium Features
- [ ] **Navigate to Custom Quizzes page** (`/custom-quizzes`):
  - Should load without redirecting to `/premium`
  - Should show "My Custom Quizzes" page
  - Should NOT show upgrade prompts

- [ ] **Navigate to Private Leagues page** (`/leagues`):
  - Should load without redirecting to `/premium`
  - Should show leagues interface
  - Should NOT show upgrade prompts

### 7. Verify Session Tier
- [ ] **Check session object in console**:
  ```javascript
  // In browser console, check:
  // The session should have tier: 'premium'
  // You can check this by looking at the logs or:
  console.log('Session tier:', session?.user?.tier)
  ```

## Expected Results

✅ **Success indicators:**
- Console shows `tier: 'premium'` in UserAccessContext logs
- Console shows `isPremium: true` in SiteHeader logs
- Menu renders with premium options
- Custom Quizzes page loads (no redirect)
- Private Leagues page loads (no redirect)
- No "Upgrade to Premium" prompts on premium features

❌ **Failure indicators:**
- Console shows `tier: 'visitor'` or `tier: 'free'`
- Console shows `isPremium: false`
- Menu shows visitor/free tier options
- Redirected to `/premium` when accessing premium features
- "Upgrade to Premium" prompts appear

## If Issues Occur

- [ ] **Check console for errors** - Look for red error messages
- [ ] **Check network tab** - Verify `/api/user/subscription` returns correct data
- [ ] **Verify database** - Run `scripts/CHECK_USER_PREMIUM_STATUS.sql` to verify user tier in DB
- [ ] **Check session** - Verify NextAuth session callback is setting tier correctly
- [ ] **Share console logs** - Copy all console output and share for debugging

## What to Share

When reporting results, please share:
1. ✅/❌ for each checklist item
2. **Console logs** - Copy all `[UserAccessContext]` and `[SiteHeader]` log messages
3. **Any errors** - Red error messages from console
4. **Screenshots** - If menu or pages look wrong
5. **Network tab** - Screenshot of `/api/user/subscription` response (if API was called)

