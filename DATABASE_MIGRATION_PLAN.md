# Database Migration Plan

## Current State Assessment

### ✅ What's Already Done

1. **Prisma Schema** - Comprehensive schema already exists with:
   - Core models: Quiz, Round, Question, Category
   - User/Organisation system
   - Achievements, Leaderboards, Private Leagues
   - Quiz completions and stats
   - User submissions

2. **Infrastructure Ready**:
   - ✅ Service layer (`quizService.ts`) - abstracted data access
   - ✅ Transformers (`quizTransformers.ts`) - Prisma ↔ Component types
   - ✅ Validation (`quizValidation.ts`) - Zod schemas
   - ✅ Constants (`quiz-constants.ts`) - shared constants
   - ✅ Hooks extracted - clean separation of concerns

3. **Mock Data Centralized**:
   - ✅ `quiz-fixtures.ts` - single source of truth
   - ✅ Easy to replace with DB calls

### ⚠️ Gaps Identified

1. **Quiz Model Missing Fields**:
   - `slug` field (currently using `id` or number-based slugs)
   - `weekISO` / `week_of` field (for weekly quiz scheduling)
   - Need to decide: use `id` as slug or add separate `slug` field

2. **Component vs Prisma Type Mismatches**:
   - Component uses `number` IDs, Prisma uses `string` (CUID)
   - Transformers handle this, but need to ensure consistency

3. **Quiz Metadata**:
   - Component expects `slug`, `weekISO`, `colorHex` on Quiz
   - Prisma has `colorHex` but missing `slug` and `weekISO`

## Migration Strategy

### Phase 1: Schema Updates (1-2 hours)

**Goal**: Ensure Prisma schema matches component needs

1. **Add missing fields to Quiz model**:
   ```prisma
   model Quiz {
     // ... existing fields
     slug      String? @unique // Add slug field
     weekISO   String? // ISO week string (e.g., "2024-01-15")
     // ... rest of fields
   }
   ```

2. **Create migration**:
   ```bash
   npx prisma migrate dev --name add_quiz_slug_and_weekiso
   ```

3. **Update seed script** to populate slugs from existing data

**Branch**: `feature/add-quiz-slug-field`

---

### Phase 2: Read Path - Quiz Play (2-3 hours)

**Goal**: Replace mock data with DB queries for quiz play experience

1. **Update QuizService.getQuizBySlug()**:
   ```typescript
   static async getQuizBySlug(slug: string): Promise<QuizData> {
     // Try database first
     const quiz = await prisma.quiz.findUnique({
       where: { slug },
       include: {
         rounds: {
           include: {
             category: true,
             questions: {
               include: { question: true },
               orderBy: { order: 'asc' }
             }
           },
           orderBy: { index: 'asc' }
         }
       }
     });
     
     if (quiz) {
       return transformQuizToPlayFormat(quiz);
     }
     
     // Fallback to mock data (dev mode)
     if (process.env.USE_MOCK_DATA === 'true') {
       return getMockQuizData(slug);
     }
     
     throw new Error(`Quiz not found: ${slug}`);
   }
   ```

2. **Add environment variable**:
   ```env
   USE_MOCK_DATA=true  # Set to false when DB is ready
   DATABASE_URL=postgresql://...
   ```

3. **Test quiz play page** - ensure it works with DB data

**Branch**: `feature/db-quiz-read-path`

---

### Phase 3: Read Path - Quiz Listings (1-2 hours)

**Goal**: Replace hardcoded quiz list with DB query

1. **Create QuizMetadataService**:
   ```typescript
   // apps/admin/src/services/quizMetadataService.ts
   export class QuizMetadataService {
     static async getPublishedQuizzes(): Promise<QuizMetadata[]> {
       const quizzes = await prisma.quiz.findMany({
         where: { status: 'published' },
         orderBy: { publicationDate: 'desc' },
         select: {
           id, slug, title, blurb, weekISO, colorHex, status
         }
       });
       return quizzes.map(transformQuizToMetadata);
     }
   }
   ```

2. **Update quiz listing pages** to use service

**Branch**: `feature/db-quiz-listings`

---

### Phase 4: Write Path - Quiz Completion (2-3 hours)

**Goal**: Save quiz completions to database

1. **Update QuizSessionService.saveCompletion()**:
   ```typescript
   static async saveCompletion(
     quizSlug: string,
     userId: string,
     completion: QuizCompletion
   ): Promise<void> {
     // Save to localStorage (optimistic)
     // ... existing code ...
     
     // Save to database
     await prisma.quizCompletion.upsert({
       where: {
         userId_quizSlug: { userId, quizSlug }
       },
       create: {
         userId,
         quizSlug,
         score: completion.score,
         totalQuestions: completion.totalQuestions,
         timeSeconds: completion.timeSpent,
         completedAt: new Date(completion.completedAt)
       },
       update: {
         score: completion.score,
         totalQuestions: completion.totalQuestions,
         timeSeconds: completion.timeSpent,
         completedAt: new Date(completion.completedAt)
       }
     });
   }
   ```

