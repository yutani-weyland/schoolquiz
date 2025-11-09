-- Migration: Add Organisation & Licensing System
-- Run this migration after updating Prisma schema

-- Create User table (if not exists from previous migrations)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  "lastLoginAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Organisation table
CREATE TABLE IF NOT EXISTS organisations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "emailDomain" TEXT,
  "ownerUserId" TEXT NOT NULL,
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "maxSeats" INTEGER DEFAULT 0,
  plan TEXT DEFAULT 'INDIVIDUAL',
  status TEXT DEFAULT 'TRIALING',
  "currentPeriodStart" TIMESTAMP,
  "currentPeriodEnd" TIMESTAMP,
  "gracePeriodEnd" TIMESTAMP,
  "featureFlags" TEXT DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("ownerUserId") REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_organisations_owner ON organisations("ownerUserId");
CREATE INDEX IF NOT EXISTS idx_organisations_status ON organisations(status, "currentPeriodEnd");

-- Create OrganisationMember table
CREATE TABLE IF NOT EXISTS organisation_members (
  id TEXT PRIMARY KEY,
  "organisationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'TEACHER',
  status TEXT NOT NULL DEFAULT 'PENDING',
  "seatAssignedAt" TIMESTAMP,
  "seatReleasedAt" TIMESTAMP,
  "deletedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("organisationId") REFERENCES organisations(id) ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE("organisationId", "userId")
);

CREATE INDEX IF NOT EXISTS idx_org_members_org_status ON organisation_members("organisationId", status);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organisation_members("userId");

-- Create OrganisationGroup table
CREATE TABLE IF NOT EXISTS organisation_groups (
  id TEXT PRIMARY KEY,
  "organisationId" TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'CUSTOM',
  description TEXT,
  "createdByUserId" TEXT NOT NULL,
  "deletedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("organisationId") REFERENCES organisations(id) ON DELETE CASCADE,
  FOREIGN KEY ("createdByUserId") REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_org_groups_org ON organisation_groups("organisationId", "deletedAt");

-- Create OrganisationGroupMember table
CREATE TABLE IF NOT EXISTS organisation_group_members (
  id TEXT PRIMARY KEY,
  "organisationGroupId" TEXT NOT NULL,
  "organisationMemberId" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("organisationGroupId") REFERENCES organisation_groups(id) ON DELETE CASCADE,
  FOREIGN KEY ("organisationMemberId") REFERENCES organisation_members(id) ON DELETE CASCADE,
  UNIQUE("organisationGroupId", "organisationMemberId")
);

-- Create Leaderboard table
CREATE TABLE IF NOT EXISTS leaderboards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  "organisationId" TEXT,
  "organisationGroupId" TEXT,
  visibility TEXT NOT NULL DEFAULT 'ORG_WIDE',
  "createdByUserId" TEXT NOT NULL,
  "deletedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("organisationId") REFERENCES organisations(id) ON DELETE CASCADE,
  FOREIGN KEY ("organisationGroupId") REFERENCES organisation_groups(id) ON DELETE SET NULL,
  FOREIGN KEY ("createdByUserId") REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboards_org ON leaderboards("organisationId", "deletedAt");
CREATE INDEX IF NOT EXISTS idx_leaderboards_group ON leaderboards("organisationGroupId");
CREATE INDEX IF NOT EXISTS idx_leaderboards_creator ON leaderboards("createdByUserId");

-- Create LeaderboardMember table
CREATE TABLE IF NOT EXISTS leaderboard_members (
  id TEXT PRIMARY KEY,
  "leaderboardId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organisationMemberId" TEXT,
  "joinedAt" TIMESTAMP DEFAULT NOW(),
  "leftAt" TIMESTAMP,
  muted BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("leaderboardId") REFERENCES leaderboards(id) ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY ("organisationMemberId") REFERENCES organisation_members(id) ON DELETE SET NULL,
  UNIQUE("leaderboardId", "userId")
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_members_user ON leaderboard_members("userId");
CREATE INDEX IF NOT EXISTS idx_leaderboard_members_board ON leaderboard_members("leaderboardId", "leftAt");

-- Create OrganisationActivity table
CREATE TABLE IF NOT EXISTS organisation_activity (
  id TEXT PRIMARY KEY,
  "organisationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  type TEXT NOT NULL,
  metadata TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("organisationId") REFERENCES organisations(id) ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_org_activity_org ON organisation_activity("organisationId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_org_activity_user ON organisation_activity("userId");

