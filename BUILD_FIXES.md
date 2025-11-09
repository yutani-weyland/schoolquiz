# Fixed Build Errors ✅

## Changes Made

1. **Fixed next-auth CSS error**: Updated `next.config.js` to exclude next-auth CSS from webpack processing
2. **Fixed @schoolquiz/ui import**: Inlined the `springs` constant in demo pages to avoid import issues

## Demo Pages Ready

The demo pages should now work without build errors:

1. **Organisation Admin**: `http://localhost:3000/admin/organisation/demo`
2. **My Leaderboards**: `http://localhost:3000/leaderboards/demo`

Both pages use mock data and don't require a database connection.

## If Build Still Fails

If you still see errors, try:

```bash
# Clean and rebuild
cd packages/ui
pnpm clean
pnpm build

cd ../../apps/admin
rm -rf .next
pnpm dev
```

The inlined springs constant should work fine for the demo pages!

