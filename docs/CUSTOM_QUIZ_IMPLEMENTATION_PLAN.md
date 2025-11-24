# Custom Quiz Creation for Premium Users - Implementation Plan

## Overview

This document outlines the design and implementation plan for allowing premium users to create, share, and play their own custom quizzes. These quizzes will integrate seamlessly with the existing quiz system while maintaining separation from official quizzes.

## Goals

1. **Premium users can create custom quizzes** with flexible structure (x rounds, x questions per round)
2. **User-friendly interface** (distinct from admin interface)
3. **Private sharing** with other premium users via private leaderboards
4. **Mixed leaderboards** supporting both official and custom quizzes
5. **Separate stats tracking** for custom quizzes
6. **PDF generation** for custom quizzes
7. **Storage efficiency** for text-based content
8. **Usage limits** to prevent abuse

---

## Database Schema Changes

### 1. Add `quizType` field to Quiz model

```prisma
model Quiz {
  // ... existing fields ...
  quizType String @default("OFFICIAL") // "OFFICIAL" | "CUSTOM"
  isPublic Boolean @default(false) // For custom quizzes: whether it's shared publicly or privately
  sharedWithUserIds String[] @default([]) // Array of user IDs who have access (for private custom quizzes)
  
  // ... rest of fields ...
}
```

### 2. Create CustomQuizQuestion model (optional - could reuse Question)

**Option A: Reuse existing Question model** (Recommended)
- Add `quizId` directly to Question (nullable)
- Add `isCustom` boolean flag
- Custom questions are linked directly to their quiz

**Option B: Separate CustomQuizQuestion model**
- Simpler queries for custom quizzes
- Clear separation of concerns
- More storage overhead

**Recommendation: Option A** - Reuse Question model with nullable `quizId` and `isCustom` flag.

### 3. Add CustomQuizUsage tracking

```prisma
model CustomQuizUsage {
  id String @id @default(cuid())
  userId String
  monthYear String // "2025-01" format for monthly tracking
  quizzesCreated Int @default(0)
  quizzesShared Int @default(0)
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, monthYear])
  @@index([userId, monthYear])
  @@map("custom_quiz_usage")
}
```

### 4. Update QuizCompletion for custom quizzes

```prisma
model QuizCompletion {
  // ... existing fields ...
  quizType String @default("OFFICIAL") // Track whether completion was for official or custom quiz
  customQuizId String? // For custom quizzes, reference the quiz ID
}
```

---

## API Design

### Endpoints

#### 1. Create Custom Quiz
```
POST /api/premium/custom-quizzes
Body: {
  title: string
  blurb?: string
  colorHex: string
  rounds: Array<{
    title?: string
    blurb?: string
    questions: Array<{
      text: string
      answer: string
      explanation?: string
    }>
  }>
}
Response: { quiz: Quiz, slug: string }
```

#### 2. List User's Custom Quizzes
```
GET /api/premium/custom-quizzes
Query: ?includeShared=true
Response: { quizzes: Quiz[] }
```

#### 3. Get Custom Quiz
```
GET /api/premium/custom-quizzes/[slug]
Response: { quiz: Quiz with rounds and questions }
```

#### 4. Update Custom Quiz
```
PATCH /api/premium/custom-quizzes/[slug]
Body: { ...quiz fields }
Response: { quiz: Quiz }
```

#### 5. Delete Custom Quiz
```
DELETE /api/premium/custom-quizzes/[slug]
Response: { success: boolean }
```

#### 6. Share Custom Quiz
```
POST /api/premium/custom-quizzes/[slug]/share
Body: {
  userIds: string[] // Array of user IDs to share with
  makePublic?: boolean
}
Response: { success: boolean, sharedWith: User[] }
```

#### 7. Generate PDF for Custom Quiz
```
GET /api/premium/custom-quizzes/[slug]/pdf
Response: PDF file
```

#### 8. Check Usage Limits
```
GET /api/premium/custom-quizzes/usage
Response: {
  currentMonth: {
    quizzesCreated: number
    quizzesShared: number
    limit: number
  }
  canCreate: boolean
}
```

