# Migration Instructions: Organisation Support for Private Leagues

## Step 1: Apply the Database Migration

Since you're using Supabase, apply the migration via the SQL Editor:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and paste the SQL from `supabase/migrations/005_add_organisation_to_leagues.sql`**

4. **Click "Run"** (or press Cmd/Ctrl + Enter)

5. **Verify it worked** - You should see "Success. No rows returned"

## Step 2: Verify Prisma Client is Generated

The Prisma client has already been regenerated. If you need to regenerate it:

```bash
cd packages/db
npx prisma generate --schema=prisma/schema.prisma
```

## Step 3: Test the Flow

### Test 1: Create a League with Organisation
1. Log in as a premium user who is part of an organisation
2. Go to Private Leagues page
3. Click "Create League"
4. You should see an organisation badge showing your organisation name
5. Create the league - it will automatically be associated with your organisation

### Test 2: Request to Join an Organisation League
1. Log in as a different premium user from the same organisation
2. Go to Private Leagues page
3. Scroll to "Leagues in Your Organisation" section
4. You should see the league created in Test 1
5. Click "Request to Join"
6. The button should show "Request Pending"

### Test 3: Approve/Reject Request
1. Log in as the league creator (from Test 1)
2. You should see a notification bell icon in the header with a badge showing "1"
3. Click the bell to see the pending request
4. Click "Approve" or "Reject"
5. If approved, the requester should now be a member of the league

### Test 4: View Requests in Leagues Page
1. As the league creator, go to Private Leagues page
2. Select the league
3. You should see a "View Requests" button if there are pending requests
4. Click it to see all pending requests in a modal

## What Was Added

### Database Changes
- `organisationId` column added to `private_leagues` table (nullable)
- New `private_league_requests` table for join requests
- Indexes for efficient queries

### API Endpoints
- `GET /api/private-leagues/organisation/available` - Get available org leagues
- `GET /api/private-leagues/requests` - List pending requests
- `POST /api/private-leagues/requests` - Create join request
- `PATCH /api/private-leagues/requests/[id]` - Approve/reject request
- `GET /api/user/organisation` - Get user's organisation

### UI Features
- Organisation badge on leagues
- "Leagues in Your Organisation" section
- Request to join functionality
- Notification bell in header
- Requests modal in leagues page

## Troubleshooting

If you encounter issues:

1. **Migration fails**: Check that the `organisations` table exists
2. **Prisma errors**: Regenerate the client: `cd packages/db && npx prisma generate`
3. **API errors**: Check browser console and server logs
4. **No organisation shown**: Ensure user is part of an organisation with `ACTIVE` status

