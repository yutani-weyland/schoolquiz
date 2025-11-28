# Testing Referral System Without Stripe

You can test the entire referral system without setting up Stripe! Here's how:

## Option 1: Use Test Endpoint (Easiest)

I've created a test endpoint that simulates a user becoming Premium and triggers the referral reward.

### Step 1: Set Up Test Users

1. **Sign up User A** (the referrer):
   - Go to `/sign-up`
   - Create an account
   - Go to `/account` → "Refer & Earn" tab
   - Copy the referral code (e.g., `ABC12345`)

2. **Sign up User B** (the referred user):
   - Go to `/sign-up?ref=ABC12345` (use User A's code)
   - Create an account
   - Note User B's user ID (you'll need this)

### Step 2: Get User IDs

You can find user IDs by:
- Checking the browser's localStorage: `localStorage.getItem('userId')`
- Or querying the database:
  ```sql
  SELECT id, email, "referralCode", "referredBy" 
  FROM users 
  ORDER BY "createdAt" DESC 
  LIMIT 5;
  ```

### Step 3: Trigger Referral Reward

**Method A: Using curl**
```bash
# Replace USER_B_ID with the actual user ID
curl -X POST http://localhost:3001/api/test/referral-reward \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_B_ID"}'
```

**Method B: Using browser console**
```javascript
fetch('/api/test/referral-reward', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'USER_B_ID' })
})
.then(r => r.json())
.then(console.log)
```

**Method C: Using a simple HTML page**
Create a file `test-referral.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Test Referral Reward</title>
</head>
<body>
  <h1>Test Referral Reward</h1>
  <input type="text" id="userId" placeholder="User ID">
  <button onclick="triggerReward()">Trigger Reward</button>
  <pre id="result"></pre>
  
  <script>
    async function triggerReward() {
      const userId = document.getElementById('userId').value;
      const response = await fetch('/api/test/referral-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      document.getElementById('result').textContent = JSON.stringify(data, null, 2);
    }
  </script>
</body>
</html>
```

### Step 4: Verify Results

1. **Check User A's account** (`/account` → "Refer & Earn"):
   - Should show 1 free month earned
   - Progress bar should show 1/3

2. **Check User B's account**:
   - Should also show 1 free month earned

3. **Check admin page** (`/admin/referrals`):
   - Referral status should be "REWARDED"
   - Both `referrerRewarded` and `referredRewarded` should be true

4. **Check database**:
   ```sql
   SELECT 
     r.id,
     r.status,
     r."reward_granted_at",
     r."referrer_rewarded",
     r."referred_rewarded",
     u1.email as referrer_email,
     u1."freeMonthsGranted" as referrer_free_months,
     u2.email as referred_email,
     u2."freeMonthsGranted" as referred_free_months
   FROM referrals r
   JOIN users u1 ON r.referrer_id = u1.id
   JOIN users u2 ON r.referred_user_id = u2.id;
   ```

## Option 2: Manual Database Update

If you want to test without the API endpoint:

1. **Make user Premium manually**:
   ```sql
   UPDATE users 
   SET 
     tier = 'premium',
     "subscriptionStatus" = 'ACTIVE'
   WHERE id = 'USER_B_ID';
   ```

2. **Then call the reward function** via the test endpoint or create a simple script.

## Option 3: Use Stripe Test Mode (Free)

If you want to test with Stripe but without real payments:

1. **Sign up for Stripe** (free, no credit card needed)
2. **Use test mode** (default for new accounts)
3. **Get test API keys** from Dashboard → Developers → API keys
4. **Use test card numbers**:
   - Success: `4242 4242 4242 4242`
   - Any future expiry date, any CVC
5. **Set up webhook** using Stripe CLI (see `STRIPE_WEBHOOK_SETUP.md`)

## Testing Scenarios

### Test 1: Basic Referral Flow
- ✅ User A refers User B
- ✅ User B becomes Premium
- ✅ Both get +1 month free

### Test 2: Max Free Months
- ✅ Refer 3 users, get 3 free months
- ✅ Refer 4th user, should NOT get 4th free month

### Test 3: Self-Referral Prevention
- ✅ Try to use own referral code → should fail

### Test 4: Multiple Referrals
- ✅ User A refers User B, C, D
- ✅ Each becomes Premium
- ✅ User A gets 3 free months total

## Quick Test Script

Save this as `test-referral.sh`:

```bash
#!/bin/bash

# Get user ID from command line
USER_ID=$1

if [ -z "$USER_ID" ]; then
  echo "Usage: ./test-referral.sh USER_ID"
  exit 1
fi

echo "Triggering referral reward for user: $USER_ID"
curl -X POST http://localhost:3001/api/test/referral-reward \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\"}" | jq

echo ""
echo "Check results at:"
echo "- /account (Refer & Earn tab)"
echo "- /admin/referrals"
```

Make it executable:
```bash
chmod +x test-referral.sh
./test-referral.sh USER_B_ID
```

## Troubleshooting

**"User was not referred by anyone"**
- Make sure User B signed up with User A's referral code
- Check: `SELECT "referredBy" FROM users WHERE id = 'USER_B_ID';`

**"User not found"**
- Verify the user ID is correct
- Check: `SELECT id, email FROM users;`

**Reward not granted**
- Check server logs for errors
- Verify user is Premium: `SELECT tier, "subscriptionStatus" FROM users WHERE id = 'USER_B_ID';`
- Check referral record: `SELECT * FROM referrals WHERE referred_user_id = 'USER_B_ID';`

