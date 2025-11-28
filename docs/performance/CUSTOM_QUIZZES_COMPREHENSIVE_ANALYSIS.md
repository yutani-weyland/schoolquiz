# Custom Quizzes - Comprehensive Analysis & Improvement Plan

**Date:** 2025-01-27  
**Reviewer:** Lead Engineer  
**Goal:** Transform into Kahoot-fast, teacher-friendly Custom Quizzes hub

---

## Executive Summary

The Custom Quizzes feature has **solid foundations** but needs **significant enhancements** to meet the vision of a fast, intuitive, teacher-friendly quiz management hub. Current implementation is ~40% complete towards the full vision.

**Key Findings:**
- ✅ Basic CRUD works, performance optimizations started
- 🚨 Missing tab system, incomplete sharing model, no status system
- 🚨 Schema gaps prevent Groups/Organisation sharing
- 🚨 UX gaps: no quiz cards metadata, missing actions, basic empty states

**Recommended Approach:**
1. **Foundation First** (Schema + Performance) - Week 1
2. **Core UX** (Tabs + Cards) - Week 2  
3. **Sharing System** (Enhanced modal) - Week 3
4. **Polish** (Actions + Empty states) - Week 4

---

## Part 1: Current Implementation Review

### ✅ What Works Well

1. **Database Foundation**
   - `Quiz` model with `quizType: CUSTOM` ✅
   - `CustomQuizShare` for basic user-to-user sharing ✅
   - `CustomQuizUsage` for monthly limits ✅
   - Basic indexes in place ✅

2. **API Infrastructure**
   - CRUD endpoints functional ✅
   - Premium user verification ✅
   - Usage limits enforced ✅
   - Basic sharing works ✅

3. **Performance Optimizations Started**
   - Removed over-fetching from API routes ✅
   - Pagination support added ✅
   - Parallel queries implemented ✅
   - Caching added (30s quizzes, 60s usage) ✅

4. **Basic UI**
   - List view with cards ✅
   - Create/edit flow works ✅
   - Search/filter (basic) ✅

---

### 🚨 Critical Gaps

#### 1. Schema Limitations (BLOCKING)

**Current CustomQuizShare:**
```prisma
model CustomQuizShare {
  id        String
  quizId    String
  userId    String  // ❌ Only supports individual users
  sharedBy  String
  // ❌ Missing: targetType, permission, groupId
}
```

**Required Schema:**
```prisma
model CustomQuizShare {
  id          String
  quizId      String
  targetType  String  // 'user' | 'group' | 'organisation'
  targetId    String? // userId or groupId; null for org
  permission  String  // 'view' | 'run' | 'edit'
  sharedBy    String
  createdAt   DateTime
}
```

**Quiz Model Missing Fields:**
- ❌ `status: 'draft' | 'published' | 'archived' | 'template'`
- ❌ `isOrgWide: Boolean`
- ❌ `isTemplate: Boolean`
- ❌ Metadata: `roundCount`, `questionCount`, `totalDuration`, `tags`

**Impact:** Cannot implement Groups/Organisation sharing, status management, or proper quiz metadata.

---

#### 2. UX Gaps (HIGH PRIORITY)

**Tab System:**
- Current: 3 basic client-side filters (All/Mine/Shared)
- Required: 5 tabs with server-side filtering:
  - All → all accessible quizzes
  - Mine → owned quizzes
  - Shared → directly shared with user
  - Groups → shared with groups user belongs to
  - Organisation → org-wide quizzes

**Quiz Cards:**
- ❌ Missing status badges (Draft/Published/Archived/Template)
- ❌ Missing round/question counts
- ❌ Missing last edited timestamp
- ❌ Missing sharing indicators (avatars, group icons, org icon)
- ❌ No three-dot menu (Open, Run, Duplicate, Edit, Share, Archive)

