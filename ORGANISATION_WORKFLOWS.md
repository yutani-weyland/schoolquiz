# Organisation System - Workflow Walkthrough

## Overview

This document provides step-by-step walkthroughs for key user workflows in the organisation system.

---

## 1. Organisation Owner Workflow

### Scenario: School purchases organisation licence and sets up system

#### Step 1: Create Organisation
1. Owner signs up/logs in
2. Navigate to `/admin/organisation/new` (to be implemented)
3. Enter:
   - Organisation name: "St Augustine's College"
   - Email domain: "staug.nsw.edu.au"
   - Number of seats: 30
   - Plan: Annual (aligned to school year)
4. Complete Stripe checkout
5. Organisation created with `status: ACTIVE`, `maxSeats: 30`

#### Step 2: Invite Staff Members
1. Navigate to `/admin/organisation/[org-id]`
2. Click "Members" tab
3. Click "Invite Member"
4. Enter email: `teacher@staug.nsw.edu.au`
5. Select role: `TEACHER` (or `ADMIN`)
6. System:
   - Validates email domain matches `staug.nsw.edu.au`
   - Checks available seats
   - Creates `OrganisationMember` with `status: PENDING`
   - Assigns seat if available (`seatAssignedAt` set, `status: ACTIVE`)
   - Sends invite email (to be implemented)
   - Logs activity: `INVITE_SENT`

#### Step 3: Create Organisation-Wide Leaderboard
1. Click "Leaderboards" tab
2. Click "Create Leaderboard"
3. Enter:
   - Name: "School Championship"
   - Description: "All-school competition"
   - Visibility: `ORG_WIDE`
4. System:
   - Creates leaderboard with `visibility: ORG_WIDE`
   - Visible to all org members (they can join/leave)
   - Logs activity: `LEADERBOARD_CREATED`

#### Step 4: Manage Seats
- View seat usage in Overview tab: "23 / 30 seats used"
- When teacher leaves:
  - Remove member → soft delete (`deletedAt` set)
  - Seat released (`seatReleasedAt` set)
  - Seat becomes available for new invite
  - Historical data preserved

---

## 2. Head of House / Faculty Workflow

### Scenario: Head of House creates house-based leaderboard

#### Step 1: Create Group
1. Admin/Head navigates to `/admin/organisation/[org-id]`
2. Click "Groups" tab
3. Click "Create Group"
4. Enter:
   - Name: "House Brennan"
   - Type: `HOUSE`
   - Description: "Brennan House members"
5. System creates `OrganisationGroup`

#### Step 2: Add Members to Group
1. In Groups tab, click on "House Brennan"
2. Click "Add Members"
3. Select teachers from organisation members list
4. System creates `OrganisationGroupMember` entries

#### Step 3: Create Group Leaderboard
1. Click "Leaderboards" tab
2. Click "Create Leaderboard"
3. Enter:
   - Name: "House Brennan Championship"
   - Visibility: `GROUP`
   - Group: Select "House Brennan"
4. System:
   - Creates leaderboard linked to group
   - Visible only to group members
   - Group members see it automatically (can leave if desired)

---

## 3. Teacher Workflow

### Scenario: Teacher joins organisation and participates in leaderboards

#### Step 1: Accept Invite
1. Teacher receives email invite
2. Clicks invite link (to be implemented)
3. If new user: creates account
4. If existing: links to organisation
5. `OrganisationMember` status changes: `PENDING` → `ACTIVE`

#### Step 2: View "My Leaderboards"
1. Navigate to `/leaderboards` (to be implemented)
2. See three sections:
   - **Organisation-wide**: All org leaderboards (can join/leave)
   - **Group**: Leaderboards for groups teacher belongs to
   - **Ad-hoc**: Cross-school leaderboards teacher created or was invited to

#### Step 3: Join Organisation-Wide Leaderboard
1. In "Organisation-wide" section, see "School Championship"
2. Click "Join" button
3. System:
   - Creates `LeaderboardMember` entry
   - Teacher now appears in leaderboard
   - Framer Motion animation: button changes to "Leave"

#### Step 4: Mute Organisation-Wide Leaderboard
1. For org-wide boards, can click "Mute" instead of "Leave"
2. Board hidden from default view but still accessible
3. `LeaderboardMember.muted = true`

#### Step 5: Create Ad-Hoc Leaderboard
1. Click "Create Ad-Hoc Leaderboard"
2. Enter:
   - Name: "Maths Teachers Network"
   - Description: "Cross-school maths teacher competition"
   - Visibility: `AD_HOC`
