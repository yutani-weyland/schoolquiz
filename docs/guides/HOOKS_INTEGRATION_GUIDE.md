# QuizPlayer Hooks Integration Guide

## ✅ Hooks Created

Three hooks have been extracted from QuizPlayer:

### 1. `useQuizTimer` (`apps/admin/src/hooks/useQuizTimer.ts`)
**Purpose**: Manages quiz timer state and persistence

**Features**:
- Timer counting (updates every second)
- SessionStorage persistence (debounced every 5 seconds)
- Auto-start logic (grid mode)
- Start/stop/reset controls

**Usage**:
```typescript
const { timer, isRunning, start, stop, reset } = useQuizTimer({
  quizSlug,
  autoStart: false,
  initialTime: 0,
});
```

### 2. `useQuizPlay` (`apps/admin/src/hooks/useQuizPlay.ts`)
**Purpose**: Manages quiz play state, navigation, and answers

**Features**:
- Question navigation (goToNext, goToPrevious)
- Answer tracking (markCorrect, unmarkCorrect, revealAnswer)
- Screen/round management
- Progress persistence via QuizSessionService
- Completion logic

**Usage**:
```typescript
const {
  currentIndex,
  currentRound,
  currentScreen,
  viewMode,
  correctAnswers,
  currentQuestion,
  goToNext,
  goToPrevious,
  markCorrect,
  revealAnswer,
  // ... more
} = useQuizPlay({
  quizSlug,
  questions,
  rounds,
  isDemo,
  maxQuestions,
  onDemoComplete,
});
```

### 3. `useQuizAchievements` (`apps/admin/src/hooks/useQuizAchievements.ts`)
**Purpose**: Manages achievement checking and notifications

**Features**:
- Achievement evaluation (ready for server-side checking)
- Auto-dismiss notifications
- Achievement state management

**Usage**:
```typescript
const { achievements, dismissAchievement } = useQuizAchievements({
  quizSlug,
  correctAnswers,
  incorrectAnswers,
  revealedAnswers,
  totalQuestions,
  timer,
  currentIndex,
  rounds,
  questions,
});
```

## 🔄 Integration Steps

### Step 1: Update QuizPlayer Imports

Add the new hooks:
```typescript
import { useQuizTimer } from '@/hooks/useQuizTimer';
import { useQuizPlay } from '@/hooks/useQuizPlay';
import { useQuizAchievements } from '@/hooks/useQuizAchievements';
```

### Step 2: Replace Timer Logic

**Remove** (lines ~546-747):
- `const [timer, setTimer] = useState(...)`
- `const [isTimerRunning, setIsTimerRunning] = useState(...)`
- Timer useEffect logic
- sessionStorage timer management

**Replace with**:
```typescript
const { timer, isRunning: isTimerRunning, start: startTimer } = useQuizTimer({
  quizSlug,
  autoStart: viewMode === 'grid',
});

// Start timer when navigating to question screen
useEffect(() => {
  if (currentScreen === "question" && !isTimerRunning) {
    startTimer();
  }
}, [currentScreen, isTimerRunning, startTimer]);
```

### Step 3: Replace Quiz Play State

**Remove** (lines ~387-451, 1105-1228):
- All useState for quiz state (currentIndex, currentRound, etc.)
- goToNext, goToPrevious functions
- markCorrect, unmarkCorrect, revealAnswer functions
- Navigation logic

**Replace with**:
```typescript
const quizPlay = useQuizPlay({
  quizSlug,
  questions: finalQuestions,
  rounds: finalRounds,
  isDemo,
  maxQuestions,
  onDemoComplete,
});

// Destructure what you need
const {
  currentIndex,
  currentRound,
  currentScreen,
  viewMode,
  correctAnswers,
  incorrectAnswers,
  revealedAnswers,
  currentQuestion,
  goToNext,
  goToPrevious,
  markCorrect,
  unmarkCorrect,
  revealAnswer,
  hideAnswer,
  switchToGridView,
  switchToPresenterView,
  startRound,
  finishQuiz,
  showCompletionModal,
  setShowCompletionModal,
  showIncompleteModal,
  setShowIncompleteModal,
} = quizPlay;
```

### Step 4: Replace Achievement Logic

**Remove** (lines ~497-537, 773-921):
- `const [achievements, setAchievements] = useState<Achievement[]>([]);`
- Achievement checking useEffect
- dismissAchievement function
- Achievement timeout management

**Replace with**:
```typescript
const { achievements, dismissAchievement } = useQuizAchievements({
  quizSlug,
  correctAnswers,
  incorrectAnswers,
  revealedAnswers,
  totalQuestions: finalQuestions.length,
  timer,
  currentIndex,
  rounds: finalRounds,
  questions: finalQuestions,
});
```

### Step 5: Update Completion Logic

**Remove** (lines ~1132-1148, 578-689):
- localStorage completion saving
- Manual completion state management

**Update** to use QuizSessionService (already integrated in useQuizPlay):
```typescript
// Completion is now handled in useQuizPlay hook
// Just use showCompletionModal and setShowCompletionModal from the hook
```

### Step 6: Clean Up

**Remove**:
- All useState/useEffect related to extracted functionality
- Manual sessionStorage/localStorage calls
- Duplicate state management

**Keep**:
- UI rendering logic
- Theme management
- Viewport handling
- Modal components
- Animation logic

## 📊 Expected Impact

**Before**: ~1800 lines, 84+ useState/useEffect calls
**After**: ~800-1000 lines, ~20 useState/useEffect calls

**Benefits**:
- ✅ Clear separation of concerns
- ✅ Easier to test (hooks can be tested independently)
- ✅ Reusable logic (hooks can be used in other components)
- ✅ Better maintainability
- ✅ Ready for database integration (services handle persistence)

## ⚠️ Notes

1. **Gradual Migration**: You can integrate hooks incrementally - start with timer, then play state, then achievements
2. **Testing**: Test each hook integration separately
3. **Backward Compatibility**: Hooks maintain the same behavior as original code
4. **Progress Persistence**: useQuizPlay automatically saves progress via QuizSessionService

## 🚀 Next Steps

1. Start with `useQuizTimer` (simplest, least dependencies)
2. Then `useQuizPlay` (most complex, but most impactful)
3. Finally `useQuizAchievements` (straightforward replacement)

Each step can be committed separately for easier rollback if needed.

