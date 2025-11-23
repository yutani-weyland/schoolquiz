# Test Scripts for The School Quiz Platform

## Quick Test Commands

### 1. Quiz Functionality Tests

```bash
# Test quiz loading
curl http://localhost:3000/api/quizzes

# Test quiz completion (requires auth token)
curl -X POST http://localhost:3000/api/quiz/completion \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "quizSlug": "12",
    "score": 20,
    "totalQuestions": 25,
    "completionTimeSeconds": 1200,
    "roundScores": [
      {"roundNumber": 1, "category": "Shape Up", "score": 5, "totalQuestions": 6, "timeSeconds": 300}
    ],
    "categories": ["Shape Up", "Pumpkins"]
  }'
```

### 2. API Endpoint Tests

```bash
# Test GET /api/quizzes
curl http://localhost:3000/api/quizzes

# Test GET /api/profile/[userId] (requires auth)
curl http://localhost:3000/api/profile/user-123 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test POST /api/quiz/completion with invalid payload (should return 400)
curl -X POST http://localhost:3000/api/quiz/completion \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'

# Test without auth (should return 401)
curl -X POST http://localhost:3000/api/quiz/completion \
  -H "Content-Type: application/json" \
  -d '{"quizSlug": "12", "score": 20, "totalQuestions": 25}'
```

### 3. Performance Tests

```bash
# Simple load test with Apache Bench
ab -n 100 -c 10 http://localhost:3000/api/quizzes

# Or with curl in a loop
for i in {1..10}; do
  curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/quizzes
done
```

## Manual Testing Checklist

### Quiz Player Tests
1. Navigate to `/quizzes/12/intro`
2. Click "Play Quiz" or "Try Quiz"
3. Verify:
   - [ ] All questions load
   - [ ] Timer starts
   - [ ] Can answer questions
   - [ ] Score updates correctly
   - [ ] Round transitions work
   - [ ] Results screen shows correct score

### State Persistence Test
1. Start quiz
2. Answer 3 questions
3. Refresh page
4. Verify:
   - [ ] Timer persists (or resets gracefully)
   - [ ] Progress is maintained (or resets gracefully)

### Responsive Design Test
1. Open DevTools → Toggle Device Toolbar
2. Test at breakpoints:
   - [ ] Mobile (375px)
   - [ ] Tablet (768px)
   - [ ] Desktop (1024px)
   - [ ] Large (1440px)
3. Verify:
   - [ ] Layout adapts correctly
   - [ ] Text is readable
   - [ ] Buttons are tappable
   - [ ] No horizontal scroll

### Dark Mode Test
1. Toggle dark mode
2. Navigate through app
3. Verify:
   - [ ] All components render correctly
   - [ ] Text is readable
   - [ ] No contrast issues

### Accessibility Test
1. Tab through interactive elements
2. Verify:
   - [ ] Focus rings visible
   - [ ] Can navigate with keyboard
   - [ ] Screen reader friendly