---

## UI/UX Design

### User-Friendly Interface (Not Admin-Like)

#### 1. Quiz Builder Page (`/premium/create-quiz`)

**Design Philosophy:**
- Step-by-step wizard or single-page builder
- Visual, card-based interface
- Drag-and-drop for question ordering (optional enhancement)
- Color picker for quiz card
- Real-time preview

**Components:**
- **Quiz Metadata Section:**
  - Title input
  - Description/blurb textarea
  - Color picker (hex input + visual picker)
  
- **Rounds Builder:**
  - Add/remove rounds
  - Round title and description
  - Questions list per round
  - Add/remove questions
  
- **Question Editor:**
  - Question text (textarea)
  - Answer input
  - Optional explanation
  - Inline validation

- **Preview Panel:**
  - Live preview of quiz card
  - Question count
  - Round count

#### 2. My Custom Quizzes Page (`/premium/my-quizzes`)

**Features:**
- Grid/list view of created quizzes
- Filter: All / Shared / Private
- Quick actions: Edit, Share, Delete, Generate PDF
- Usage stats: "3 of 10 quizzes this month"

#### 3. Share Quiz Modal/Dialog

**Features:**
- Search premium users by name/email
- Select multiple users
- Option to make public (visible to all premium users)
- Generate shareable link (optional)
- View who has access

#### 4. Quiz Play Integration

**Modifications:**
- Custom quizzes appear in quiz list with badge "Custom"
- Filter option: "Show custom quizzes"
- Same play interface as official quizzes
- Stats tracked separately

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)
1. Database migrations
   - Add `quizType`, `isPublic`, `sharedWithUserIds` to Quiz
   - Add `isCustom`, `quizId` to Question (nullable)
   - Create CustomQuizUsage table
   - Update QuizCompletion model

2. API endpoints (basic CRUD)
   - Create, Read, Update, Delete custom quizzes
   - Usage tracking middleware

3. Validation
   - Quiz structure validation (flexible: 1-10 rounds, 1-20 questions per round)
   - Usage limit enforcement
   - Premium user verification

### Phase 2: UI Builder (Week 2-3)
1. Quiz builder interface
   - Form components
   - Round/question management
   - Color picker
   - Preview

2. My Quizzes page
   - List view
   - Actions (edit, delete, share)

3. Integration with existing quiz list
   - Filter for custom quizzes
   - Badge indicators

### Phase 3: Sharing & Privacy (Week 3-4)
1. Share functionality
   - User search/selection
   - Access control
   - Public/private toggle

2. Private leaderboard integration
   - Link custom quizzes to private leagues
   - Mixed leaderboard support

### Phase 4: PDF & Polish (Week 4)
1. PDF generation
   - Reuse existing PDF generator
   - Custom quiz branding

2. Stats tracking
   - Separate stats for custom quizzes
   - Analytics dashboard integration

3. Testing & refinement

---

## Storage Considerations

### Text Storage Estimates

**Per Quiz:**
- Title: ~50 bytes
- Blurb: ~200 bytes
- Metadata: ~100 bytes
- Per Question: ~500 bytes (text + answer + explanation)
- Per Round: ~100 bytes (title + blurb)

**Example Quiz (4 rounds, 6 questions each = 24 questions):**
- Base: 350 bytes
- Questions: 24 × 500 = 12,000 bytes
- Rounds: 4 × 100 = 400 bytes
- **Total: ~12.75 KB per quiz**

**With 1000 premium users creating 10 quizzes/month:**
- 10,000 quizzes/month
- ~127 MB/month
- ~1.5 GB/year

**Recommendations:**
1. **Database storage is fine** - PostgreSQL handles this easily
2. **Add indexes** on `quizType`, `createdBy`, `sharedWithUserIds`
3. **Archive old quizzes** - Option to archive after 1 year of inactivity
4. **Compression** - Consider JSONB for `sharedWithUserIds` array

### PDF Storage

