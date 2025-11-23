# Admin Area UI Consistency Audit

This document identifies all UI inconsistencies found across the admin area. Each issue is categorized and includes specific examples with file references.

## 🔴 Critical Inconsistencies

### 1. Button Variants & Sizes

**Issue**: Inconsistent button variant usage and sizing across pages.

**Examples**:
- **Organisations page** (line 386-393): Uses `variant="primary"` and `size="sm"` for "Create Organisation"
- **Users page** (line 363-370): Uses `variant="primary"` and `size="sm"` for "Create User"  
- **Quizzes page** (line 436-439): Uses default variant (no variant specified) and default size for "Create Quiz"
- **Scheduling page** (line 118-121): Uses default variant (no variant specified) and default size for "Create Job"

**Recommendation**: Standardize all primary action buttons to use `variant="primary"` and `size="sm"` consistently.

---

### 2. Badge/Pill Styling

**Issue**: Multiple badge implementations with different styles.

**Examples**:
- **Badge component** (`Badge.tsx`): Uses `px-2.5 py-0.5 rounded-full text-xs font-medium`
- **Overview page** (line 483-485, 497-499, 511-513): Uses custom badges with `px-2 py-1 text-xs font-medium` and different background colors
- **Quizzes page** (line 720-733): Uses inline badges with `px-2.5 py-0.5 rounded-full text-xs font-medium` but different color schemes
- **Billing page** (line 564-570): Uses inline badges with `px-2.5 py-0.5 rounded-full text-xs font-medium` but different structure

**Recommendation**: Use the standardized `Badge` component everywhere. Replace all custom badge implementations.

---

### 3. Heading Sizes & Weights

**Issue**: Inconsistent heading sizes and font weights.

**Examples**:
- **PageHeader component**: Uses `text-3xl font-bold` for h1
- **Overview page** (line 274, 398, 425, 469, 520): Uses `text-lg font-bold` for section headings
- **Analytics page** (line 78, 99): Uses `text-xl font-semibold` and `text-lg font-semibold`
- **System page** (line 59, 94, 108): Uses `text-lg font-semibold` and `text-xl font-semibold`
- **Billing page** (line 497): Uses `text-lg font-semibold`
- **Card sections**: Mix of `text-lg font-bold`, `text-lg font-semibold`, and `text-xl font-semibold`

**Recommendation**: 
- Page titles: `text-3xl font-bold` (already standardized in PageHeader)
- Section headings in cards: `text-lg font-semibold` (consistent)
- Subsection headings: `text-base font-semibold`

---

### 4. Card Padding

**Issue**: Inconsistent card padding values.

**Examples**:
- **Card component**: Default `padding="md"` = `p-6`
- **Overview page** (line 272): Uses `p-6` directly (matches default)
- **Analytics page** (line 98): Uses Card with default padding
- **Organisations/Users pages**: Uses `Card padding="sm"` for filter cards (line 537, 511)
- **Billing page** (line 167, 186, 199): Uses Card with default padding
- **Quizzes page** (line 445): Uses `Card padding="sm"` for filters

**Recommendation**: Standardize to use Card component with explicit padding prop. Use `padding="sm"` for filter/search cards, `padding="md"` for content cards.

---

### 5. Table Header Styling

**Issue**: Different table header styles across pages.

**Examples**:
- **Organisations/Users pages**: Uses `DataTableHeader` component with consistent styling
- **Quizzes page** (line 600-657): Uses `DataTableHeader` but with custom `th` elements mixed in (line 602)
- **Billing page** (line 249-269, 346-366): Uses custom table headers with:
  - Line 249: `bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-900/50`
  - Line 346: `bg-[hsl(var(--muted))]`
  - Different text styles: `text-xs font-medium text-gray-500` vs `text-xs font-medium text-[hsl(var(--muted-foreground))]`
- **Scheduling page**: Uses `DataTableHeader` component (consistent)

**Recommendation**: Use `DataTableHeader` and `DataTableHeaderCell` components everywhere. Remove all custom table header implementations.