**Sharing Modal:**
- Current: Only individual users
- Required:
  - Section 1: People (search, add with permissions)
  - Section 2: Groups (toggle per group)
  - Section 3: Organisation (org-wide toggle)
  - Share summary visualization

**Empty States:**
- Current: Generic empty state
- Required: Contextual per tab with helpful messages

**Missing Actions:**
- ❌ Duplicate quiz
- ❌ Archive/Unarchive
- ❌ Convert to template
- ❌ Three-dot menu for all actions

---

#### 3. Performance Gaps (MEDIUM PRIORITY)

**No Summary Queries:**
- Still fetches full quiz objects in some places
- Need dedicated summary queries for list views
- Should return ONLY: id, title, subtitle, status, metadata, share indicators

**Client-Side Layout:**
- PageLayout/PageContainer in client component
- Should be server-rendered shell (reduces bundle by ~30-40%)

**Client-Side Filtering:**
- Filtering happens in React instead of database
- Should filter at query level for better performance

**URL Structure:**
- Current: `/custom-quizzes`
- Should be: `/quizzes/custom` (cleaner, predictable)

---

#### 4. Architecture Gaps (MEDIUM PRIORITY)

**Mixed Data Fetching:**
- Some client-side `fetch()` calls
- Should be pure server components with server actions

**No Granular Suspense:**
- Single Suspense boundary
- Need separate boundaries: tabs, usage widget, quiz list

**No Server Actions:**
- Using API routes for mutations
- Server actions would be faster, smaller payloads

---

## Part 2: Requirements Mapping

### Required Features vs Current State

| Feature | Required | Current | Status |
|---------|----------|---------|--------|
| **Tabs** | All, Mine, Shared, Groups, Org | All, Mine, Shared | ⚠️ Partial |
| **Quiz Cards** | Full metadata + indicators | Basic cards | ❌ Missing |
| **Sharing** | People + Groups + Org | People only | ⚠️ Partial |
| **Permissions** | view/run/edit | None | ❌ Missing |
| **Status System** | draft/published/archived/template | None | ❌ Missing |
| **Actions** | Open/Run/Duplicate/Edit/Share/Archive | Edit/Share/Play/Delete | ⚠️ Partial |
| **Empty States** | Contextual per tab | Generic | ⚠️ Partial |
| **Performance** | Summary queries, <1s load | Optimized but not summary | ⚠️ Partial |

---

## Part 3: Improvement Plan

### Phase 1: Foundation (Week 1) - BLOCKING

**1.1 Schema Enhancements**

**Migration: Add Fields to Quiz**
```sql
-- Add status enum and field
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS "isOrgWide" BOOLEAN DEFAULT false;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS "isTemplate" BOOLEAN DEFAULT false;

-- Add computed metadata (denormalized for performance)
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS "roundCount" INTEGER;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS "questionCount" INTEGER;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON quizzes(status);
CREATE INDEX IF NOT EXISTS idx_quizzes_isOrgWide ON quizzes("isOrgWide") WHERE "isOrgWide" = true;
```

**Migration: Enhance CustomQuizShare**
```sql
-- Add new fields
ALTER TABLE custom_quiz_shares ADD COLUMN IF NOT EXISTS "targetType" TEXT DEFAULT 'user';
ALTER TABLE custom_quiz_shares ADD COLUMN IF NOT EXISTS "targetId" TEXT;
ALTER TABLE custom_quiz_shares ADD COLUMN IF NOT EXISTS permission TEXT DEFAULT 'view';

-- Migrate existing shares (all are 'user' type)
UPDATE custom_quiz_shares SET "targetType" = 'user', "targetId" = "userId" WHERE "targetType" IS NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_custom_quiz_shares_target ON custom_quiz_shares("targetType", "targetId");
CREATE INDEX IF NOT EXISTS idx_custom_quiz_shares_group ON custom_quiz_shares("targetType", "targetId") WHERE "targetType" = 'group';
```

**1.2 Summary Query System**

