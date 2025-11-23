# Testing Checklist - Unified Next.js App

## ✅ What's Ready to Test

### 1. **Landing Page** (`http://localhost:3000/`)
- [ ] Page loads without errors
- [ ] SiteHeader appears at top
- [ ] NextQuizCountdown notch appears and works
- [ ] RotatingText animates ("students", "tutor groups", "homerooms")
- [ ] HeroCTA buttons display correctly
- [ ] WhySection displays with 6 feature cards
- [ ] Footer links work
- [ ] Theme toggle works (dark/light mode)
- [ ] Responsive design works on mobile

### 2. **Quizzes Page** (`http://localhost:3000/quizzes`)
- [ ] Page loads without errors
- [ ] SiteHeader appears
- [ ] "Your Quizzes" title displays
- [ ] Quiz cards render in grid (3 columns on desktop)
- [ ] NextQuizTeaser card appears (hidden on mobile)
- [ ] Quiz cards show correct colors, titles, dates
- [ ] "Coming soon" quiz is disabled
- [ ] Clicking a quiz card navigates (will 404 until we migrate quiz pages)
- [ ] Subscribe CTA section displays
- [ ] Footer displays correctly
- [ ] Theme toggle works

### 3. **Navigation**
- [ ] SiteHeader menu opens/closes
- [ ] All menu links work:
  - [ ] Browse Quizzes → `/quizzes`
  - [ ] Explore → `/explore-quizzes` (may 404)
  - [ ] Dashboard → `/dashboard` (may 404)
  - [ ] Account → `/account`
- [ ] Logo links to `/quizzes`
- [ ] Theme toggle works from header
- [ ] Mobile menu works

### 4. **Account Page** (`http://localhost:3000/account`)
- [ ] Page loads (should show league management)
- [ ] Create league works
- [ ] League cards display
- [ ] Edit/delete leagues works

## 🐛 Known Issues / TODOs

1. **Quiz Player Pages** - Not migrated yet (will 404)
   - `/quiz/[slug]/intro` - Not implemented
   - `/quiz/[slug]/play` - Not implemented

2. **Marketing Pages** - Not migrated yet (will 404)
   - `/about` - Not implemented
   - `/help` - Not implemented
   - `/contact` - Not implemented
   - `/privacy` - Not implemented
   - `/terms` - Not implemented

3. **QuizSafariPreview** - Component not migrated yet (commented out on landing page)

4. **Auth Pages** - Not migrated yet
   - `/sign-in` - Not implemented
   - `/sign-up` - Not implemented

## 🧪 Quick Test Commands

```bash
# Check if server is running
curl http://localhost:3000

# Check for build errors
cd apps/admin && pnpm build

# Check TypeScript errors
cd apps/admin && pnpm type-check
```

## 📝 Notes

- All pages use Next.js `Link` components for navigation
- Theme system is unified across all pages
- SiteHeader is shared component
- Design system matches main site

