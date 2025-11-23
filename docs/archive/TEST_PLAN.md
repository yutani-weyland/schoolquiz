# Admin Quiz Management - Test Plan

## Test Environment
- Base URL: `http://localhost:3001`
- Database: Supabase (PostgreSQL)

## Test Cases

### 1. View Quizzes List (`/admin/quizzes`)
- [ ] Page loads without errors
- [ ] All 5 seeded quizzes are displayed
- [ ] Quiz data is correct (title, status, rounds count, runs count)
- [ ] Search functionality works (search by title)
- [ ] Status filter works (draft, scheduled, published)
- [ ] Sorting works (title, status, runs, publication date, created date)
- [ ] Pagination works (if more than 50 quizzes)

### 2. Create New Quiz (`/create-quiz`)
- [ ] Page loads without errors
- [ ] Can fill in quiz metadata (title, description, status)
- [ ] Can add 4 standard rounds with 6 questions each
- [ ] Can add 1 peoples round with 1 question
- [ ] Can save quiz successfully
- [ ] New quiz appears in `/admin/quizzes` list
- [ ] Quiz can be played at `/quizzes/[slug]/play`

### 3. Edit Existing Quiz (`/create-quiz?edit=quizId`)
- [ ] Page loads with `?edit=quizId` parameter
- [ ] Quiz data is loaded and displayed correctly
- [ ] All rounds and questions are populated
- [ ] Can modify quiz metadata
- [ ] Can modify rounds and questions
- [ ] Can save changes successfully
- [ ] Changes are reflected in quiz list
- [ ] Changes are reflected when playing the quiz

### 4. Delete Quiz (`/admin/quizzes` or `/explore-quizzes`)
- [ ] Delete button is visible
- [ ] Confirmation dialog appears
- [ ] Quiz is deleted from database
- [ ] Quiz disappears from list
- [ ] Quiz is no longer playable

### 5. Duplicate Quiz (`/explore-quizzes`)
- [ ] Duplicate button is visible
- [ ] Confirmation dialog appears
- [ ] New quiz is created with "-copy" suffix
- [ ] All rounds and questions are duplicated
- [ ] New quiz appears in list
- [ ] New quiz can be edited independently

### 6. Explore Quizzes Page (`/explore-quizzes`)
- [ ] Page loads without errors
- [ ] All quizzes are displayed in grid layout
- [ ] Search functionality works
- [ ] Filter by status works
- [ ] Sort by date/number/submissions/score works
- [ ] Edit button navigates to edit page
- [ ] Delete button works
- [ ] Duplicate button works

### 7. Quiz Play Page (`/quizzes/[slug]/play`)
- [ ] Quiz loads from database
- [ ] All rounds and questions are displayed
- [ ] Navigation works (next/previous)
- [ ] Timer works
- [ ] Answers can be submitted
- [ ] Quiz completion saves to database
- [ ] Score is calculated correctly

### 8. Error Handling
- [ ] Invalid quiz ID shows appropriate error
- [ ] Network errors are handled gracefully
- [ ] Validation errors are displayed
- [ ] Loading states are shown during API calls

## Quick Test Checklist

1. **View List**: Navigate to `/admin/quizzes` - should see 5 quizzes
2. **Search**: Type "demo" in search - should filter to demo quiz
3. **Edit**: Click "Edit" on any quiz - should load in create-quiz page
4. **Save Edit**: Make a change and save - should update successfully
5. **Delete**: Delete a quiz - should remove from list
6. **Duplicate**: Duplicate a quiz - should create new quiz with "-copy"
7. **Create New**: Create a new quiz - should appear in list
8. **Play Quiz**: Play a quiz - should work with database data
