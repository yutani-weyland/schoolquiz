# 🚀 Quick Setup Guide

I've created `.env.local` for you. Now you need to set up a database.

## Easiest Option: Supabase (Free Cloud Database) ⭐

1. **Go to https://supabase.com** and sign up/login
2. **Create a new project**:
   - Click "New Project"
   - Name it "schoolquiz" (or any name)
   - Set a database password (save this!)
   - Choose a region close to you
   - Wait ~2 minutes for setup

3. **Get your connection string**:
   - Go to **Project Settings** → **Database**
   - Scroll to **Connection string** section
   - Copy the **URI** connection string
   - It looks like: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

4. **Update `.env.local`**:
   ```bash
   # Replace the DATABASE_URL line with your Supabase connection string
   DATABASE_URL="your-supabase-connection-string-here"
   ```

5. **Run the migration**:
   ```bash
   cd packages/db
   npx prisma migrate deploy
   ```

6. **Start the app**:
   ```bash
   cd apps/admin
   pnpm dev
   ```

## Alternative: Local PostgreSQL

If you prefer local development:

```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb schoolquiz

# Update .env.local DATABASE_URL to:
# DATABASE_URL="postgresql://$(whoami)@localhost:5432/schoolquiz"

# Then run migration
cd packages/db
npx prisma migrate dev --name add_organisation_system
```

## After Database is Set Up

Once you have DATABASE_URL configured:

```bash
# 1. Run migration
cd packages/db
npx prisma migrate deploy

# 2. Start admin app
cd ../../apps/admin
pnpm dev

# 3. Visit http://localhost:3007
```

**Need help?** Let me know which option you want to use and I'll guide you through it!

