# Next Steps Guide - Database Integration

## Option A: Set Up Database Now (Recommended for Production)

### Step 1: Choose Your Database Provider

**Option 1: Supabase (Easiest - Free Tier Available)**
1. Go to https://supabase.com
2. Sign up/login
3. Create a new project
4. Wait ~2 minutes for setup
5. Go to Project Settings > Database
6. Copy the "Connection string" (under Connection pooling)

**Option 2: Local PostgreSQL**
```bash
# macOS
brew install postgresql
brew services start postgresql
createdb schoolquiz
```

**Option 3: Docker (Quick Test)**
```bash
docker run --name schoolquiz-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=schoolquiz \
  -p 5432:5432 \
  -d postgres:15
```

### Step 2: Configure Environment Variables

Create `.env.local` in the **root** of the project:

```bash
# Database connection
DATABASE_URL="postgresql://user:password@host:port/database"

# Optional: Use mock data as fallback (set to 'true' to enable)
USE_MOCK_DATA="true"
```

**For Supabase**, your DATABASE_URL will look like:
```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres"
```

### Step 3: Run Migration

```bash
cd packages/db
pnpm db:migrate
# or if migration already exists:
npx prisma migrate deploy
```

### Step 4: Generate Prisma Client

```bash
cd packages/db
pnpm db:generate
```

### Step 5: Test Connection

```bash
cd packages/db
pnpm test
```

---

## Option B: Continue with Mock Data (Development)

You can proceed with Phase 2 implementation **without** a database. The code will:
- Try to query database if `DATABASE_URL` is set
- Automatically fall back to mock data if database is unavailable
- Use mock data exclusively if `USE_MOCK_DATA=true`

This allows you to:
- Develop and test the integration code
- Switch to database later without code changes
- Work offline or without database setup

---

## Phase 2: Update QuizService (Next Implementation Step)

We'll update `QuizService.getQuizBySlug()` to:
1. Try database first (if `DATABASE_URL` is set)
2. Fall back to mock data (if database unavailable or `USE_MOCK_DATA=true`)
3. Throw error only if both fail

This gives you flexibility to work with or without a database.

---

## Quick Start (No Database Setup)

If you want to proceed with implementation now:

1. **Set USE_MOCK_DATA flag** (optional):
   ```bash
   # In .env.local (create if doesn't exist)
   USE_MOCK_DATA=true
   ```

2. **Proceed with Phase 2** - I'll update QuizService to support both modes

3. **Test with mock data** - Everything will work as before

4. **Add database later** - Just set `DATABASE_URL` and it will automatically switch

---

## What We'll Implement Next

1. ✅ Update `QuizService.getQuizBySlug()` to query database
2. ✅ Add proper error handling and fallback
3. ✅ Update API route to use QuizService
4. ✅ Test with mock data first
5. ✅ Test with database when ready

Ready to proceed? Let me know if you want to:
- **A)** Set up database first (I'll guide you)
- **B)** Continue with implementation (mock data fallback)

