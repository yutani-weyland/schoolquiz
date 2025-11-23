# How to Get Your Supabase Database Password

## Option 1: Find Existing Password (If You Set It)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Log in to your account

2. **Select Your Project**
   - Click on your project: `qncciizmpqyfxjxnyhxt` (or the project name)

3. **Navigate to Database Settings**
   - Click **Settings** (gear icon) in the left sidebar
   - Click **Database** in the settings menu

4. **Find Database Password**
   - Scroll down to the **Database password** section
   - If you set a password, it might be shown (masked) or you may need to reset it

## Option 2: Reset Database Password (Recommended)

If you don't remember the password or it's not shown:

1. **Go to Database Settings** (same as above)
   - Settings → Database

2. **Reset Password**
   - Find the **Database password** section
   - Click **Reset database password** button
   - **Copy the new password immediately** (you won't be able to see it again!)

3. **Update Your Connection String**
   - The password will be shown once after reset
   - Copy it and replace `[YOUR_PASSWORD]` in your `.env.local` file

## Option 3: Use Connection Pooling (Alternative)

Supabase also provides a connection pooling URL that might use a different authentication method:

1. **Go to Settings → Database**
2. **Look for "Connection string" section**
3. **Select "Connection pooling" tab**
4. **Copy the connection string** - it might have a different format

## Quick Steps Summary

```
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Settings → Database
4. Find "Database password" section
5. Click "Reset database password"
6. Copy the password shown
7. Update .env.local with the password
```

## Important Notes

- ⚠️ **The password is only shown once** after reset - copy it immediately!
- 🔒 Store it securely (password manager recommended)
- 📝 The password is different from your Supabase account password
- 🔄 You can reset it again if you lose it

## After Getting the Password

1. Open `.env.local` in your project root
2. Replace `[YOUR_PASSWORD]` with the actual password
3. Save the file
4. Then we can run migrations!

