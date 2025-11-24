-- Verify test leagues and Andrew's organization membership
-- Run this to check if everything is set up correctly

-- Check Andrew's organization membership
SELECT 
    u.email,
    u.name,
    u.tier,
    o.name as organisation_name,
    om.status as membership_status,
    om.role as membership_role
FROM users u
LEFT JOIN organisation_members om ON om."userId" = u.id
LEFT JOIN organisations o ON o.id = om."organisationId"
WHERE u.email = 'andrew@sac.com.au';

-- Check all leagues in St Augustine's College
SELECT 
    pl.id,
    pl.name,
    pl.description,
    pl."inviteCode",
    pl."organisationId",
    o.name as organisation_name,
    u.email as creator_email,
    u.name as creator_name,
    (SELECT COUNT(*) FROM private_league_members plm WHERE plm."leagueId" = pl.id AND plm."leftAt" IS NULL) as member_count
FROM private_leagues pl
LEFT JOIN organisations o ON o.id = pl."organisationId"
LEFT JOIN users u ON u.id = pl."createdByUserId"
WHERE o.name = 'St Augustine''s College' 
  AND pl."deletedAt" IS NULL
ORDER BY pl."createdAt" DESC;

-- Check if Andrew is a member of any leagues
SELECT 
    pl.name as league_name,
    plm."joinedAt",
    plm."leftAt"
FROM private_league_members plm
JOIN private_leagues pl ON pl.id = plm."leagueId"
JOIN users u ON u.id = plm."userId"
WHERE u.email = 'andrew@sac.com.au'
  AND pl."deletedAt" IS NULL;

-- Check which leagues Andrew created
SELECT 
    pl.name,
    pl."inviteCode"
FROM private_leagues pl
JOIN users u ON u.id = pl."createdByUserId"
WHERE u.email = 'andrew@sac.com.au'
  AND pl."deletedAt" IS NULL;

