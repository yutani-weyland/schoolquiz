# Build Fix for Phase 1

## Issue
Build fails with: `Module not found: Can't resolve '@schoolquiz/db'`

## Solution

The workspace packages need to be built before building the admin app. Run:

```bash
# From project root
cd /Users/fong/Desktop/schoolquiz-3

# Build all workspace packages
pnpm --filter "./packages/*" build

# Then build admin app
cd apps/admin
npm run build
```

## Quick Fix Script

```bash
#!/bin/bash
# Build all packages first
cd /Users/fong/Desktop/schoolquiz-3
pnpm --filter "./packages/*" build

# Then build admin
cd apps/admin
npm run build
```

## Alternative: Use Dev Mode

For development, you can use dev mode which handles transpilation automatically:

```bash
cd apps/admin
npm run dev
```

The `transpilePackages` config in `next.config.js` should handle this, but the build process requires packages to be built first.

## Note

The `@schoolquiz/db` package was successfully built. The remaining issue is with `@schoolquiz/ui` which may need its dist folder created or the build process needs to be run again.


