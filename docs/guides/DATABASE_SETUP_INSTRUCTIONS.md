# Database Setup Instructions

## ⚠️ IMPORTANT: Replace Password Placeholder

Your `.env.local` file has been updated with the Supabase connection string, but you need to:

1. **Open `.env.local`** in the project root
2. **Find this line:**
   ```
   DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.qncciizmpqyfxjxnyhxt.supabase.co:5432/postgres"
   ```
3. **Replace `[YOUR_PASSWORD]`** with your actual Supabase database password
4. **Save the file**

## Next Steps

Once you've updated the password, run these commands:

```bash
# 1. Navigate to db package
cd packages/db

# 2. Generate Prisma client (this will validate the connection)
pnpm db:generate

# 3. Run migrations to create/update tables
pnpm db:migrate

# 4. Test the connection
pnpm test
```

## If You Don't Know Your Password

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **Database**
3. Look for **Database password** section
4. You can reset it if needed (click "Reset database password")

## Troubleshooting

### Connection Error
- Verify password is correct (no brackets, just the password)
- Check Supabase project is active
- Verify connection string format

### Migration Errors
- Make sure database is empty or previous migrations are applied
- Check Prisma schema matches your database state
- Run `pnpm db:generate` first

### Prisma Client Errors
- Run `pnpm db:generate` after any schema changes
- Restart your dev server after generating client

