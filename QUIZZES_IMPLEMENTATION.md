# Quizzes Page Implementation

## Overview
Implemented the Past Quizzes grid page with animated cards, full-screen intro transition, and scroll/filter restoration on back navigation in the **public-facing Astro app** (`apps/web`).

## Key Features

### 1. Shared Element Animation
- **Layout IDs**: Both `QuizCard` and the intro page use `layoutId={`quiz-bg-${quiz.id}`}` 
- **Color wash transition**: The card's background color smoothly transitions to full-screen intro
- **Animation library**: Framer Motion with LayoutGroup wrapper
- **React islands**: Components use `client:load` in Astro for interactivity

### 2. URL-Based Filters
- Search: `?q=searchterm` for title/tag search
- Sort: `?sort=new|old|az` for sorting options
- Tags: `?tags=tag1,tag2` for tag filtering
- Filters persist in URL and restore on browser back
- Custom `urlchange` event for syncing between components

### 3. Scroll Restoration
- Saves scroll position on card click: `sessionStorage.quizzes.scrollY`
- Restores scroll when navigating back from intro
- Filter state automatically preserved via URL params

## Files

### New Files (Astro App)
- `apps/web/src/components/quiz/QuizCard.tsx` - Animated card component with Framer Motion
- `apps/web/src/components/quiz/QuizFilters.tsx` - Filter UI with URL sync
- `apps/web/src/components/quiz/QuizzesGrid.tsx` - Grid with filtering logic
- `apps/web/src/components/quiz/QuizIntro.tsx` - Full-screen intro component
- `apps/web/src/pages/quiz/[slug]/intro.astro` - Intro page route

### Modified Files (Astro App)
- `apps/web/src/pages/quizzes.astro` - Updated to use React components
- `apps/web/package.json` - Added `lucide-react` dependency

### Helper Scripts
- `scripts/dev-web.sh` - Start Astro dev server on port 4321
- `scripts/dev-admin.sh` - Start Next.js dev server on port 3000

## How to Test

1. **Install dependencies** (if lucide-react isn't installed):
   ```bash
   pnpm install
   ```

2. **Start Astro dev server**:
   ```bash
   ./scripts/dev-web.sh
   # or manually:
   pnpm --filter @schoolquiz/web dev
   ```

3. **Navigate**: http://localhost:4321/quizzes

4. **Test flow**:
   - Apply filters (search, sort, tags)
   - Click a quiz card (not "Coming soon")
   - See color wash animation expanding to full screen
   - Click Back button
   - Verify: Filters preserved, scroll position restored

## Architecture Notes

### Astro Islands
React components are loaded as interactive islands using `client:load` directive. This enables:
- SSR for initial page load (fast)
- Client-side interactivity for animations and filters
- Shared Framer Motion context between components

### Data Flow
Currently using mock data in:
- `apps/web/src/pages/quizzes.astro` - Main listing
- `apps/web/src/pages/quiz/[slug]/intro.astro` - Static paths generation

To connect to real data:
- Fetch from Supabase in the Astro frontmatter
- Pass as props to React components
- Update `getStaticPaths()` for SSG

### Performance
- Cards use `will-change-transform` for GPU acceleration
- Scroll restoration uses `sessionStorage` for persistence
- Intro page sets `fixed inset-0` to prevent scroll during transition
- Lazy loading via Astro's code splitting

## Animation Sequence
1. User clicks card → saves scroll position to sessionStorage
2. Framer Motion detects matching `layoutId` across pages
3. Background color expands from card dimensions to full viewport
4. Content fades in with staggered timing
5. On back navigation, animation reverses
6. Scroll position restores via useEffect

## Color Contrast
Uses WCAG luminance calculation (`textOn()` function) to determine whether to use black or white text on each quiz's color background for accessibility.

## Future Enhancements
- [ ] Connect to Supabase for real quiz data
- [ ] Add infinite scroll for large quiz lists
- [ ] Add quiz preview/hover state
- [ ] Add "More options" menu with share/copy features
- [ ] Add keyboard navigation between cards
- [ ] Add loading states during route transitions

