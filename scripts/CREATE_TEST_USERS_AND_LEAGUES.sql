-- Create a league with 20 users for St Augustine's College
-- This script creates 20 users and one league with all of them as members
-- 
-- IMPORTANT: Run CLEANUP_TEST_LEAGUES.sql first to remove old test leagues

-- First, get the organization ID for St Augustine's College
DO $$
DECLARE
    org_id TEXT;
    creator_user_id TEXT;
    league_id TEXT;
    user_ids TEXT[] := ARRAY[]::TEXT[];
    i INTEGER;
    user_id TEXT;
    owner_user_id TEXT;
    member_names TEXT[] := ARRAY[
        'Alice Smith', 'Bob Johnson', 'Charlie Brown', 'Diana Prince', 'Ethan Hunt',
        'Fiona Green', 'George White', 'Hannah Black', 'Ian Gray', 'Julia Red',
        'Kevin Blue', 'Laura Pink', 'Mike Orange', 'Nina Purple', 'Oscar Yellow',
        'Paula Cyan', 'Quinn Magenta', 'Rachel Teal', 'Sam Indigo', 'Tina Violet'
    ];
    first_names TEXT[] := ARRAY[
        'Alice', 'Bob', 'Charlie', 'Diana', 'Ethan',
        'Fiona', 'George', 'Hannah', 'Ian', 'Julia',
        'Kevin', 'Laura', 'Mike', 'Nina', 'Oscar',
        'Paula', 'Quinn', 'Rachel', 'Sam', 'Tina'
    ];
BEGIN
    -- Get or create organization
    SELECT id INTO org_id FROM organisations WHERE name = 'St Augustine''s College' LIMIT 1;
    
    IF org_id IS NULL THEN
        -- Need an owner user to create the organization
        -- First, try to find any existing user
        SELECT id INTO owner_user_id FROM users LIMIT 1;
        
        IF owner_user_id IS NULL THEN
            -- Create a temporary system user as owner
            INSERT INTO users (
                id,
                email,
                name,
                tier,
                "emailVerified",
                "createdAt",
                "updatedAt"
            )
            VALUES (
                'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
                'system@schoolquiz.com',
                'System',
                'premium',
                true,
                NOW(),
                NOW()
            )
            RETURNING id INTO owner_user_id;
        END IF;
        
        -- Create the organization
        INSERT INTO organisations (
            id,
            name,
            "emailDomain",
            "ownerUserId",
            plan,
            status,
            "maxSeats",
            "createdAt",
            "updatedAt"
        )
        VALUES (
            'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
            'St Augustine''s College',
            'sac.com.au',
            owner_user_id,
            'ORG_ANNUAL',
            'ACTIVE',
            100,
            NOW(),
            NOW()
        )
        RETURNING id INTO org_id;
        
        RAISE NOTICE 'Created organization "St Augustine''s College" (ID: %)', org_id;
    END IF;
    
    -- Get or create a creator user (first user will be the creator)
    SELECT id INTO creator_user_id FROM users WHERE email = 'league.creator@sac.com.au' LIMIT 1;
    
    IF creator_user_id IS NULL THEN
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
            'league.creator@sac.com.au',
            'League Creator',
            'premium',
            'ACTIVE',
            'email',
            true,
            NOW(),
            NOW()
        )
        RETURNING id INTO creator_user_id;
        
        INSERT INTO user_profiles (
            "userId",
            "displayName",
            "createdAt",
            "updatedAt"
        )
        VALUES (
            creator_user_id,
            'Creator',
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
            creator_user_id,
            'TEACHER',
            'ACTIVE',
            NOW(),
            NOW()
        );
    END IF;
    
    user_ids := ARRAY[creator_user_id];
    
    -- ============================================
    -- Create 19 Additional Users (20 total including creator)
    -- ============================================
    
    FOR i IN 1..19 LOOP
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
            'cl' || substr(md5(random()::text || clock_timestamp()::text || i::text), 1, 23),
            lower(replace(member_names[i], ' ', '.')) || '@sac.com.au',
            member_names[i],
            'premium',
            'ACTIVE',
            'email',
            true,
            'STUDENT',
            NOW(),
            NOW()
        )
        RETURNING id INTO user_id;
        
        user_ids := array_append(user_ids, user_id);
        
        INSERT INTO user_profiles (
            "userId",
            "displayName",
            "createdAt",
            "updatedAt"
        )
        VALUES (
            user_id,
            first_names[i],
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
            'cl' || substr(md5(random()::text || clock_timestamp()::text || i::text), 1, 23),
            org_id,
            user_id,
            'TEACHER',
            'ACTIVE',
            NOW(),
            NOW()
        );
    END LOOP;
    
    -- ============================================
    -- Create One League with All 20 Users
    -- ============================================
    
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
        'Champions League',
        'A competitive league with 20 active members',
        creator_user_id,
        org_id,
        'CHAMP2024',
        50,
        NOW(),
        NOW()
    )
    RETURNING id INTO league_id;
    
    -- Add all 20 users as members
    FOR i IN 1..20 LOOP
        INSERT INTO private_league_members (
            id,
            "leagueId",
            "userId",
            "joinedAt",
            "createdAt",
            "updatedAt"
        )
        VALUES (
            'cl' || substr(md5(random()::text || clock_timestamp()::text || i::text || 'member'), 1, 23),
            league_id,
            user_ids[i],
            NOW() - (i || ' minutes')::INTERVAL, -- Stagger join times for realism
            NOW(),
            NOW()
        );
    END LOOP;
    
    RAISE NOTICE 'Successfully created league with 20 users!';
    RAISE NOTICE 'League: Champions League (ID: %)', league_id;
    RAISE NOTICE 'Members: 20 users added';
END $$;
