# Why Two Separate Servers?

## Current Architecture

You have **two separate applications** in a monorepo:

### 1. **apps/web** (Astro) - Port 4321/4324
- **Framework**: Astro
- **Purpose**: Public-facing quiz site
- **Users**: Students, teachers taking quizzes
- **Features**: Quiz player, landing pages, marketing
- **Tech**: Astro + React islands, optimized for static content

### 2. **apps/admin** (Next.js) - Port 3000/3007  
- **Framework**: Next.js 15 (App Router)
- **Purpose**: Admin dashboard & teacher tools
- **Users**: Teachers managing quizzes, creating content
- **Features**: Quiz builder, question bank, analytics, account management
- **Tech**: Next.js + React, optimized for dynamic admin interfaces

## Why Separate?

### Historical Reasons
1. **Different frameworks** - Astro for static/marketing pages, Next.js for dynamic admin
2. **Different deployment needs** - Static site vs. dynamic app
3. **Different optimization targets** - SEO/performance vs. interactivity

### Current Reality
- **You want them unified** - Same header, same navigation, seamless experience
- **They share code** - Both use `@schoolquiz/db`, `@schoolquiz/ui` packages
- **Same design system** - Same styling, same components

## The Problem

Having two servers means:
- ❌ Different URLs (`localhost:4321` vs `localhost:3000`)
- ❌ Can't share navigation seamlessly
- ❌ More complex deployment
- ❌ Users notice they're on "different" sites

## Solutions

### Option 1: Consolidate into One Next.js App (Recommended)
**Move everything to Next.js:**
- ✅ Single server, single port
- ✅ Unified navigation
- ✅ Shared authentication
- ✅ Easier deployment
- ✅ Better for dynamic features

**Trade-offs:**
- Need to migrate Astro pages to Next.js
- Lose some Astro optimizations (but Next.js is great for this too)

### Option 2: Keep Separate but Proxy/Route
**Use a reverse proxy or routing:**
- Admin routes: `/admin/*` → Next.js (port 3000)
- Public routes: `/*` → Astro (port 4321)
- Single entry point, routes to correct server

**Trade-offs:**
- More complex setup
- Still two servers running
- Deployment complexity

### Option 3: Keep Separate, Accept the Split
**Current approach:**
- Two separate apps
- Share components via packages
- Accept that admin is "separate"

**Trade-offs:**
- Simple architecture
- But doesn't match your goal of seamless experience

## My Recommendation

**Consolidate to Next.js** because:
1. You already have Next.js for admin
2. Next.js can handle everything Astro does (static pages, SSR, API routes)
3. Single server = seamless navigation
4. Easier to maintain
5. Better for your use case (dynamic quiz platform)

The Astro app is mainly:
- Landing page (`index.astro`)
- Quiz pages (`quiz/[slug]/*`)
- Marketing pages (`about`, `help`, etc.)

All of these can be Next.js pages with the same performance!

Would you like me to help consolidate them into a single Next.js app?

