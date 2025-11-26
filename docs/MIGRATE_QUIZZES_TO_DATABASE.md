# Migrate Quizzes from Hardcoded Data to Database

**Date:** 2025-01-27  
**Status:** ✅ Complete

---

## Summary

Replaced hardcoded quiz data in `apps/admin/src/app/quizzes/page.tsx` with database-backed quizzes. Created a SQL migration to seed 12 test quizzes and updated the code to fetch from the database.

---

## Changes Made

### 1. ✅ Created SQL Migration
**File:** `supabase/migrations/012_seed_official_quizzes.sql`

- Creates default school and teacher if they don't exist
- Inserts 12 official quizzes with all metadata:
  - Quiz IDs: `quiz_seed_1` through `quiz_seed_12`
  - Slugs: `1` through `12`
  - Titles, blurbs, weekISO dates, colors, status
- Uses `ON CONFLICT` to make migration idempotent (safe to run multiple times)

**Key Features:**
- Idempotent: Can run multiple times safely
- Creates required dependencies (school, teacher) automatically
- Uses the same data that was previously hardcoded

---

### 2. ✅ Updated Server Functions
**File:** `apps/admin/src/app/quizzes/quizzes-server.ts`

**Added:**
- `fetchOfficialQuizzes()` function to fetch official quizzes from database
- `OfficialQuiz` interface matching the QuizCard component format
- Handles ID conversion (database string ID → numeric slug ID for compatibility)

**Features:**
- Fetches only published official quizzes
- Orders by `weekISO` (newest first)
- Transforms data to match QuizCard component expectations
- Returns empty array on error (graceful degradation)

---

### 3. ✅ Updated Page Component
**File:** `apps/admin/src/app/quizzes/page.tsx`

**Removed:**
- Hardcoded 135-line quiz array
- Import of `getQuizColor` (colors now come from database)

**Added:**
- `getCachedOfficialQuizzes()` function with 5-minute cache
- Database fetching for official quizzes
- Dynamic redirect using latest quiz slug

**Benefits:**
- Quizzes now stored in database (can be managed via admin)
- Cached for 5 minutes (quizzes change infrequently)
- Single source of truth (no duplication)

---

## Database Schema

The quizzes are stored in the `quizzes` table with:

```sql
- id: TEXT (primary key)
- slug: TEXT (unique, e.g., "1", "2", "12")
- weekISO: TEXT (e.g., "2024-01-15")
- title: TEXT
- blurb: TEXT
- status: TEXT (default: 'draft', we use 'published')
- colorHex: TEXT (hex color code)
- createdBy: TEXT (teacher ID - required)
- quizType: TEXT (default: 'OFFICIAL')
- createdAt, updatedAt: TIMESTAMP
```

---

## Migration Details

### Prerequisites
- Must have `schools` table
- Must have `teachers` table
- Must have `quizzes` table with proper schema

### Running the Migration

**Option 1: Via Supabase Dashboard**
1. Go to Supabase SQL Editor
2. Copy contents of `supabase/migrations/012_seed_official_quizzes.sql`
3. Run the SQL

**Option 2: Via Migration Tool**
```bash
# If using Supabase CLI
supabase migration up

# Or apply directly
psql $DATABASE_URL -f supabase/migrations/012_seed_official_quizzes.sql
```

### Verification

After migration, verify quizzes exist:
```sql
SELECT slug, title, status, "weekISO"
FROM quizzes
WHERE "quizType" = 'OFFICIAL'
ORDER BY "weekISO" DESC;
```

Should return 12 quizzes with slugs '1' through '12'.

---

## Code Changes

### Before
```typescript
// Hardcoded array
const quizzes: Quiz[] = [
  { id: 12, slug: "12", title: "...", ... },
  { id: 11, slug: "11", title: "...", ... },
  // ... 10 more
]

export default async function QuizzesPage() {
  const pageData = await getQuizzesPageData()
  return <QuizzesClient initialData={pageData} quizzes={quizzes} />
}
```

### After
```typescript
async function getCachedOfficialQuizzes(): Promise<Quiz[]> {
  return unstable_cache(
    async () => await fetchOfficialQuizzes(),
    ['official-quizzes'],
    { revalidate: 300 }
  )()
}

export default async function QuizzesPage() {
  const quizzes = await getCachedOfficialQuizzes()
  const pageData = await getQuizzesPageData()
  return <QuizzesClient initialData={pageData} quizzes={quizzes} />
}
```

---

## Testing Checklist

- [ ] Run migration successfully
- [ ] Verify 12 quizzes exist in database
- [ ] Visit `/quizzes` page - should load quizzes from database
- [ ] Check that quiz cards display correctly
- [ ] Verify quiz colors come from database
- [ ] Test pagination/lazy loading still works
- [ ] Test with user who has completions
- [ ] Test redirect for non-logged-in users (should use latest quiz slug)

---

## Benefits

1. **Single Source of Truth**
   - Quizzes managed in database, not hardcoded
   - Can be updated via admin interface
   - No code changes needed to add/modify quizzes

2. **Better Performance**
   - Cached for 5 minutes (quizzes change infrequently)
   - Only fetches published quizzes
   - Database indexes for fast queries

3. **Maintainability**
   - Removed 135 lines of hardcoded data
   - Easier to add new quizzes (just insert into database)
   - No need to deploy code for quiz updates

4. **Scalability**
   - Can easily add more quizzes
   - Database handles ordering/filtering
   - Supports pagination if needed in future

---

## Future Improvements

1. **Admin Interface**
   - Create UI to manage official quizzes
   - Allow editing titles, blurbs, colors
   - Schedule quiz publication dates

2. **Question Data**
   - Currently only quiz metadata is seeded
   - Could add rounds and questions in future migration

3. **Dynamic Colors**
   - Colors are currently hardcoded in migration
   - Could generate colors dynamically based on quiz ID

---

## Rollback Plan

If issues occur, can temporarily revert to hardcoded data by:
1. Restoring the `quizzes` array in `page.tsx`
2. Commenting out database fetch
3. Re-running migration to fix database issues

However, migration is idempotent and should be safe to run.

---

## Notes

- Quiz IDs in database are strings (CUIDs), but QuizCard expects numeric IDs
- Solution: Use slug (which is numeric) as the ID for compatibility
- This maintains backward compatibility with existing QuizCard component
- Future: Could refactor QuizCard to accept string IDs

---

**Migration Status:** Ready to run  
**Code Status:** ✅ Complete  
**Testing Status:** ⏳ Pending user verification

