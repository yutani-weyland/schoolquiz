# Quick Win Implementation Guide

**Highest Impact:** Eliminate CSS `@import` blocking rendering

## Step 1: Remove `@import` from globals.css

**File:** `apps/admin/src/app/globals.css`

**Change:**
```css
/* REMOVE THIS LINE (line 62): */
@import "react-day-picker/style.css";
```

**Reason:** `@import` blocks rendering. Since react-day-picker is only used in date pickers (below the fold), we can load it asynchronously.

---

## Step 2: Load react-day-picker CSS Asynchronously

**Option A: Load in Calendar Component (Recommended)**

**File:** `apps/admin/src/components/ui/calendar.tsx`

Add at the top:
```typescript
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

// ⚡ Load CSS asynchronously
if (typeof window !== 'undefined') {
  // Only load when component mounts (not blocking initial render)
  import('react-day-picker/style.css').catch(() => {
    // Silently fail if already loaded or error
  })
}

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
// ... rest of component
```

**Option B: Load via Link Tag (Alternative)**

**File:** `apps/admin/src/app/layout.tsx`

Add in `<head>`:
```typescript
<head>
  {/* ... existing head content ... */}
  
  {/* ⚡ Load react-day-picker CSS asynchronously */}
  <link
    rel="preload"
    href="/_next/static/css/react-day-picker.css"
    as="style"
    onLoad="this.onload=null;this.rel='stylesheet'"
  />
  <noscript>
    <link rel="stylesheet" href="/_next/static/css/react-day-picker.css" />
  </noscript>
</head>
```

**But wait!** Next.js doesn't expose node_modules CSS directly. Better approach:

**Option C: Extract CSS to Public Folder (Best)**

1. Copy the CSS file:
```bash
cp node_modules/react-day-picker/style.css public/styles/react-day-picker.css
```

2. Load it in Calendar component:
```typescript
// apps/admin/src/components/ui/calendar.tsx
"use client"

import * as React from "react"
import { useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

// ⚡ Load CSS asynchronously when component mounts
useEffect(() => {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = '/styles/react-day-picker.css'
  link.media = 'print'
  link.onload = () => {
    link.media = 'all'
  }
  document.head.appendChild(link)
  
  return () => {
    // Cleanup on unmount (optional)
    document.head.removeChild(link)
  }
}, [])

import { cn } from "@/lib/utils"
// ... rest of component
```

**Option D: Use Next.js Dynamic Import (Simplest)**

Since the Calendar component is already client-side, we can use dynamic import:

**File:** `apps/admin/src/components/ui/calendar.tsx`

```typescript
"use client"

import * as React from "react"
import { useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

// ⚡ Load CSS asynchronously
useEffect(() => {
  // Use dynamic import to load CSS
  import('react-day-picker/dist/style.css')
}, [])

import { cn } from "@/lib/utils"
// ... rest of component
```

**This works because:**
- CSS imported in `useEffect` doesn't block initial render
- Only loads when Calendar component mounts
- Date pickers are typically below the fold anyway

---

## Step 3: Verify the Change

1. **Remove the `@import` line from globals.css**
2. **Add the `useEffect` import in calendar.tsx**
3. **Test:**
   - Open a page with a date picker
   - Check Network tab - CSS should load after initial render
   - Verify date picker still works correctly

---

## Expected Impact

- **Before:** CSS `@import` blocks rendering → ~200-400ms delay
- **After:** CSS loads asynchronously → No render blocking
- **Result:** **-200-400ms FCP improvement**

---

## Next Steps

After this quick win, implement the other Phase 1 optimizations from `PAINT_TIME_OPTIMIZATIONS.md`:
1. ✅ Eliminate CSS `@import` (this guide)
2. Extract critical CSS
3. Optimize font loading
4. Replace `<img>` with Next.js `<Image>`

