# Testing Notes - SchoolQuiz Application

## Project Overview

### Tech Stack
- **Frontend (Web)**: Astro + React islands + Tailwind CSS + Framer Motion
- **Admin**: Next.js (App Router) + shadcn/ui + @dnd-kit
- **Database**: Supabase with Row Level Security (RLS)
- **Monorepo**: pnpm + Turborepo
- **TypeScript**: Used throughout

### Current Main User Flows (What Actually Works)

1. **Quiz Player Flow** (`QuizPlayer.tsx`):
   - Load quiz with questions and rounds
   - Navigate between questions (keyboard arrows, progress bar clicks)
   - Reveal answers with "Reveal answer" button
   - Mark questions as correct/incorrect (✓/✗ buttons)
   - Score tracking via `correctAnswers` Set (counts correct marks)
   - Progress visualization via `RailProgress` component
   - Timer functionality (persists to sessionStorage)
   - Two view modes: "presenter" and "grid"
   - Round intro screens
   - Keyboard shortcuts (Arrow keys for navigation)

2. **Quiz State Management** (`useQuizState.ts`):
   - Reducer-based state for round/question navigation
   - Session persistence via sessionStorage
   - Score tracking
   - Timer state management

3. **Progress Bar** (`RailProgress.tsx`):
   - Visual indicators for current, viewed, correct, incorrect questions
   - Click navigation to specific questions
   - Keyboard navigation (Arrow keys, Home, End)
   - Scroll auto-centering
   - Tooltips with question previews

4. **Answer Reveal** (`AnswerReveal.tsx`):
   - Reveal/hide answer toggle
   - Mark correct/incorrect buttons
   - Encouragement messages on incorrect marks
   - Overflow text scrolling for long answers

### Known Incomplete/WIP Areas

- **Analytics**: Functions exist (`calculateWilsonCI`, `calculateDifficultyIndex`, `calculateRecencyWeightedScore`) but may not be fully integrated
- **Quiz Submission**: `SubmissionAttribution` component exists but submission flow may be incomplete
- **Quiz Builder**: Admin interface exists but may have WIP features
- **Statistics**: National statistics feature-flagged (`NEXT_PUBLIC_STATS_ENABLED`)
- **Authentication**: Supabase auth setup but may not be fully tested
- **Database Integration**: Types exist but actual API calls may be mocked/stubbed

---

## Test Strategy

### Unit Tests

#### Utilities (`apps/admin/src/lib/`)
1. **`format.ts` - `formatWeek(weekISO: string)`**
   - ✅ Valid ISO date strings
   - ✅ Invalid date strings (returns original)
   - ✅ Edge cases: empty string, null, undefined
   - ✅ Output format verification

2. **`contrast.ts` - `textOn(bg: string)`**
   - ✅ Light backgrounds → 'black'
   - ✅ Dark backgrounds → 'white'
   - ✅ Edge cases: invalid hex, short hex, missing #
   - ✅ Boundary values (luminance ~0.5)

#### Analytics (`packages/analytics/src/index.ts`)
3. **`calculateWilsonCI(nCorrect, nIncorrect, confidenceLevel)`**
   - ✅ Valid inputs (normal case)
   - ✅ Zero attempts (nCorrect + nIncorrect = 0)
   - ✅ All correct (nIncorrect = 0)
   - ✅ All incorrect (nCorrect = 0)
   - ✅ Confidence level 0.95 vs 0.99
   - ✅ CI bounds within [0, 1]

4. **`calculateDifficultyIndex(successRate)`**
   - ✅ successRate = 0 → difficulty = 1
   - ✅ successRate = 1 → difficulty = 0
   - ✅ successRate = 0.5 → difficulty = 0.5
   - ✅ Boundary values

5. **`calculateRecencyWeightedScore(dailyData, halfLifeDays)`**
   - ✅ Single day data
   - ✅ Multiple days with decay
   - ✅ Zero total attempts
   - ✅ Custom half-life (default 28 days)
   - ✅ Recent vs old data weighting

