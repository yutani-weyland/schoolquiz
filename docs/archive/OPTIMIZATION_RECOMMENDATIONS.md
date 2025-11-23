# Codebase Optimization & Best Practices Recommendations

## Executive Summary

This document outlines actionable recommendations to optimize, improve performance, and bring your codebase to professional standards. The analysis covers code quality, performance, security, developer experience, and production readiness.

---

## 1. Code Quality & Architecture

### 1.1 Error Handling & Logging

**Current Issues:**
- `console.log/error` used throughout (22 files found)
- Generic error messages in API routes
- No structured error logging
- Error details exposed to clients in production

**Recommendations:**

1. **Implement Structured Logging**
   ```typescript
   // packages/logger/src/index.ts (new package)
   import pino from 'pino';
   
   export const logger = pino({
     level: process.env.LOG_LEVEL || 'info',
     transport: process.env.NODE_ENV === 'development' 
       ? { target: 'pino-pretty' }
       : undefined,
   });
   
   export const createLogger = (context: string) => logger.child({ context });
   ```

2. **Create Error Handling Utilities**
   ```typescript
   // packages/api/src/errors.ts (new file)
   export class AppError extends Error {
     constructor(
       message: string,
       public statusCode: number = 500,
       public code?: string,
       public isOperational = true
     ) {
       super(message);
       Object.setPrototypeOf(this, AppError.prototype);
     }
   }
   
   export class ValidationError extends AppError {
     constructor(message: string, public field?: string) {
       super(message, 400, 'VALIDATION_ERROR');
     }
   }
   
   export class NotFoundError extends AppError {
     constructor(resource: string) {
       super(`${resource} not found`, 404, 'NOT_FOUND');
     }
   }
   ```

3. **Update API Routes with Proper Error Handling**
   ```typescript
   // apps/admin/src/app/api/questions/route.ts
   import { logger } from '@schoolquiz/logger';
   import { AppError } from '@schoolquiz/api/errors';
   
   export async function GET(request: NextRequest) {
     try {
       const questions = await getQuestions();
       return NextResponse.json({ questions, pagination: { total: questions.length } });
     } catch (error) {
       const logContext = logger.child({ route: '/api/questions', method: 'GET' });
       
       if (error instanceof AppError) {
         logContext.warn({ error: error.message }, 'Request failed');
         return NextResponse.json(
           { error: error.message, code: error.code },
           { status: error.statusCode }
         );
       }
       
       logContext.error({ error }, 'Unexpected error');
       return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
       );
     }
   }
   ```

### 1.2 TypeScript Improvements

**Current Issues:**
- `any` types used in components (QuizPlayer.tsx, QuizIntro.tsx)
- Missing type definitions for API responses
- Inconsistent type exports

**Recommendations:**

1. **Create Shared Type Definitions**
   ```typescript
   // packages/api/src/types.ts
   export interface ApiResponse<T> {
     data: T;
     error?: string;
     code?: string;
   }
   
   export interface PaginatedResponse<T> extends ApiResponse<T[]> {
     pagination: {
       page: number;
       limit: number;
       total: number;
       pages: number;
     };
   }
   ```

2. **Remove `any` Types**
   - Replace `any` with proper types in QuizPlayer, RoundIntro, PresenterMode
   - Use `unknown` for truly unknown types, then validate

