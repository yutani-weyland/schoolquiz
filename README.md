# SchoolQuiz

Weekly quiz platform for Australian students with minimal visuals and beautiful micro-interactions.

## 🎯 Product Overview

SchoolQuiz delivers a **5 categories × 6 questions + 1 finale** weekly quiz format. The platform supports **Solo**, **Class**, and **Private League** modes.

### Key Features
- **Typography-first design** (Atkinson Hyperlegible)
- **Teacher-led presenter** interface
- **Private Leagues** & **Custom Quizzes**
- **Performance-optimized**

## 🚀 Getting Started

### Prerequisites
- **Node.js**: 18+
- **pnpm**: 8.6.10+
- **Supabase CLI**

### Installation

```bash
# Clone and install
git clone <repository-url>
cd schoolquiz
pnpm install

# Environment Setup
pnpm sync-env

# Start Local Dev
supabase start
supabase db reset
cd packages/db && pnpm db:generate && cd ../..
pnpm dev
```

- **App**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323

## 📚 Documentation

- [Architecture & Tech Stack](docs/ARCHITECTURE.md)
- [Setup & Configuration](docs/setup/)
- [Features](docs/features/)
- [Migrations](docs/migrations/)
- [Testing](docs/testing/)

## 🛠️ Development

- `pnpm dev` - Start dev servers
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check

## 🤝 Contributing

1. Follow the animation philosophy (purposeful, subtle, fast)
2. Respect accessibility preferences
3. Write performance-optimized queries

---
**Built with ❤️ for Australian students**
