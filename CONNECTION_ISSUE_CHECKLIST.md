# Connection Issue Checklist

## Current Issue
Can't reach database server at `db.qncciizmpqyfxjxnyhxt.supabase.co:5432`

## Possible Causes & Solutions

### 1. IP Restrictions
**Check:** Supabase Dashboard → Settings → Database → Connection Pooling
- Look for "IP Restrictions" or "Allowed IPs"
- Your current IP might not be whitelisted
- **Solution:** Add your IP to the allowed list, or disable IP restrictions temporarily

### 2. Connection Pooling Required
**Check:** Supabase Dashboard → Settings → Database → Connection string
- Look for "Connection pooling" tab
- Copy the connection string from there (usually port 6543)
- Format might be: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

### 3. Database Not Active
**Check:** Supabase Dashboard → Project Overview
- Make sure your project is active (not paused)
- Free tier projects can pause after inactivity

### 4. Network/Firewall
**Check:** Your network/firewall settings
- Some networks block outbound database connections
- Try from a different network (mobile hotspot, etc.)

### 5. Wrong Connection String Format
**Check:** Supabase Dashboard → Settings → Database
- Make sure you're copying the correct connection string
- There are multiple formats (URI, JDBC, etc.)
- Use the **URI** format for Prisma

## Next Steps

1. **Check Supabase Dashboard:**
   - Go to Settings → Database
   - Look at "Connection string" section
   - Check all tabs (URI, Connection pooling, etc.)
   - Look for any IP restriction settings

2. **Try Connection Pooling:**
   - Use the connection string from "Connection pooling" tab
   - Usually uses port 6543
   - Hostname might be different (pooler.supabase.com)

3. **Check Project Status:**
   - Make sure project is active
   - Check if there are any warnings/errors in dashboard

4. **Test from Different Network:**
   - Try from mobile hotspot
   - Or from a different location

## What to Share

If still having issues, please share:
1. The exact connection string from "Connection pooling" tab
2. Any IP restriction settings you see
3. Project status (active/paused)
4. Any error messages from Supabase dashboard

