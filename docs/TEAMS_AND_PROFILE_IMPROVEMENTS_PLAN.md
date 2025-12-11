# Teams/Classes Feature & Profile Improvements Plan

## Overview

This document outlines the plan for implementing:
1. **Email/Display Name Changes** - Best practices for user profile updates
2. **Teams/Classes Feature** - Premium feature allowing users to create multiple teams/classes
3. **PDF Button in Presentation Mode** - Add print PDF button to round intro splash screen

---

## Part 1: Email & Display Name Changes

### Best Practices

#### Email Changes
**Security Considerations:**
- Email is used for authentication (NextAuth)
- Must verify new email before changing
- Prevent email conflicts
- Update NextAuth account record
- Send verification email to new address
- Keep old email for recovery period (optional)

**Implementation:**
1. **API Endpoint**: `PUT /api/user/profile/email`
   - Check if new email already exists
   - Generate verification token
   - Send verification email
   - Return success (email change pending verification)

2. **Verification Endpoint**: `POST /api/user/profile/verify-email`
   - Verify token
   - Update email in User table
   - Update NextAuth account (if using email provider)
   - Invalidate sessions (force re-login)

3. **UI Flow:**
   - Show "Change Email" button in account settings
   - Modal with new email input + current password
   - Show "Verification email sent" message
   - Link in email → verify → email updated

#### Display Name Changes
**Simpler Implementation:**
- No verification needed
- Just update User.name field
- Validate: 1-50 characters, no special restrictions
- Update immediately

**Implementation:**
1. **API Endpoint**: `PUT /api/user/profile` (extend existing)
   - Add `name` field to UpdateProfileSchema
   - Update User.name
   - Return updated profile

2. **UI:**
   - Make name field editable in AccountTab
   - Remove "cannot be changed" message
   - Add save button

---

## Part 2: Teams/Classes Feature

### Concept

**Core Idea:**
- Premium users can create multiple "Teams" (classes)
- Each team has a name (e.g., "Year 7A", "Year 8B", "Period 3")
- When playing a quiz, user selects which team they're playing as
- Stats are tracked per team
- Users can compare stats across their teams
- Quiz cards show best score per team

**Use Cases:**
- Teacher teaches multiple classes → create team per class
- Teacher runs same quiz with different classes → compare performance
- Student in multiple classes → track progress per class

### Database Schema Changes

#### New Model: `Team`
```prisma
model Team {
  id              String   @id @default(cuid())
  userId          String   // Owner of the team
  name            String   // e.g., "Year 7A", "Period 3"
  color           String?  // Optional color for UI
  isDefault       Boolean  @default(false) // One default team per user
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  quizCompletions QuizCompletion[]
  
  @@unique([userId, name]) // Unique team name per user
  @@index([userId])
  @@map("teams")
}
```

#### Update `QuizCompletion` Model
```prisma
model QuizCompletion {
  // ... existing fields ...
  teamId          String?  // Nullable - for backward compatibility
  team            Team?     @relation(fields: [teamId], references: [id], onDelete: SetNull)
  
  // Update unique constraint: one completion per user+quiz+team
  @@unique([userId, quizSlug, teamId]) // teamId can be null
  @@index([teamId])
}
```

#### Migration Strategy
1. Create `teams` table
2. Add `teamId` to `quiz_completions` (nullable)
3. Migrate existing `teamName` from User → create default Team for each user
4. Update indexes
5. Add constraints

### Feature Limits

**Premium Users:**
- Maximum 10 teams per user
- Can create/delete teams
- Can rename teams
- Can set default team

**Free Users:**
- No teams feature (or limit to 1 team)
- Use existing `teamName` field for backward compatibility

### UI/UX Flow

#### 1. Team Management (Account Settings)
- New "Teams" tab in account settings
- List of teams with:
  - Team name
  - Color indicator
  - "Default" badge
  - Quiz count
  - Actions: Edit, Delete, Set as Default
- "Create Team" button
- Show limit: "X of 10 teams"

#### 2. Team Selection (Quiz Start)
- **Before Quiz Starts:**
  - Show team selector dropdown
  - Default to user's default team
  - Show "Create New Team" option
  - Only show for premium users
  - Store selection in session/localStorage

#### 3. Quiz Player Integration
- Pass `teamId` when saving completion
- No UI changes needed during quiz play
- Team selection happens before quiz starts

#### 4. Stats Dashboard
- Add team filter dropdown
- "All Teams" option (aggregate)
- Per-team stats view
- Comparison view (side-by-side)
- Team-specific leaderboards

#### 5. Quiz Cards
- Show "Best Score" per team
- Team selector on card (if multiple teams)
- Show which team achieved the score
- "Play as [Team Name]" button

### Implementation Phases