6. **`meetsKAnonymity(nExposed, nRuns, minExposed, minRuns)`**
   - ✅ Meets thresholds
   - ✅ Below thresholds
   - ✅ Custom thresholds
   - ✅ Edge cases (0 values)

#### Quiz State (`apps/web/src/components/quiz/useQuizState.ts`)
7. **`useQuizState` hook logic** (test reducer actions)
   - ✅ GOTO action
   - ✅ NEXT action (within round, across rounds)
   - ✅ PREV action (within round, across rounds)
   - ✅ MARK_CORRECT action (advances + increments score)
   - ✅ TOGGLE_TIMER action
   - ✅ RESET action
   - ✅ Boundary conditions (first/last question)

#### Helper Functions
8. **Circular progress calculation** (in `QuizPlayer.tsx`)
   - ✅ Progress percentage calculation
   - ✅ Stroke dash offset calculation
   - ✅ Edge cases (0%, 100%, >100%)

---

### Component / Integration Tests

#### Core Components
1. **`QuestionCard`** (`apps/web/src/components/QuestionCard.tsx`)
   - ✅ Renders question text and points
   - ✅ Reveal button shows/hides answer
   - ✅ onAnswer callback with correct/incorrect
   - ✅ Stats display (if enabled)

2. **`AnswerReveal`** (`apps/web/src/components/quiz/AnswerReveal.tsx`)
   - ✅ Reveal button toggles answer visibility
   - ✅ Correct/incorrect buttons appear after reveal
   - ✅ onMarkCorrect/onUnmarkCorrect callbacks
   - ✅ Encouragement messages on incorrect (if implemented)
   - ✅ Text overflow scrolling for long answers

3. **`RailProgress`** (`apps/web/src/components/progress/RailProgress.tsx`)
   - ✅ Renders correct number of question indicators
   - ✅ Current question highlighted
   - ✅ Correct/incorrect/viewed states reflected
   - ✅ onSelect callback on click
   - ✅ Keyboard navigation (Arrow keys, Home, End)
   - ✅ Auto-scroll to current question
   - ✅ Tooltip on hover

4. **`QuizPlayer`** (`apps/web/src/components/quiz/QuizPlayer.tsx`)
   - ✅ Renders with questions
   - ✅ Error state when no questions
   - ✅ Navigation between questions
   - ✅ Score updates on mark correct
   - ✅ Timer starts/stops correctly
   - ✅ Progress bar integration
   - ✅ Keyboard shortcuts work
   - ✅ View mode switching (presenter/grid)

5. **`ScoreCounter`** (`apps/web/src/components/ScoreCounter.tsx`)
   - ✅ Displays score/total
   - ✅ Animates on score change

6. **`useQuizState` hook** (integration)
   - ✅ State persists to sessionStorage
   - ✅ State restored from sessionStorage
   - ✅ All actions update state correctly

---

### End-to-End (E2E) Tests

#### Test Framework
- **To be determined**: Check for Playwright/Cypress config, or set up minimal Playwright

#### Test Scenarios
1. **Basic Quiz Flow**
   - Navigate to quiz page
   - Start quiz
   - Answer 2-3 questions (reveal + mark correct/incorrect)
   - Verify score updates
   - Verify progress bar updates
   - Navigate via progress bar to different questions

2. **Keyboard Navigation**
   - Use Arrow keys to navigate
   - Use Home/End keys in progress bar
   - Verify question content updates

3. **Timer Functionality**
   - Timer starts (if in grid mode or after first question)
   - Timer persists to sessionStorage
   - Timer continues after page refresh

4. **Progress Bar Navigation**
   - Click question indicators
   - Verify question content changes
   - Verify current indicator updates

5. **Answer Reveal Flow**
   - Click "Reveal answer"
   - Verify answer appears
   - Mark correct → verify score updates
   - Mark incorrect → verify no score change

---

## Test Implementation Status

### Setup
- [x] Configure Vitest for unit tests
- [x] Configure React Testing Library for component tests
- [x] Set up Playwright for E2E tests
- [x] Add test scripts to package.json