---

### 6. Modal Structure & Buttons

**Issue**: Inconsistent modal layouts and button arrangements.

**Examples**:
- **Create Organisation Modal** (line 1113-1136): 
  - Buttons: `variant="secondary"` and `variant="primary"`
  - Layout: `justify-end gap-3 pt-4`
- **Edit Organisation Modal** (line 1290-1305):
  - Buttons: `variant="ghost"` and default (primary)
  - Layout: `justify-end gap-3 pt-4 border-t`
- **Create User Modal** (line 1052-1075):
  - Buttons: `variant="secondary"` and `variant="primary"`
  - Layout: `justify-end gap-3 pt-4`
- **Edit User Modal** (line 1419-1443):
  - Buttons: `variant="secondary"`, `variant="ghost"`, and default
  - Layout: `gap-3 pt-4 border-t` with flex-1 spacer
- **Billing Create Offer Code Modal** (line 737-753):
  - Buttons: `variant="secondary"` and default
  - Layout: `gap-4` with `flex-1` on buttons

**Recommendation**: 
- Standardize modal footer: Always use `border-t border-[hsl(var(--border))] pt-4`
- Button order: Cancel (secondary/ghost) on left, Primary action on right
- Use `justify-end` or `justify-between` consistently
- Button variants: Cancel = `variant="secondary"`, Primary = `variant="primary"` (default)

---

### 7. Input Field Styling

**Issue**: Some pages use custom input styling instead of Input component.

**Examples**:
- **Organisations/Users/Quizzes pages**: Use `Input` component (consistent)
- **Billing Create Offer Code Modal** (line 657-664, 671-677, etc.): Uses raw `<input>` elements with custom classes instead of `Input` component

**Recommendation**: Use the standardized `Input` component everywhere. Replace all custom input implementations.

---

### 8. Status Badge Colors

**Issue**: Inconsistent status badge color mappings.

**Examples**:
- **Organisations page**: Uses `getOrganisationStatusBadge()` helper
- **Users page**: Uses `getUserTierBadge()` helper
- **Quizzes page** (line 400-407): Uses custom `getStatusBadge()` with different mapping:
  - `draft: 'default'`, `scheduled: 'info'`, `published: 'success'`
- **Scheduling page** (line 65-87): Uses custom mapping with `'danger'` variant
- **Billing page** (line 109-119): Uses custom mapping with icons

**Recommendation**: Create a centralized status badge utility that handles all status types consistently. Use the same color scheme across all pages.

---

### 9. Icon Sizes

**Issue**: Inconsistent icon sizes throughout.

**Examples**:
- **PageHeader actions**: Icons typically `w-4 h-4` or `w-5 h-5`
- **Card icons**: Mix of `w-5 h-5`, `w-6 h-6`, `w-8 h-8`
- **Table action icons**: `w-4 h-4`
- **Badge icons**: `w-3 h-3` (in Badge component)
- **Overview stat cards** (line 385): `w-6 h-6`
- **Analytics cards** (line 74): `w-6 h-6`
- **System cards** (line 90): `w-6 h-6`
- **Billing revenue cards** (line 182, 195, 208): `w-8 h-8`

**Recommendation**: 
- Small icons (badges, inline): `w-3 h-3` or `w-4 h-4`
- Medium icons (buttons, table actions): `w-4 h-4` or `w-5 h-5`
- Large icons (cards, feature highlights): `w-6 h-6`
- Extra large (hero sections): `w-8 h-8`

---

### 10. Text Color Usage

**Issue**: Inconsistent use of CSS variables vs Tailwind colors.

**Examples**:
- **Most pages**: Use `text-[hsl(var(--foreground))]` and `text-[hsl(var(--muted-foreground))]`
- **Billing page** (line 220-240): Uses `text-gray-600 dark:text-gray-400` and `text-gray-900 dark:hover:text-white`
- **Billing page** (line 251, 254, etc.): Uses `text-gray-500 dark:text-gray-400`
- **Billing page** (line 523, 526, etc.): Uses `text-gray-500 dark:text-gray-400`

