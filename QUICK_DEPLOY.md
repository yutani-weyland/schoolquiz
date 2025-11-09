# Quick Deploy Guide

## Option 1: Use Supabase (Recommended - Free & Easy)

1. **Create a Supabase project**:
   - Go to https://supabase.com
   - Sign up/login
   - Click "New Project"
   - Choose a name and database password
   - Wait for project to be created (~2 minutes)

2. **Get your connection string**:
   - Go to Project Settings > Database
   - Copy the "Connection string" under "Connection pooling"
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres`

3. **Update .env.local**:
   ```bash
   DATABASE_URL="your-supabase-connection-string"
   ```

4. **Run migration**:
   ```bash
   cd packages/db
   npx prisma migrate deploy
   ```

5. **Start the app**:
   ```bash
   cd apps/admin
   pnpm dev
   ```

## Option 2: Use Local PostgreSQL

1. **Install PostgreSQL** (if not installed):
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Create database
   createdb schoolquiz
   ```

2. **Update .env.local**:
   ```bash
   DATABASE_URL="postgresql://$(whoami)@localhost:5432/schoolquiz"
   ```

3. **Run migration**:
   ```bash
   cd packages/db
   npx prisma migrate dev --name add_organisation_system
   ```

4. **Start the app**:
   ```bash
   cd apps/admin
   pnpm dev
   ```

## Option 3: Use Docker (Quick Test)

1. **Start PostgreSQL container**:
   ```bash
   docker run --name schoolquiz-postgres \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=schoolquiz \
     -p 5432:5432 \
     -d postgres:15
   ```

2. **Update .env.local**:
   ```bash
   DATABASE_URL="postgresql://postgres:password@localhost:5432/schoolquiz"
   ```

3. **Run migration**:
   ```bash
   cd packages/db
   npx prisma migrate dev --name add_organisation_system
   ```

4. **Start the app**:
   ```bash
   cd apps/admin
   pnpm dev
   ```

## After Setup

Once your database is connected:

1. **Visit the admin app**: http://localhost:3007
2. **Create your first organisation** (via API or manually in database)
3. **Test the features**:
   - `/admin/organisation/[org-id]` - Organisation admin panel
   - `/leaderboards` - Teacher leaderboards page

