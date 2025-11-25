#!/bin/bash

# Script to check if DATABASE_URL is using connection pooler

echo "🔍 Checking DATABASE_URL configuration..."
echo ""

# Try to read from root .env.local first, then apps/admin/.env.local
if [ -f ".env.local" ]; then
  DATABASE_URL=$(grep "^DATABASE_URL=" .env.local | cut -d '=' -f2- | tr -d '"')
elif [ -f "apps/admin/.env.local" ]; then
  DATABASE_URL=$(grep "^DATABASE_URL=" apps/admin/.env.local | cut -d '=' -f2- | tr -d '"')
else
  echo "❌ Could not find .env.local file"
  echo "   Please create it in the project root or apps/admin/"
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not found in .env.local"
  exit 1
fi

echo "📋 Current DATABASE_URL:"
echo "   ${DATABASE_URL:0:80}..."
echo ""

# Check if it's using connection pooler
if echo "$DATABASE_URL" | grep -q "pooler.supabase.com" && echo "$DATABASE_URL" | grep -q ":6543"; then
  echo "✅ Using Connection Pooler (OPTIMIZED)"
  echo "   - Host: pooler.supabase.com"
  echo "   - Port: 6543"
  echo ""
  echo "✨ Your connection is optimized for performance!"
elif echo "$DATABASE_URL" | grep -q "db.*\.supabase\.co" && echo "$DATABASE_URL" | grep -q ":5432"; then
  echo "⚠️  Using Direct Connection (NOT OPTIMIZED)"
  echo "   - Host: db.*.supabase.co"
  echo "   - Port: 5432"
  echo ""
  echo "🔧 To optimize:"
  echo "   1. Go to Supabase Dashboard → Settings → Database"
  echo "   2. Click 'Connection pooling' tab"
  echo "   3. Select 'Transaction' mode"
  echo "   4. Copy the connection string"
  echo "   5. Update DATABASE_URL in .env.local"
  echo "   6. Run: pnpm sync-env"
else
  echo "❓ Unknown connection type"
  echo "   Make sure you're using Supabase connection pooling for best performance"
fi

echo ""
echo "📚 See docs/OPTIMIZE_DATABASE_CONNECTION.md for detailed instructions"

