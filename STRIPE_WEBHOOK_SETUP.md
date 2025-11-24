# Stripe Webhook Setup Guide

## Step 1: Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API keys**
3. Copy your **Secret key** (starts with `sk_`)
4. Keep this page open for the webhook setup

## Step 2: Configure Environment Variables

Add these to your `.env.local` file (in the `apps/admin` directory or root):

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...  # We'll get this in Step 3

# JWT Secret (for signup tokens)
JWT_SECRET=your-random-secret-key-here-change-in-production
```

**For development**, you can generate a random JWT secret:
```bash
# Generate a random secret
openssl rand -base64 32
```

## Step 3: Set Up Stripe Webhook

### Option A: Local Development (using Stripe CLI)

1. **Install Stripe CLI**:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server**:
   ```bash
   # In a separate terminal, while your dev server is running
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```
   
   This will output a webhook signing secret like: `whsec_...`
   
4. **Copy the webhook secret** and add it to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Option B: Production/Staging (Stripe Dashboard)

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: `https://your-domain.com/api/stripe/webhook`
4. **Description**: "Referral rewards webhook"
5. **Events to send**:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `invoice.payment_succeeded`
6. Click **Add endpoint**
7. **Copy the Signing secret** (starts with `whsec_`)
8. Add it to your production environment variables:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Step 4: Verify Setup

1. **Restart your dev server** to load new environment variables:
   ```bash
   cd apps/admin
   pnpm dev
   ```

2. **Test the webhook endpoint** (if using Stripe CLI):
   ```bash
   # In another terminal
   stripe trigger customer.subscription.created
   ```
   
   Check your server logs to see if the webhook was received.

## Step 5: Test the Full Flow

1. **Create a test user with referral code**:
   - Sign up a user (User A) → they get a referral code
   - Go to `/account` → "Refer & Earn" tab
   - Copy the referral link

2. **Sign up another user with referral code**:
   - Sign up User B using: `/sign-up?ref=USERA_CODE`
   - Verify referral record is created (check `/admin/referrals`)

3. **Make User B Premium** (via Stripe):
   - Create a subscription for User B in Stripe Dashboard
   - Or use Stripe test mode to create a subscription
   - The webhook should trigger automatically

4. **Verify rewards**:
   - Check `/admin/referrals` - status should be "REWARDED"
   - Check User A's account - should show 1 free month earned
   - Check User B's account - should also show 1 free month earned

## Troubleshooting

**Webhook not receiving events:**
- Check `STRIPE_WEBHOOK_SECRET` is set correctly
- Verify webhook URL is accessible (for production)
- Check server logs for errors
- Use Stripe Dashboard → Webhooks → View logs

**"Invalid signature" error:**
- Make sure `STRIPE_WEBHOOK_SECRET` matches the one from Stripe
- For local dev, use the secret from `stripe listen` command
- For production, use the secret from Stripe Dashboard

**Webhook received but rewards not granted:**
- Check server logs for errors
- Verify user has `referredBy` set
- Check if user is actually Premium (`tier === 'premium'` or `subscriptionStatus === 'ACTIVE'`)
- Verify `processReferralReward` function is being called

## Next Steps

Once webhook is configured:
1. ✅ Test with Stripe test mode
2. ✅ Verify rewards are granted correctly
3. ✅ Test max 3 free months limit
4. ✅ Test self-referral prevention
5. ✅ Deploy to production and configure production webhook

