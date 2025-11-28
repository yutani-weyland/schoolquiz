# SchoolQuiz – Admin Dashboard Plan

## Architecture Overview

- Single Next.js app using the App Router.

- New admin lives under `app/admin/*`.

- Old admin exists temporarily; only the "Achievement Creator" feature will be migrated.

- Database: Postgres (Supabase or similar).

- Roles:

  - PlatformAdmin, OrgAdmin, Teacher, Student, Parent.

## Core Domains

- Users & Roles

- Organisations & Classes

- Quizzes & Question Bank

- Quiz Runs & Attempts

- Scheduling (open/close times, weekly quizzes, maintenance)

- Analytics (engagement, learning outcomes, funnel)

- Billing (Stripe subscriptions, invoices, webhooks)

- Support (contact, tickets)

- System (feature flags, audit logs, health)

- Achievements (including Achievement Creator)

## Admin Route Structure (target)

- `/admin` – Overview

- `/admin/organisations` – org list

- `/admin/organisations/[orgId]` – org detail (overview, members, classes, billing, activity)

- `/admin/users` – user list

- `/admin/users/[userId]` – user detail

- `/admin/quizzes` – quiz list

- `/admin/quizzes/[quizId]` – quiz detail (content, analytics, runs)

- `/admin/scheduling` – calendar + jobs

- `/admin/analytics/engagement`

- `/admin/analytics/learning`

- `/admin/analytics/funnel`

- `/admin/billing`

- `/admin/support`

- `/admin/system`

- `/admin/system/feature-flags`

- `/admin/system/audit-log`

- `/admin/achievements` – home for Achievement Creator and any achievement management

## Admin Layout

- Sidebar:

  - Overview

  - Organisations

  - Users

  - Quizzes

  - Scheduling

  - Analytics

  - Billing

  - Support

  - System

  - Achievements

- Topbar:

  - Page title / breadcrumbs

  - Environment badge (optional)

  - User menu

- Content:

  - Stat cards

  - Tables (lists)

  - Charts (engagement, learning)

  - Detail views with tabs

This document is a living plan. As the code evolves, this should be updated rather than ignored.

