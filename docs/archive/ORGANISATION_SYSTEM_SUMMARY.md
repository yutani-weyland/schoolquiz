# Organisation System Implementation Summary

## Current State Analysis

### Database Schema
- **Prisma Schema** (`packages/db/prisma/schema.prisma`):
  - Uses `School` and `Teacher` models
  - `Teacher` has `schoolId`, `email`, `name`, `role` (admin/editor/teacher/viewer)
  - No unified `User` model yet
  - No subscription/billing models
  - No leaderboard models

- **Supabase Migrations** (`supabase/migrations/`):
  - Has `organisations` and `user_organisation` tables
  - Uses Supabase auth (`auth.users`)
  - Has `classes` table for organisation groups

### Authentication
- NextAuth with email provider
- Session includes `schoolId` and `schoolName`
- Uses `Teacher` model from Prisma

### UI Components
- Shared UI package: `Button`, `Card` components
- Uses Framer Motion for animations (`springs.micro`, `motionPreset`)
- Design system: Tailwind CSS, pill buttons (rounded-full)
- DataTable component exists for admin tables

### API Structure
- Next.js App Router API routes (`/api/questions`, `/api/quizzes`, `/api/analytics`)
- Uses Supabase client for data access
- No server actions pattern yet

## Migration Strategy

### Phase 1: Schema Extension
1. **Unified User Model**: Create `User` model that can replace `Teacher` gradually
2. **Organisation Model**: Add licensing fields, Stripe integration, subscription status
3. **OrganisationMember**: Role-based membership with seat tracking
4. **OrganisationGroup**: Houses, faculties, year groups
5. **Leaderboard**: Org-wide, group-based, and ad-hoc leaderboards
6. **Activity Logging**: Lightweight audit trail

### Phase 2: Backend Logic
1. Permission utilities for role checking
2. Seat management (assign/release)
3. Subscription status enforcement
4. API routes for CRUD operations

### Phase 3: Frontend
1. Organisation Admin Panel (`/admin/organisation`)
2. Teacher Leaderboards Dashboard (`/leaderboards`)
3. Join/Leave leaderboard functionality
4. Status banners for subscription states

## Key Design Decisions

1. **Dual Schema Support**: Keep Prisma schema as primary, but ensure compatibility with Supabase migrations
2. **Soft Deletes**: Use `deletedAt` for preserving history
3. **Seat Model**: Named seats tied to `OrganisationMember` with `seatAssignedAt`/`seatReleasedAt`
4. **Permission Model**: Clear role hierarchy (OWNER > ADMIN > TEACHER > BILLING_ADMIN)
5. **Leaderboard Membership**: Lazy join model (not auto-created for org-wide boards)

## Next Steps

See implementation tasks in TODO list.

