#!/bin/bash

# Script to apply teams migrations to Supabase
# This applies migrations 017 and 018 which add teams support

echo "🚀 Applying Teams Migrations to Supabase"
echo "=========================================="
echo ""
echo "This script will apply:"
echo "  - Migration 017: Add Teams feature"
echo "  - Migration 018: Add Teams to Private Leagues"
echo ""
echo "⚠️  Make sure your DATABASE_URL is set in your .env file"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set your DATABASE_URL in your .env file"
    echo "For Supabase, it should look like:"
    echo 'DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"'
    echo ""
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed"
    echo ""
    echo "You have two options:"
    echo ""
    echo "Option 1: Install psql (recommended)"
    echo "  macOS: brew install postgresql"
    echo ""
    echo "Option 2: Apply migrations manually via Supabase Dashboard"
    echo "  1. Go to https://supabase.com/dashboard"
    echo "  2. Select your project"
    echo "  3. Click 'SQL Editor' in the left sidebar"
    echo "  4. Click 'New query'"
    echo "  5. Copy and paste the contents of:"
    echo "     - supabase/migrations/017_add_teams_feature.sql"
    echo "     - supabase/migrations/018_add_teams_to_private_leagues.sql"
    echo "  6. Click 'Run' (or press Cmd/Ctrl + Enter)"
    echo ""
    exit 1
fi

echo "📊 Applying migration 017: Add Teams feature..."
psql "$DATABASE_URL" -f supabase/migrations/017_add_teams_feature.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration 017 applied successfully"
else
    echo "❌ Migration 017 failed"
    exit 1
fi

echo ""
echo "📊 Applying migration 018: Add Teams to Private Leagues..."
psql "$DATABASE_URL" -f supabase/migrations/018_add_teams_to_private_leagues.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration 018 applied successfully"
else
    echo "❌ Migration 018 failed"
    exit 1
fi

echo ""
echo "🎉 All migrations applied successfully!"
echo ""
echo "Next steps:"
echo "  1. The Prisma client has already been regenerated"
echo "  2. Try creating a league with teams again"
echo ""
