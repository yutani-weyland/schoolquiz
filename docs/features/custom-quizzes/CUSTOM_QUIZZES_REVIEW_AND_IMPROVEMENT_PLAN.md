# Custom Quizzes - Comprehensive Review & Improvement Plan

**Date:** 2025-01-27  
**Goal:** Transform Custom Quizzes into a Kahoot-fast, teacher-friendly hub

---

## Current Implementation Review

### ✅ What's Good

1. **Basic Schema Exists**
   - `Quiz` model with `quizType: CUSTOM`
   - `CustomQuizShare` model for user-to-user sharing
   - `CustomQuizUsage` for monthly limits tracking
   - Basic indexes in place

2. **Core API Endpoints**
   - CRUD operations work
   - Basic sharing (user-to-user)
   - Usage limits enforced

3. **Performance Optimizations Started**
   - Removed over-fetching in API routes
   - Added pagination support
   - Parallel queries implemented
   - Caching added

4. **Basic UI Exists**
   - List view with cards
   - Create/edit flow works
   - Basic search/filter

---

## Critical Gaps vs Requirements

### 🚨 Schema Gaps (HIGH PRIORITY)

**Current CustomQuizShare:**
```prisma
model CustomQuizShare {
  id        String
  quizId    String
  userId    String  // Only supports individual users
  sharedBy  String
  // Missing: targetType, permission, groupId, org flag
}
```

**Required:**
- `targetType: 'user' | 'group' | 'organisation'`
- `targetId: String?` (userId or groupId; null for org)
- `permission: 'view' | 'run' | 'edit'`
- Support for group sharing
- Support for organisation-wide sharing

**Quiz Model Missing:**
- `status: 'draft' | 'published' | 'archived' | 'template'`
- `isOrgWide: Boolean`
- `isTemplate: Boolean`
- Metadata: `roundCount`, `questionCount`, `totalDuration`, `tags[]`

### 🚨 UX Gaps (HIGH PRIORITY)

1. **Tab System Missing**
   - Current: 3 basic filters (All/Mine/Shared)
   - Required: All, Mine, Shared, Groups, Organisation

2. **Quiz Cards Incomplete**
   - Missing: Status badges (Draft/Published/Template/Archived)
   - Missing: Round count + question count
   - Missing: Last edited time
   - Missing: Sharing indicators (avatars, group icons, org icon)
   - Missing: Three-dot menu (Open, Run, Duplicate, Edit, Share, Archive)

3. **Sharing UX Incomplete**
   - Current: Only supports individual users
   - Missing: Groups section
   - Missing: Organisation toggle
   - Missing: Share summary visualization
   - Missing: Permission levels (view/run/edit)

4. **Empty States Not Contextual**
   - Need different messages per tab
   - Need helpful explanations and CTAs

5. **Missing Actions**
   - No Duplicate quiz
   - No Archive
   - No three-dot menu

### 🚨 Performance Gaps (MEDIUM PRIORITY)

1. **No Summary Queries**
   - Still sometimes fetches full quiz data
   - Need dedicated summary queries for list views

2. **Client-Side Layout**
   - PageLayout/PageContainer in client component
   - Should be server-rendered shell

3. **Client-Side Filtering**
   - Filtering happens client-side instead of server-side
   - Should filter at database level

4. **URL Structure**
   - Current: `/custom-quizzes`
   - Should be: `/quizzes/custom` (cleaner, more predictable)

### 🚨 Architecture Gaps (MEDIUM PRIORITY)

1. **No Server Actions for Mutations**
   - Using API routes for everything
   - Should use server actions for better performance

2. **Mixed Data Fetching**
   - Some client-side fetching
   - Should be pure server components with server actions

3. **No Granular Suspense**
   - Single Suspense boundary
   - Need separate boundaries for tabs, usage widget, etc.

---

## Improvement Plan

### Phase 1: Schema Enhancements (Foundation)

**1.1 Update CustomQuizShare Model**
```prisma
model CustomQuizShare {
  id          String
  quizId      String
  targetType  String  // 'user' | 'group' | 'organisation'
  targetId    String? // userId or groupId; null for org
  permission  String  // 'view' | 'run' | 'edit'
  sharedBy    String
  createdAt   DateTime
  
  quiz  Quiz @relation(...)
  user  User? @relation(...)  // If targetType = 'user'
  group Group? @relation(...) // If targetType = 'group'
}
```

