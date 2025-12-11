# Testing Teams Feature - Complete Guide

## Prerequisites Checklist

- [ ] Database migration `017_add_teams_feature.sql` has been applied
- [ ] Prisma client has been regenerated (`cd packages/db && pnpm db:generate`)
- [ ] Dev server has been restarted
- [ ] You have a premium account (teams are premium-only)

## Test 1: Team Management UI

### Step 1: Access Teams Tab
1. Navigate to `/account` (or `/account?tab=teams`)
2. Click on the "Teams" tab
3. **Expected**: Should see Teams tab (only if premium)

### Step 2: Create Your First Team
1. Click "Create Team" button
2. Enter team name: `Year 7A`
3. Select a color (e.g., blue)
4. Click "Create Team"
5. **Expected**: 
   - Team appears in list
   - Shows "Default" badge
   - Shows "0 quizzes"
   - Success message appears

### Step 3: Create More Teams
1. Create `Year 8B` (green color)
2. Create `Period 3` (red color)
3. **Expected**: 
   - All teams appear in list
   - First team has "Default" badge
   - Team count shows "3 of 10 teams"

### Step 4: Edit Team
1. Click edit icon on `Year 8B`
2. Change name to `Year 8B Updated`
3. Change color to purple
4. Click "Save"
5. **Expected**: 
   - Team name and color update
   - Success message appears

### Step 5: Set Default Team
1. Click star icon on `Period 3`
2. **Expected**: 
   - `Period 3` now has "Default" badge
   - `Year 7A` loses "Default" badge
   - Success message appears

### Step 6: Delete Team
1. Click delete icon on `Year 8B Updated`
2. Confirm deletion
3. **Expected**: 
   - Team is removed from list
   - Team count decreases
   - Success message appears

### Step 7: Try to Delete Default Team
1. Try to delete the team with "Default" badge
2. **Expected**: 
   - Error message: "Cannot delete default team. Please set another team as default first."

### Step 8: Test Team Limit
1. Create teams until you reach 10 teams
2. Try to create an 11th team
3. **Expected**: 
   - Error message: "Maximum of 10 teams allowed"
   - "Create Team" button is disabled or shows limit reached

### Step 9: Test Duplicate Names
1. Try to create a team with the same name as an existing team
2. **Expected**: 
   - Error message: "A team with this name already exists"

## Test 2: Team Selection in Quiz Flow

### Step 1: Navigate to Quiz Intro
1. Go to `/quizzes/12/intro` (or any quiz intro page)
2. **Expected**: 
   - If premium: See "Play as:" dropdown above play button
   - Dropdown shows current selected team with color indicator
   - If not premium: No team selector visible

### Step 2: Select Different Team
1. Click on team selector dropdown
2. Select a different team
3. **Expected**: 
   - Dropdown closes
   - Selected team name updates
   - Team color indicator updates

### Step 3: Play Quiz with Selected Team
1. Click "Play Quiz" button
2. Complete the quiz (or answer a few questions)
3. **Expected**: 
   - Quiz plays normally
   - No errors in console

### Step 4: Verify Completion Saved with Team
1. After completing quiz, check browser console
2. Look for completion API call
3. **Expected**: 
   - POST `/api/quiz/completion` includes `teamId` in body
   - Response is successful

### Step 5: Check Team Stats
1. Go back to `/account?tab=teams`
2. Check the team you played as
3. **Expected**: 
   - Quiz count increases (e.g., "1 quiz")
   - Shows correct number of completions

## Test 3: Multiple Teams, Same Quiz

### Step 1: Play Same Quiz with Different Teams
1. Select `Year 7A` team
2. Play quiz #12
3. Complete it
4. Go back to quiz intro
5. Select `Period 3` team
6. Play quiz #12 again
7. Complete it
8. **Expected**: 
   - Both completions save successfully
   - Each team shows 1 quiz completion
   - Can play same quiz multiple times with different teams

### Step 2: Verify Separate Scores
1. Check `/account?tab=teams`
2. Both teams should show quiz completions
3. **Expected**: 
   - Each team tracks its own completions
   - Scores are independent per team

## Test 4: API Endpoints (Manual)

### Test GET /api/user/teams
```javascript
// In browser console
const response = await fetch('/api/user/teams', { credentials: 'include' });
const data = await response.json();
console.log(data);
// Expected: { teams: [...], count: X, maxTeams: 10 }
```

### Test POST /api/user/teams
```javascript
const response = await fetch('/api/user/teams', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ name: 'Test Team', color: '#FF5733' })
});
const data = await response.json();
console.log(data);
// Expected: Team object with id, name, color, etc.
```

### Test Quiz Completion with Team
```javascript
// After selecting a team and playing quiz
// Check localStorage
console.log(localStorage.getItem('selectedTeamId'));
// Should show team ID

// Check completion was saved with teamId
// (Check Network tab in DevTools for POST /api/quiz/completion)
```

## Test 5: Edge Cases

### Test 1: Non-Premium User
1. Log in as a free user
2. Navigate to `/account`
3. **Expected**: 
   - No "Teams" tab visible
   - Cannot access `/api/user/teams` (403 error)

### Test 2: No Teams Created
1. Delete all teams
2. Go to quiz intro page
3. **Expected**: 
   - No team selector visible (no teams available)
   - Quiz can still be played (completion saved without teamId)

### Test 3: Team Persistence
1. Select a team
2. Refresh the page
3. **Expected**: 
   - Same team still selected (stored in localStorage)
   - Team selector shows correct team

### Test 4: Team Deletion with Completions
1. Create a team
2. Play a quiz with that team
3. Try to delete the team
4. **Expected**: 
   - Team can be deleted
   - Completions remain but teamId becomes null (soft delete)

## Test 6: Database Verification

### Check Teams Table
```sql
SELECT * FROM teams WHERE "userId" = 'your-user-id';
-- Should show all your teams
```

### Check Quiz Completions with Teams
```sql
SELECT 
  qc."quizSlug",
  qc.score,
  qc."totalQuestions",
  t.name as team_name
FROM quiz_completions qc
LEFT JOIN teams t ON qc."teamId" = t.id
WHERE qc."userId" = 'your-user-id'
ORDER BY qc."completedAt" DESC;
-- Should show completions with team names
```

## Common Issues & Solutions

### Issue: "Teams feature is only available to premium users"
**Solution**: Make sure your account has `tier: 'premium'` or active subscription

### Issue: Team selector not showing
**Solution**: 
- Check you're logged in and premium
- Check browser console for errors
- Verify teams exist: `/api/user/teams`

### Issue: Completion not saving with teamId
**Solution**:
- Check localStorage has `selectedTeamId`
- Check Network tab for completion API call
- Verify teamId is in request body

### Issue: "Cannot read properties of undefined (reading 'count')"
**Solution**:
- Restart dev server
- Regenerate Prisma: `cd packages/db && pnpm db:generate`

## Success Criteria

✅ Can create, edit, delete teams  
✅ Can set default team  
✅ Team selector appears on quiz intro (premium only)  
✅ Can select team before playing quiz  
✅ Completions save with teamId  
✅ Each team tracks its own quiz completions  
✅ Can play same quiz multiple times with different teams  
✅ Team limit enforced (max 10)  
✅ Duplicate names prevented  

## Next Steps After Testing

Once testing is complete:
1. Report any bugs or issues
2. Proceed to Phase 4: Stats Integration
3. Enhance quiz cards to show team-specific scores
