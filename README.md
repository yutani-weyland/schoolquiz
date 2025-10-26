# SchoolQuiz

Weekly quiz platform for Australian students with minimal visuals and beautiful micro-interactions.

## 🎯 Product Overview

SchoolQuiz delivers a **5 categories × 5 questions** weekly quiz format, published every Monday at 07:00 Australia/Sydney. The platform supports both **Solo** (individual) and **Org → Classes** (teacher-named teams) modes.

### Key Features

- **Typography-first design** with Atkinson Hyperlegible font
- **Low-chroma round accents** for visual hierarchy
- **Teacher-led presenter** interface with keyboard shortcuts
- **National statistics** (feature-flagged, anonymous)
- **Accessibility controls** for font, theme, text size, and motion

## 🏗️ Architecture

### Monorepo Structure

```
schoolquiz/
├── apps/
│   ├── web/          # Astro + React islands + Tailwind
│   └── admin/        # Next.js (App Router) + shadcn/ui
├── packages/
│   ├── db/           # Supabase SQL + typed client
│   ├── ui/           # Shared components + motion utilities
│   └── config/       # ESLint, Prettier, TypeScript configs
└── supabase/         # Database migrations + RLS policies
```

### Tech Stack

- **Frontend**: Astro + React islands + Tailwind CSS + Framer Motion
- **Admin**: Next.js (App Router) + shadcn/ui + @dnd-kit
- **Database**: Supabase with Row Level Security (RLS)
- **Deployment**: Vercel + Supabase Scheduler
- **Monorepo**: pnpm + Turborepo

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

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8.6.10+
- Supabase CLI

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd schoolquiz

# Install dependencies
pnpm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your Supabase credentials

# Start Supabase locally
supabase start

# Run database migrations
supabase db reset

# Start development servers
pnpm dev
```

### Development URLs

- **Web app**: http://localhost:4321
- **Admin app**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323

## 📱 App Routes

### Web App (Astro)

- `/` - Splash page with headline animation
- `/quizzes` - Grid of published quizzes
- `/quiz/[slug]` - Interactive quiz presenter
- `/sign-in`, `/sign-up` - Supabase auth
- `/get-premium` - Single plan card
- `/about`, `/faq`, `/legal/*` - Content pages

### Admin App (Next.js)

- `/admin` - Dashboard
- `/admin/quizzes/[id]` - Quiz Composer (5×5 grid builder)
- `/admin/categories` - Category Library

## 🎮 Quiz Presenter Features

### Keyboard Shortcuts

- **↑/↓** - Navigate between questions
- **Space** - Reveal answer
- **F** - Toggle fullscreen
- **T** - Toggle timer
- **?** - Show keyboard help

### Micro-interactions

- **Question reveal**: Height-auto animation with opacity cross-fade
- **Answer feedback**: Tactile press (scale 0.98) + success ring glow
- **Score counter**: Spring animation on score changes
- **Category rail**: Left border scales from 2px→6px on focus

### Accessibility Panel

- **Font**: Default (Hyperlegible) | OpenDyslexic
- **Theme**: Default | High-contrast
- **Text size**: Normal | Large
- **Motion**: On | Off

## 🏗️ Quiz Builder Features

### 5×5 Grid Composer

- **Round cards**: Title, blurb, accent color, type selection
- **Question tiles**: Drag-and-drop reordering with @dnd-kit
- **Live preview**: Cross-fade between rounds
- **Validation**: Prevents publishing unless 5 rounds × 5 questions

### Motion in Builder

- **Drag-and-drop**: Smooth reordering with spring physics
- **Layout animations**: FLIP animations for card resizing
- **Drawer transitions**: Scale 0.98→1, opacity 0→1 (220ms)
- **Validation feedback**: Chips slide in from Y:-8 (150ms)

### Publish Controls

- **Save Draft** - Local storage
- **Schedule** - Next Monday 07:00 AEST/AEDT
- **Publish Now** - Immediate with server validation
- **Archive** - Soft delete

## 🗄️ Database Schema

### Core Tables

- `quizzes` - Quiz metadata and publishing status
- `categories` - 5 rounds per quiz (title, blurb, accent, type)
- `questions` - 5 questions per category (text, answer, points, order)
- `quiz_sessions` - Individual or class quiz attempts
- `quiz_scores` - Final scores (0-25)
- `answer_stats` - Anonymous national statistics

### Row Level Security (RLS)

- **Sessions/Scores**: Users can only access their own or their classes'
- **Answer Stats**: Public read, write only via `bump_answer_stats()` RPC
- **Teachers**: Can manage their organization's classes

### Scheduled Publishing

```sql
-- Runs every 5 minutes via Supabase Scheduler
SELECT publish_due_quizzes();
```

## 🧪 Testing

### Playwright Tests

1. **Presenter animations**: Question reveal, score counter spring
2. **Builder DnD**: Reordering preserves smooth layout
3. **Motion off**: `<html data-motion="off">` disables animations
4. **Validation**: Prevents publishing incomplete quizzes

### Performance

- **Lighthouse**: ≥95 on `/` and `/quiz/[slug]`
- **Motion performance**: Only `opacity`, `transform`, `filter`
- **Lazy loading**: Heavy React islands load on demand

## 🚀 Deployment

### Vercel Setup

```bash
# Deploy web app
cd apps/web
vercel --prod

# Deploy admin app  
cd apps/admin
vercel --prod
```

### Supabase Scheduler

```sql
-- Create scheduled function
SELECT cron.schedule(
  'publish-quizzes',
  '*/5 * * * *', -- Every 5 minutes
  'SELECT publish_due_quizzes();'
);
```

## 🎨 Adding New Round Accents

1. Update color in `packages/ui/src/tokens.ts`
2. Add CSS variable in `apps/web/src/layouts/Layout.astro`
3. Update Tailwind config in both apps
4. Test accessibility contrast (AA on white)

## ⌨️ Builder Shortcuts

- **⌘S** - Save draft
- **⌘K** - Open category library
- **⌘P** - Preview quiz
- **Tab** - Navigate between fields
- **Enter** - Add new question

## 📅 Scheduling Notes

- **Publish time**: Monday 07:00 Australia/Sydney (AEST/AEDT)
- **Timezone handling**: Automatic DST adjustment
- **Fallback**: Manual publish available
- **Validation**: 5×5 structure enforced on publish

## 🤝 Contributing

1. Follow the animation philosophy (purposeful, subtle, fast)
2. Respect accessibility preferences
3. Use shared motion utilities from `@schoolquiz/ui`
4. Test with motion disabled
5. Maintain 5×5 quiz structure

## 📄 License

[Add your license here]

---

**Built with ❤️ for Australian students**
