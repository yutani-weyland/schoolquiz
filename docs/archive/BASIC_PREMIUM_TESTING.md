# Basic vs Premium User Testing Guide

This document describes how to test the Basic (Free) and Premium (Paid) user tiers locally.

## Overview

The application now supports two user tiers:
- **Basic (Free)**: Limited access to quizzes and features
- **Premium (Paid)**: Full access to all features

## Database Setup

1. **Run Prisma migrations** to add the new fields:
```bash
cd packages/db
npx prisma migrate dev --name add_user_tier_and_referrals
```

2. **Verify schema changes**:
   - `User.tier` field (defaults to "basic")
   - `User.referralCode` field (unique, nullable)
   - `User.referredBy` field (nullable)
   - `User.referralCount` field (defaults to 0)
   - `User.freeTrialUntil` field (nullable)

## Testing Basic Users

### 1. Create a Basic User

Users are created as "basic" by default. To verify:

```typescript
// In your database or seed script
const basicUser = await prisma.user.create({
  data: {
    email: 'basic@example.com',
    name: 'Basic User',
    tier: 'basic', // Default
  },
});
```

### 2. Test Quiz Access Restrictions

**Expected Behavior:**
- ✅ Can access the **latest** weekly quiz (first quiz in the list)
- ❌ Cannot access previous quizzes (shows upgrade modal)
- ❌ Quiz cards for non-latest quizzes show "Premium" lock badge

**Test Steps:**
1. Log in as a basic user
2. Navigate to `/quizzes`
3. Try clicking on the latest quiz → Should work
4. Try clicking on any older quiz → Should show upgrade modal

### 3. Test Leaderboard Restrictions

**Expected Behavior:**
- ✅ Can view organisation-wide leaderboards
- ❌ Cannot view group or ad-hoc leaderboards
- ❌ Cannot join private leagues (shows upgrade modal)

**Test Steps:**
1. Log in as a basic user
2. Navigate to `/leaderboards`
3. Should only see organisation-wide leaderboards
4. Try to join a group/ad-hoc leaderboard → Should show upgrade modal

### 4. Test Achievement Display

**Expected Behavior:**
- ✅ Can view achievements (but greyed out)
- ❌ Achievements show lock icon
- ❌ Tooltip says "Unlock with Premium"
- ❌ Cannot drag/reorder achievements

**Test Steps:**
1. Log in as a basic user
2. Navigate to `/account` → Account & Profile tab
3. View achievements section
4. Achievements should be desaturated with lock icons

### 5. Test Referral System

**Expected Behavior:**
- ✅ Basic users see "Refer & Earn" card
- ✅ Shows progress bar (0-3 referrals)
- ✅ Displays copyable referral link
- ✅ On 3rd referral, user automatically upgraded to premium

**Test Steps:**
1. Log in as a basic user
2. Navigate to `/account` → Account & Profile tab
3. Should see "Refer & Earn Premium" card
4. Copy referral link
5. Sign up a new user with that referral code
6. Verify referrer's count increments
7. After 3 referrals, verify user is upgraded to premium

**API Endpoint:**
```bash
# Get referral data
GET /api/user/referral
Authorization: Bearer <token>

# Process referral (called during signup)
POST /api/user/referral/verify
Body: { referralCode: "ABC123", newUserId: "user-id" }
```

## Testing Premium Users

### 1. Upgrade a User to Premium

```typescript
// In your database or seed script
const premiumUser = await prisma.user.update({
  where: { email: 'user@example.com' },
  data: {
    tier: 'premium',
    // OR set subscription status
    subscriptionStatus: 'ACTIVE',
    // OR set free trial end date
    freeTrialUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  },
});
```

### 2. Test Full Access

**Expected Behavior:**
- ✅ Can access all quizzes (latest and previous)
- ✅ Can view all leaderboards (org-wide, group, ad-hoc)
- ✅ Can create/join private leagues
- ✅ Can unlock and reorder achievements
- ✅ No upgrade modals shown

**Test Steps:**
1. Log in as a premium user
2. Navigate to `/quizzes` → All quizzes accessible
3. Navigate to `/leaderboards` → All leaderboard types visible
4. Navigate to `/account` → Full access to all features

## Testing Upgrade Modal

The upgrade modal appears when:
- Basic user tries to access previous quizzes
- Basic user tries to join private leagues
- Basic user tries to access premium-only features

**Test Steps:**
1. Log in as a basic user
2. Click on any restricted feature
3. Modal should appear with:
   - "Upgrade to Premium" header
   - List of premium features
   - "Upgrade Now" button (links to `/upgrade`)

## Testing Referral Flow

### Complete Referral Flow Test

1. **Create Referrer (Basic User)**
   ```typescript
   const referrer = await prisma.user.create({
     data: {
       email: 'referrer@example.com',
       tier: 'basic',
     },
   });
   ```

2. **Get Referral Code**
   ```bash
   GET /api/user/referral
   # Returns: { referralCode: "ABC123", referralCount: 0 }
   ```

3. **Sign Up New User with Referral**
   ```bash
   POST /api/user/referral/verify
   Body: {
     referralCode: "ABC123",
     newUserId: "new-user-id"
   }
   ```

4. **Verify Referrer Count Increments**
   ```bash
   GET /api/user/referral
   # Returns: { referralCode: "ABC123", referralCount: 1 }
   ```

5. **Repeat Steps 3-4 twice more**

6. **Verify Auto-Upgrade**
   ```bash
   GET /api/user/referral
   # User should now have tier: "premium"
   # freeTrialUntil should be set to 1 month from now
   ```

## API Endpoints

### Get User Tier
```bash
GET /api/user/subscription
Authorization: Bearer <token>
```

### Get Referral Data
```bash
GET /api/user/referral
Authorization: Bearer <token>
```

### Process Referral
```bash
POST /api/user/referral/verify
Body: {
  referralCode: string,
  newUserId: string
}
```

## Component Testing

### UpgradeModal Component
- Location: `apps/admin/src/components/premium/UpgradeModal.tsx`
- Props: `isOpen`, `onClose`, `feature?`
- Test: Render modal, verify CTA button links to `/upgrade`

### ReferralProgress Component
- Location: `apps/admin/src/components/premium/ReferralProgress.tsx`
- Props: `userId?`, `organisationDomain?`
- Test: Only visible for basic users, shows progress bar, copyable link

### QuizCard Component
- Location: `apps/admin/src/components/quiz/QuizCard.tsx`
- Test: Shows lock badge for basic users on non-latest quizzes
- Test: Shows upgrade modal when basic user clicks restricted quiz

## Edge Cases to Test

1. **User with expired free trial**
   - Set `freeTrialUntil` to past date
   - User should be downgraded to basic

2. **User with active subscription but tier="basic"**
   - Auth system should upgrade tier based on subscription status

3. **Self-referral prevention**
   - User cannot refer themselves
   - API should return error

4. **Duplicate referrals**
   - Same user cannot be referred twice
   - API should return error

5. **Referral code generation**
   - Codes should be unique
   - Codes should be 8 characters (alphanumeric)

## Notes

- Tier is determined by: `tier === "premium"` OR `subscriptionStatus === "ACTIVE"` OR `freeTrialUntil > now`
- Basic users default to `tier: "basic"`
- Premium users can be set via `tier: "premium"` or active subscription
- Referral system only works for basic users
- After 3 successful referrals, user is automatically upgraded

