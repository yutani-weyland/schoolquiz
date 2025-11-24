-- Create user Max Burgess with a private league "Lads" in St Augustine's College
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  org_id TEXT;
  max_user_id TEXT;
  league_id TEXT;
  invite_code TEXT;
BEGIN
  -- Step 1: Get St Augustine's College organisation
  SELECT id INTO org_id 
  FROM organisations 
  WHERE name = 'St Augustine''s College'
  LIMIT 1;
  
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Organisation "St Augustine''s College" not found. Please run CREATE_ANDREW_FONG_USER.sql first.';
  END IF;
  
  RAISE NOTICE '✅ Found organisation: St Augustine''s College (ID: %)', org_id;
  
  -- Step 2: Create or get user Max Burgess
  SELECT id INTO max_user_id 
  FROM users 
  WHERE email = 'max.burgess@sac.com.au'
  LIMIT 1;
  
  IF max_user_id IS NULL THEN
    -- Create new user
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
      'max.burgess@sac.com.au',
      'Max Burgess',
      'premium',
      'ACTIVE',
      'PREMIUM_ANNUAL',
      true,
      'email',
      NOW(),
      NOW()
    )
    RETURNING id INTO max_user_id;
    
    RAISE NOTICE '✅ Created user: Max Burgess (ID: %)', max_user_id;
  ELSE
    -- Update existing user to premium
    UPDATE users
    SET 
      name = 'Max Burgess',
      tier = 'premium',
      "subscriptionStatus" = 'ACTIVE',
      "subscriptionPlan" = 'PREMIUM_ANNUAL',
      "emailVerified" = true,
      "updatedAt" = NOW()
    WHERE id = max_user_id;
    
    RAISE NOTICE '✅ Updated user to premium: Max Burgess (ID: %)', max_user_id;
  END IF;
  
  -- Step 3: Link Max to organisation as ACTIVE member
  IF NOT EXISTS (
    SELECT 1 FROM organisation_members 
    WHERE "organisationId" = org_id AND "userId" = max_user_id
  ) THEN
    INSERT INTO organisation_members (
      id,
      "organisationId",
      "userId",
      role,
      status,
      "seatAssignedAt",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
      org_id,
      max_user_id,
      'TEACHER',
      'ACTIVE',
      NOW(),
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Added Max to organisation as ACTIVE member';
  ELSE
    -- Update existing membership to ACTIVE
    UPDATE organisation_members
    SET 
      status = 'ACTIVE',
      role = 'TEACHER',
      "seatAssignedAt" = COALESCE("seatAssignedAt", NOW()),
      "updatedAt" = NOW()
    WHERE "organisationId" = org_id AND "userId" = max_user_id;
    
    RAISE NOTICE '✅ Updated Max''s organisation membership to ACTIVE';
  END IF;
  
  -- Step 4: Generate unique invite code
  invite_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  
  -- Ensure invite code is unique
  WHILE EXISTS (SELECT 1 FROM private_leagues WHERE "inviteCode" = invite_code) LOOP
    invite_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  END LOOP;
  
  -- Step 5: Create "Lads" league
  IF NOT EXISTS (
    SELECT 1 FROM private_leagues 
    WHERE name = 'Lads' AND "createdByUserId" = max_user_id AND "deletedAt" IS NULL
  ) THEN
    INSERT INTO private_leagues (
      id,
      name,
      description,
      "createdByUserId",
      "inviteCode",
      "organisationId",
      "maxMembers",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
      'Lads',
      'A league for the lads',
      max_user_id,
      invite_code,
      org_id,
      50,
      NOW(),
      NOW()
    )
    RETURNING id INTO league_id;
    
    RAISE NOTICE '✅ Created league: Lads (ID: %, Invite Code: %)', league_id, invite_code;
    
    -- Step 6: Add Max as a member of his own league
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
      league_id,
      max_user_id,
      NOW(),
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Added Max as member of his league';
  ELSE
    RAISE NOTICE '⚠️  League "Lads" already exists for Max Burgess';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Setup complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Max Burgess Details:';
  RAISE NOTICE '   Email: max.burgess@sac.com.au';
  RAISE NOTICE '   Password: abc123';
  RAISE NOTICE '   Name: Max Burgess';
  RAISE NOTICE '   Tier: premium';
  RAISE NOTICE '   Organisation: St Augustine''s College';
  RAISE NOTICE '   League: Lads';
  RAISE NOTICE '';
  
END $$;

-- Verify the setup
SELECT 
  u.id,
  u.email,
  u.name,
  u.tier,
  o.name as organisation_name,
  om.status as org_membership_status,
  pl.name as league_name,
  pl."inviteCode" as league_invite_code
FROM users u
LEFT JOIN organisation_members om ON om."userId" = u.id
LEFT JOIN organisations o ON o.id = om."organisationId"
LEFT JOIN private_leagues pl ON pl."createdByUserId" = u.id AND pl."deletedAt" IS NULL
WHERE u.email = 'max.burgess@sac.com.au';

