-- Create test users and leagues for St Augustine's College
-- This script creates multiple users and leagues for comprehensive testing

-- First, get the organization ID for St Augustine's College
DO $$
DECLARE
    org_id TEXT;
    user_id_1 TEXT;
    user_id_2 TEXT;
    user_id_3 TEXT;
    user_id_4 TEXT;
    user_id_5 TEXT;
    league_id_1 TEXT;
    league_id_2 TEXT;
    league_id_3 TEXT;
    league_id_4 TEXT;
BEGIN
    -- Get organization ID
    SELECT id INTO org_id FROM organisations WHERE name = 'St Augustine''s College' LIMIT 1;
    
    IF org_id IS NULL THEN
        RAISE EXCEPTION 'Organization "St Augustine''s College" not found. Please create it first.';
    END IF;

    -- ============================================
    -- Create Test Users
    -- ============================================

    -- User 1: Sarah Johnson (Teacher)
    INSERT INTO users (
        id,
        email,
        name,
        "tier",
        "subscriptionStatus",
        "signupMethod",
        "emailVerified",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
        'sarah.johnson@sac.com.au',
        'Sarah Johnson',
        'premium',
        'ACTIVE',
        'email',
        true,
        NOW(),
        NOW()
    )
    RETURNING id INTO user_id_1;

    INSERT INTO user_profiles (
        "userId",
        "displayName",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        user_id_1,
        'Ms Johnson',
        NOW(),
        NOW()
    );

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
        user_id_1,
        'TEACHER',
        'ACTIVE',
        NOW(),
        NOW()
    );

    -- User 2: James Wilson (Teacher)
    INSERT INTO users (
        id,
        email,
        name,
        "tier",
        "subscriptionStatus",
        "signupMethod",
        "emailVerified",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
        'james.wilson@sac.com.au',
        'James Wilson',
        'premium',
        'ACTIVE',
        'email',
        true,
        NOW(),
        NOW()
    )
    RETURNING id INTO user_id_2;

    INSERT INTO user_profiles (
        "userId",
        "displayName",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        user_id_2,
        'Mr Wilson',
        NOW(),
        NOW()
    );

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
        user_id_2,
        'TEACHER',
        'ACTIVE',
        NOW(),
        NOW()
    );

    -- User 3: Emma Davis (Student - using TEACHER role as that's the only valid org member role)
    INSERT INTO users (
        id,
        email,
        name,
        "tier",
        "subscriptionStatus",
        "signupMethod",
        "emailVerified",
        "platformRole",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
        'emma.davis@sac.com.au',
        'Emma Davis',
        'premium',
        'ACTIVE',
        'email',
        true,
        'STUDENT',
        NOW(),
        NOW()
    )
    RETURNING id INTO user_id_3;

    INSERT INTO user_profiles (
        "userId",
        "displayName",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        user_id_3,
        'Emma',
        NOW(),
        NOW()
    );

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
        user_id_3,
        'TEACHER',
        'ACTIVE',
        NOW(),
        NOW()
    );

    -- User 4: Tom Anderson (Student - using TEACHER role as that's the only valid org member role)
    INSERT INTO users (
        id,
        email,
        name,
        "tier",
        "subscriptionStatus",
        "signupMethod",
        "emailVerified",
        "platformRole",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
        'tom.anderson@sac.com.au',
        'Tom Anderson',
        'premium',
        'ACTIVE',
        'email',
        true,
        'STUDENT',
        NOW(),
        NOW()
    )
    RETURNING id INTO user_id_4;

    INSERT INTO user_profiles (
        "userId",
        "displayName",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        user_id_4,
        'Tom',
        NOW(),
        NOW()
    );

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
        user_id_4,
        'TEACHER',
        'ACTIVE',
        NOW(),
        NOW()
    );

    -- User 5: Lisa Chen (Teacher)
    INSERT INTO users (
        id,
        email,
        name,
        "tier",
        "subscriptionStatus",
        "signupMethod",
        "emailVerified",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
        'lisa.chen@sac.com.au',
        'Lisa Chen',
        'premium',
        'ACTIVE',
        'email',
        true,
        NOW(),
        NOW()
    )
    RETURNING id INTO user_id_5;

    INSERT INTO user_profiles (
        "userId",
        "displayName",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        user_id_5,
        'Ms Chen',
        NOW(),
        NOW()
    );

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
        user_id_5,
        'TEACHER',
        'ACTIVE',
        NOW(),
        NOW()
    );

    -- ============================================
    -- Create Test Leagues
    -- ============================================

    -- League 1: "Mathletes" by Sarah Johnson
    INSERT INTO private_leagues (
        id,
        name,
        description,
        "createdByUserId",
        "organisationId",
        "inviteCode",
        "maxMembers",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
        'Mathletes',
        'For students who love mathematics and want to compete',
        user_id_1,
        org_id,
        'MATH2024',
        30,
        NOW(),
        NOW()
    )
    RETURNING id INTO league_id_1;

    -- Add creator as member
    INSERT INTO private_league_members (
        id,
        "leagueId",
        "userId",
        "joinedAt",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
        league_id_1,
        user_id_1,
        NOW(),
        NOW(),
        NOW()
    );

    -- League 2: "History Buffs" by James Wilson
    INSERT INTO private_leagues (
        id,
        name,
        description,
        "createdByUserId",
        "organisationId",
        "inviteCode",
        "maxMembers",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
        'History Buffs',
        'A league for history enthusiasts',
        user_id_2,
        org_id,
        'HIST2024',
        25,
        NOW(),
        NOW()
    )
    RETURNING id INTO league_id_2;

    -- Add creator as member
    INSERT INTO private_league_members (
        id,
        "leagueId",
        "userId",
        "joinedAt",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
        league_id_2,
        user_id_2,
        NOW(),
        NOW(),
        NOW()
    );

    -- Add Emma as member
    INSERT INTO private_league_members (
        id,
        "leagueId",
        "userId",
        "joinedAt",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
        league_id_2,
        user_id_3,
        NOW(),
        NOW(),
        NOW()
    );

    -- League 3: "Science Squad" by Lisa Chen
    INSERT INTO private_leagues (
        id,
        name,
        description,
        "createdByUserId",
        "organisationId",
        "inviteCode",
        "maxMembers",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
        'Science Squad',
        'Competitive science quiz league',
        user_id_5,
        org_id,
        'SCI2024',
        40,
        NOW(),
        NOW()
    )
    RETURNING id INTO league_id_3;

    -- Add creator as member
    INSERT INTO private_league_members (
        id,
        "leagueId",
        "userId",
        "joinedAt",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
        league_id_3,
        user_id_5,
        NOW(),
        NOW(),
        NOW()
    );

    -- Add Tom as member
    INSERT INTO private_league_members (
        id,
        "leagueId",
        "userId",
        "joinedAt",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
        league_id_3,
        user_id_4,
        NOW(),
        NOW(),
        NOW()
    );

    -- League 4: "Year 10 Champions" by Max Burgess (already exists, but let's add more members)
    -- First, find Max's league "Lads"
    SELECT id INTO league_id_4 FROM private_leagues 
    WHERE name = 'Lads' AND "organisationId" = org_id 
    LIMIT 1;

    -- ============================================
    -- Create Join Requests (for testing)
    -- ============================================

    -- Request 1: Tom wants to join Mathletes (created by Sarah)
    INSERT INTO private_league_requests (
        id,
        "leagueId",
        "userId",
        status,
        "requestedAt",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
        league_id_1,
        user_id_4,
        'PENDING',
        NOW(),
        NOW(),
        NOW()
    );

    -- Request 2: Emma wants to join Science Squad (created by Lisa)
    INSERT INTO private_league_requests (
        id,
        "leagueId",
        "userId",
        status,
        "requestedAt",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
        league_id_3,
        user_id_3,
        'PENDING',
        NOW(),
        NOW(),
        NOW()
    );

    -- Request 3: Tom wants to join History Buffs (created by James)
    INSERT INTO private_league_requests (
        id,
        "leagueId",
        "userId",
        status,
        "requestedAt",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
        league_id_2,
        user_id_4,
        'PENDING',
        NOW(),
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Successfully created test users and leagues!';
    RAISE NOTICE 'Users created: Sarah Johnson, James Wilson, Emma Davis, Tom Anderson, Lisa Chen';
    RAISE NOTICE 'Leagues created: Mathletes, History Buffs, Science Squad';
    RAISE NOTICE 'Join requests created: 3 pending requests';
END $$;

