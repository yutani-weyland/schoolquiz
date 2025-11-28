# Zod Validation Migration Guide

## Overview

This guide explains how to migrate API routes from manual validation/type casting to Zod-based runtime validation.

## Why Zod?

1. **Runtime Safety**: TypeScript types disappear at runtime. Zod validates data at runtime.
2. **Security**: Prevents malformed/malicious payloads from crashing the server or corrupting data.
3. **Better Error Messages**: Structured validation errors help frontend display user-friendly messages.
4. **Type Inference**: Zod schemas automatically generate TypeScript types.

## Implementation Status

✅ **Core utilities created:**
- `apps/admin/src/lib/api-validation.ts` - Validation helpers
- `apps/admin/src/lib/validation/schemas.ts` - Shared schemas

✅ **Example migration:**
- `apps/admin/src/app/api/admin/quizzes/route.ts` (POST handler)

## Quick Start

### Before (Unsafe)

```typescript
export async function POST(request: NextRequest) {
  const body: QuizInput = await request.json(); // ❌ No runtime validation
  // body could be anything!
}
```

### After (Safe)

```typescript
import { validateRequest } from '@/lib/api-validation';
import { CreateQuizSchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await validateRequest(request, CreateQuizSchema); // ✅ Validated
    // body is now guaranteed to match the schema
  } catch (error) {
    return handleApiError(error); // Handles ValidationError automatically
  }
}
```

## Migration Steps

### Step 1: Import Validation Utilities

```typescript
import { validateRequest, validateQuery, validateParams } from '@/lib/api-validation';
import { handleApiError } from '@/lib/api-error';
```

### Step 2: Choose or Create a Schema

**Option A: Use existing schema from `@/lib/validation/schemas`**

```typescript
import { CreateQuizSchema, UpdateUserSchema } from '@/lib/validation/schemas';
```

**Option B: Create route-specific schema**

```typescript
import { z } from 'zod';

const MyCustomSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().positive(),
});
```

### Step 3: Replace Manual Parsing

**Request Body (POST/PUT/PATCH):**
```typescript
// Before
const body: MyType = await request.json();

// After
const body = await validateRequest(request, MySchema);
```

**Query Parameters (GET):**
```typescript
// Before
const page = parseInt(searchParams.get('page') || '1');
const limit = parseInt(searchParams.get('limit') || '20');

// After
const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
const query = await validateQuery(request, QuerySchema);
```

**Route Parameters:**
```typescript
// Before
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
}

// After
const ParamsSchema = z.object({ id: z.string().min(1) });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await validateParams(await params, ParamsSchema);
}
```

### Step 4: Update Error Handling

```typescript
// Before
catch (error: any) {
  return NextResponse.json(
    { error: error.message },
    { status: 500 }
  );
}

// After
catch (error) {
  return handleApiError(error); // Automatically handles ValidationError
}
```

## Common Patterns

### Pattern 1: Simple POST with Body Validation

```typescript
import { validateRequest } from '@/lib/api-validation';
import { CreateUserSchema } from '@/lib/validation/schemas';
import { handleApiError } from '@/lib/api-error';

export async function POST(request: NextRequest) {
  try {
    const body = await validateRequest(request, CreateUserSchema);
    // Use validated body...
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Pattern 2: GET with Query Parameters

```typescript
import { validateQuery } from '@/lib/api-validation';
import { SearchQuerySchema } from '@/lib/validation/schemas';

