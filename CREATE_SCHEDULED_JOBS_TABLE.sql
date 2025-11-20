-- Create scheduled_jobs table if it doesn't exist
-- Run this in Supabase SQL Editor

DO $$
BEGIN
  -- Create enum types if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ScheduledJobType') THEN
    CREATE TYPE "ScheduledJobType" AS ENUM (
      'PUBLISH_QUIZ',
      'OPEN_QUIZ_RUN',
      'CLOSE_QUIZ_RUN',
      'MAINTENANCE_WINDOW',
      'SEND_NOTIFICATION',
      'CUSTOM'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ScheduledJobStatus') THEN
    CREATE TYPE "ScheduledJobStatus" AS ENUM (
      'PENDING',
      'SCHEDULED',
      'RUNNING',
      'COMPLETED',
      'FAILED',
      'CANCELLED'
    );
  END IF;

  -- Create table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scheduled_jobs') THEN
    CREATE TABLE "scheduled_jobs" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "type" "ScheduledJobType" NOT NULL,
      "status" "ScheduledJobStatus" NOT NULL DEFAULT 'PENDING',
      "name" TEXT NOT NULL,
      "description" TEXT,
      "scheduledFor" TIMESTAMP(3) NOT NULL,
      "executedAt" TIMESTAMP(3),
      "nextRunAt" TIMESTAMP(3),
      "config" TEXT NOT NULL DEFAULT '{}',
      "attempts" INTEGER NOT NULL DEFAULT 0,
      "maxAttempts" INTEGER NOT NULL DEFAULT 3,
      "lastError" TEXT,
      "result" TEXT,
      "isRecurring" BOOLEAN NOT NULL DEFAULT false,
      "recurrencePattern" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      "createdBy" TEXT
    );

    -- Create indexes
    CREATE INDEX "scheduled_jobs_status_scheduledFor_idx" ON "scheduled_jobs"("status", "scheduledFor");
    CREATE INDEX "scheduled_jobs_type_status_idx" ON "scheduled_jobs"("type", "status");
    CREATE INDEX "scheduled_jobs_scheduledFor_idx" ON "scheduled_jobs"("scheduledFor");

    RAISE NOTICE '✅ Created scheduled_jobs table and indexes';
  ELSE
    RAISE NOTICE 'ℹ️ scheduled_jobs table already exists';
  END IF;
END $$;

-- Verify the table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'scheduled_jobs'
ORDER BY ordinal_position;

