#!/bin/bash

# Database Setup Script for The School Quiz
# This script helps set up the database for development

echo "🗄️  Setting up The School Quiz Database"
echo "========================================"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set your DATABASE_URL in your .env file:"
    echo "DATABASE_URL=\"postgresql://username:password@localhost:5432/schoolquiz\""
    echo ""
    echo "For local development, you can use:"
    echo "1. Docker: docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres"
    echo "2. Cloud database: Supabase, Railway, or Neon"
    echo "3. Local PostgreSQL installation"
    echo ""
    exit 1
fi

echo "✅ DATABASE_URL is set"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd packages/db
pnpm db:generate

# Run database migrations
echo "📊 Running database migrations..."
pnpm db:migrate

# Seed the database
echo "🌱 Seeding database with sample data..."
pnpm db:seed

echo ""
echo "🎉 Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the admin app: cd apps/admin && pnpm dev"
echo "2. Visit http://localhost:3007/dashboard"
echo "3. Start the web app: cd apps/web && pnpm dev"
echo "4. Visit http://localhost:4324"
echo ""

