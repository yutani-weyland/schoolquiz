-- Check ALL leagues in the database to see what exists
SELECT 
    pl.id,
    pl.name,
    pl.description,
    pl."inviteCode",
    pl."organisationId",
    o.name as organisation_name,
    u.email as creator_email,
    u.name as creator_name,
    pl."createdAt",
    (SELECT COUNT(*) FROM private_league_members plm WHERE plm."leagueId" = pl.id AND plm."leftAt" IS NULL) as member_count
FROM private_leagues pl
LEFT JOIN organisations o ON o.id = pl."organisationId"
LEFT JOIN users u ON u.id = pl."createdByUserId"
WHERE pl."deletedAt" IS NULL
ORDER BY pl."createdAt" DESC;

-- Check all organizations
SELECT id, name FROM organisations ORDER BY name;

-- Check if the test users exist
SELECT 
    u.email,
    u.name,
    u.tier,
    o.name as organisation_name,
    om.status as membership_status
FROM users u
LEFT JOIN organisation_members om ON om."userId" = u.id
LEFT JOIN organisations o ON o.id = om."organisationId"
WHERE u.email IN (
    'sarah.johnson@sac.com.au',
    'james.wilson@sac.com.au',
    'emma.davis@sac.com.au',
    'tom.anderson@sac.com.au',
    'lisa.chen@sac.com.au',
    'andrew@sac.com.au',
    'max.burgess@sac.com.au'
)
ORDER BY u.email;

