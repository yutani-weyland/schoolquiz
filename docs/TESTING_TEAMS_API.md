# Testing Teams API Endpoints

## Prerequisites

1. **Run the database migration** first:
   ```sql
   -- Apply migration 017_add_teams_feature.sql to your Supabase database
   ```

2. **Regenerate Prisma client** (if not done already):
   ```bash
   cd packages/db && pnpm db:generate
   ```

3. **Ensure you have a premium account** - Teams feature is premium-only

4. **Be logged in** - All endpoints require authentication via NextAuth session

## Method 1: Browser Console Testing

1. **Start your dev server:**
   ```bash
   pnpm dev
   ```

2. **Log in** to your app at `http://localhost:3000`

3. **Open browser console** (F12 or Cmd+Option+I)

4. **Copy and paste this test script:**

```javascript
// Test Teams API endpoints
const BASE_URL = window.location.origin;

async function testTeamsAPI() {
  console.log('🚀 Starting Teams API Tests\n');

  // Test 1: List teams (should be empty initially)
  console.log('1️⃣ Testing GET /api/user/teams');
  const listResponse = await fetch(`${BASE_URL}/api/user/teams`, {
    credentials: 'include',
  });
  const listData = await listResponse.json();
  console.log('Response:', listData);
  console.log('');

  // Test 2: Create a team
  console.log('2️⃣ Testing POST /api/user/teams');
  const createResponse = await fetch(`${BASE_URL}/api/user/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      name: 'Year 7A',
      color: '#3B82F6',
    }),
  });
  const createData = await createResponse.json();
  console.log('Response:', createData);
  const teamId = createData.id;
  console.log('');

  if (!teamId) {
    console.error('❌ Failed to create team. Check if you have premium access.');
    return;
  }

  // Test 3: Get specific team
  console.log(`3️⃣ Testing GET /api/user/teams/${teamId}`);
  const getResponse = await fetch(`${BASE_URL}/api/user/teams/${teamId}`, {
    credentials: 'include',
  });
  const getData = await getResponse.json();
  console.log('Response:', getData);
  console.log('');

  // Test 4: Update team
  console.log(`4️⃣ Testing PUT /api/user/teams/${teamId}`);
  const updateResponse = await fetch(`${BASE_URL}/api/user/teams/${teamId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      name: 'Year 7A Updated',
      color: '#10B981',
    }),
  });
  const updateData = await updateResponse.json();
  console.log('Response:', updateData);
  console.log('');

  // Test 5: Set as default
  console.log(`5️⃣ Testing POST /api/user/teams/${teamId}/set-default`);
  const defaultResponse = await fetch(`${BASE_URL}/api/user/teams/${teamId}/set-default`, {
    method: 'POST',
    credentials: 'include',
  });
  const defaultData = await defaultResponse.json();
  console.log('Response:', defaultData);
  console.log('');

  // Test 6: List teams again
  console.log('6️⃣ Testing GET /api/user/teams (final)');
  const finalListResponse = await fetch(`${BASE_URL}/api/user/teams`, {
    credentials: 'include',
  });
  const finalListData = await finalListResponse.json();
  console.log('Response:', finalListData);
  console.log('');

  console.log('✅ All tests completed!');
}

// Run tests
testTeamsAPI();
```

## Method 2: Node.js Script

1. **Run the test script:**
   ```bash
   tsx scripts/test-teams-api.ts
   ```

   **Note:** This requires you to be logged in via browser first (to have session cookies), or you'll need to modify it to use API tokens.

## Method 3: Manual Testing with curl

Since endpoints use NextAuth session cookies, you'll need to:

1. **Get your session cookie** from browser DevTools → Application → Cookies
2. **Use it in curl:**

```bash
# Set your session cookie
SESSION_COOKIE="your-session-cookie-here"
BASE_URL="http://localhost:3000"

# List teams
curl -X GET "${BASE_URL}/api/user/teams" \
  -H "Cookie: next-auth.session-token=${SESSION_COOKIE}"

# Create team
curl -X POST "${BASE_URL}/api/user/teams" \
  -H "Cookie: next-auth.session-token=${SESSION_COOKIE}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Year 7A", "color": "#3B82F6"}'
```

## Expected Results

### ✅ Success Cases

1. **GET /api/user/teams**
   - Returns: `{ teams: [], count: 0, maxTeams: 10 }`
   - Status: 200

2. **POST /api/user/teams**
   - Returns: Team object with `id`, `name`, `color`, `isDefault`, etc.
   - Status: 201
   - First team should have `isDefault: true`

3. **GET /api/user/teams/[id]**
   - Returns: Single team object
   - Status: 200

4. **PUT /api/user/teams/[id]**
   - Returns: Updated team object
   - Status: 200

5. **POST /api/user/teams/[id]/set-default**
   - Returns: Team object with `isDefault: true`
   - Status: 200
   - Other teams should have `isDefault: false`

6. **DELETE /api/user/teams/[id]**
   - Returns: `{ success: true }`
   - Status: 200

### ❌ Error Cases

1. **Non-premium user**
   - Error: `"Teams feature is only available to premium users"`
   - Status: 403

2. **Duplicate team name**
   - Error: `"A team with this name already exists"`
   - Status: 400

3. **Team limit exceeded (11th team)**
   - Error: `"Maximum of 10 teams allowed"`
   - Status: 400

4. **Team not found**
   - Error: `"Team not found"`
   - Status: 404

5. **Delete default team when others exist**
   - Error: `"Cannot delete default team. Please set another team as default first."`
   - Status: 400

## Testing Quiz Completion with Team

After creating teams, test that quiz completions can be saved with a teamId:

```javascript
// In browser console after creating a team
const teamId = 'your-team-id-here';
const quizSlug = '12'; // Use an existing quiz slug

const completionResponse = await fetch(`${window.location.origin}/api/quiz/completion`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    quizSlug,
    score: 20,
    totalQuestions: 25,
    completionTimeSeconds: 1200,
    teamId, // Include teamId
  }),
});

const completionData = await completionResponse.json();
console.log('Completion saved:', completionData);
```

## Troubleshooting

### "Teams feature is only available to premium users"
- Make sure your user account has `tier: 'premium'` or active subscription
- Check user in database: `SELECT id, email, tier, "subscriptionStatus" FROM users WHERE email = 'your@email.com';`

### "Team not found"
- Verify team ID is correct
- Check team belongs to your user: `SELECT * FROM teams WHERE id = 'team-id';`

### "Cannot delete default team"
- Set another team as default first
- Or delete all other teams first

### Migration errors
- Make sure migration `017_add_teams_feature.sql` has been applied
- Check tables exist: `SELECT * FROM teams LIMIT 1;`
- Check column exists: `SELECT "teamId" FROM quiz_completions LIMIT 1;`