Create dedicated summary queries that return ONLY list view data:
- No nested includes
- Use `select` not `include`
- Aggregate counts (roundCount, questionCount)
- Share indicators as booleans/aggregates

**1.3 Server-Rendered Shell**

Extract layout to server component:
- Reduces client JS bundle
- Faster initial paint
- Better SEO

---

### Phase 2: Core UX (Week 2) - HIGH PRIORITY

**2.1 Tab System Implementation**

**Server-Side Tab Queries:**
```typescript
// All: Union of owned + shared + groups + org
// Mine: WHERE createdByUserId = userId
// Shared: WHERE shares.targetType = 'user' AND shares.targetId = userId
// Groups: WHERE shares.targetType = 'group' AND shares.targetId IN (userGroupIds)
// Organisation: WHERE isOrgWide = true AND user.orgId = quiz.orgId
```

**Benefits:**
- Single optimized query per tab
- Server-side filtering (faster)
- Reduced payload (only visible quizzes)

**2.2 Enhanced Quiz Cards**

**New Card Fields:**
- Status badge (color-coded)
- Round count + Question count
- Last edited timestamp
- Sharing indicators:
  - Avatars (individual shares)
  - Group icons (group shares)
  - Org icon (org-wide)
- Three-dot menu with all actions

**2.3 Server-Side Filtering**

Move filtering to database queries:
- Filter by tab type at query level
- Search at database level (not client-side)
- Pagination per tab

**2.4 Granular Suspense Boundaries**

- Separate Suspense for each tab content
- Separate Suspense for usage widget
- Better streaming, faster perceived performance

---

### Phase 3: Sharing System (Week 3) - HIGH PRIORITY

**3.1 Enhanced Sharing Modal**

**Three Sections:**
1. **People**: Search by email/name, add with permissions (view/run/edit)
2. **Groups**: List user's groups, toggle share per group
3. **Organisation**: Toggle org-wide access (if user has permission)

**Share Summary Area:**
- Current access visualization
- Avatars for people
- Group icons
- Org indicator
- Remove/revoke controls

**3.2 Permission System**

Implement permission levels:
- `view`: Can see quiz exists
- `run`: Can play quiz with students
- `edit`: Can modify quiz content

**3.3 API Enhancements**

Update sharing endpoints to support:
- Group sharing
- Organisation sharing
- Permission levels

---

### Phase 4: Actions & Polish (Week 4) - MEDIUM PRIORITY

**4.1 Three-Dot Menu**

Actions:
- Open (view details)
- Run (play with students)
- Duplicate (copy quiz)
- Edit (modify content)
- Share (open sharing modal)
- Archive (soft delete)

**4.2 Duplicate Action**

- Copy quiz structure
- New quiz with "Copy of..." title
- User becomes owner
- Preserve rounds/questions

**4.3 Archive System**

- Soft delete (status = 'archived')
- Filter archived from default views
- Restore option

**4.4 Contextual Empty States**

Per-tab messages:
- **Mine**: "Create your first quiz" + CTA
- **Shared**: "Quizzes shared with you will appear here"
- **Groups**: "Quizzes shared with your groups"
- **Organisation**: "Organisation-wide quizzes"

**4.5 URL Structure Cleanup**

- Move to `/quizzes/custom`
- Update all references
- Preserve backwards compatibility

---

## Part 4: Implementation Details

### Summary Query Example

