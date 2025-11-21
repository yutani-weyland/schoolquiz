-- Update users table to match Prisma schema
-- Run this after the organisation system migration

-- Add missing columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS "passwordHash" TEXT,
  ADD COLUMN IF NOT EXISTS "signupCode" TEXT,
  ADD COLUMN IF NOT EXISTS "signupMethod" TEXT DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS "freeTrialStartedAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "freeTrialEndsAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT DEFAULT 'FREE_TRIAL',
  ADD COLUMN IF NOT EXISTS "subscriptionPlan" TEXT,
  ADD COLUMN IF NOT EXISTS "subscriptionEndsAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS "platformRole" TEXT,
  ADD COLUMN IF NOT EXISTS "referralCode" TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS "referredBy" TEXT,
  ADD COLUMN IF NOT EXISTS "referralCount" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "freeTrialUntil" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT,
  ADD COLUMN IF NOT EXISTS "emailVerificationExpires" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "phoneVerificationCode" TEXT,
  ADD COLUMN IF NOT EXISTS "phoneVerificationExpires" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "profileVisibility" TEXT DEFAULT 'PUBLIC',
  ADD COLUMN IF NOT EXISTS "teamName" TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS "profileColorScheme" TEXT,
  ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Make name nullable (it's optional in schema)
ALTER TABLE users ALTER COLUMN name DROP NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_signup_code ON users("signupCode");
CREATE INDEX IF NOT EXISTS idx_users_profile_visibility ON users("profileVisibility");
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users("referralCode");
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users("referredBy");