3. **Enable Stricter TypeScript**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "noImplicitReturns": true
     }
   }
   ```

### 1.3 Component Architecture

**Current Issues:**
- Large components (QuizPlayer.tsx: 1155 lines, QuizIntro.tsx: 528 lines)
- Mixed concerns (UI + business logic)
- Inline utility functions

**Recommendations:**

1. **Extract Utilities**
   ```typescript
   // apps/web/src/lib/color-utils.ts
   export function calculateLuminance(hex: string): number {
     const cleanHex = hex.replace("#", "");
     if (cleanHex.length !== 6) return 0.5;
     
     const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
     const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
     const b = parseInt(cleanHex.slice(4, 6), 16) / 255;
     
     const chan = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
     const R = chan(r);
     const G = chan(g);
     const B = chan(b);
     
     return 0.2126 * R + 0.7152 * G + 0.0722 * B;
   }
   
   export function getTextColor(hex: string): "black" | "white" {
     return calculateLuminance(hex) > 0.5 ? "black" : "white";
   }
   ```

2. **Split Large Components**
   - Extract `RoundIntro`, `PresenterMode`, `GridMode` into separate files
   - Create `hooks/useQuizState.ts` for state management
   - Create `hooks/useQuizTimer.ts` for timer logic

3. **Create Reusable Hooks**
   ```typescript
   // apps/web/src/hooks/useQuizState.ts
   export function useQuizState(quizSlug: string) {
     const [viewedQuestions, setViewedQuestions] = useState<Set<number>>(new Set());
     const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
     const [correctAnswers, setCorrectAnswers] = useState<Set<number>>(new Set());
     
     // Persist to sessionStorage
     useEffect(() => {
       const key = `quiz-${quizSlug}-state`;
       const saved = sessionStorage.getItem(key);
       if (saved) {
         const parsed = JSON.parse(saved);
         setViewedQuestions(new Set(parsed.viewed));
         setRevealedAnswers(new Set(parsed.revealed));
         setCorrectAnswers(new Set(parsed.correct));
       }
     }, [quizSlug]);
     
     // Save on change
     useEffect(() => {
       const key = `quiz-${quizSlug}-state`;
       sessionStorage.setItem(key, JSON.stringify({
         viewed: Array.from(viewedQuestions),
         revealed: Array.from(revealedAnswers),
         correct: Array.from(correctAnswers),
       }));
     }, [viewedQuestions, revealedAnswers, correctAnswers, quizSlug]);
     
     return {
       viewedQuestions,
       revealedAnswers,
       correctAnswers,
       setViewedQuestions,
       setRevealedAnswers,
       setCorrectAnswers,
     };
   }
   ```

---

## 2. Performance Optimizations

### 2.1 React Performance

**Current Issues:**
- Missing `React.memo` for expensive components
- Inline function definitions in JSX
- Unnecessary re-renders

**Recommendations:**

1. **Memoize Expensive Components**
   ```typescript
   // apps/web/src/components/quiz/GridMode.tsx
   export const GridMode = React.memo(function GridMode({
     questions,
     rounds,
     // ... props
   }: GridModeProps) {
     // ... component code
   }, (prevProps, nextProps) => {
     // Custom comparison if needed
     return prevProps.questions.length === nextProps.questions.length &&
            prevProps.revealedAnswers.size === nextProps.revealedAnswers.size;
   });
   ```

2. **Use `useCallback` for Handlers**
   ```typescript
   const handleRevealAnswer = useCallback((id: number) => {
     setRevealedAnswers((prev) => new Set([...prev, id]));
   }, []);
   ```

3. **Optimize State Updates**
   ```typescript
   // Instead of creating new Set each time
   const handleRevealAnswer = useCallback((id: number) => {
     setRevealedAnswers((prev) => {
       if (prev.has(id)) return prev; // Avoid unnecessary re-render
       const next = new Set(prev);
       next.add(id);
       return next;
     });
   }, []);
   ```

### 2.2 Database & API Performance

**Current Issues:**
- No query result caching
- N+1 query potential in Prisma includes
- Missing database indexes

**Recommendations:**

1. **Add Database Indexes**
   ```prisma
   // packages/db/prisma/schema.prisma
   model Question {
     // ... existing fields
     
     @@index([status, updatedAt])
     @@index([categoryId])
     @@index([createdBy, status]) // Add for teacher queries
     @@index([usageCount]) // For popularity queries
   }
   
   model Quiz {
     // ... existing fields
     
     @@index([status, createdAt])
     @@index([schoolId, status])
   }
   ```

2. **Implement Query Caching**
   ```typescript
   // packages/api/src/cache.ts
   import { unstable_cache } from 'next/cache';
   
   export async function getCachedQuestions(filters: {
     categoryId?: string;
     status?: string;
   }) {
     return unstable_cache(
       async () => getQuestions(filters),
       ['questions', JSON.stringify(filters)],
       {
         revalidate: 60, // 60 seconds
         tags: ['questions']
       }
     )();
   }
   ```

3. **Optimize Prisma Queries**
   ```typescript
   // Use select instead of include when possible
   const questions = await prisma.question.findMany({
     select: {
       id: true,
       text: true,
       answer: true,
       category: {
         select: { name: true }
       }
     },
     // ... rest
   });
   ```

### 2.3 Bundle Size Optimization

**Current Issues:**
- Large component files
- Potentially unused dependencies
- No code splitting strategy

**Recommendations:**

1. **Code Splitting**
   ```typescript
   // apps/web/src/components/quiz/QuizPlayer.tsx
   const GridMode = lazy(() => import('./GridMode'));
   const PresenterMode = lazy(() => import('./PresenterMode'));
   
   // Wrap in Suspense
   <Suspense fallback={<QuizLoadingSkeleton />}>
     {viewMode === "presenter" ? <PresenterMode /> : <GridMode />}
   </Suspense>
   ```

2. **Tree Shaking Analysis**
   ```bash
   # Add to package.json
   "analyze": "ANALYZE=true next build"
   ```

3. **Remove Unused Dependencies**
   - Audit dependencies with `pnpm why <package>`
   - Consider lighter alternatives (e.g., `date-fns` is large, consider `dayjs`)

---

## 3. Security Improvements

### 3.1 Environment Variables

**Current Issues:**
- No runtime validation
- Missing environment variable documentation
- No type safety for env vars

**Recommendations:**

1. **Create Environment Schema**
   ```typescript
   // packages/config/src/env.ts
   import { z } from 'zod';
   
   const envSchema = z.object({
     NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
     DATABASE_URL: z.string().url(),
     NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
     NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
     SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
     NEXTAUTH_SECRET: z.string().min(32),
     NEXTAUTH_URL: z.string().url(),
   });
   
   export const env = envSchema.parse(process.env);
   ```

2. **Validate at Startup**
   ```typescript
   // apps/admin/src/app/layout.tsx
   import { env } from '@schoolquiz/config/env';
   
   // This will throw if env vars are invalid
   if (process.env.NODE_ENV === 'production') {
     console.log('Environment validated:', Object.keys(env));
   }
   ```

### 3.2 API Security

**Current Issues:**
- No rate limiting
- Missing authentication checks
- No input sanitization

**Recommendations:**

1. **Add Rate Limiting**
   ```typescript
   // apps/admin/src/lib/rate-limit.ts
   import { LRUCache } from 'lru-cache';
   
   const rateLimit = new LRUCache<string, number>({
     max: 500,
     ttl: 60000, // 1 minute
   });
   
   export function checkRateLimit(identifier: string, limit = 10): boolean {
     const count = rateLimit.get(identifier) || 0;
     if (count >= limit) return false;
     rateLimit.set(identifier, count + 1);
     return true;
   }
   ```

2. **Implement Authentication Middleware**
   ```typescript
   // apps/admin/src/lib/auth-middleware.ts
   import { getServerSession } from 'next-auth';
   import { authOptions } from '@schoolquiz/auth';
   
   export async function requireAuth() {
     const session = await getServerSession(authOptions);
     if (!session) {
       throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
     }
     return session;
   }
   ```

3. **Input Validation**
   ```typescript
   // Already using Zod - ensure all endpoints use it
   export async function POST(request: NextRequest) {
     const body = await request.json();
     const validated = CreateQuestionSchema.parse(body); // Throws on invalid
     // ... rest
   }
   ```

---

## 4. Developer Experience

### 4.1 Code Consistency

**Recommendations:**

1. **ESLint Configuration**
   ```javascript
   // packages/config/eslint.js
   module.exports = {
     extends: [
       'next/core-web-vitals',
       'plugin:@typescript-eslint/recommended',
       'prettier'
     ],
     rules: {
       'no-console': ['warn', { allow: ['warn', 'error'] }],
       '@typescript-eslint/no-explicit-any': 'error',
       'react-hooks/exhaustive-deps': 'warn',
     }
   };
   ```

2. **Prettier Configuration**
   ```javascript
   // packages/config/prettier.js
   module.exports = {
     semi: true,
     singleQuote: true,
     tabWidth: 2,
     trailingComma: 'es5',
     printWidth: 100,
   };
   ```

3. **Pre-commit Hooks**
   ```json
   // package.json
   {
     "scripts": {
       "prepare": "husky install",
       "lint-staged": "lint-staged"
     },
     "lint-staged": {
       "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
       "*.{json,md}": ["prettier --write"]
     }
   }
   ```

### 4.2 Testing Infrastructure

**Current Issues:**
- No test files found
- Missing test setup

**Recommendations:**

1. **Add Testing Framework**
   ```bash
   pnpm add -D vitest @testing-library/react @testing-library/jest-dom
   ```

2. **Create Test Utilities**
   ```typescript
   // packages/test-utils/src/index.ts
   export function renderWithProviders(ui: React.ReactElement) {
     // Wrapper with providers
   }
   
   export function createMockQuiz(): Quiz {
     // Factory function
   }
   ```

3. **Component Tests**
   ```typescript
   // apps/web/src/components/quiz/__tests__/QuizIntro.test.tsx
   import { render, screen } from '@testing-library/react';
   import QuizIntro from '../QuizIntro';
   
   describe('QuizIntro', () => {
     it('renders quiz title', () => {
       render(<QuizIntro quiz={mockQuiz} />);
       expect(screen.getByText(mockQuiz.title)).toBeInTheDocument();
     });
   });
   ```

---

## 5. Production Readiness

### 5.1 Monitoring & Observability

**Recommendations:**

1. **Error Tracking**
   ```typescript
   // packages/logger/src/sentry.ts
   import * as Sentry from '@sentry/nextjs';
   
   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 0.1,
   });
   ```

2. **Performance Monitoring**
   ```typescript
   // apps/admin/src/app/layout.tsx
   import { SpeedInsights } from '@vercel/speed-insights/next';
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <SpeedInsights />
         </body>
       </html>
     );
   }
   ```

### 5.2 Build Optimization

**Recommendations:**

1. **Next.js Config Optimization**
   ```javascript
   // apps/admin/next.config.js
   module.exports = {
     compress: true,
     poweredByHeader: false,
     reactStrictMode: true,
     swcMinify: true,
     images: {
       formats: ['image/avif', 'image/webp'],
     },
     experimental: {
       optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
     },
   };
   ```

2. **Astro Config Optimization**
   ```javascript
   // apps/web/astro.config.mjs
   export default defineConfig({
     // ... existing config
     build: {
       inlineStylesheets: 'auto',
     },
     vite: {
       build: {
         cssCodeSplit: true,
         rollupOptions: {
           output: {
             manualChunks: {
               'react-vendor': ['react', 'react-dom'],
               'framer-motion': ['framer-motion'],
             },
           },
         },
       },
     },
   });
   ```

---

## 6. Quick Wins (Priority Order)

### High Priority (Do First)
1. ✅ Remove `console.log` statements, replace with logger
2. ✅ Add environment variable validation
3. ✅ Fix TypeScript `any` types
4. ✅ Extract utility functions from components
5. ✅ Add database indexes

### Medium Priority
6. ⚠️ Split large components (QuizPlayer, QuizIntro)
7. ⚠️ Implement proper error handling in APIs
8. ⚠️ Add React performance optimizations (memo, useCallback)
9. ⚠️ Set up ESLint and Prettier
10. ⚠️ Add query caching

### Low Priority (Nice to Have)
11. 📝 Add testing infrastructure
12. 📝 Set up error monitoring (Sentry)
13. 📝 Implement rate limiting
14. 📝 Code splitting for large components
15. 📝 Performance monitoring

---

## Implementation Plan

### Phase 1: Foundation (Week 1)
- Set up logging package
- Create error handling utilities
- Add environment validation
- Configure ESLint/Prettier

### Phase 2: Code Quality (Week 2)
- Remove `any` types
- Extract utilities
- Split large components
- Add TypeScript strict mode

### Phase 3: Performance (Week 3)
- Add React optimizations
- Implement query caching
- Add database indexes
- Optimize bundle size

### Phase 4: Production (Week 4)
- Add monitoring
- Set up error tracking
- Add rate limiting
- Final testing

---

## Tools & Dependencies to Add

```json
{
  "devDependencies": {
    "pino": "^8.15.0",
    "pino-pretty": "^10.2.0",
    "@sentry/nextjs": "^7.80.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^15.0.0",
    "lru-cache": "^10.0.0"
  }
}
```

---

## Notes

- All recommendations follow 2025 best practices
- Prioritize based on impact vs effort
- Test changes incrementally
- Consider backward compatibility
- Document breaking changes



