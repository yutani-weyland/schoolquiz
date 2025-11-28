# NextAuth Migration Status

## Overview
This document tracks the migration from localStorage-based auth to NextAuth v5.

## ✅ Completed
- `packages/auth/src/index.ts` - NextAuth configuration with session callback
- `apps/admin/src/contexts/UserAccessContext.tsx` - Updated to use NextAuth session
- `apps/admin/src/components/SiteHeader.tsx` - Updated to use NextAuth session
- `apps/admin/src/app/quizzes/page.tsx` - Updated to use NextAuth session
- `apps/admin/src/components/auth/SignInForm.tsx` - Already uses NextAuth

## 🔄 In Progress
- None currently

## 📋 Pending Migration (47 files)

### Components - Auth (1 file)
- [ ] `apps/admin/src/components/auth/SignUpForm.tsx` - Uses localStorage for signup

### Components - Premium (9 files)
- [ ] `apps/admin/src/components/premium/SubscriptionTab.tsx`
- [ ] `apps/admin/src/components/premium/SubscriptionBillingTab.tsx`
- [ ] `apps/admin/src/components/premium/ShareQuizModal.tsx`
- [ ] `apps/admin/src/components/premium/SchoolLogoUpload.tsx`
- [ ] `apps/admin/src/components/premium/ReferralTab.tsx`
- [ ] `apps/admin/src/components/premium/ReferralProgress.tsx`
- [ ] `apps/admin/src/components/premium/PrivateLeaguesTab.tsx`
- [ ] `apps/admin/src/components/premium/OrganisationBrandingTab.tsx`
- [ ] `apps/admin/src/components/premium/AccountTab.tsx`
- [ ] `apps/admin/src/components/premium/AccountProfileTab.tsx`

### Components - Quiz (4 files)
- [ ] `apps/admin/src/components/quiz/QuizIntro.tsx`
- [ ] `apps/admin/src/components/quiz/QuizCard.tsx`
- [ ] `apps/admin/src/components/quiz/QuizPlayer.tsx`
- [ ] `apps/admin/src/components/quiz/play/QuizHeader.tsx`

### Components - Profile (3 files)
- [ ] `apps/admin/src/components/profile/ProfileCustomizeTab.tsx`
- [ ] `apps/admin/src/components/profile/PrivateLeaguesAnalytics.tsx`
- [ ] `apps/admin/src/components/profile/AchievementsShowcase.tsx`

### Components - Stats (2 files)
- [ ] `apps/admin/src/components/stats/RecentAchievements.tsx`
- [ ] `apps/admin/src/components/stats/InProgressAchievements.tsx`

### Components - Marketing (1 file)
- [ ] `apps/admin/src/components/marketing/QuizCardStack.tsx`

### Components - Admin (1 file)
- [ ] `apps/admin/src/components/admin/AdminTopbar.tsx`

### Components - Auth (1 file)
- [ ] `apps/admin/src/components/auth/UpgradePage.tsx`

### App Pages (10 files)
- [ ] `apps/admin/src/app/page.tsx`
- [ ] `apps/admin/src/app/stats/stats-server.ts`
- [ ] `apps/admin/src/app/stats/StatsClient.tsx`
- [ ] `apps/admin/src/app/profile/[userId]/profile-server.ts`
- [ ] `apps/admin/src/app/profile/[userId]/ProfileClient.tsx`
- [ ] `apps/admin/src/app/premium/my-quizzes/page.tsx`
- [ ] `apps/admin/src/app/premium/create-quiz/page.tsx`
- [ ] `apps/admin/src/app/leagues/page.tsx`
- [ ] `apps/admin/src/app/custom-quizzes/page.tsx`
- [ ] `apps/admin/src/app/custom-quizzes/create/page.tsx`
- [ ] `apps/admin/src/app/custom-quizzes/[id]/play/page.tsx`
- [ ] `apps/admin/src/app/contact/page.tsx`
- [ ] `apps/admin/src/app/admin/referrals/page.tsx`
- [ ] `apps/admin/src/app/achievements/page.tsx`
- [ ] `apps/admin/src/app/account/page.tsx`

### API Routes (3 files)
- [ ] `apps/admin/src/app/api/admin/users/[id]/role/route.ts`
- [ ] `apps/admin/src/app/api/admin/users/[id]/impersonate/route.ts`
- [ ] `apps/admin/src/app/api/admin/organisations/[id]/members/[memberId]/role/route.ts`

### Hooks & Utilities (3 files)
- [ ] `apps/admin/src/hooks/useUserTier.ts`
- [ ] `apps/admin/src/lib/server-auth.ts`
- [ ] `apps/admin/src/lib/leagues-fetch.ts`

## Migration Strategy

### Batch 1: Premium Components (Priority: High)
These are user-facing premium features that need to work correctly.

### Batch 2: Quiz Components (Priority: High)
Core quiz functionality that users interact with daily.

### Batch 3: Profile & Stats Components (Priority: Medium)
User profile and statistics pages.

### Batch 4: App Pages (Priority: Medium)
Page-level components that need auth checks.

### Batch 5: API Routes (Priority: Medium)
Server-side routes that need auth verification.

### Batch 6: Utilities & Hooks (Priority: Low)
Supporting code that can be updated last.

## Common Patterns to Replace

### Pattern 1: localStorage.getItem('authToken')
**Replace with:** `useSession()` from NextAuth
```typescript
// Old
const token = localStorage.getItem('authToken');

// New
const { data: session } = useSession();
// Session is automatically available, no token needed for API calls
```

### Pattern 2: Authorization Headers
**Replace with:** Server-side auth or session-based API calls
```typescript
// Old
fetch('/api/endpoint', {
  headers: { Authorization: `Bearer ${token}` }
});

// New (client-side)
fetch('/api/endpoint', { credentials: 'include' });

// New (server-side)
import { auth } from '@schoolquiz/auth';
const session = await auth();
```

### Pattern 3: User ID from localStorage
**Replace with:** Session user ID
```typescript
// Old
const userId = localStorage.getItem('userId');

// New
const { data: session } = useSession();
const userId = session?.user?.id;
```

### Pattern 4: Check if logged in
**Replace with:** Session status
```typescript
// Old
const isLoggedIn = !!localStorage.getItem('authToken');

// New
const { data: session, status } = useSession();
const isLoggedIn = status === 'authenticated' && !!session;
```