### Unit Tests
- [x] `format.ts` tests (6 tests)
- [x] `contrast.ts` tests (7 tests)
- [x] Analytics tests (23 tests)
- [x] `useQuizState` reducer tests (22 tests)

### Component Tests
- [x] `QuestionCard` tests (7 tests)
- [x] `ScoreCounter` tests (4 tests)
- [ ] `AnswerReveal` tests (complex component, may need more setup)
- [ ] `RailProgress` tests (complex component with scroll behavior)
- [ ] `QuizPlayer` tests (large component, may need extensive mocking)

### E2E Tests
- [x] Basic E2E test structure created
- [ ] Basic quiz flow (needs actual quiz data)
- [ ] Keyboard navigation
- [ ] Timer functionality
- [ ] Progress bar navigation

---

## Test Results

### Current Status

**✅ All implemented tests passing!**

#### Analytics Package (`packages/analytics`)
- **23 tests** - All passing
- Tests cover: `calculateWilsonCI`, `calculateDifficultyIndex`, `calculateRecencyWeightedScore`, `meetsKAnonymity`

#### Admin App (`apps/admin`)
- **13 tests** - All passing
- `format.ts`: 6 tests
- `contrast.ts`: 7 tests

#### Web App (`apps/web`)
- **33 tests** - All passing
- `useQuizState`: 22 tests (reducer logic)
- `QuestionCard`: 7 tests
- `ScoreCounter`: 4 tests

### Test Commands
```bash
# Run all tests across workspace
pnpm test

# Run tests for specific package
pnpm --filter @schoolquiz/analytics test
pnpm --filter @schoolquiz/admin test
pnpm --filter @schoolquiz/web test

# Watch mode
pnpm --filter @schoolquiz/web test:watch

# E2E tests (web app)
cd apps/web && pnpm test:e2e

# E2E tests with UI
cd apps/web && pnpm test:e2e:ui
```

### Known Issues

1. **Framer Motion Mocking**: Component tests that use framer-motion show warnings about unrecognized props (`whileTap`, `whileHover`). These are harmless but could be improved by better mocking.

2. **E2E Tests**: Currently minimal - need actual quiz data and pages to test. The test structure is in place but commented out until quiz pages are available.

3. **Complex Components**: `AnswerReveal`, `RailProgress`, and `QuizPlayer` are not yet tested. These require:
   - More complex mocking of animations
   - Scroll behavior testing
   - Timer and sessionStorage mocking
   - Keyboard event simulation

### Flaky Tests
None identified so far.

### Test Coverage
- **Unit tests**: Core utilities and logic well covered
- **Component tests**: Basic components covered, complex interactive components pending
- **E2E tests**: Structure in place, needs real quiz data to execute

### Next Steps for Complete Test Coverage

1. **Add more component tests**:
   - `AnswerReveal` - test reveal/answer flow
   - `RailProgress` - test navigation and state indicators
   - `QuizPlayer` - basic rendering and navigation (may need significant mocking)

2. **Expand E2E tests**:
   - Set up test data or mock quiz API
   - Test full quiz flow end-to-end
   - Test keyboard shortcuts
   - Test timer persistence

3. **Integration tests**:
   - Test quiz state persistence (sessionStorage)
   - Test score calculation end-to-end
   - Test progress bar updates with quiz state

---

## Out of Scope for Now

- **Admin quiz builder**: Complex drag-and-drop, may be WIP
- **Authentication flows**: Supabase auth integration
- **Database operations**: Actual Supabase queries (mock in tests)
- **Statistics dashboard**: Feature-flagged, may not be complete
- **Premium features**: Payment/subscription flows
- **Performance testing**: Lighthouse scores, etc. (mentioned in README but not critical for current state)

---

## Notes

- Tests should mock Supabase client and any external APIs
- Use `data-testid` attributes for robust selectors in E2E tests
- Respect `prefers-reduced-motion` in component tests
- Test with both light and dark themes where applicable
- Mock `sessionStorage` and `localStorage` in tests