**Recommendation**: Use CSS variables consistently: `text-[hsl(var(--foreground))]` and `text-[hsl(var(--muted-foreground))]`. Remove all hardcoded gray color classes.

---

### 11. Border Radius

**Issue**: Inconsistent border radius values.

**Examples**:
- **Cards**: `rounded-2xl` (standardized in Card component)
- **Buttons**: `rounded-xl` (standardized in Button component)
- **Badges**: `rounded-full` (standardized in Badge component)
- **Inputs**: Should be `rounded-xl` but some custom inputs use different values
- **Billing tabs** (line 217): Uses `rounded-none` for tabs
- **Modal close buttons**: Mix of `rounded-lg` and no rounding

**Recommendation**: 
- Cards: `rounded-2xl`
- Buttons: `rounded-xl`
- Badges: `rounded-full`
- Inputs: `rounded-xl`
- Small interactive elements: `rounded-lg`

---

### 12. Spacing Between Elements

**Issue**: Inconsistent gap and spacing values.

**Examples**:
- **Page containers**: Most use `space-y-6`
- **Card grids**: Mix of `gap-4`, `gap-5`, `gap-6`
- **Button groups**: Mix of `gap-2`, `gap-3`, `gap-4`
- **Form fields**: Mix of `space-y-4` and custom spacing
- **Table cells**: Mix of `px-4 py-4`, `px-6 py-4`, `px-6 py-3`

**Recommendation**:
- Page containers: `space-y-6`
- Card grids: `gap-6` (md breakpoint: `md:gap-6`)
- Button groups: `gap-2` for related actions, `gap-3` for modal footers
- Form fields: `space-y-4`
- Table cells: Standardize to `px-6 py-4` (or use DataTableCell component)

---

### 13. Loading States

**Issue**: Different loading spinner implementations.

**Examples**:
- **Overview page** (line 286): `h-6 w-6 border-b-2`
- **Billing page** (line 124): `h-8 w-8 border-b-2`
- **Quizzes page** (line 192): `h-8 w-8 border-b-2`
- **Users/Organisations**: Uses `TableSkeleton` component

**Recommendation**: Create a standardized `Spinner` component with size variants. Use `TableSkeleton` for table loading states.

---

### 14. Empty States

**Issue**: Inconsistent empty state styling.

**Examples**:
- **Organisations/Users pages**: Uses `DataTableEmpty` component
- **Quizzes page** (line 591-595): Custom empty state with `p-12 text-center`
- **Billing page** (line 511-513): Custom empty state with `p-12 text-center`
- **Scheduling page** (line 287): Uses `DataTableEmpty` component

**Recommendation**: Use `DataTableEmpty` component for all table empty states. Create a standardized empty state component for non-table contexts.

---

### 15. Pagination Styling

**Issue**: Different pagination implementations.

**Examples**:
- **Organisations/Users pages**: Custom pagination with Button components, consistent styling
- **Quizzes page** (line 807-845): Uses Link components with custom button styling instead of Button component

**Recommendation**: Standardize pagination to use Button components consistently. Create a reusable Pagination component.

---

### 16. Filter Card Styling

**Issue**: Filter/search cards have inconsistent styling.

**Examples**:
- **Organisations/Users pages**: Uses `Card padding="sm"` with `flex flex-col sm:flex-row gap-4`
- **Quizzes page**: Uses `Card padding="sm"` with `flex flex-col sm:flex-row gap-4` (consistent)
- **Scheduling page** (line 126-161): Uses `Card` (default padding) instead of `padding="sm"`

**Recommendation**: All filter/search cards should use `Card padding="sm"` with consistent layout.

---

### 17. Action Button Icons

**Issue**: Inconsistent icon usage in action buttons.

**Examples**:
- **Create buttons**: Some use `Plus` icon, some don't
- **Export buttons**: Some use `Download` icon with `ChevronDown`, some don't
- **Delete buttons**: Mix of `Trash2` and `XCircle` icons
- **Edit buttons**: Mix of `Edit2` and no icon

