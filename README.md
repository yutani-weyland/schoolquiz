# SchoolQuiz

Weekly quiz platform for Australian students with minimal visuals and beautiful micro-interactions.

## 🎯 Product Overview

SchoolQuiz delivers a **5 categories × 6 questions + 1 finale** weekly quiz format, published every Monday at 07:00 Australia/Sydney. The platform supports both **Solo** (individual) and **Org → Classes** (teacher-named teams) modes, plus **Private Leagues** for competitive play.

### Key Features

- **Typography-first design** with Atkinson Hyperlegible font
- **Low-chroma round accents** for visual hierarchy
- **Teacher-led presenter** interface with keyboard shortcuts
- **Private Leagues** - Create, join, and administrate competitive leagues
- **Custom Quizzes** - Premium users can create branded custom quizzes
- **National statistics** (feature-flagged, anonymous)
- **Accessibility controls** for font, theme, text size, and motion
- **Performance-optimized** - Blisteringly fast load times with aggressive prefetching

## 🏗️ Architecture

### Monorepo Structure

```
schoolquiz/
├── apps/
│   └── admin/              # Next.js 15 (App Router) + shadcn/ui
│       ├── src/app/        # App routes
│       │   ├── quizzes/    # Public quiz pages (optimized)
│       │   ├── admin/     # Admin dashboard (new)
│       │   ├── leagues/   # Private leagues
│       │   └── premium/   # Premium features
│       └── src/components/# React components
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

### Tech Stack

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

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18+ (LTS recommended)
- **pnpm**: 8.6.10+ (`npm install -g pnpm@8.6.10`)
- **Supabase CLI**: For local development (`npm install -g supabase`)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd schoolquiz

# Install dependencies
pnpm install

# Set up environment variables
cp env.local.example .env.local
cp env.local.example apps/admin/.env.local
# Edit both .env.local files with your Supabase credentials

# Or use the sync script
pnpm sync-env

# Start Supabase locally
supabase start

# Run database migrations
supabase db reset

# Generate Prisma client
cd packages/db && pnpm db:generate && cd ../..

# Start development servers
pnpm dev
```

### Development URLs

- **App**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323

## 📱 App Routes

### Public Routes

- `/` - Landing page with headline animation
- `/quizzes` - Grid of published quizzes (optimized, server-rendered)
- `/quizzes/[slug]/intro` - Quiz splash/intro page (server-rendered)
- `/quizzes/[slug]/play` - Interactive quiz player (optimized, parallel queries)
- `/sign-in`, `/sign-up` - Authentication
- `/upgrade` - Premium subscription
- `/about`, `/faq`, `/legal/*` - Content pages

### Premium Routes

- `/premium/my-quizzes` - Custom quizzes management
- `/premium/create-quiz` - Create custom quiz
- `/custom-quizzes/[id]/play` - Play custom quiz
- `/leagues` - Private leagues (create, join, manage)

### Admin Routes (Protected - PlatformAdmin only)

