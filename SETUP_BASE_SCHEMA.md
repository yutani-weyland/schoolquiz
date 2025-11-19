# Setup Base Database Schema

## Issue
The database is missing the base tables (schools, teachers, categories, etc.). We need to create these before seeding quizzes.

## Solution: Run Complete Schema Setup

### Step 1: Go to Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**

### Step 2: Run the Complete Schema SQL

Copy and paste the entire contents of `COMPLETE_SCHEMA_SETUP.sql` into the SQL Editor and click **Run**.

This will create:
- ✅ Schools table
- ✅ Teachers table  
- ✅ Categories table
- ✅ Questions table
- ✅ Quizzes table (with slug and weekISO)
- ✅ Rounds table
- ✅ Quiz Round Questions table
- ✅ Runs table
- ✅ Run Question Stats table
- ✅ Users table
- ✅ User Question Submissions table
- ✅ All necessary indexes

### Step 3: Verify

After running, you should see "Success. No rows returned" or similar.

### Step 4: Seed Quizzes

Once the schema is set up, run the seed command:

```bash
curl -X POST http://localhost:3001/api/admin/seed-quizzes
```

You should see:
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

## What This Does

This creates all the base tables needed for the quiz app. The seed script will then:
1. Create a default school and teacher (if they don't exist)
2. Create a default category (if it doesn't exist)
3. Create quizzes, rounds, and questions from the mock fixtures

## After Setup

Once both are complete:
- ✅ Database schema ready
- ✅ Quiz data seeded
- ✅ Ready to test quiz play page
- ✅ Ready to update admin CRUD

