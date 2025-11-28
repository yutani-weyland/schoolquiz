# Architecture & Technical Documentation

## Monorepo Structure

```
schoolquiz/
├── apps/
│   └── admin/              # Next.js 15 (App Router) + shadcn/ui
│       ├── src/app/        # App routes
│       │   ├── quizzes/    # Public quiz pages (optimized)
│       │   ├── admin/      # Admin dashboard
│       │   ├── leagues/    # Private leagues
│       │   └── premium/    # Premium features
│       └── src/components/ # React components
├── packages/
│   ├── db/                 # Prisma + Supabase SQL + typed client
│   ├── ui/                 # Shared components + motion utilities
│   ├── auth/               # NextAuth.js configuration
│   ├── api/                # API utilities
│   ├── analytics/          # Analytics utilities
│   └── config/             # ESLint, Prettier, TypeScript configs
├── supabase/
│   └── migrations/         # Database migrations + RLS policies
├── scripts/                # Utility scripts (DB, seeding, etc.)
└── docs/                   # Documentation
```

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animations**: Framer Motion (purposeful, subtle, fast)
- **UI Components**: shadcn/ui + Radix UI primitives + @dnd-kit
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **State Management**: React Query (TanStack Query)
- **Deployment**: Vercel + Supabase
- **Monorepo**: pnpm + Turborepo

## App Routes

### Public Routes
- `/` - Landing page
- `/quizzes` - Grid of published quizzes
- `/quizzes/[slug]/intro` - Quiz splash/intro page
- `/quizzes/[slug]/play` - Interactive quiz player
- `/sign-in`, `/sign-up` - Authentication
- `/upgrade` - Premium subscription

### Premium Routes
- `/premium/my-quizzes` - Custom quizzes management
- `/premium/create-quiz` - Create custom quiz
- `/custom-quizzes/[id]/play` - Play custom quiz
- `/leagues` - Private leagues

### Admin Routes (PlatformAdmin only)
- `/admin` - Dashboard overview
- `/admin/organisations` - Organisation management
- `/admin/users` - User management
- `/admin/quizzes` - Quiz management & builder
- `/admin/scheduling` - Quiz scheduling
- `/admin/analytics` - Analytics dashboards
- `/admin/billing` - Billing management
- `/admin/support` - Support tickets
- `/admin/system` - System settings & feature flags
- `/admin/achievements` - Achievement Creator

## Database Schema

### Core Tables
- `quizzes`, `rounds`, `questions` - Quiz content
- `users`, `organisations` - Accounts & Auth
- `private_leagues`, `private_league_members` - Competition
- `leaderboards`, `achievements` - Gamification

### Row Level Security (RLS)
- **Sessions/Scores**: Users can only access their own or their classes'
- **Answer Stats**: Public read, write only via RPC functions
- **Teachers**: Can manage their organization's classes
- **Leagues**: Members can only access leagues they belong to

## Performance Optimizations

- **Server-side rendering** with streaming
- **Parallel query execution**
- **Selective field fetching**
- **Aggressive prefetching**
- **React Query** for client-side caching

## Animation Philosophy

- **Purposeful, subtle, fast**: 150–240ms for transitions
- **Spring micro-interactions**: `{ type: "spring", stiffness: 380, damping: 28, mass: 0.8 }`
- **Accessibility-first**: Respect `prefers-reduced-motion`

## Design System

- **Typography**: Atkinson Hyperlegible (Primary), OpenDyslexic (Option)
- **Colors**: Custom palette with 5 round-specific accent colors