#### Phase 1: Database & API
1. Create migration for Team model
2. Add teamId to QuizCompletion
3. Create API endpoints:
   - `GET /api/user/teams` - List user's teams
   - `POST /api/user/teams` - Create team
   - `PUT /api/user/teams/[id]` - Update team
   - `DELETE /api/user/teams/[id]` - Delete team
   - `POST /api/user/teams/[id]/set-default` - Set default
4. Update QuizCompletion API to accept teamId

#### Phase 2: Team Management UI
1. Create TeamsTab component
2. Add to Account settings
3. Team CRUD operations
4. Team selection component

#### Phase 3: Quiz Integration
1. Add team selector to quiz intro page
2. Pass teamId through quiz flow
3. Update completion API calls
4. Update quiz cards to show team-specific scores

#### Phase 4: Stats Integration
1. Add team filter to stats page
2. Update stats queries to filter by team
3. Add comparison view
4. Update leaderboards

#### Phase 5: Migration & Cleanup
1. Migrate existing teamName → Teams
2. Update all quiz completion queries
3. Remove teamName field (or keep for backward compat)
4. Update documentation

### Edge Cases & Considerations

**Quiz Cards:**
- Show best score per team (not just overall)
- If user has 3 teams, show 3 scores (or best of all)
- Add team badge/indicator
- "Play as different team" option

**Stats:**
- Aggregate view (all teams combined)
- Per-team view
- Comparison view (side-by-side charts)
- Team-specific leaderboards

**Backward Compatibility:**
- Keep `teamName` field for free users
- Migrate to Teams model for premium users
- Handle null teamId in queries (legacy completions)

**Limits:**
- Max 10 teams per premium user
- Max team name length: 50 characters
- Prevent duplicate team names per user
- Can't delete team if it has completions (or soft delete)

---

## Part 3: PDF Button in Presentation Mode

### Location
Add PDF download button to **Round Intro splash screen** in presenter mode.

### Implementation
1. **RoundIntro Component** (`QuestionArea.tsx`)
   - Add PDF button next to "Let's go!" button
   - Only show for premium users
   - Only show in presenter mode
   - Button should link to `/api/quizzes/[slug]/pdf` or `/api/admin/quizzes/[id]/pdf`

2. **Props Needed:**
   - `quizSlug` or `quizId`
   - `isPremium` flag
   - `isPresenterMode` flag

3. **Button Design:**
   - Icon: FileText or Download
   - Text: "Download PDF" or "Print Quiz"
   - Position: Below "Let's go!" button or side-by-side
   - Style: Match presenter mode aesthetic

---

## Implementation Priority

### Phase 1: Quick Wins
1. ✅ Add PDF button to round intro (15 min)
2. Enable display name editing (30 min)
3. Email change API structure (1 hour)

### Phase 2: Teams Foundation
1. Database migration for Teams (2 hours)
2. Team CRUD API endpoints (3 hours)
3. Team management UI (4 hours)

### Phase 3: Quiz Integration
1. Team selector in quiz flow (2 hours)
2. Update completion API (1 hour)
3. Update quiz cards (3 hours)

### Phase 4: Stats Integration
1. Team filter in stats (2 hours)
2. Comparison views (4 hours)
3. Team-specific leaderboards (3 hours)

### Phase 5: Polish & Migration
1. Migrate existing data (1 hour)
2. Update all queries (2 hours)
3. Testing & documentation (2 hours)

---

## Technical Considerations

### Email Change Security
- Use secure tokens (crypto.randomBytes)
- Token expiry: 24 hours
- Rate limiting: Max 3 email change requests per day
- Log email changes for audit

### Teams Performance
- Index on `userId` and `teamId`
- Cache user's teams in session
- Optimize stats queries with team filters
- Consider denormalization for quiz card scores

### Migration Strategy
- Create Teams table
- Migrate teamName → Teams (one per user as default)
- Add teamId to QuizCompletion (nullable)
- Update queries gradually
- Keep teamName for backward compatibility initially

---

## Questions to Consider

1. **Team Limits:**
   - 10 teams enough? Should it scale with subscription tier?
   - Should org admins get more teams?

2. **Team Deletion:**
   - Hard delete or soft delete?
   - What happens to completions? (Keep with teamId = null?)

3. **Default Team:**
   - Auto-create on first team creation?
   - Can user have no default team?

4. **Quiz Cards:**
   - Show all team scores or just best?
   - How to handle 10+ teams? (Dropdown?)

5. **Stats Comparison:**
   - Side-by-side charts?
   - Overlay comparison?
   - Export comparison data?

---

## Next Steps

1. Review and approve plan
2. Start with PDF button (quick win)
3. Implement email/name changes
4. Begin Teams feature implementation
5. Test thoroughly before release