- PDFs are generated on-demand (not pre-generated)
- Cache PDFs for 24 hours
- Store in Supabase Storage (same as official quizzes)
- Estimated size: 50-200 KB per PDF

---

## Usage Restrictions

### Recommended Limits

#### Per Month:
- **Quizzes Created: 10** (adjustable per tier)
- **Quizzes Shared: 20** (to prevent spam)
- **Total Questions: 200** (10 quizzes × 20 questions avg)

#### Per Quiz:
- **Minimum:** 1 round, 1 question
- **Maximum:** 10 rounds, 20 questions per round
- **Total Questions:** Max 100 per quiz

#### Storage:
- **Max Quizzes Stored:** 50 per user (archive older ones)
- **Max Shared Quizzes:** 100 (across all users)

### Enforcement

1. **Pre-creation check:**
   ```typescript
   const usage = await getCustomQuizUsage(userId, currentMonth);
   if (usage.quizzesCreated >= LIMITS.QUIZZES_PER_MONTH) {
     throw new Error('Monthly quiz limit reached');
   }
   ```

2. **Database constraints:**
   - Check constraint on question count per round
   - Trigger to update usage counter

3. **UI indicators:**
   - Show usage: "7 of 10 quizzes created this month"
   - Disable create button when limit reached
   - Upgrade prompt for higher limits (future)

---

## Technical Considerations

### 1. Quiz Structure Flexibility

**Current System:**
- Fixed: 4 rounds + 1 people's round, 6 questions each

**Custom Quizzes:**
- Flexible: 1-10 rounds, 1-20 questions per round
- No people's round requirement
- No category requirement (or use "Custom" category)

**Implementation:**
- Make `QUIZ_CONSTANTS` optional for custom quizzes
- Add validation that's flexible for custom quizzes
- QuizPlayer component already handles variable rounds/questions

### 2. Question Model Reuse

**Approach:**
```prisma
model Question {
  // ... existing fields ...
  quizId String? // Nullable - set for custom quiz questions
  isCustom Boolean @default(false)
  
  // For custom quizzes, categoryId can be null or point to "Custom" category
  categoryId String? // Make nullable
}
```

**Benefits:**
- Reuse existing question infrastructure
- Same validation logic
- Same stats tracking

### 3. Leaderboard Integration

**Challenge:** Mix official and custom quizzes on same leaderboard

**Solution:**
- Add `quizType` filter to leaderboard queries
- Allow filtering: "Official Only", "Custom Only", "All"
- Separate stats tables or add `quizType` to existing stats

### 4. Sharing Model

**Option A: Direct User Sharing**
- `sharedWithUserIds` array on Quiz
- Simple, fast queries
- Limited to direct sharing

**Option B: Share Table**
```prisma
model QuizShare {
  id String @id @default(cuid())
  quizId String
  sharedWithUserId String
  sharedByUserId String
  canEdit Boolean @default(false)
  createdAt DateTime @default(now())
  
  @@unique([quizId, sharedWithUserId])
}
```

**Recommendation: Option A** for MVP, migrate to Option B if collaboration features needed.

### 5. Slug Generation

**For Custom Quizzes:**
- Format: `custom-{userId}-{timestamp}` or `custom-{randomId}`
- Ensure uniqueness
- User-friendly option: `custom-{userSlug}-{quizTitleSlug}`

### 6. PDF Generation

**Reuse existing:**
- `generateQuizPDF()` function
- Same format as official quizzes
- Add "Custom Quiz" watermark/badge

---

## Edge Cases & Validation

### Validation Rules

1. **Quiz Metadata:**
   - Title: 3-100 characters, required
   - Blurb: max 500 characters, optional
   - ColorHex: valid hex color, required

2. **Rounds:**
   - Min 1 round, max 10 rounds
   - Round title: max 100 characters
   - Round blurb: max 300 characters

3. **Questions:**
   - Min 1 question per round, max 20
   - Question text: 10-500 characters
   - Answer: 1-200 characters
   - Explanation: max 500 characters (optional)

