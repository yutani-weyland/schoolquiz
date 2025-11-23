# Admin Access Setup

Since you're the only site admin, here are the easiest ways to access the admin section:

## Option 1: Skip Auth in Development (Easiest) ⭐

Add this to your `.env.local` file:

```bash
SKIP_ADMIN_AUTH=true
```

Then restart your dev server. This will bypass all admin checks in development.

**Note:** This only works in development (`NODE_ENV !== 'production'`).

---

## Option 2: Auto-Create Admin (Recommended)

I've updated `requireAdmin` to automatically create an admin user if none exists in development.

**Just try accessing `/admin` - it will create an admin user automatically!**

The admin user will be:
- Email: `admin@schoolquiz.com`
- Name: `Platform Admin`
- Role: `PlatformAdmin`

---

## Option 3: Create Admin via SQL

Run this in Supabase SQL Editor:

```sql
-- See CREATE_ADMIN_USER.sql for the full script
```

Or run the setup API endpoint:

```bash
curl -X POST http://localhost:3000/api/admin/setup
```

---

## Option 4: Set Environment Variable

Add to `.env.local`:

```bash
# Allow admin fallback (creates admin if none exists)
ALLOW_ADMIN_FALLBACK=true
```

---

## Quick Test

1. **Try accessing `/admin` directly** - it should work now with the auto-create logic
2. If it doesn't work, add `SKIP_ADMIN_AUTH=true` to `.env.local`
3. Restart your dev server

The admin section should now be accessible!

