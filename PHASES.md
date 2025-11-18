# SchoolQuiz – Admin Dashboard Phases

We are replacing the old admin with a new admin at `/admin`. 
The existing "Achievement Creator" from the old admin must eventually be migrated and integrated.

## Phase 0 – Admin Shell

- Create `app/admin/layout.tsx` as the admin shell (sidebar + topbar + main content area).

- Create `app/admin/page.tsx` as the overview page with placeholder stats.

- Add role protection so only PlatformAdmins (and/or appropriate admin roles) can access `/admin/*`.

- Do NOT integrate Achievement Creator yet. Just scaffold the new admin shell.

## Phase 1 – Users & Organisations

- Implement `app/admin/organisations/page.tsx` (list view).

- Implement `app/admin/organisations/[orgId]/page.tsx` (detail view with tabs).

- Implement `app/admin/users/page.tsx` and `app/admin/users/[userId]/page.tsx`.

- Show and manage roles: Admin, OrgAdmin, Teacher, Student, Parent.

- Add impersonation support for debugging (admin can view as a given user).

- Add basic audit logging for user/org changes.

## Phase 2 – Quizzes, Runs & Scheduling

- Implement `app/admin/quizzes/page.tsx` and `app/admin/quizzes/[quizId]/page.tsx`.

- Implement `app/admin/scheduling/page.tsx` with calendar + jobs table.

- Introduce a simple `scheduled_jobs` abstraction and a cron entry point or similar to execute due jobs (e.g., open/close quiz runs, weekly quiz publish, maintenance windows).

- Show and manage past and upcoming quiz runs.

## Phase 3 – Analytics

- Implement:

  - `app/admin/analytics/engagement/page.tsx`

  - `app/admin/analytics/learning/page.tsx`

  - `app/admin/analytics/funnel/page.tsx`

- Engagment:

  - DAU/MAU, quiz attempts per day, top active orgs.

- Learning:

  - Outcome coverage, "most missed outcomes" based on existing answer data.

- Funnel:

  - Signup → first quiz → org creation → paid (as far as current data allows).

## Phase 4 – Billing, Support, System & Achievements

- Billing:

  - `app/admin/billing/page.tsx`

  - Optional: `app/admin/billing/webhooks/page.tsx` to view Stripe webhook events.

- Support:

  - `app/admin/support/page.tsx` for tickets/contact messages.

- System:

  - `app/admin/system/page.tsx` overview.

  - `app/admin/system/feature-flags/page.tsx`

  - `app/admin/system/audit-log/page.tsx`

- Achievements:

  - Integrate the existing "Achievement Creator" from the old admin into a new section under `/admin` (e.g. `/admin/achievements`).

  - Reuse as much logic as possible; modernise the UI to fit the new admin shell.

## Phase 5 – Cleanup

- Remove the legacy admin routes/components once the new `/admin` covers all necessary functionality, including Achievement Creator.

- Update any links in the app that reference the old admin to use the new `/admin` routes.

