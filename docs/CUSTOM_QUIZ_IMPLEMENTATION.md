# Custom Quiz Creation Implementation Plan

## Overview

This document outlines the implementation plan for Custom Quiz Creation for Premium Users, following the requirements in the project prompt.

## Architecture Decisions

### 1. Schema Extensions

**Quiz Model:**
- Add `quizType` enum: `OFFICIAL` | `CUSTOM` (default: `OFFICIAL`)
- Add `createdByUserId` (nullable) to support User model (in addition to existing `createdBy` for Teacher)
- Add branding fields: `schoolLogoUrl`, `brandHeading`, `brandSubheading`
- Keep existing structure for backward compatibility

**Question Model:**
- Add `quizId` (nullable) to directly link custom quiz questions
- Add `isCustom` boolean flag
- Make `categoryId` nullable (custom questions may not need categories)
- Keep `createdBy` (Teacher) for backward compatibility, add `createdByUserId` (nullable)

**Sharing:**
- Create `CustomQuizShare` join table (better than array for querying)
- Tracks who has access to which custom quiz

**Usage Tracking:**
- Create `CustomQuizUsage` table for monthly limits
- Tracks quizzes created and shared per month

**QuizCompletion:**
- Add `quizType` field to distinguish official vs custom
- Keep `quizSlug` for compatibility

### 2. API Structure

Following existing patterns from `/api/private-leagues`:
- `/api/premium/custom-quizzes` - List/Create
- `/api/premium/custom-quizzes/[id]` - Get/Update/Delete
- `/api/premium/custom-quizzes/[id]/share` - Share management
- `/api/premium/custom-quizzes/[id]/branding` - Branding management
- `/api/premium/custom-quizzes/[id]/pdf` - PDF generation
- `/api/premium/custom-quizzes/usage` - Usage limits

### 3. Validation Rules

- Quiz: Title 3-100 chars, Blurb ≤500 chars
- Rounds: 1-10 rounds per quiz
- Questions: 1-20 per round, max 100 total
- Question text: 10-500 chars
- Answer: 1-200 chars
- Explanation: ≤500 chars (optional)

### 4. Usage Limits

- 10 custom quizzes created per month
- 20 shares per month
- Max 50 stored custom quizzes per user

## Implementation Phases

### Phase 1: Schema & Backend (Current)
1. ✅ Analyze existing schema
2. ⏳ Create Prisma schema extensions
3. ⏳ Create database migration
4. ⏳ Implement CRUD API endpoints
5. ⏳ Implement usage tracking
6. ⏳ Add branding fields

### Phase 2: UI Builder
1. Quiz builder interface
2. My Quizzes page
3. Integration with quiz list

### Phase 3: Sharing & Player
1. Share modal and functionality
2. Quiz player integration
3. Completion tracking

### Phase 4: PDF & Polish
1. PDF generation with branding
2. Validation and error handling
3. Testing and refinement

