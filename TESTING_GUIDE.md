# Admin Quiz Management - Testing Guide

## ✅ API Status: Working

All API endpoints are responding correctly:
- ✅ GET /api/admin/quizzes - Returns 5 quizzes with full data
- ✅ GET /api/admin/quizzes/[id] - Returns quiz details
- ✅ Search and filter functionality working

## 🧪 Manual Testing Steps

### Test 1: View Admin Quizzes Page
**URL:** `http://localhost:3001/admin/quizzes`

**Expected:**
- [ ] Page loads without errors
- [ ] Shows list of 5 quizzes from database
- [ ] Each quiz shows: ID, Title, Status, Runs count, Publication date, PDF status
- [ ] Search box works (try searching for "demo")
- [ ] Status filter works (try filtering by "published")
- [ ] Sorting works (click column headers)
- [ ] "Edit" button navigates to edit page

**Test Search:**
1. Type "demo" in search box
2. Should filter to show only "Quiz demo"

**Test Filter:**
1. Select "Published" from status dropdown
2. Should show only published quizzes

---

### Test 2: Edit a Quiz
**URL:** `http://localhost:3001/create-quiz?edit=cmi5x8v6zhtth4yo4b`

**Expected:**
- [ ] Page shows "Edit Quiz" title (not "New Quiz")
- [ ] Loading spinner appears briefly
- [ ] Quiz data loads:
  - [ ] Quiz number: 12
  - [ ] Title: "Quiz 12"
  - [ ] Description: "Quiz number 12"
  - [ ] 5 rounds displayed
  - [ ] Each round has questions
- [ ] Can modify quiz title
- [ ] Can modify description
- [ ] Can add/remove questions
- [ ] Can save changes
- [ ] Success message appears
- [ ] Redirects to dashboard

**Test Edit:**
1. Change title to "Quiz 12 - Updated"
2. Click "Save Draft"
3. Verify success message
4. Go back to `/admin/quizzes`
5. Verify title was updated

---

### Test 3: Create a New Quiz
**URL:** `http://localhost:3001/create-quiz`

**Expected:**
- [ ] Page shows "New Quiz" title
- [ ] Form is empty
- [ ] Can enter quiz number
- [ ] Can enter title and description
- [ ] Can add rounds
- [ ] Can add questions to rounds
- [ ] Validation works (requires 4 rounds of 6 questions + 1 people round)
- [ ] Can save as draft
- [ ] Can publish
- [ ] Success message appears
- [ ] New quiz appears in `/admin/quizzes`

**Test Create:**
1. Enter quiz number: 13
2. Enter title: "Test Quiz 13"
3. Enter description: "Testing quiz creation"
4. Add 4 standard rounds with 6 questions each
5. Add 1 People's Question round with 1 question
6. Click "Save Draft"
7. Verify success message
8. Go to `/admin/quizzes`
9. Verify new quiz appears

---

### Test 4: Explore Quizzes Page
**URL:** `http://localhost:3001/explore-quizzes`

**Expected:**
- [ ] Page loads without errors
- [ ] Shows quizzes in timeline view (grouped by month)
- [ ] Each quiz card shows:
  - [ ] Quiz number
  - [ ] Title
  - [ ] Description
  - [ ] Status badge
  - [ ] Categories
  - [ ] Action buttons (Edit, Delete, Duplicate)
- [ ] Delete button works (with confirmation)
- [ ] Duplicate button works
- [ ] Loading state shows while fetching

**Test Delete:**
1. Find a quiz (preferably a test one)
2. Click "Delete" button
3. Confirm deletion in dialog
4. Verify quiz is removed
5. Verify success message

**Test Duplicate:**
1. Find a quiz
2. Click "Duplicate" button
3. Confirm duplication
4. Verify new quiz appears with "-copy" in slug
5. Verify all rounds and questions were copied

---

### Test 5: Quiz Detail Page
**URL:** `http://localhost:3001/admin/quizzes/cmi5x8v6zhtth4yo4b`

**Expected:**
- [ ] Page loads quiz details
- [ ] Shows quiz metadata
- [ ] Shows rounds and questions
- [ ] Shows analytics (runs, participants, etc.)
- [ ] Can edit quiz
- [ ] Can delete quiz

---

## 🐛 Common Issues to Watch For

1. **Loading States:**
   - Pages should show loading spinner while fetching data
   - Should not show blank/white screen

2. **Error Handling:**
   - If API fails, should show error message
   - Should not crash the app

3. **Data Transformation:**
   - Quiz data should load correctly in edit mode
   - Rounds and questions should display properly
   - Numbers should be correct

4. **Validation:**
   - Should prevent saving invalid quizzes
   - Should show helpful error messages

5. **Navigation:**
   - Edit button should navigate correctly
   - Save should redirect appropriately
   - Back buttons should work

---

## 📝 Test Results Template

```
Date: [Date]
Tester: [Your name]

### Test 1: Admin Quizzes Page
- [ ] Pass
- [ ] Fail - Notes: [issues]

### Test 2: Edit Quiz
- [ ] Pass
- [ ] Fail - Notes: [issues]

### Test 3: Create Quiz
- [ ] Pass
- [ ] Fail - Notes: [issues]

### Test 4: Explore Quizzes
- [ ] Pass
- [ ] Fail - Notes: [issues]

### Test 5: Quiz Detail
- [ ] Pass
- [ ] Fail - Notes: [issues]

### Issues Found:
1. [Issue description]
2. [Issue description]
```

---

## 🚀 Quick Test URLs

- Admin Quizzes: http://localhost:3001/admin/quizzes
- Explore Quizzes: http://localhost:3001/explore-quizzes
- Create Quiz: http://localhost:3001/create-quiz
- Edit Quiz 12: http://localhost:3001/create-quiz?edit=cmi5x8v6zhtth4yo4b
- Quiz Detail: http://localhost:3001/admin/quizzes/cmi5x8v6zhtth4yo4b

