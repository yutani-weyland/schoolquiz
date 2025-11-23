#!/bin/bash
echo "Setting up database for private leagues..."
echo ""
echo "Make sure DATABASE_URL is set in .env.local first!"
echo ""
read -p "Press enter when DATABASE_URL is set..."
cd packages/db
npx prisma migrate dev --name add_private_leagues
npx prisma generate
echo ""
echo "✅ Database setup complete! Restart your dev server."
