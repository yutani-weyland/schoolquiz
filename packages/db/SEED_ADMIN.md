# Admin Seed Data

This seed script creates example users and organisations for testing the admin interface.

## Prerequisites

1. Make sure you have a valid `DATABASE_URL` set in your environment or `.env.local` file
2. Run the database migration to add the `platformRole` field:
   ```bash
   cd packages/db
   npm run db:migrate
   ```

## Running the Seed Script

```bash
cd packages/db
npm run db:seed:admin
```

## What Gets Created

### Users

1. **Platform Admin**
   - Email: `admin@schoolquiz.com`
   - Role: `PLATFORM_ADMIN`
   - Tier: Premium
   - Status: Active

2. **Organisation Admin**
   - Email: `orgadmin@example.com`
   - Role: `ORG_ADMIN`
   - Tier: Premium
   - Status: Active

3. **Teachers** (4 users)
   - `teacher1@melbournehigh.edu.au` - Premium, Active
   - `teacher2@melbournehigh.edu.au` - Basic, Free Trial
   - `teacher3@sydneygrammar.edu.au` - Premium, Active
   - `teacher4@brisbanegrammar.edu.au` - Basic, Expired

4. **Students** (2 users)
   - `student1@melbournehigh.edu.au`
   - `student2@melbournehigh.edu.au`

5. **Parent** (1 user)
   - `parent1@example.com`

### Organisations

1. **Melbourne High School**
   - Status: ACTIVE
   - Plan: ORG_ANNUAL
   - Seats: 50
   - Members: 4 (Owner, Admin, 2 Students)
   - Groups: 2 (Year 10, Science Faculty)

2. **Sydney Grammar School**
   - Status: ACTIVE
   - Plan: ORG_MONTHLY
   - Seats: 30
   - Members: 1 (Owner)
   - Groups: 1 (Year 11)

3. **Brisbane Grammar School**
   - Status: PAST_DUE
   - Plan: ORG_MONTHLY
   - Seats: 25
   - Members: 1 (Owner)
   - Grace period: 10 days remaining

4. **Trial School**
   - Status: TRIALING
   - Plan: INDIVIDUAL
   - Seats: 10
   - Members: 1 (Owner)

### Activity Logs

The seed script also creates sample activity logs for:
- Member additions
- Role changes
- Leaderboard creation
- Group creation

## Testing the Admin Interface

1. Sign in as the platform admin:
   - Email: `admin@schoolquiz.com`
   - Password: `abc123`
2. Navigate to `/admin/organisations` to see all organisations
3. Navigate to `/admin/users` to see all users
4. Click on any organisation or user to see the detail pages
5. Test role management by changing user roles
6. Test impersonation (currently logs to console)

## Passwords

**All test users use the password: `abc123`**

This is a simple password for testing purposes. The signin route accepts this password for any user in the database.

## Notes

- The seed script uses `upsert` so it's safe to run multiple times
- All users have `emailVerified: true` for easy testing
- Some users have different `lastLoginAt` dates to test filtering
- Organisations have different statuses to test filtering

