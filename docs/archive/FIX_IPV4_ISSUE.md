# Fix: IPv4 Compatibility Issue

## Problem
Your Supabase project shows: **"Not IPv4 compatible"** - the direct connection requires IPv6, but your network is IPv4-only.

## Solution: Use Connection Pooler

1. **In the Supabase modal you're looking at:**
   - Change the **"Method"** dropdown from "Direct connection" to **"Session Pooler"** or **"Connection Pooling"**
   - This will give you a connection string that works on IPv4 networks

2. **Copy the new connection string** (it will have a different hostname, usually `pooler.supabase.com`)

3. **Share it with me** and I'll update `.env.local`

## Alternative: Click "Pooler settings"

You can also click the **"Pooler settings"** button in the warning section to get the connection pooling string directly.

