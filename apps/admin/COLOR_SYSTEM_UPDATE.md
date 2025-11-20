# Admin Color System Update

## Overview
All admin components have been updated to use a unified HSL-based color system following modern UI principles.

## Color Variables

### Background Colors
- `--background`: Base background (0% dark, 100% light)
- `--card`: Card/surface background (5% dark, 100% light)
- `--raised`: Raised elements (10% dark, 95% light)
- `--muted`: Muted backgrounds (15% dark, 96% light)

### Text Colors
- `--foreground`: Primary text (95% dark, 10% light)
- `--muted-foreground`: Secondary/muted text (65% dark, 45% light)

### Interactive Elements
- `--primary`: Primary action color (blue: 217° 91% 60%)
- `--border`: Border color (20% dark, 90% light)
- `--input`: Input background (5% dark, 100% light)
- `--ring`: Focus ring (matches primary)

## Replacement Patterns

### Old → New
- `dark:bg-gray-900` → `dark:bg-[hsl(var(--background))]`
- `dark:bg-gray-800` → `dark:bg-[hsl(var(--card))]`
- `dark:text-gray-400` → `text-[hsl(var(--muted-foreground))]`
- `dark:text-white` → `text-[hsl(var(--foreground))]`
- `dark:border-gray-700` → `border-[hsl(var(--border))]`
- Remove all `shadow-[...]` and `inset_` shadow effects
- Remove all `bg-gradient-to-br` gradients (use solid colors)

## Files Updated
- ✅ DataTable.tsx
- ✅ Sidebar.tsx
- ✅ AdminTopbar.tsx
- ✅ AdminLayout.tsx
- ✅ admin/page.tsx (overview)
- ✅ admin/users/page.tsx
- ✅ admin/quizzes/page.tsx
- ✅ admin/organisations/page.tsx
- ✅ admin/questions/create/page.tsx

## Remaining Files to Update
See grep output for complete list of files still using old color patterns.



