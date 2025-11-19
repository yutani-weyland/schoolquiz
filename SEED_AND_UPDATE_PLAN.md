# Seed Database & Update Admin CRUD - Implementation Plan

## ✅ Completed
1. Created seed API route at `/api/admin/seed-quizzes`
2. Database connection working

## 📋 Next Steps

### Step 1: Seed Database
```bash
# Start the admin app
cd apps/admin
pnpm dev

# In another terminal, seed the database
curl -X POST http://localhost:3007/api/admin/seed-quizzes
```

### Step 2: Update Admin API Routes
- Update `GET /api/admin/quizzes` to query database
- Update `GET /api/admin/quizzes/[id]` to query database  
- Update `PATCH /api/admin/quizzes/[id]` to update database
- Keep fallback to dummy data if database unavailable

### Step 3: Update Create Quiz Page
- Update `saveQuiz` function to POST to API
- Create API route `POST /api/admin/quizzes` to save to database
- Use transformers to convert component format to Prisma format

### Step 4: Test
- Test quiz play page with database data
- Test admin CRUD operations
- Verify everything works end-to-end

## Files to Update
1. `apps/admin/src/app/api/admin/quizzes/route.ts` - GET and POST
2. `apps/admin/src/app/api/admin/quizzes/[id]/route.ts` - GET and PATCH
3. `apps/admin/src/app/create-quiz/page.tsx` - saveQuiz function
4. Create `apps/admin/src/services/quizAdminService.ts` - Admin CRUD service

