-- Additional Performance Indexes for Admin Pages
-- Adds indexes for frequently queried fields in admin list/sort/filter operations

-- User model indexes for admin queries
-- Name is frequently searched in admin user list
CREATE INDEX IF NOT EXISTS "users_name_idx" ON "users"("name");

-- Tier is frequently filtered in admin user list
CREATE INDEX IF NOT EXISTS "users_tier_idx" ON "users"("tier");

-- CreatedAt is frequently used for sorting in admin user list
CREATE INDEX IF NOT EXISTS "users_createdAt_idx" ON "users"("createdAt");

-- Composite index for common admin query pattern: filter by tier + sort by createdAt
CREATE INDEX IF NOT EXISTS "users_tier_createdAt_idx" ON "users"("tier", "createdAt" DESC);

-- Composite index for name search + createdAt sort (case-insensitive search uses ILIKE, but index still helps)
CREATE INDEX IF NOT EXISTS "users_name_createdAt_idx" ON "users"("name", "createdAt" DESC);

-- Organisation model indexes for admin queries
-- Name is frequently searched in admin organisation list
CREATE INDEX IF NOT EXISTS "organisations_name_idx" ON "organisations"("name");

-- Plan is frequently filtered in admin organisation list
CREATE INDEX IF NOT EXISTS "organisations_plan_idx" ON "organisations"("plan");

-- CreatedAt is frequently used for sorting in admin organisation list
CREATE INDEX IF NOT EXISTS "organisations_createdAt_idx" ON "organisations"("createdAt");

-- Composite index for common admin query pattern: filter by status + sort by createdAt
CREATE INDEX IF NOT EXISTS "organisations_status_createdAt_idx" ON "organisations"("status", "createdAt" DESC);

-- Composite index for filter by plan + sort by createdAt
CREATE INDEX IF NOT EXISTS "organisations_plan_createdAt_idx" ON "organisations"("plan", "createdAt" DESC);

-- Composite index for name search + createdAt sort
CREATE INDEX IF NOT EXISTS "organisations_name_createdAt_idx" ON "organisations"("name", "createdAt" DESC);

-- Email domain is frequently searched
CREATE INDEX IF NOT EXISTS "organisations_emailDomain_idx" ON "organisations"("emailDomain");

