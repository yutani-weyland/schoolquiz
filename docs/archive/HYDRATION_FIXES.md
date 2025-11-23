# Hydration Error Fixes

## Issue Summary
Next.js hydration errors occur when server-rendered HTML doesn't match client-rendered HTML. This commonly happens when:
- Using `typeof window !== 'undefined'` checks during render (not in useEffect)
- Accessing localStorage/sessionStorage during render
- Using Date.now() or Math.random() during render
- Conditional rendering based on client-only values

## Fixed Issues

### ✅ QuizIntro Component (`apps/admin/src/components/quiz/QuizIntro.tsx`)
**Problem:** `loggedIn` was computed during render using `typeof window !== 'undefined'`, causing server to render "Try Quiz" while client rendered "Play Quiz".

**Solution:**
- Moved `loggedIn` to `useState(false)` initialized to match server render
- Added `mounted` state to track when component has hydrated
- Set `loggedIn` in `useEffect` after component mounts
- Updated conditional rendering to check `!mounted || !loggedIn` to ensure consistent initial render

**Changes:**
```typescript
// Before (caused hydration error):
const loggedIn = typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') === 'true';

// After (fixed):
const [loggedIn, setLoggedIn] = useState(false);
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
  const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') === 'true';
  setLoggedIn(isLoggedIn);
  // ... rest of logic
}, [dependencies]);
```

## Verified Safe (No Changes Needed)

### ✅ Quizzes Page (`apps/admin/src/app/quizzes/page.tsx`)
- All `typeof window` checks are inside `useEffect` hooks
- No render-time client-only logic

### ✅ QuizCard Component (`apps/admin/src/components/quiz/QuizCard.tsx`)
- All `typeof window` checks are inside `useEffect` hooks
- No render-time client-only logic

## Testing Checklist

1. **Quiz Intro Page**
   - [ ] Navigate to `/quizzes/12/intro` as logged-out user
   - [ ] Check browser console for hydration errors
   - [ ] Verify "Try Quiz" button appears correctly
   - [ ] Navigate to `/quizzes/12/intro` as logged-in user
   - [ ] Verify "Play Quiz" button appears correctly
   - [ ] Check browser console for hydration errors

2. **Quizzes Page**
   - [ ] Navigate to `/quizzes` page
   - [ ] Check browser console for hydration errors
   - [ ] Verify animations work correctly
   - [ ] Verify quiz cards render correctly

3. **General**
   - [ ] Open browser DevTools → Console
   - [ ] Look for "Hydration failed" warnings
   - [ ] Test navigation between pages
   - [ ] Test with different user states (logged in/out, premium/free)

## Best Practices Going Forward

1. **Never access `window`, `localStorage`, or `sessionStorage` during render**
   - Always use `useState` + `useEffect` pattern
   - Initialize state with server-safe default values

2. **Use `mounted` state pattern for client-only content**
   ```typescript
   const [mounted, setMounted] = useState(false);
   
   useEffect(() => {
     setMounted(true);
     // Client-only logic here
   }, []);
   
   if (!mounted) {
     return <div>Loading...</div>; // or return null, or server-safe content
   }
   ```

3. **Keep conditional rendering consistent**
   - Server and client should render the same initial HTML
   - Use `mounted` check before showing client-specific content

4. **Test for hydration errors**
   - Always check browser console when developing
   - Test with SSR enabled (production builds)
   - Use React DevTools to inspect hydration mismatches