- `/admin` - Dashboard overview
- `/admin/organisations` - Organisation management
- `/admin/users` - User management
- `/admin/quizzes` - Quiz management & builder
- `/admin/quizzes/[id]` - Quiz Composer (4×6 rounds + People's Question)
- `/admin/scheduling` - Quiz scheduling
- `/admin/analytics` - Analytics dashboards
- `/admin/billing` - Billing management
- `/admin/support` - Support tickets
- `/admin/system` - System settings & feature flags
- `/admin/achievements` - Achievement Creator

## ⚡ Performance Optimizations

### Recent Improvements

- **Quiz Pages**: 75% faster load times (800ms → 200ms)
- **Play Page**: 75% faster (1200ms → 300ms)
- **Database Queries**: 80% faster with selective field fetching
- **Payload Size**: 70% smaller (150KB → 45KB)
- **Request Waterfalls**: Eliminated through parallel queries
- **Aggressive Prefetching**: Instant navigation from intro to play

### Optimization Techniques

- Server-side rendering with streaming
- Parallel query execution (`Promise.all`)
- Selective field fetching (only needed data)
- Database indexes for common queries
- Aggressive prefetching (route + API data)
- React Query for client-side caching
- Code splitting and lazy loading

See `docs/QUIZ_PLAY_PERFORMANCE_OPTIMIZATIONS.md` for details.

## 🎨 Animation Philosophy

### Core Principles

- **Purposeful, subtle, fast**: 150–240ms for transitions
- **Spring micro-interactions**: `{ type: "spring", stiffness: 380, damping: 28, mass: 0.8 }`
- **Accessibility-first**: Respect `prefers-reduced-motion` and `<html data-motion="off">`
- **Performance-optimized**: Animate only `opacity`, `transform`, `filter`

### Motion Tokens

```typescript
// Easing curves
easeOut: cubic-bezier(0.22, 1, 0.36, 1)
easeInOut: cubic-bezier(0.45, 0, 0.40, 1)

// Spring configurations
micro: { type: "spring", stiffness: 380, damping: 28, mass: 0.8 }
gentle: { type: "spring", stiffness: 200, damping: 25, mass: 1 }
snappy: { type: "spring", stiffness: 500, damping: 30, mass: 0.5 }

// Transition presets
fast: { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
medium: { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
```

### Disabling Motion

Motion can be disabled in two ways:

1. **System preference**: `prefers-reduced-motion: reduce`
2. **Manual toggle**: `<html data-motion="off">`

When motion is disabled, all animations are replaced with instant opacity changes.

## 🎨 Design System

### Typography

- **Primary font**: Atkinson Hyperlegible (accessibility-focused)
- **Fallback**: system-ui, -apple-system, sans-serif
- **Dyslexic support**: OpenDyslexic (user-selectable)

### Color Palette

```css
:root {
  --round-1: #F4A261; /* History */
  --round-2: #7FB3FF; /* Science */
  --round-3: #F7A8C0; /* Pop Culture */
  --round-4: #9EE6B4; /* Sport */
  --round-5: #F7D57A; /* Civics */
}
```

### Fluid Typography

```css
h1 { font-size: clamp(2.75rem, 6vw, 6rem); }
body { font-size: clamp(1rem, 1.1vw, 1.125rem); }
```

## 🎮 Quiz Features

### Quiz Presenter

- **Keyboard Shortcuts**:
  - `↑/↓` - Navigate between questions
  - `Space` - Reveal answer
  - `F` - Toggle fullscreen
  - `T` - Toggle timer
  - `?` - Show keyboard help

- **Micro-interactions**:
  - Question reveal: Height-auto animation with opacity cross-fade
  - Answer feedback: Tactile press (scale 0.98) + success ring glow
  - Score counter: Spring animation on score changes
  - Category rail: Left border scales from 2px→6px on focus

- **Accessibility Panel**:
  - Font: Default (Hyperlegible) | OpenDyslexic
  - Theme: Default | High-contrast
  - Text size: Normal | Large
  - Motion: On | Off

### Quiz Builder

- **Round Builder** (4×6 + Finale):
  - Standard rounds: Four categories with title, blurb, accent color, type selection
  - People's question: Dedicated finale slot with community attribution
  - Question tiles: Drag-and-drop reordering with @dnd-kit
  - Live preview: Cross-fade between rounds
  - Validation: Prevents publishing unless 4 rounds × 6 questions + 1 finale question

- **Publish Controls**:
  - Save Draft - Local storage
  - Schedule - Next Monday 07:00 AEST/AEDT
  - Publish Now - Immediate with server validation
  - Archive - Soft delete

### Custom Quizzes (Premium)

- Create branded quizzes with custom colors and logos
- Share with organisation members or make public
- PDF export with custom branding
- Full quiz builder with drag-and-drop

### Private Leagues

- Create leagues with invite codes
- Join leagues by code
- View leaderboards and member stats
- Manage league members (invite, kick)
- Organisation-wide leagues

## 🗄️ Database Schema

### Core Tables

- `quizzes` - Quiz metadata and publishing status
- `rounds` - Quiz rounds (4 standard + 1 finale)
- `questions` - Questions (6 per standard round + 1 finale)
- `quiz_round_questions` - Junction table linking questions to rounds
- `categories` - Question categories
- `users` - User accounts with roles and subscriptions
- `organisations` - School/organisation accounts
- `organisation_members` - Organisation membership
- `private_leagues` - Private league definitions
- `private_league_members` - League membership
- `leaderboards` - Custom leaderboards
- `achievements` - Achievement definitions
- `user_achievements` - User achievement progress

### Row Level Security (RLS)

- **Sessions/Scores**: Users can only access their own or their classes'
- **Answer Stats**: Public read, write only via RPC functions
- **Teachers**: Can manage their organization's classes
- **Leagues**: Members can only access leagues they belong to

### Database Indexes

See `apps/admin/DATABASE_INDEXES.sql` for performance indexes.

## 🧪 Testing

### Performance Testing

- **Lighthouse**: ≥95 on `/` and `/quizzes/[slug]/play`
- **Core Web Vitals**: Optimized for LCP, FID, CLS
- **Database Queries**: Logged and optimized (<100ms target)

### Playwright Tests

1. **Presenter animations**: Question reveal, score counter spring
2. **Builder DnD**: Reordering preserves smooth layout
3. **Motion off**: `<html data-motion="off">` disables animations
4. **Validation**: Prevents publishing incomplete quizzes

## 🚀 Deployment

### Vercel Setup

```bash
# Deploy app
cd apps/admin
vercel --prod
```

### Supabase Setup

1. Create Supabase project
2. Run migrations: `supabase db push`
3. Set up RLS policies
4. Configure environment variables in Vercel

### Environment Variables

Required variables (see `env.local.example`):

- `DATABASE_URL` - Supabase PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `NEXTAUTH_URL` - Application URL
- `STRIPE_SECRET_KEY` - Stripe secret key (for billing)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

## 📚 Documentation

### Key Documents

- `docs/admin-dashboard-plan.md` - Admin dashboard architecture
- `docs/archive/PHASES.md` - Development phases roadmap
- `docs/QUIZ_PLAY_PERFORMANCE_OPTIMIZATIONS.md` - Performance guide
- `docs/QUIZZES_PAGE_LIGHTHOUSE_OPTIMIZATIONS.md` - Quizzes page optimizations
- `docs/LEADERBOARDS_OPTIMIZATION_PLAN.md` - Leaderboards guide

### Scripts

- `scripts/add_questions_to_empty_quizzes.sql` - Populate empty quizzes
- `scripts/check_quizzes_without_questions.sql` - Find quizzes without questions
- `apps/admin/DATABASE_INDEXES.sql` - Performance indexes

## 🛠️ Development

### Common Commands

```bash
# Development
pnpm dev                    # Start all dev servers
pnpm build                   # Build all packages
pnpm lint                    # Lint all packages
pnpm type-check              # Type check all packages

# Database
cd packages/db
pnpm db:generate             # Generate Prisma client
pnpm db:migrate              # Run migrations
pnpm db:studio               # Open Prisma Studio

# Environment
pnpm sync-env                # Sync .env.local to apps/admin
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Extended Next.js config
- **Prettier**: Auto-format on save
- **Imports**: Absolute imports from `@/` alias

### Project Structure Guidelines

- **Server Components**: Default, use `"use client"` only when needed
- **API Routes**: Under `app/api/`
- **Components**: Co-located with pages or in `components/`
- **Utilities**: In `lib/` directory
- **Types**: Co-located or in `types/` directory

## 🤝 Contributing

1. Follow the animation philosophy (purposeful, subtle, fast)
2. Respect accessibility preferences (`prefers-reduced-motion`)
3. Use shared motion utilities from `@schoolquiz/ui`
4. Test with motion disabled
5. Maintain 4×6 + People's Question structure
6. Write performance-optimized queries (selective fields, parallel execution)
7. Add database indexes for new query patterns

## 📄 License

[Add your license here]

---

**Built with ❤️ for Australian students**