```typescript
// OPTIMIZATION: Summary query - only fields needed for list view
async function getCustomQuizSummariesForUser(
  userId: string,
  tab: 'all' | 'mine' | 'shared' | 'groups' | 'organisation',
  searchQuery?: string
) {
  // Build query based on tab
  const where = buildTabQuery(userId, tab)
  
  if (searchQuery) {
    where.OR = [
      { title: { contains: searchQuery, mode: 'insensitive' } },
      { blurb: { contains: searchQuery, mode: 'insensitive' } },
    ]
  }

  return prisma.quiz.findMany({
    where,
    select: {
      id: true,
      title: true,
      blurb: true,
      status: true,
      colorHex: true,
      createdAt: true,
      updatedAt: true,
      roundCount: true, // Denormalized
      questionCount: true, // Denormalized
      isOrgWide: true,
      // Share indicators as aggregates
      _count: {
        select: {
          shares: {
            where: { targetType: 'user' }
          }
        }
      },
      // Only fetch share metadata, not full relations
      shares: {
        where: { targetType: 'user' },
        select: {
          targetId: true,
          permission: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        take: 3 // Only first 3 for avatars
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: 20, // Pagination
  })
}
```

**Benefits:**
- Single query per tab
- No nested includes (except minimal share metadata)
- Fast, small payload
- Database-level filtering and search

---

### Tab Query Builder

```typescript
function buildTabQuery(userId: string, tab: TabType) {
  switch (tab) {
    case 'mine':
      return {
        quizType: 'CUSTOM',
        createdByUserId: userId,
        status: { not: 'archived' }
      }
    
    case 'shared':
      return {
        quizType: 'CUSTOM',
        shares: {
          some: {
            targetType: 'user',
            targetId: userId
          }
        },
        status: { not: 'archived' }
      }
    
    case 'groups':
      // Get user's group IDs
      const userGroups = await getUserGroupIds(userId)
      return {
        quizType: 'CUSTOM',
        shares: {
          some: {
            targetType: 'group',
            targetId: { in: userGroups }
          }
        },
        status: { not: 'archived' }
      }
    
    case 'organisation':
      const userOrg = await getUserOrganisationId(userId)
      return {
        quizType: 'CUSTOM',
        isOrgWide: true,
        // Additional check: user's org matches quiz's org context
        status: { not: 'archived' }
      }
    
    case 'all':
    default:
      // Union of all above (complex query)
      return buildAllTabQuery(userId)
  }
}
```

---

## Part 5: Performance Targets

### Current Performance

- **Initial Payload:** ~50-100KB
- **Queries:** 2-3 per page load
- **Client JS:** ~200KB
- **Time to Interactive:** ~2-3s
- **Data Fetched:** Full quiz objects in some cases

### Target Performance (Kahoot-fast)

- **Initial Payload:** ~10-20KB (summary data only)
- **Queries:** 1 per tab (single optimized query)
- **Client JS:** ~100KB (server-rendered shell)
- **Time to Interactive:** ~0.5-1s
- **Data Fetched:** Summary only, no nested relations

**Improvement:** ~80% reduction in payload, ~70% faster load time

---

## Part 6: Next Steps

### Immediate Actions

1. **Review & Approve Plan** ✅
2. **Schema Migration** - Start with foundation
3. **Summary Query System** - Critical for performance
4. **Tab System** - Core UX improvement

### Implementation Order

1. ✅ **Schema Enhancements** (Foundation - blocking)
2. ✅ **Summary Queries** (Performance - critical)
3. ✅ **Server-Rendered Shell** (Performance - critical)
4. ✅ **Tab System** (UX - high priority)
5. ✅ **Enhanced Cards** (UX - high priority)
6. ✅ **Sharing System** (Feature - high priority)
7. ✅ **Actions & Polish** (UX - medium priority)

---

## Success Metrics

### Performance
- [ ] Initial payload < 20KB
- [ ] Time to Interactive < 1s
- [ ] Client JS bundle < 150KB
- [ ] Single query per tab

### UX
- [ ] All 5 tabs functional
- [ ] Quiz cards show all metadata
- [ ] Sharing modal supports People/Groups/Org
- [ ] Contextual empty states
- [ ] All actions available

### Features
- [ ] Status system (draft/published/archived/template)
- [ ] Permission levels (view/run/edit)
- [ ] Duplicate quiz
- [ ] Archive/restore
- [ ] Org-wide sharing

---

**Ready to begin implementation!** 🚀

