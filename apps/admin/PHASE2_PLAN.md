# Phase 2 Performance Optimizations - Plan

## Overview
Phase 2 focuses on converting heavy client-side pages to Server Components and implementing streaming for better perceived performance.

## Priority Order

### 1. Convert Organisations Page to Server Component ⚡
**Impact:** 30-40% faster initial load, better SEO
**Effort:** High (4-6 hours)
**Files:**
- `app/admin/organisations/page.tsx` (958 lines - large refactor)
- Create server component wrapper
- Extract client components for interactivity

### 2. Convert Users Page to Server Component ⚡
**Impact:** 30-40% faster initial load
**Effort:** High (4-6 hours)
**Files:**
- `app/admin/users/page.tsx` (933 lines - large refactor)
- Similar pattern to organisations page

### 3. Standardize Caching Strategy 📦
**Impact:** 60-80% reduction in database queries
**Effort:** Medium (2-3 hours)
**Files:**
- Review all API routes
- Standardize cache TTLs
- Use revalidation tags consistently

### 4. Lazy Load Analytics Section 🎯
**Impact:** Reduce initial bundle by ~200KB
**Effort:** Low (1 hour)
**Files:**
- Analytics pages
- Route groups

### 5. Add Database Indexes 🗄️
**Impact:** Faster queries on large datasets
**Effort:** Medium (1-2 hours)
**Files:**
- Create migration file
- Add indexes for frequently queried fields

---

## Implementation Strategy

### For Organisations/Users Pages:
1. Create Server Component that fetches initial data
2. Extract table/filters to client component
3. Use Suspense for progressive loading
4. Keep modals/forms as client components
5. Server-side pagination/filtering

### For Caching:
1. Review existing cache config
2. Standardize TTLs per data type
3. Use cache tags for invalidation
4. Document caching strategy

---

## Success Criteria

✅ Organisations page loads 30-40% faster
✅ Users page loads 30-40% faster
✅ Consistent caching across all routes
✅ Analytics section lazy-loaded
✅ Database indexes added

---

**Starting with Organisations page conversion...**

