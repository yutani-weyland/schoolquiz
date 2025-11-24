-- Create user Andrew Fong with organisation St Augustine's College
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  org_id TEXT;
  user_id TEXT;
  user_profile_exists BOOLEAN;
BEGIN
  -- Step 1: Create or get the organisation "St Augustine's College"
  SELECT id INTO org_id 
  FROM organisations 
  WHERE name = 'St Augustine''s College'
  LIMIT 1;
  
  IF org_id IS NULL THEN
    -- Create the organisation (we'll need a user ID first, so we'll create a temporary owner)
    -- First, check if there's any existing user we can use as owner
    SELECT id INTO user_id FROM users LIMIT 1;
    
    IF user_id IS NULL THEN
      -- Create a temporary system user as owner
      INSERT INTO users (id, email, name, tier, "emailVerified", "createdAt", "updatedAt")
      VALUES (
        'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 23),
        'system@schoolquiz.com',
        'System',
        'premium',
        true,
        NOW(),
        NOW()
      )
      RETURNING id INTO user_id;
    END IF;
    
    -- Create the organisation
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
      user_id,
      'ORG_ANNUAL',
      'ACTIVE',
      100,
      NOW(),
      NOW()
    )
    RETURNING id INTO org_id;
    
    RAISE NOTICE '✅ Created organisation: St Augustine''s College (ID: %)', org_id;
  ELSE
    RAISE NOTICE '✅ Organisation already exists: St Augustine''s College (ID: %)', org_id;
  END IF;
  
  -- Step 2: Create or update user Andrew Fong
  SELECT id INTO user_id 
  FROM users 
  WHERE email = 'andrew@sac.com.au'
  LIMIT 1;
  
  IF user_id IS NULL THEN
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
      'andrew@sac.com.au',
      'Andrew Fong',
      'premium',
      'ACTIVE',
      'PREMIUM_ANNUAL',
      true,
      'email',
      NOW(),
      NOW()
    )
    RETURNING id INTO user_id;
    
    RAISE NOTICE '✅ Created user: Andrew Fong (ID: %)', user_id;
  ELSE
    -- Update existing user to premium
    UPDATE users
    SET 
      name = 'Andrew Fong',
      tier = 'premium',
      "subscriptionStatus" = 'ACTIVE',
      "subscriptionPlan" = 'PREMIUM_ANNUAL',
      "emailVerified" = true,
      "updatedAt" = NOW()
    WHERE id = user_id;
    
    RAISE NOTICE '✅ Updated user to premium: Andrew Fong (ID: %)', user_id;
  END IF;
  
  -- Step 3: Create or update user profile with display name
  SELECT EXISTS(SELECT 1 FROM user_profiles WHERE "userId" = user_id) INTO user_profile_exists;
  
  IF user_profile_exists THEN
    UPDATE user_profiles
    SET 
      "displayName" = 'Mr Fong',
      "updatedAt" = NOW()
    WHERE "userId" = user_id;
    
    RAISE NOTICE '✅ Updated user profile display name to: Mr Fong';
  ELSE
    INSERT INTO user_profiles (
      "userId",
      "displayName",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      user_id,
      'Mr Fong',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Created user profile with display name: Mr Fong';
  END IF;
  
  -- Step 4: Link user to organisation as ACTIVE member
  IF NOT EXISTS (
    SELECT 1 FROM organisation_members 
    WHERE "organisationId" = org_id AND "userId" = user_id
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
      user_id,
      'TEACHER',
      'ACTIVE',
      NOW(),
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Added user to organisation as ACTIVE member';
  ELSE
    -- Update existing membership to ACTIVE
    UPDATE organisation_members
    SET 
      status = 'ACTIVE',
      role = 'TEACHER',
      "seatAssignedAt" = COALESCE("seatAssignedAt", NOW()),
      "updatedAt" = NOW()
    WHERE "organisationId" = org_id AND "userId" = user_id;
    
    RAISE NOTICE '✅ Updated organisation membership to ACTIVE';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Setup complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 User Details:';
  RAISE NOTICE '   Email: andrew@sac.com.au';
  RAISE NOTICE '   Password: abc123';
  RAISE NOTICE '   Name: Andrew Fong';
  RAISE NOTICE '   Display Name: Mr Fong';
  RAISE NOTICE '   Tier: premium';
  RAISE NOTICE '   Organisation: St Augustine''s College';
  RAISE NOTICE '';
  
END $$;

-- Verify the setup
SELECT 
  u.id,
  u.email,
  u.name,
  u.tier,
  up."displayName",
  o.name as organisation_name,
  om.status as org_membership_status,
  om.role as org_role
FROM users u
LEFT JOIN user_profiles up ON up."userId" = u.id
LEFT JOIN organisation_members om ON om."userId" = u.id
LEFT JOIN organisations o ON o.id = om."organisationId"
WHERE u.email = 'andrew@sac.com.au';