**Recommendation**: 
- Create actions: Always include `Plus` icon
- Export actions: Always include `Download` icon
- Delete actions: Always use `Trash2` icon
- Edit actions: Always use `Edit2` icon

---

### 18. Table Row Hover States

**Issue**: Different hover state implementations.

**Examples**:
- **Organisations/Users pages**: Uses `DataTableRow` component with built-in hover
- **Quizzes page** (line 667): Custom `hover:bg-[hsl(var(--muted))]/50`
- **Billing page** (line 278, 375): Custom `hover:bg-[hsl(var(--muted))]`

**Recommendation**: Use `DataTableRow` component everywhere for consistent hover states.

---

### 19. Modal Backdrop

**Issue**: Slight variations in modal backdrop styling.

**Examples**:
- **All modals**: Use `bg-black/50 backdrop-blur-sm` (consistent)
- **Modal containers**: All use `rounded-2xl` (consistent)
- **Modal padding**: Mix of `p-6` (consistent)

**Recommendation**: Already mostly consistent. Ensure all modals use the same backdrop and container styling.

---

### 20. Success/Error Message Styling

**Issue**: Different success/error message implementations.

**Examples**:
- **Create Organisation Modal** (line 1101-1111): Uses `bg-red-50 dark:bg-red-900/20 border border-red-200`
- **Edit Organisation Modal** (line 1278-1288): Uses `bg-[hsl(var(--destructive))]/10 border border-[hsl(var(--destructive))]/30`
- **Create User Modal** (line 1040-1050): Uses `bg-red-50 dark:bg-red-900/20 border border-red-200`
- **Edit User Modal** (line 1407-1417): Uses `bg-[hsl(var(--destructive))]/10 border border-[hsl(var(--destructive))]/30`

**Recommendation**: Standardize to use CSS variables: `bg-[hsl(var(--destructive))]/10 border border-[hsl(var(--destructive))]/30` for errors, similar pattern for success messages.

---

### 21. Button Variant "outline" Not Defined

**Issue**: Some pages use `variant="outline"` which doesn't exist in the Button component.

**Examples**:
- **Support page** (line 347, 360): Uses `variant="outline"` for pagination buttons
- **Button component**: Only defines `'primary' | 'secondary' | 'danger' | 'ghost'`

**Recommendation**: Either add `outline` variant to Button component, or replace with `variant="secondary"` everywhere.

---

### 22. Custom Button Implementations

**Issue**: Some pages use custom button styling instead of Button component.

**Examples**:
- **Achievements page** (line 633-639, 709-714, 657-692): Uses custom button classes instead of Button component
- **Organisation detail page**: May have custom buttons

**Recommendation**: Replace all custom button implementations with the standardized Button component.

---

### 23. Loading Spinner Color Inconsistency

**Issue**: Different spinner border colors.

**Examples**:
- **Most pages**: Use `border-[hsl(var(--primary))]`
- **Organisation detail page** (line 128): Uses `border-blue-500` (hardcoded color)
- **Support page**: Uses CSS variable (consistent)

**Recommendation**: Always use `border-[hsl(var(--primary))]` for loading spinners.

---

### 24. Filter Card Padding Inconsistency

**Issue**: Support page uses default Card padding instead of `padding="sm"`.

**Examples**:
- **Organisations/Users/Quizzes pages**: Use `Card padding="sm"` for filters
- **Support page** (line 202): Uses `Card` with default padding (should be `padding="sm"`)
- **Scheduling page** (line 126): Uses `Card` with default padding (should be `padding="sm"`)

**Recommendation**: All filter/search cards should use `Card padding="sm"`.

---

### 25. Table Header Text Styling

**Issue**: Achievements page uses custom table headers instead of DataTable components.

**Examples**:
- **Achievements page** (line 721-759): Uses custom `<thead>` and `<th>` elements with `text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider`
- **Other pages**: Use `DataTableHeader` and `DataTableHeaderCell` components

