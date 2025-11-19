# Supabase Connection Troubleshooting

## Issue: Can't reach database server

The connection string you're using might need to be adjusted. Supabase provides different connection strings for different use cases.

## Solution: Get the Correct Connection String

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Go to Settings → Database**

3. **Find "Connection string" section**
   - You'll see multiple tabs: **URI**, **JDBC**, **Connection pooling**, etc.

4. **For Prisma Migrations, try these options:**

   **Option A: Direct Connection (URI tab)**
   - Copy the connection string from the **URI** tab
   - Should look like: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
   - Or: `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`

   **Option B: Connection Pooling (Transaction mode)**
   - Go to **Connection pooling** tab
   - Select **Transaction** mode
   - Copy that connection string
   - Port should be **6543** (not 5432)

   **Option C: Direct Connection (if available)**
   - Some Supabase projects allow direct connections on port 5432
   - Check if your project has this enabled

## Common Issues

### 1. Port 5432 Blocked
- Supabase often blocks direct connections on port 5432
- Use connection pooling on port **6543** instead

### 2. Connection Pooling Required
- For Prisma migrations, you might need to use the pooler
- Use the **Transaction** mode connection string

### 3. Network/Firewall
- Check if your network allows outbound connections
- Try from a different network if possible

## Next Steps

1. Get the connection string from Supabase dashboard
2. Update `.env.local` with the correct connection string
3. Try running migrations again

Let me know which connection string format you see in your Supabase dashboard!

