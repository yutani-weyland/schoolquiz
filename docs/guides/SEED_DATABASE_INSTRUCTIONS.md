# How to Seed the Database

## Step 1: Start the Admin Server

In one terminal, start the admin app:

```bash
cd apps/admin
pnpm dev
```

Wait for the server to start (you'll see "Ready" message).

## Step 2: Seed the Database

In another terminal (or the same one if you background the server), run:

```bash
curl -X POST http://localhost:3007/api/admin/seed-quizzes
```

You should see a JSON response like:

```json
{
  "success": true,
  "message": "Quiz seeding completed",
  "results": {
    "created": 5,
    "skipped": 0,
    "errors": []
  }
}
```

## Step 3: Verify

Check the database to see if quizzes were created:

```bash
cd packages/db
pnpm test
```

Or check in Supabase dashboard → Table Editor → quizzes

## What Gets Seeded

- Quiz slugs: "12", "279", "11", "10", "demo"
- All rounds and questions for each quiz
- Default school, teacher, and category if they don't exist

## Troubleshooting

- **Server not running**: Make sure `pnpm dev` is running in `apps/admin`
- **Connection error**: Check that `DATABASE_URL` is set in `.env.local`
- **Already exists**: If quizzes already exist, they'll be skipped (that's okay!)

