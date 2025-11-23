# Database Standards & Conventions

## Naming Conventions

### Tables
-   **Convention:** `snake_case` (plural)
-   **Reasoning:** Follows standard Postgres conventions for table names.
-   **Prisma Mapping:** Use `@@map("table_name")` in `schema.prisma`.
    ```prisma
    model UserProfile {
      // ...
      @@map("user_profiles")
    }
    ```

### Columns
-   **Convention:** `camelCase`
-   **Reasoning:** Aligns with TypeScript and Prisma property names. This avoids the need for extensive `@map("column_name")` decorators in Prisma and simplifies data handling in the frontend/backend when using the Supabase client directly.
-   **Example:**
    ```prisma
    model User {
      createdAt DateTime // Database column is "createdAt"
      // NOT: createdAt DateTime @map("created_at")
    }
    ```

### Foreign Keys
-   **Convention:** `camelCase` (e.g., `schoolId`, `userId`)
-   **Reasoning:** Consistent with column naming.

## Schema Management

### Migrations
-   **Tool:** Prisma Migrate (`pnpm db:migrate`)
-   **Workflow:**
    1.  Modify `packages/db/prisma/schema.prisma`.
    2.  Run `pnpm db:migrate` to generate and apply the SQL migration.
    3.  Commit the `migrations` folder.

### Manual SQL
-   **Avoid** manual SQL changes (e.g., via Supabase Dashboard) as they cause drift from the Prisma schema.
-   If manual SQL is necessary, capture it in a migration file.

## Common Pitfalls
-   **Supabase UI:** Creating columns in the Supabase UI defaults to `snake_case` suggestions. **Always override this to `camelCase`** to match the application standard.
-   **Legacy Scripts:** You may see `FIX_ALL_COLUMN_NAMES.sql` in the legacy scripts folder. This was used to migrate the database from mixed conventions to strict `camelCase`. Do not revert this.
