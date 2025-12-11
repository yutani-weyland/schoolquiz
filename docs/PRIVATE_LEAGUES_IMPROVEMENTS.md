# Private Leagues Improvements

## Current State Analysis

### ✅ What Works
- **Delete League**: API endpoint exists (`DELETE /api/private-leagues/[id]`) - only creator can delete
- **Manage League**: Modal exists with edit name/description/color functionality
- **View Members**: Modal shows members list with creator badges
- **Invite Members**: Can invite by email or organisation members

### ❌ What's Missing
- **Remove Member API**: Frontend calls `DELETE /api/private-leagues/[id]/members/[userId]` but endpoint doesn't exist
- **Remove Member UI**: Button exists in modal but functionality is broken

## Recommended Improvements

### 1. **Critical: Add Remove Member Functionality** 🔴
**Priority: HIGH**

**Backend:**
- Create `DELETE /api/private-leagues/[id]/members/[userId]` endpoint
- Only league creator can remove members
- Soft delete by setting `leftAt` timestamp
- Return appropriate error if user tries to remove themselves or creator

**Frontend:**
- Fix `handleKickMember` in `page.tsx` to properly call new endpoint
- Add confirmation dialog with member name
- Show success/error toast notifications
- Invalidate queries to refresh member list

**UX Improvements:**
- Show loading state on remove button
- Disable remove button for creator (can't remove themselves)
- Show warning if removing last member before creator

### 2. **Improve League Card Actions** 🟡
**Priority: MEDIUM**

**Current Issues:**
- Actions are small and easy to miss
- No visual distinction between creator and member actions
- Settings icon only visible on hover

**Suggestions:**
- Add more prominent "Delete League" button in Manage modal (already exists but could be more visible)
- Add quick action menu (three dots) on league card
- Show creator badge more prominently
- Add "Leave League" button for non-creators (already exists in API)

### 3. **Enhanced Members Modal** 🟡
**Priority: MEDIUM**

**Current State:**
- Shows members list
- Has remove button for creator
- Shows invite code

**Improvements:**
- Add search/filter members
- Show member join date
- Show member stats (quizzes completed, points, etc.)
- Bulk actions (select multiple members to remove)
- Export member list
- Show member activity status (active/inactive)
- Add pagination for large member lists (currently limited to 100)

### 4. **Better Delete Confirmation** 🟢
**Priority: LOW**

**Current:**
- Simple confirmation dialog in Manage modal

**Improvements:**
- Show league stats before deletion (member count, creation date)
- Warn about data loss (stats, history)
- Add "Type league name to confirm" for extra safety
- Show impact: "This will remove X members from the league"

### 5. **League Management Dashboard** 🟢
**Priority: LOW**

**New Feature:**
- Create a dedicated management view for creators
- Show league analytics (growth, activity, top members)
- Quick actions panel
- Member management tools
- Invite code regeneration
- League settings (max members, privacy, etc.)

### 6. **Member Permissions & Roles** 🟢
**Priority: LOW (Future Enhancement)**

**Ideas:**
- Add co-admin role (can manage members but not delete league)
- Member roles (viewer, participant, admin)
- Permission to invite others
- Transfer ownership functionality

### 7. **UI/UX Polish** 🟢
**Priority: LOW**

**Improvements:**
- Better empty states (no members, no leagues)
- Loading skeletons instead of spinners
- Better error messages
- Success animations
- Keyboard shortcuts (Delete key to remove member, etc.)
- Drag to reorder leagues (if sorting is added)

### 8. **Accessibility** 🟢
**Priority: LOW**

**Improvements:**
- ARIA labels for all action buttons
- Keyboard navigation
- Screen reader announcements for actions
- Focus management in modals

## Implementation Priority

1. **🔴 CRITICAL**: Add Remove Member API endpoint
2. **🟡 HIGH**: Fix Remove Member UI functionality
3. **🟡 MEDIUM**: Improve league card actions visibility
4. **🟡 MEDIUM**: Enhance members modal with search/pagination
5. **🟢 LOW**: Better delete confirmation
6. **🟢 LOW**: UI/UX polish and accessibility

## Technical Notes

### API Endpoint to Create
```typescript
// DELETE /api/private-leagues/[id]/members/[userId]
// - Check user is creator
// - Check member exists and is active
// - Prevent removing creator
// - Soft delete by setting leftAt
// - Return success/error
```

### Database Considerations
- Already has `leftAt` field for soft deletes ✅
- Indexes exist for member queries ✅
- No schema changes needed ✅

### Frontend Changes Needed
- Fix `handleKickMember` in `apps/admin/src/app/leagues/page.tsx`
- Update `LeagueMembersModal` to show better feedback
- Add error handling and loading states
