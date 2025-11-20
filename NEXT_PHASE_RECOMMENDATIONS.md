# Next Phase Recommendations

Based on the current state and PHASES.md roadmap:

## ✅ Completed

### Phase 0 - Admin Shell
- ✅ Admin layout with sidebar/topbar
- ✅ Overview page
- ✅ Role protection (with dev fallback)

### Phase 2 - Quizzes (Partial)
- ✅ Quiz list page (optimized, server component)
- ✅ Quiz detail page (optimized, server component)
- ✅ Quiz builder/editor
- ✅ Quiz CRUD operations
- ⚠️ **Scheduling** - Page exists but needs implementation

### Performance Optimizations
- ✅ Server components for quiz pages
- ✅ Caching layer (achievements, categories)
- ✅ N+1 query fixes
- ✅ Query optimizations

## 🎯 Recommended Next Phase: **Complete Phase 2 - Scheduling**

### Why Scheduling Next?
1. **Natural progression**: Quizzes are done, scheduling is the missing piece
2. **High value**: Enables automated quiz publishing
3. **Foundation for analytics**: Scheduled runs generate data for analytics
4. **Completes Phase 2**: Finishes the quizzes/runs/scheduling domain

### What Needs to Be Built

#### 1. Scheduling Page (`/admin/scheduling`)
- [ ] Calendar view showing scheduled quizzes
- [ ] Jobs table (past and upcoming)
- [ ] Create/edit scheduled jobs
- [ ] Job status (pending, running, completed, failed)

#### 2. Scheduled Jobs System
- [ ] Database schema for `scheduled_jobs` table
- [ ] Job types:
  - Weekly quiz publish
  - Open/close quiz runs
  - Maintenance windows
- [ ] Cron job runner (or Next.js API route with cron trigger)
- [ ] Job execution logic

#### 3. Quiz Runs Management
- [ ] View past runs
- [ ] View upcoming runs
- [ ] Run analytics per quiz

### Alternative: Phase 3 - Analytics (If Scheduling is Complex)

If scheduling is too complex, Phase 3 (Analytics) is a good alternative:

#### Analytics Pages (Make Functional)
- [ ] **Engagement** (`/admin/analytics/engagement`)
  - DAU/MAU metrics
  - Quiz attempts per day
  - Top active organisations
  - Real data from database

- [ ] **Learning** (`/admin/analytics/learning`)
  - Outcome coverage
  - Most missed outcomes
  - Question performance

- [ ] **Funnel** (`/admin/analytics/funnel`)
  - Signup → first quiz → org creation → paid
  - Conversion rates

## 📊 Current Status Summary

| Phase | Status | Priority |
|-------|--------|----------|
| Phase 0 - Admin Shell | ✅ Complete | - |
| Phase 1 - Users & Orgs | ⚠️ Partial | Medium |
| Phase 2 - Quizzes | ✅ Complete | - |
| Phase 2 - Scheduling | ❌ Not Started | **HIGH** |
| Phase 3 - Analytics | ⚠️ Pages exist, need data | Medium |
| Phase 4 - Billing/Support/System | ⚠️ Pages exist, need data | Low |
| Phase 5 - Cleanup | ❌ Not Started | Low |

## 🚀 Recommendation

**Start with Phase 2 - Scheduling** because:
1. Completes the quiz management workflow
2. Enables automated operations
3. Creates data for analytics
4. Natural next step after quizzes

**Or** if scheduling is complex, **Phase 3 - Analytics** because:
1. Pages already exist
2. High visibility feature
3. Uses existing quiz/run data
4. Good for demonstrating value