**Recommendation**: Use DataTable components consistently. The Achievements page should be refactored to use DataTable components.

---

### 26. Custom Badge Implementations in Tables

**Issue**: Some pages use inline badge styling instead of Badge component.

**Examples**:
- **Achievements page** (line 839-853, 856-864): Uses inline badge styling with hardcoded colors
- **Quizzes page** (line 720-733): Uses inline badge styling
- **Billing page** (line 564-570): Uses inline badge styling

**Recommendation**: Replace all inline badge implementations with the Badge component.

---

### 27. Pagination Button Styling

**Issue**: Support page uses different pagination button styling.

**Examples**:
- **Organisations/Users pages**: Custom pagination with Button components
- **Support page** (line 346-368): Uses `variant="outline"` (which doesn't exist) and different layout
- **Quizzes page**: Uses Link components with custom styling

**Recommendation**: Create a standardized Pagination component and use it everywhere.

---

### 28. Modal Close Button Styling

**Issue**: Different close button implementations in modals.

**Examples**:
- **Create/Edit Organisation/User modals**: Use custom button with `p-2` and X icon
- **Support detail modal** (line 396-406): Uses Button component with `variant="ghost" size="sm"` and `h-8 w-8 p-0`
- **Billing Create Offer Code modal** (line 644-649): Uses custom button with XCircle icon

**Recommendation**: Standardize modal close buttons to use Button component with `variant="ghost" size="sm"`.

---

### 29. Empty State Button Styling

**Issue**: Different button styles in empty states.

**Examples**:
- **Achievements page** (line 709-714): Custom button with inline classes
- **Quizzes page** (line 591-595): No button in empty state
- **Other pages**: Vary in implementation

**Recommendation**: Create a standardized EmptyState component with consistent button styling.

---

### 30. Icon Size in Search/Filter Inputs

**Issue**: Inconsistent icon sizes in search/filter inputs.

**Examples**:
- **Organisations/Users/Quizzes pages**: Use `w-5 h-5` for Search/Filter icons
- **Support page** (line 205, 215, 228): Uses `w-4 h-4` for Search/Filter icons

**Recommendation**: Standardize to `w-5 h-5` for search/filter input icons.

---

## 📋 Summary of Required Changes

### High Priority (Affects User Experience)
1. Standardize all button variants and sizes
2. Replace all custom badges with Badge component
3. Standardize heading sizes and weights
4. Use DataTable components consistently
5. Standardize modal button layouts
6. Replace custom inputs with Input component
7. Standardize status badge colors
8. Add missing "outline" variant to Button component OR replace with "secondary"
9. Replace all custom button implementations with Button component
10. Refactor Achievements page to use DataTable components

### Medium Priority (Visual Consistency)
11. Standardize icon sizes
12. Use CSS variables for all text colors
13. Standardize border radius values
14. Standardize spacing between elements
15. Create standardized loading/empty states
16. Standardize pagination component
17. Standardize loading spinner colors (use CSS variables)
18. Standardize filter card padding (all should use `padding="sm"`)
19. Standardize modal close buttons
20. Standardize empty state buttons

### Low Priority (Polish)
21. Standardize action button icons
22. Standardize table row hover states
23. Standardize success/error messages
24. Standardize search/filter icon sizes

---

## 🎯 Recommended Action Plan

1. **Phase 1**: Create/update shared components (Spinner, Pagination, EmptyState)
2. **Phase 2**: Standardize all buttons, badges, and inputs
3. **Phase 3**: Standardize all tables and modals
4. **Phase 4**: Standardize spacing, colors, and typography
5. **Phase 5**: Final polish and consistency check

---

## 📝 Notes

- Most inconsistencies are minor but add up to create a less polished experience
- The existing component library (Button, Badge, Card, Input, etc.) is well-designed but not used consistently
- Some pages (like Billing) have more custom implementations that should be refactored
- The DataTable components are excellent but not used everywhere they should be