3. System:
   - Creates leaderboard with `organisationId: null`
   - Teacher can invite other subscribed teachers by email
   - Never appears in public directory

#### Step 6: Leave Organisation
- If teacher leaves org:
  - `OrganisationMember` soft-deleted (`deletedAt` set)
  - Seat released
  - Historical leaderboard data preserved
  - Can join another org or continue on individual plan

---

## 4. Subscription Expiry Workflow

### Scenario: Organisation subscription expires

#### Expiry Process
1. Stripe webhook received → `status: EXPIRED`
2. `currentPeriodEnd` set to expiry date
3. Optional `gracePeriodEnd` set (e.g., 7 days)

#### During Grace Period
- Teachers see banner: "Subscription expired. Renew by [date]"
- Full functionality maintained
- Can still create leaderboards, invite members

#### After Grace Period
- Banner: "Subscription expired. Limited to read-only access."
- Restrictions:
  - ❌ Cannot create new leaderboards
  - ❌ Cannot invite new members
  - ❌ Cannot start new quizzes (if paid feature)
  - ✅ Can view historical data
  - ✅ Can view existing leaderboards (read-only)

#### Renewal
1. Owner navigates to billing settings
2. Updates payment method / renews subscription
3. Stripe webhook → `status: ACTIVE`
4. Full functionality restored

---

## 5. Permission Matrix

| Action | OWNER | ADMIN | TEACHER | BILLING_ADMIN |
|--------|-------|-------|---------|---------------|
| View organisation | ✅ | ✅ | ✅ | ✅ |
| Update org settings | ✅ | ❌ | ❌ | ❌ |
| Invite members | ✅ | ✅ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ❌ | ❌ |
| Change member roles | ✅ | ✅ | ❌ | ❌ |
| Manage seats | ✅ | ❌ | ❌ | ❌ |
| View billing | ✅ | ❌ | ❌ | ✅ |
| Manage billing | ✅ | ❌ | ❌ | ❌ |
| Create groups | ✅ | ✅ | ❌ | ❌ |
| Create org leaderboards | ✅ | ✅ | ❌ | ❌ |
| Create ad-hoc leaderboards | ✅ | ✅ | ✅ | ❌ |
| Join/leave leaderboards | ✅ | ✅ | ✅ | ✅ |

---

## 6. Data Preservation

### When Teacher Leaves Org
- `OrganisationMember.deletedAt` set (soft delete)
- `seatReleasedAt` set
- Historical data preserved:
  - Quiz runs remain linked to teacher
  - Leaderboard scores remain visible
  - Activity logs preserved

### When Organisation Expires
- All data preserved
- Read-only access maintained
- Can renew and restore full access

### When Leaderboard Deleted
- `Leaderboard.deletedAt` set (soft delete)
- Historical scores preserved
- Members can still see past performance

---

## 7. API Usage Examples

### Get Organisation Details
```typescript
GET /api/organisation/[org-id]
Response: {
  organisation: { ... },
  seats: { total: 30, used: 23, available: 7 }
}
```

### Invite Member
```typescript
POST /api/organisation/[org-id]/members
Body: { email: "teacher@staug.nsw.edu.au", role: "TEACHER" }
Response: { member: { ... } }
```

### Join Leaderboard
```typescript
POST /api/leaderboards/[leaderboard-id]/join
Response: { member: { ... } }
```

### Get My Leaderboards
```typescript
GET /api/my-leaderboards
Response: {
  orgWide: [...],
  group: [...],
  adHoc: [...]
}
```

---

## 8. Edge Cases Handled

1. **Email Domain Mismatch**: Invite rejected if email doesn't match org domain
2. **No Available Seats**: Invite fails with clear error message
3. **Duplicate Invite**: Returns existing member if already invited
4. **Owner Removal**: Prevented (cannot remove owner)
5. **Expired Subscription**: Read-only mode with clear banners
6. **Cross-School Leaderboards**: Ad-hoc boards allow any subscribed teacher
7. **Group Membership**: Auto-visible leaderboards for group members
8. **Soft Deletes**: All deletions preserve historical data

---

## Next Steps for Full Implementation

1. **Email System**: Integrate email service for invites
2. **Stripe Webhooks**: Handle subscription updates
3. **Teacher Dashboard**: Complete `/leaderboards` page
4. **Group Management UI**: Finish groups tab
5. **Leaderboard Management UI**: Finish leaderboards tab
6. **Migration Script**: Migrate existing Teacher → User data
7. **Testing**: Comprehensive test suite for permissions and flows

