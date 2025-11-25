-- Migration: Add PrivateLeagueRequestStatus enum type
-- This creates the PostgreSQL enum type that Prisma expects

-- Create the enum type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PrivateLeagueRequestStatus') THEN
        CREATE TYPE "PrivateLeagueRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    END IF;
END $$;

-- Alter the table to use the enum type instead of TEXT
-- This migration is idempotent and handles all edge cases properly
DO $$
BEGIN
    -- Check if the column exists and is TEXT type (needs migration)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'private_league_requests' 
        AND column_name = 'status'
        AND data_type = 'text'
    ) THEN
        -- Step 1: Drop indexes that reference the status column
        -- These will be recreated after the column type change
        DROP INDEX IF EXISTS idx_league_requests_unique_pending;
        DROP INDEX IF EXISTS idx_league_requests_league;
        DROP INDEX IF EXISTS idx_league_requests_user;
        DROP INDEX IF EXISTS idx_league_requests_creator;
        
        -- Step 2: Remove the default constraint
        ALTER TABLE private_league_requests 
        ALTER COLUMN status DROP DEFAULT;
        
        -- Step 3: Add a temporary column with the enum type
        ALTER TABLE private_league_requests 
        ADD COLUMN status_new "PrivateLeagueRequestStatus";
        
        -- Step 4: Populate the new column based on the old column's text value
        -- Validate and convert all existing values
        UPDATE private_league_requests 
        SET status_new = CASE 
            WHEN status = 'PENDING' THEN 'PENDING'::"PrivateLeagueRequestStatus"
            WHEN status = 'APPROVED' THEN 'APPROVED'::"PrivateLeagueRequestStatus"
            WHEN status = 'REJECTED' THEN 'REJECTED'::"PrivateLeagueRequestStatus"
            ELSE 'PENDING'::"PrivateLeagueRequestStatus" -- Default for any invalid values
        END;
        
        -- Step 5: Drop the old TEXT column (this will also drop any remaining constraints)
        ALTER TABLE private_league_requests 
        DROP COLUMN status;
        
        -- Step 6: Rename the new column to the original name
        ALTER TABLE private_league_requests 
        RENAME COLUMN status_new TO status;
        
        -- Step 7: Add constraints back
        ALTER TABLE private_league_requests 
        ALTER COLUMN status SET NOT NULL;
        
        ALTER TABLE private_league_requests 
        ALTER COLUMN status SET DEFAULT 'PENDING'::"PrivateLeagueRequestStatus";
        
        -- Step 8: Recreate all indexes that reference the status column
        -- Unique index: One pending request per user per league
        CREATE UNIQUE INDEX IF NOT EXISTS idx_league_requests_unique_pending 
        ON private_league_requests("leagueId", "userId") 
        WHERE status = 'PENDING'::"PrivateLeagueRequestStatus";
        
        -- Indexes for efficient queries
        CREATE INDEX IF NOT EXISTS idx_league_requests_league 
        ON private_league_requests("leagueId", status);
        
        CREATE INDEX IF NOT EXISTS idx_league_requests_user 
        ON private_league_requests("userId", status);
        
        CREATE INDEX IF NOT EXISTS idx_league_requests_creator 
        ON private_league_requests("leagueId", status, "requestedAt") 
        WHERE status = 'PENDING'::"PrivateLeagueRequestStatus";
        
    ELSIF EXISTS (
        -- Check if column already has the enum type (migration already applied)
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'private_league_requests' 
        AND column_name = 'status'
        AND udt_name = 'PrivateLeagueRequestStatus'
    ) THEN
        -- Migration already applied, ensure indexes exist
        CREATE UNIQUE INDEX IF NOT EXISTS idx_league_requests_unique_pending 
        ON private_league_requests("leagueId", "userId") 
        WHERE status = 'PENDING'::"PrivateLeagueRequestStatus";
        
        CREATE INDEX IF NOT EXISTS idx_league_requests_league 
        ON private_league_requests("leagueId", status);
        
        CREATE INDEX IF NOT EXISTS idx_league_requests_user 
        ON private_league_requests("userId", status);
        
        CREATE INDEX IF NOT EXISTS idx_league_requests_creator 
        ON private_league_requests("leagueId", status, "requestedAt") 
        WHERE status = 'PENDING'::"PrivateLeagueRequestStatus";
    END IF;
END $$;