2. **Update QuizPlayer** to pass userId to completion service

**Branch**: `feature/db-quiz-completions`

---

### Phase 5: Write Path - Admin CRUD (4-6 hours)

**Goal**: Enable admin to create/edit quizzes in database

1. **Create QuizAdminService**:
   ```typescript
   // apps/admin/src/services/quizAdminService.ts
   export class QuizAdminService {
     static async createQuiz(data: CreateQuizInput): Promise<Quiz> {
       // Validate structure
       const validation = validateQuizStructure(data);
       if (!validation.valid) {
         throw new Error(validation.errors.join(', '));
       }
       
       // Create quiz with rounds and questions
       return prisma.quiz.create({
         data: {
           title: data.title,
           slug: data.slug,
           // ... transform and create
         }
       });
     }
     
     static async updateQuiz(slug: string, data: UpdateQuizInput) { }
     static async deleteQuiz(slug: string) { }
   }
   ```

2. **Update create-quiz page** to use service
3. **Add admin quiz editor** pages

**Branch**: `feature/admin-quiz-crud` (large branch, consider splitting)

---

### Phase 6: Achievements & Progress (2-3 hours)

**Goal**: Move achievement logic to database

1. **Update AchievementService** to query DB
2. **Update useQuizAchievements** to use DB service
3. **Migrate progress tracking** from localStorage to DB

**Branch**: `feature/db-achievements-progress`

---

### Phase 7: Cleanup & Testing (2-3 hours)

**Goal**: Remove mock data fallbacks, add tests

1. **Remove USE_MOCK_DATA flag** (or keep for dev only)
2. **Add integration tests** for core flows
3. **Create seed script** for development data
4. **Update documentation**

**Branch**: `feature/db-cleanup-tests`

---

## Implementation Checklist

### Setup (Do First)
- [ ] Review Prisma schema for missing fields
- [ ] Add `slug` and `weekISO` to Quiz model if needed
- [ ] Run migration: `npx prisma migrate dev`
- [ ] Set up `.env` with `DATABASE_URL`
- [ ] Test Prisma connection: `npx prisma db pull`

### Read Path (Priority 1)
- [ ] Update `QuizService.getQuizBySlug()` to use Prisma
- [ ] Add mock data fallback for development
- [ ] Test quiz play page with DB data
- [ ] Update quiz listings to use DB
- [ ] Test all quiz navigation flows

### Write Path (Priority 2)
- [ ] Implement quiz completion saving
- [ ] Update progress tracking to use DB
- [ ] Test completion flow end-to-end

### Admin CRUD (Priority 3)
- [ ] Create QuizAdminService
- [ ] Update create-quiz page
- [ ] Add edit/delete functionality
- [ ] Test admin workflows

### Achievements (Priority 4)
- [ ] Update AchievementService to use DB
- [ ] Migrate achievement checking logic
- [ ] Test achievement unlocking

### Testing & Cleanup (Final)
- [ ] Add integration tests
- [ ] Create seed script
- [ ] Remove mock data fallbacks (or document dev mode)
- [ ] Update API documentation

---

## Key Decisions Needed

1. **Slug Strategy**:
   - Option A: Use `id` as slug (requires URL changes)
   - Option B: Add `slug` field (recommended, cleaner URLs)
   - **Recommendation**: Add `slug` field, keep backward compatibility

2. **Mock Data Strategy**:
   - Keep for development/testing?
   - **Recommendation**: Keep `USE_MOCK_DATA` flag for local dev without DB

3. **ID Type Strategy**:
   - Keep component types using `number` IDs?
   - Migrate to `string` IDs everywhere?
   - **Recommendation**: Keep transformers, gradually migrate components

4. **Migration Timing**:
   - Big bang (all at once)?
   - Incremental (read first, then write)?
   - **Recommendation**: Incremental - read path first, then writes

---

## Risk Mitigation

1. **Feature Flags**: Use `USE_MOCK_DATA` to toggle between mock/DB
2. **Dual Write**: Write to both localStorage and DB during transition
3. **Rollback Plan**: Keep mock data as fallback
4. **Testing**: Test each phase thoroughly before moving to next

---

## Estimated Timeline

- **Phase 1** (Schema): 1-2 hours
- **Phase 2** (Read - Play): 2-3 hours
- **Phase 3** (Read - Listings): 1-2 hours
- **Phase 4** (Write - Completions): 2-3 hours
- **Phase 5** (Admin CRUD): 4-6 hours
- **Phase 6** (Achievements): 2-3 hours
- **Phase 7** (Cleanup): 2-3 hours

**Total**: ~14-22 hours of focused work

---

## Next Immediate Steps

1. **Review Prisma schema** - confirm it matches needs
2. **Add missing fields** (slug, weekISO) if needed
3. **Start with Phase 2** - read path for quiz play (lowest risk)
4. **Test thoroughly** before moving to writes

