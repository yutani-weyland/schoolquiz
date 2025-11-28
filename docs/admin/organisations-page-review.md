# Organisations Page - Review & Recommendations

## High Priority Fixes

### 1. **Terminology Inconsistency: "Members" vs "Seats"** 🔴 CRITICAL

**Issue:**
- Main page table shows "Members" column (line 179 in `page.tsx`)
- Overview tab says "Total Members" but then shows "of X seats" (line 203 in `[id]/page.tsx`)
- Billing tab has a section titled "Seats" (line 530)
- Members table has a "Seat" column (line 318 in `organisation/[id]/page.tsx`)
- Edit modal has "Max Seats" field (line 424 in `page.tsx`)
- InviteMemberModal doesn't mention seats at all

**Recommendation:**
- **Standardize on "Members"** as the primary term for people
- Use "Seats" only when referring to the capacity/limit (e.g., "5 of 10 seats used")
- Update all references:
  - Billing tab: Change "Seats" section to "Member Capacity" or "Seat Usage"
  - Overview tab: Change "of X seats" to "of X member capacity" or keep "seats" but be consistent
  - Members table: Change "Seat" column to "Has Seat" or "Seat Assigned" (more descriptive)
  - Edit modal: Keep "Max Seats" but add helper text: "Maximum number of members (seats)"

### 2. **InviteMemberModal Missing Seat Information** 🔴 CRITICAL

**Issue:**
- Modal doesn't show available seats before inviting
- No warning if seats are full
- User has to guess if they can invite someone

**Recommendation:**
- Add seat availability display in modal:
  ```
  Available Seats: 3 of 10 remaining
  ```
- Show warning/disable button if no seats available (unless OWNER role)
- Fetch and display seat info when modal opens

### 3. **Missing Error Handling & User Feedback** 🟠 HIGH

**Issues:**
- InviteMemberModal uses `alert()` for errors (line 932) - poor UX
- No success feedback after actions
- No loading states in some places
- API errors not properly displayed

**Recommendation:**
- Replace `alert()` with proper toast/notification system
- Add success messages after successful invites
- Show inline error messages in forms
- Add loading spinners for async operations

### 4. **Members Table "Seat" Column Unclear** 🟠 HIGH

**Issue:**
- Column header just says "Seat" (line 318)
- Shows "Yes/No" but unclear what it means
- Doesn't indicate if seat is required or optional

**Recommendation:**
- Change column header to "Seat Assigned" or "Has Seat"
- Add tooltip: "Whether this member is using a seat (required for non-owners)"
- Consider showing seat status with icon + text

### 5. **No Bulk Actions** 🟠 HIGH

**Issue:**
- Can only invite one member at a time
- Can only change roles one at a time
- No way to remove multiple members

**Recommendation:**
- Add checkbox selection for bulk actions
- Bulk role changes
- Bulk remove/deactivate
- Bulk invite (CSV upload or multiple emails)

## Quality of Life Improvements

### 6. **Search & Filter in Members Tab** 🟡 MEDIUM

**Issue:**
- Members tab has no search or filter
- Hard to find specific members in large organisations

**Recommendation:**
- Add search by name/email
- Filter by role, status, seat assignment
- Sort by any column

### 7. **Member Details/Profile View** 🟡 MEDIUM

**Issue:**
- Can't see full member details
- No way to see member's groups, activity, etc.

**Recommendation:**
- Make member rows clickable to view details
- Show member profile modal with:
  - Full user info
  - Groups they're in
  - Activity history
  - Seat assignment history

### 8. **Seat Usage Visualization** 🟡 MEDIUM

**Issue:**
- Only shows numbers, not visual representation
- Billing tab has progress bar, but overview doesn't

**Recommendation:**
- Add progress bar to overview tab (like billing tab)
- Color-code: green (<80%), yellow (80-95%), red (>95%)
- Show warning when approaching limit

### 9. **Invite History/Status** 🟡 MEDIUM

**Issue:**
- No way to see pending invites
- Can't resend or cancel invites
- No indication of invite status

**Recommendation:**
- Show pending invites in members table (with PENDING status)
- Add "Resend Invite" action
- Add "Cancel Invite" action
- Show invite sent date

### 10. **Role Management Improvements** 🟡 MEDIUM

**Issue:**
- Role dropdown in table is easy to misclick
- No confirmation for role changes
- No explanation of what each role does

**Recommendation:**
- Add confirmation dialog for role changes
- Add role descriptions/tooltips
- Consider separate "Actions" column with dropdown menu
- Prevent changing OWNER role (or add extra confirmation)

### 11. **Export Functionality** 🟢 LOW

**Issue:**
- No way to export member list
- Can't generate reports

**Recommendation:**
- Add "Export Members" button (CSV/Excel)
- Include: name, email, role, status, seat assignment, joined date

### 12. **Empty States** 🟢 LOW

**Issue:**
- Some empty states are basic
- No guidance on what to do next

**Recommendation:**
- Improve empty states with:
  - Helpful messaging
  - Action buttons
  - Illustrations/icons

### 13. **Keyboard Shortcuts** 🟢 LOW

**Issue:**
- No keyboard shortcuts for common actions

**Recommendation:**
- `⌘K` for search (already exists in topbar, but could add to members tab)
- `⌘I` to open invite modal
- `Esc` to close modals

### 14. **Responsive Design** 🟡 MEDIUM

**Issue:**
- Tables may not be mobile-friendly
- Modals might be too wide on mobile

**Recommendation:**
- Test and improve mobile layouts
- Consider card view for mobile instead of table
- Stack modals vertically on mobile

### 15. **Accessibility** 🟡 MEDIUM

**Issue:**
- Some interactive elements may lack proper ARIA labels
- Color-only status indicators

**Recommendation:**
- Add proper ARIA labels to all interactive elements
- Ensure status badges have text, not just color
- Test with screen readers

## Implementation Priority

### Phase 1 (Immediate - This Week)
1. Fix terminology consistency (#1)
2. Add seat info to InviteMemberModal (#2)
3. Improve error handling (#3)
4. Clarify "Seat" column (#4)

### Phase 2 (Next Week)
5. Add search/filter to Members tab (#6)
6. Improve seat visualization (#8)
7. Add invite history (#9)

### Phase 3 (Future)
8. Bulk actions (#5)
9. Member details view (#7)
10. Export functionality (#11)
11. Role management improvements (#10)

## Code Locations

- Main organisations list: `apps/admin/src/app/admin/organisations/page.tsx`
- Organisation detail: `apps/admin/src/app/admin/organisations/[id]/page.tsx`
- InviteMemberModal: `apps/admin/src/app/admin/organisation/[id]/page.tsx` (line 914)
- API endpoint: `apps/admin/src/app/api/organisation/[id]/members/route.ts`