4. **Usage Limits:**
   - Check before creation
   - Atomic updates to usage counter
   - Handle race conditions

### Edge Cases

1. **User downgrades from Premium:**
   - Keep existing custom quizzes (read-only)
   - Prevent new creation
   - Allow deletion

2. **Shared quiz owner deletes account:**
   - Transfer ownership to first shared user
   - Or mark as orphaned (read-only)

3. **Quiz with no questions:**
   - Prevent saving
   - Show validation error

4. **Concurrent edits:**
   - Last-write-wins (simple)
   - Or implement optimistic locking (complex)

5. **Storage limits:**
   - Warn at 80% of limit
   - Prevent creation at 100%
   - Offer archive/delete old quizzes

---

## Security Considerations

1. **Authorization:**
   - Verify premium status on all endpoints
   - Verify quiz ownership before edit/delete
   - Verify share permissions

2. **Input Validation:**
   - Sanitize all text inputs
   - Prevent XSS in question/answer text
   - Validate color hex format

3. **Rate Limiting:**
   - Limit API calls per user
   - Prevent abuse of sharing feature

4. **Content Moderation:**
   - Optional: Flag inappropriate content
   - Report mechanism for shared quizzes
   - Admin review queue (future)

---

## Future Enhancements

1. **Collaboration:**
   - Multiple editors per quiz
   - Comments/feedback system
   - Version history

2. **Templates:**
   - Save quiz as template
   - Browse community templates
   - Quick-start from template

3. **Advanced Features:**
   - Image support in questions
   - Audio/video questions
   - Multiple choice questions
   - Timed questions

4. **Analytics:**
   - View stats for shared quizzes
   - Most popular custom quizzes
   - Question difficulty analysis

5. **Marketplace:**
   - Sell custom quizzes
   - Rating/review system
   - Featured quizzes

---

## Migration Strategy

1. **Database Migration:**
   - Add new fields with defaults
   - Backfill existing quizzes as "OFFICIAL"
   - Create indexes

2. **Code Migration:**
   - Update Quiz queries to filter by `quizType`
   - Update QuizPlayer to handle custom quizzes
   - Update stats tracking

3. **Rollout:**
   - Feature flag: `ENABLE_CUSTOM_QUIZZES`
   - Beta test with select premium users
   - Gradual rollout

---

## Success Metrics

1. **Adoption:**
   - % of premium users creating quizzes
   - Average quizzes created per user
   - Quizzes shared per user

2. **Engagement:**
   - Custom quiz play rate
   - Average completion rate
   - Time spent in quiz builder

3. **Quality:**
   - Average questions per quiz
   - Quiz completion rate
   - User feedback scores

---

## Questions to Resolve

1. **Question Model:**
   - Reuse existing Question model or create separate?
   - **Recommendation: Reuse with nullable quizId**

2. **Category Requirement:**
   - Require category for custom quiz questions?
   - **Recommendation: Optional, default to "Custom" category**

3. **People's Round:**
   - Require people's round in custom quizzes?
   - **Recommendation: Optional, let users decide**

4. **Sharing Model:**
   - Direct array or separate table?
   - **Recommendation: Array for MVP, migrate if needed**

5. **Usage Limits:**
   - What are the exact limits?
   - **Recommendation: 10 quizzes/month, 20 shares/month**

---

## Next Steps

1. **Review this plan** and provide feedback
2. **Decide on open questions** (see above)
3. **Create detailed task breakdown** for Phase 1
4. **Set up database migrations**
5. **Begin API implementation**

---

## Estimated Timeline

- **Phase 1 (Infrastructure):** 1-2 weeks
- **Phase 2 (UI Builder):** 1-2 weeks
- **Phase 3 (Sharing):** 1 week
- **Phase 4 (PDF & Polish):** 1 week

**Total: 4-6 weeks** for full implementation

---

## Notes

- This feature significantly enhances premium value proposition
- Storage costs are minimal (text-based)
- Reuses existing quiz infrastructure where possible
- Maintains separation from official quizzes
- Provides foundation for future collaboration features

