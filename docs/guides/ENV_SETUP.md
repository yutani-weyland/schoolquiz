# Environment Variables Setup

## Important: Monorepo Environment Variable Location

In this monorepo, **Next.js reads `.env.local` from `apps/admin/`**, not from the project root.

## Quick Setup

1. **Create `.env.local` in the project root** (copy from `env.local.example`)
2. **Run the sync script** to copy it to the app directory:
   ```bash
   pnpm sync-env
   ```
3. **Restart your dev server** if it's running

## Why This Is Needed

Next.js looks for environment files in the app directory (`apps/admin/`), but we keep the source `.env.local` in the root for:
- Easier management in a monorepo
- Single source of truth
- Better gitignore handling

## Automatic Sync

The sync script (`pnpm sync-env`) copies `.env.local` from root to `apps/admin/.env.local`.

**Run it whenever you:**
- Create a new `.env.local` file
- Update environment variables
- Clone the repo and set up for the first time

## Troubleshooting

If you see `DATABASE_URL is not set or invalid` errors:

1. Check that `.env.local` exists in the **root** directory
2. Run `pnpm sync-env` to copy it to `apps/admin/`
3. Restart the dev server: `pnpm dev`

## Environment Variables Reference

See `env.local.example` in the project root for all available variables.







