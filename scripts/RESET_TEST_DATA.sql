-- Reset Test Data Script
-- This script deletes all user data and creates fresh test users
-- WARNING: This will delete ALL users, organisations, and related data!

-- First, delete all related data (in correct order due to foreign keys)
-- Using DO block to handle tables that might not exist gracefully
DO $$
BEGIN
    -- Delete in order of dependencies (child tables first)
    DELETE FROM private_league_requests WHERE true;
    DELETE FROM private_league_stats WHERE true;
    DELETE FROM private_league_members WHERE true;
    DELETE FROM private_leagues WHERE true;
    DELETE FROM organisation_group_members WHERE true;
    DELETE FROM leaderboard_members WHERE true;
    DELETE FROM leaderboards WHERE true;
    DELETE FROM organisation_groups WHERE true;
    DELETE FROM organisation_members WHERE true;
    DELETE FROM user_profiles WHERE true;
    DELETE FROM users WHERE true;
    DELETE FROM organisations WHERE true;
    
    RAISE NOTICE '✅ Deleted all existing data';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Some tables may not exist, continuing...';
END $$;

-- Reset sequences if using auto-increment IDs (PostgreSQL)
-- Note: This is for PostgreSQL. Adjust for your database if needed.

-- Now create a fresh premium test user
DO $$
DECLARE
    user_id TEXT;
    org_id TEXT;
BEGIN
    -- Create premium test user FIRST (needed for organisation ownerUserId)
    INSERT INTO users (
        id,
        email,
        name,
        tier,
        "subscriptionStatus",
        "subscriptionPlan",
        "emailVerified",
        "signupMethod",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
        'premium@test.com',
        'Premium Test User',
        'premium',
        'ACTIVE',
        'PREMIUM_ANNUAL',
        true,
        'email',
        NOW(),
        NOW()
    )
    RETURNING id INTO user_id;
    
    RAISE NOTICE '✅ Created premium user: premium@test.com (ID: %)', user_id;
    
    -- Create test organisation (requires ownerUserId)
    INSERT INTO organisations (
        id,
        name,
        "ownerUserId",
        status,
        plan,
        "maxSeats",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
        'Test School',
        user_id,
        'ACTIVE',
        'ORG_ANNUAL',
        50,
        NOW(),
        NOW()
    )
    RETURNING id INTO org_id;
    
    RAISE NOTICE '✅ Created organisation: Test School (ID: %)', org_id;
    
    -- Create user profile
    INSERT INTO user_profiles (
        "userId",
        "displayName",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        user_id,
        'Premium User',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE '✅ Created user profile';
    
    -- Link user to organisation
    INSERT INTO organisation_members (
        id,
        "organisationId",
        "userId",
        role,
        status,
        "createdAt",
        "updatedAt"
    )
    VALUES (
        'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
        org_id,
        user_id,
        'OWNER',
        'ACTIVE',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE '✅ Linked user to organisation';
    
    RAISE NOTICE '';
    RAISE NOTICE '📝 Test User Created:';
    RAISE NOTICE '   Email: premium@test.com';
    RAISE NOTICE '   Tier: premium';
    RAISE NOTICE '   Subscription Status: ACTIVE';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: Run the following command to set the password:';
    RAISE NOTICE '   pnpm tsx scripts/set-test-user-password.ts';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Test data reset complete!';
END $$;

