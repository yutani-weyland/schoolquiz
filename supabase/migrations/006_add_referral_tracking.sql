-- Migration: Add referral tracking table
-- This tracks individual referrals for better admin visibility

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY DEFAULT ('ref_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20)),
  referrer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  referred_user_tier TEXT NOT NULL DEFAULT 'basic',
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, VERIFIED, COUNTED
  counted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at);

-- Add column to track if user has a free month pending (for paying users)
ALTER TABLE users ADD COLUMN IF NOT EXISTS next_cycle_free BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_month_granted_at TIMESTAMP WITH TIME ZONE;

COMMENT ON TABLE referrals IS 'Tracks individual referrals for admin visibility and analytics';
COMMENT ON COLUMN referrals.status IS 'PENDING: referral created but not yet counted, VERIFIED: user signed up, COUNTED: counted toward free month';
COMMENT ON COLUMN users.next_cycle_free IS 'True if user has earned a free month that will apply to their next billing cycle';
COMMENT ON COLUMN users.free_month_granted_at IS 'Timestamp when the free month was granted';

