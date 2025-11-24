# Referral System Implementation

## Overview

Implemented a referral system where:
- Each teacher has a unique referral link
- When a referred teacher becomes Premium, **BOTH** teachers get +1 month free
- Teachers can earn up to **3 free months** total via referrals
- Rewards are only granted when the referred user becomes Premium (not on signup)
- Self-referrals are prevented

## What Was Implemented

### 1. Database Schema Updates

**Migration File:** `supabase/migrations/007_update_referral_system.sql`

**Changes:**
- Replaced `referralCount` with `freeMonthsGranted` (tracks total free months earned, max 3)
- Updated `Referral` model to track:
  - `status`: PENDING → REWARDED (when both users get free month)
  - `rewardGrantedAt`: Timestamp when reward was granted
  - `referrerRewarded`: Boolean flag
  - `referredRewarded`: Boolean flag

**Prisma Schema:** Updated `packages/db/prisma/schema.prisma`

### 2. Backend Logic

**Referral Reward Function:** `apps/admin/src/lib/referral-rewards.ts`
- `grantFreeMonth()`: Grants +1 month to a user (handles both free and paying users)
- `processReferralReward()`: Processes rewards when referred user becomes Premium
- Enforces max 3 free months per user

**API Endpoints:**
- `GET /api/user/referral`: Get user's referral code and stats
- `POST /api/user/referral/verify`: Record referral during signup (creates PENDING record)
- `POST /api/auth/signup`: New signup endpoint that accepts referral codes
- `GET /api/admin/referrals`: Admin endpoint to view all referrals and stats

**Stripe Webhook:** `apps/admin/src/app/api/stripe/webhook/route.ts`
- Handles `customer.subscription.created`, `customer.subscription.updated`, `invoice.payment_succeeded`
- Automatically triggers referral rewards when referred user becomes Premium

### 3. Frontend UI

**Signup Form:** `apps/admin/src/components/auth/SignUpForm.tsx`
- Added referral code input field (optional)
- Extracts referral code from URL query parameter (`?ref=CODE`)
- Passes referral code to signup API

**Referral Tab:** `apps/admin/src/components/premium/ReferralTab.tsx`
- Shows referral link with copy button
- Displays stats: referrals made, rewarded referrals, free months earned
- Progress bar showing free months earned (max 3)
- Available to all users (not just free users)

**Admin Page:** `apps/admin/src/app/admin/referrals/page.tsx`
- Dashboard showing total referrals, pending, rewarded, and total free months granted
- Table of all referrals with status, user info, and reward details

## Next Steps

### 1. Apply Database Migration

Run the SQL migration in Supabase:

```sql
-- Run: supabase/migrations/007_update_referral_system.sql
```

Or apply via Supabase Dashboard → SQL Editor.

### 2. Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `invoice.payment_succeeded`
4. Copy the webhook secret to `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 3. Environment Variables

Ensure these are set in `.env.local`:

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
JWT_SECRET=your-secret-key
```

### 4. Test the Flow

1. **Signup with referral code:**
   - User A signs up normally (gets referral code)
   - User B signs up with User A's referral code: `/sign-up?ref=USERA_CODE`
   - Referral record created with status PENDING

2. **User B becomes Premium:**
   - User B subscribes via Stripe
   - Stripe webhook triggers
   - Both User A and User B get +1 month free
   - Referral status changes to REWARDED

3. **Verify rewards:**
   - Check `/account` → Refer & Earn tab
   - Check `/admin/referrals` for admin view

## Key Features

✅ **Unique referral codes** for each user (8 characters, auto-generated)
✅ **Rewards trigger on Premium subscription** (not signup)
✅ **Both users get rewarded** (referrer + referred)
✅ **Max 3 free months** per user (enforced)
✅ **Self-referral prevention**
✅ **Admin tracking page** for monitoring
✅ **Stripe webhook integration** for automatic processing

## Guardrails

- ✅ Self-referrals blocked
- ✅ Max 3 free months enforced
- ✅ Only Premium subscriptions trigger rewards
- ✅ Referral code can only be used once per user
- ✅ Status tracking (PENDING → REWARDED)

## Notes

- The referral system works for **all users** (not just free users)
- Free months are applied differently:
  - **Free users**: `freeTrialUntil` is extended
  - **Paying users**: `nextCycleFree` flag is set (you'll need to handle this in billing logic)
- The Stripe webhook handler needs to be tested with real Stripe events
- Consider adding email notifications when rewards are granted