**1.2 Add Quiz Metadata Fields**
- Add computed/denormalized fields: `roundCount`, `questionCount`
- Add `status` enum
- Add `isOrgWide` flag
- Add `tags` array

**1.3 Migration Strategy**
- Add new fields as nullable
- Migrate existing shares to new structure
- Keep backwards compatibility during transition

---

### Phase 2: Performance & Architecture (Critical)

**2.1 Create Summary Query System**
```typescript
// New function: getCustomQuizSummariesForUser(userId, filters)
// Returns ONLY: id, title, subtitle, status, createdAt, updatedAt, 
//                roundCount, questionCount, share indicators
// Uses select, not include - no nested data
```

**2.2 Server-Rendered Shell**
- Extract layout to server component
- Only interactive parts are client components
- Reduces client JS bundle significantly

**2.3 Server-Side Filtering**
- Move filtering to database queries
- Filter by tab type at query level
- Reduce client-side work

**2.4 Granular Suspense Boundaries**
- Separate Suspense for each tab
- Separate Suspense for usage widget
- Separate Suspense for quiz list

**2.5 Server Actions**
- Replace API routes with server actions where possible
- Faster, smaller payloads
- Better error handling

---

### Phase 3: UX Enhancements (High Priority)

**3.1 Tab System**
- Implement All, Mine, Shared, Groups, Organisation tabs
- Each tab has own query/logic
- Server-side filtering per tab

**3.2 Enhanced Quiz Cards**
- Status badges (color-coded)
- Round/question counts
- Last edited timestamp
- Sharing indicators (avatars/icons)
- Three-dot menu with all actions

**3.3 Comprehensive Sharing Modal**
- Three sections: People, Groups, Organisation
- Share summary area with current access
- Permission levels (view/run/edit)
- Remove/revoke access controls

**3.4 Contextual Empty States**
- Different messages per tab
- Helpful explanations
- Prominent CTAs

**3.5 Missing Actions**
- Duplicate quiz
- Archive/Unarchive
- Convert to template

---

### Phase 4: Polish & Optimization (Lower Priority)

**4.1 URL Structure**
- Move to `/quizzes/custom`
- Update all references

**4.2 Analytics Integration**
- Track quiz usage
- Show play counts
- Simple analytics dashboard

**4.3 Template System**
- Mark quizzes as templates
- Browse template gallery
- Clone from templates

---

## Implementation Order

### Week 1: Foundation
1. ✅ Schema enhancements (CustomQuizShare + Quiz metadata)
2. ✅ Summary query system
3. ✅ Server-rendered shell
4. ✅ Database indexes

### Week 2: Core UX
1. ✅ Tab system (All/Mine/Shared/Groups/Organisation)
2. ✅ Enhanced quiz cards
3. ✅ Server-side filtering per tab
4. ✅ Granular Suspense boundaries

### Week 3: Sharing
1. ✅ Enhanced sharing modal (People/Groups/Org)
2. ✅ Permission system
3. ✅ Share summary visualization
4. ✅ Update sharing API/logic

### Week 4: Actions & Polish
1. ✅ Three-dot menu
2. ✅ Duplicate action
3. ✅ Archive action
4. ✅ Contextual empty states
5. ✅ URL structure cleanup

---

## Performance Targets

### Before (Current)
- Initial Payload: ~50-100KB (with optimizations)
- Queries: 2-3 per page load
- Client JS: ~200KB
- Time to Interactive: ~2-3s

### After (Target)
- Initial Payload: ~10-20KB (summary data only)
- Queries: 1 per tab (single optimized query)
- Client JS: ~100KB (server-rendered shell)
- Time to Interactive: ~0.5-1s

**Goal: Kahoot-fast (<1s perceived load time)**

---

## Next Steps

1. **Review & Approve Plan** - Ensure alignment with product vision
2. **Schema Migration** - Start with foundation
3. **Summary Query System** - Critical for performance
4. **Tab System** - Core UX improvement
5. **Sharing Enhancements** - Completes feature set

---

**Ready to begin implementation!** 🚀

