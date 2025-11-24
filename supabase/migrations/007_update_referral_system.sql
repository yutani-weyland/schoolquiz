-- Migration: Update referral system for Premium-based rewards
-- Changes:
-- 1. Track free months granted (not just count)
-- 2. Update referral status to track when rewards are granted
-- 3. Track if both referrer and referred user got rewards
--
-- This migration is idempotent and safe to run multiple times

-- Update users table: Replace referralCount with freeMonthsGranted
-- First, check if referralCount exists and migrate data if needed
DO $$
BEGIN
  -- Add freeMonthsGranted if it doesn't exist FIRST
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'freeMonthsGranted'
  ) THEN
    ALTER TABLE users ADD COLUMN "freeMonthsGranted" INTEGER DEFAULT 0;
  END IF;
  
  -- Now check if referralCount exists and migrate data
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'referralCount'
  ) THEN
    -- Migrate existing data: set freeMonthsGranted based on referralCount
    -- (assuming 3 referrals = 1 free month, but we'll cap at 3)
    UPDATE users 
    SET "freeMonthsGranted" = LEAST(COALESCE("referralCount", 0), 3)
    WHERE "referralCount" > 0;
    
    -- Drop the old column
    ALTER TABLE users DROP COLUMN "referralCount";
  END IF;
END $$;

-- Update referrals table structure
DO $$
BEGIN
  -- Check if referrals table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'referrals'
  ) THEN
    -- Drop old columns if they exist
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'referrals' AND column_name = 'referred_user_tier'
    ) THEN
      ALTER TABLE referrals DROP COLUMN "referred_user_tier";
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'referrals' AND column_name = 'counted_at'
    ) THEN
      ALTER TABLE referrals DROP COLUMN "counted_at";
    END IF;
    
    -- Add new columns if they don't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'referrals' AND column_name = 'reward_granted_at'
    ) THEN
      ALTER TABLE referrals ADD COLUMN "reward_granted_at" TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'referrals' AND column_name = 'referrer_rewarded'
    ) THEN
      ALTER TABLE referrals ADD COLUMN "referrer_rewarded" BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'referrals' AND column_name = 'referred_rewarded'
    ) THEN
      ALTER TABLE referrals ADD COLUMN "referred_rewarded" BOOLEAN DEFAULT FALSE;
    END IF;
  ELSE
    -- Create referrals table if it doesn't exist (in case 006 wasn't run)
    CREATE TABLE referrals (
      id TEXT PRIMARY KEY DEFAULT ('ref_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20)),
      referrer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      referred_user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      referral_code TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      reward_granted_at TIMESTAMP WITH TIME ZONE,
      referrer_rewarded BOOLEAN DEFAULT FALSE,
      referred_rewarded BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
    CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
    CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
    CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at);
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN users."freeMonthsGranted" IS 'Total free months earned via referrals (max 3)';
COMMENT ON COLUMN referrals.status IS 'PENDING: user signed up via referral, REWARDED: both users got free month';
COMMENT ON COLUMN referrals.reward_granted_at IS 'When the reward was granted (when referred user became Premium)';
COMMENT ON COLUMN referrals.referrer_rewarded IS 'Whether referrer got their free month';
COMMENT ON COLUMN referrals.referred_rewarded IS 'Whether referred user got their free month';
