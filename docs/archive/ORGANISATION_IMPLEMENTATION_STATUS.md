# Organisation System Implementation - Summary

## ✅ Completed

### 1. Database Schema
- Extended Prisma schema with:
  - `User` model (unified identity)
  - `Organisation` model (with licensing fields)
  - `OrganisationMember` model (role-based membership)
  - `OrganisationGroup` model (houses, faculties, year groups)
  - `Leaderboard` model (org-wide, group, ad-hoc)
  - `LeaderboardMember` model (join/leave tracking)
  - `OrganisationActivity` model (audit logging)

### 2. Permission System
- Created `packages/db/src/permissions.ts` with:
  - `getOrganisationContext()` - Get user's org membership context
  - `hasPermission()` - Check role-based permissions
  - `isSubscriptionActive()` - Check subscription status
  - `canWrite()` - Check if user can perform write operations
  - `getAvailableSeats()` - Calculate seat usage
  - `requirePermission()` - Throw error if permission denied

### 3. Activity Logging
- Created `packages/db/src/activity.ts` with:
  - `logOrganisationActivity()` - Log key actions

### 4. API Routes
Created comprehensive API routes:
- `GET/POST /api/organisation/:id` - Organisation details
- `GET/POST /api/organisation/:id/members` - List/invite members
- `PATCH/DELETE /api/organisation/:id/members/:memberId` - Update/remove members
- `GET/POST /api/organisation/:id/groups` - List/create groups
- `POST/DELETE /api/organisation/:id/groups/:groupId/members` - Manage group members
- `GET/POST /api/organisation/:id/leaderboards` - List/create leaderboards
- `GET /api/my-leaderboards` - Get user's leaderboards
- `POST /api/leaderboards/:id/join` - Join leaderboard
- `POST /api/leaderboards/:id/leave` - Leave/mute leaderboard
- `DELETE /api/leaderboards/:id` - Delete leaderboard

### 5. UI Components
- Created Organisation Admin page (`/admin/organisation/[id]`) with:
  - Overview tab (licence usage, subscription status, plan info)
  - Members tab (list, invite modal)
  - Groups tab (placeholder)
  - Leaderboards tab (placeholder)

## 🔄 In Progress / Next Steps

### 6. Complete UI Components
- [ ] Finish Groups tab (create/edit groups, manage members)
- [ ] Finish Leaderboards tab (create/edit, manage visibility)
- [ ] Create Teacher "My Leaderboards" page (`/leaderboards`)
- [ ] Add join/leave buttons with Framer Motion animations
- [ ] Add status banners for subscription states

### 7. Database Migration
- [ ] Run Prisma migration: `npx prisma migrate dev --name add_organisation_system`
- [ ] Or apply SQL migration manually if using Supabase

### 8. Integration Points
- [ ] Update NextAuth session to include organisation context
- [ ] Add organisation selector if user belongs to multiple orgs
- [ ] Integrate Stripe webhooks for subscription updates
- [ ] Add email notifications for invites

### 9. Testing
- [ ] Test permission checks
- [ ] Test seat assignment/release
- [ ] Test leaderboard join/leave flows
- [ ] Test subscription expiry handling

## 📋 Key Features Implemented

### Permission Model
- **OWNER**: Full control (settings, billing, seats, members, groups, leaderboards)
- **ADMIN**: Member management, groups, leaderboards (no billing)
- **TEACHER**: View org, create ad-hoc leaderboards
- **BILLING_ADMIN**: View billing, manage payment (no content changes)

### Seat Management
- Seats are "named seats" tied to `OrganisationMember`
- When member leaves: soft delete, release seat, preserve history
- Seat count tracked via `seatAssignedAt` / `seatReleasedAt`

### Subscription Lifecycle
- **ACTIVE/TRIALING**: Full functionality
- **PAST_DUE/EXPIRED**: Read-only (with grace period support)
- **CANCELLED**: Read-only with cancellation banner

### Leaderboard Types
- **ORG_WIDE**: Visible to all org members, opt-in join
- **GROUP**: Tied to specific group (house/faculty/year), auto-visible to group members
- **AD_HOC**: Cross-school, invite-only

## 🎨 Design Patterns Used

- **Pill buttons**: `rounded-full` for actions
- **Framer Motion**: Subtle animations (`springs.micro`)
- **Radix UI**: Tabs, modals, tooltips
- **Tailwind CSS**: Consistent spacing, dark mode support
- **Status badges**: Color-coded with icons

## 📝 Notes

- User model created but Teacher model still exists for backward compatibility
- Migration path: Gradually migrate Teacher → User relationships
- Activity logging is lightweight (JSON metadata field)
- Feature flags stored as JSON string on Organisation model

## 🚀 Usage Examples

### Create Organisation
```typescript
const org = await prisma.organisation.create({
  data: {
    name: "St Augustine's College",
    emailDomain: "staug.nsw.edu.au",
    ownerUserId: user.id,
    maxSeats: 30,
    plan: "ORG_ANNUAL",
    status: "ACTIVE",
  },
});
```

### Invite Member
```typescript
// POST /api/organisation/:id/members
{
  email: "teacher@staug.nsw.edu.au",
  role: "TEACHER"
}
```

### Join Leaderboard
```typescript
// POST /api/leaderboards/:id/join
// Automatically handles permissions and membership
```

## 🔗 Related Files

- Schema: `packages/db/prisma/schema.prisma`
- Permissions: `packages/db/src/permissions.ts`
- Activity: `packages/db/src/activity.ts`
- Auth: `apps/admin/src/lib/auth.ts`
- API Routes: `apps/admin/src/app/api/organisation/**`
- UI: `apps/admin/src/app/admin/organisation/[id]/page.tsx`

