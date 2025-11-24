-- Simple query to check if test leagues exist
SELECT 
    pl.name,
    pl."inviteCode",
    o.name as organisation_name,
    u.email as creator_email,
    (SELECT COUNT(*) FROM private_league_members plm WHERE plm."leagueId" = pl.id AND plm."leftAt" IS NULL) as member_count
FROM private_leagues pl
LEFT JOIN organisations o ON o.id = pl."organisationId"
LEFT JOIN users u ON u.id = pl."createdByUserId"
WHERE pl."deletedAt" IS NULL
ORDER BY pl."createdAt" DESC;