export async function GET(request: NextRequest) {
  try {
    const query = await validateQuery(request, SearchQuerySchema);
    // query.page, query.limit, query.search are validated
    return NextResponse.json({ data: [] });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Pattern 3: Dynamic Route with Params

```typescript
import { validateParams } from '@/lib/api-validation';
import { z } from 'zod';

const ParamsSchema = z.object({
  id: z.string().min(1),
  slug: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; slug?: string }> }
) {
  try {
    const { id, slug } = await validateParams(await params, ParamsSchema);
    // Use validated params...
    return NextResponse.json({ id, slug });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Pattern 4: Custom Validation with Refinements

```typescript
import { z } from 'zod';

const CreateCustomQuizSchema = z.object({
  title: z.string().min(3).max(100),
  rounds: z.array(RoundSchema).min(1).max(10),
}).refine(
  (data) => {
    const totalQuestions = data.rounds.reduce(
      (sum, round) => sum + round.questions.length,
      0
    );
    return totalQuestions >= 1 && totalQuestions <= 100;
  },
  { message: 'Total questions must be between 1 and 100' }
);
```

### Pattern 5: Optional Validation (Safe Parse)

```typescript
import { validateRequestSafe } from '@/lib/api-validation';

export async function POST(request: NextRequest) {
  const result = await validateRequestSafe(request, MySchema);
  
  if (!result.success) {
    // Custom error handling
    return NextResponse.json(
      { errors: result.errors },
      { status: 400 }
    );
  }
  
  const body = result.data; // Type-safe!
  // Continue with validated data...
}
```

## Error Response Format

When validation fails, `ValidationError` is thrown and `handleApiError` returns:

```json
{
  "error": "Request validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "errors": [
      {
        "path": "title",
        "message": "String must contain at least 1 character(s)",
        "code": "too_small"
      },
      {
        "path": "email",
        "message": "Invalid email",
        "code": "invalid_string"
      }
    ]
  }
}
```

## Migration Checklist

For each API route:

- [ ] Replace `await request.json()` with `validateRequest(request, schema)`
- [ ] Replace manual query param parsing with `validateQuery(request, schema)`
- [ ] Replace route param access with `validateParams(params, schema)`
- [ ] Update error handling to use `handleApiError(error)`
- [ ] Remove TypeScript interface definitions (use `z.infer<typeof Schema>` instead)
- [ ] Test with invalid payloads to ensure validation works
- [ ] Update frontend to handle validation error responses

## Priority Routes to Migrate

### High Priority (User-facing, data-modifying)
1. `/api/auth/signup` - User registration
2. `/api/auth/signin` - Authentication
3. `/api/admin/users` - User management
4. `/api/admin/organisations` - Organisation management
5. `/api/premium/custom-quizzes` - Custom quiz creation
6. `/api/private-leagues` - League management

### Medium Priority
1. `/api/admin/quizzes` - Quiz management (partially done)
2. `/api/admin/achievements` - Achievement management
3. `/api/user/profile` - Profile updates
4. `/api/contact/*` - Contact forms

### Low Priority (Read-only or internal)
1. GET routes (mostly query params)
2. Internal admin routes
3. Analytics endpoints

## Adding New Schemas

When creating new schemas, add them to `apps/admin/src/lib/validation/schemas.ts`:

```typescript
export const MyNewSchema = z.object({
  field1: z.string().min(1),
  field2: z.number().positive(),
});

export type MyNewInput = z.infer<typeof MyNewSchema>;
```

## Best Practices

1. **Reuse schemas**: Check `schemas.ts` before creating new ones
2. **Extend schemas**: Use `.extend()`, `.partial()`, `.pick()`, `.omit()` to create variants
3. **Use coerce for query params**: `z.coerce.number()` for string-to-number conversion
4. **Provide defaults**: Use `.default()` for optional query params
5. **Add custom messages**: Use second parameter for user-friendly error messages
6. **Test edge cases**: Empty strings, null, undefined, wrong types

## Examples

See the migrated route for reference:
- `apps/admin/src/app/api/admin/quizzes/route.ts` (POST handler)

## Questions?

- Check existing schemas in `apps/admin/src/lib/validation/schemas.ts`
- Review `apps/admin/src/lib/api-validation.ts` for utility functions
- See error handling in `apps/admin/src/lib/api-error.ts`

