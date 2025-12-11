-- Cleanup script to remove test leagues and their associated data
-- This removes leagues like "Mathletes", "History Buffs", "Science Squad" etc.

DO $$
DECLARE
    deleted_leagues INTEGER := 0;
    deleted_members INTEGER := 0;
    deleted_requests INTEGER := 0;
BEGIN
    -- Delete join requests for test leagues
    DELETE FROM private_league_requests
    WHERE "leagueId" IN (
        SELECT id FROM private_leagues 
        WHERE name IN ('Mathletes', 'History Buffs', 'Science Squad', 'Test League', 'Demo League')
        OR name LIKE '%Test%'
        OR name LIKE '%test%'
    );
    
    GET DIAGNOSTICS deleted_requests = ROW_COUNT;
    
    -- Delete league members for test leagues
    DELETE FROM private_league_members
    WHERE "leagueId" IN (
        SELECT id FROM private_leagues 
        WHERE name IN ('Mathletes', 'History Buffs', 'Science Squad', 'Test League', 'Demo League')
        OR name LIKE '%Test%'
        OR name LIKE '%test%'
    );
    
    GET DIAGNOSTICS deleted_members = ROW_COUNT;
    
    -- Delete the test leagues themselves
    DELETE FROM private_leagues
    WHERE name IN ('Mathletes', 'History Buffs', 'Science Squad', 'Test League', 'Demo League')
    OR name LIKE '%Test%'
    OR name LIKE '%test%';
    
    GET DIAGNOSTICS deleted_leagues = ROW_COUNT;
    
    RAISE NOTICE 'Cleanup complete!';
    RAISE NOTICE 'Deleted % test leagues', deleted_leagues;
    RAISE NOTICE 'Deleted % league members', deleted_members;
    RAISE NOTICE 'Deleted % join requests', deleted_requests;
END $$;
