# Testing Zod Validation Implementation

## Overview

This guide covers testing the Zod validation implementation across migrated API routes.

## Quick Start

### Automated Tests

Run the unit tests:

```bash
cd apps/admin
pnpm test api-validation
```

Run the manual test script:

```bash
chmod +x scripts/test-zod-validation.sh
./scripts/test-zod-validation.sh
```

Or with custom base URL:

```bash
BASE_URL=http://localhost:3001 ./scripts/test-zod-validation.sh
```

## Manual Testing Guide

### 1. Test Signup Validation

#### Valid Request
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "method": "email",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected:** `200 OK` or `409 Conflict` (if email exists)

#### Invalid Request - Missing Email
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "method": "email",
    "password": "password123"
  }'
```

**Expected:** `400 Bad Request` with validation error:
```json
{
  "error": "Request validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "errors": [
      {
        "path": "email",
        "message": "Required",
        "code": "invalid_type"
      }
    ]
  }
}
```

#### Invalid Request - Bad Email Format
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "method": "email",
    "email": "not-an-email",
    "password": "password123"
  }'
```

**Expected:** `400 Bad Request` with email validation error

### 2. Test Quiz Creation Validation

#### Valid Request
```bash
curl -X POST http://localhost:3001/api/admin/quizzes \
  -H "Content-Type: application/json" \
  -d '{
    "number": 999,
    "title": "Test Quiz",
    "description": "A test quiz",
    "status": "draft",
    "rounds": [
      {
        "category": "General Knowledge",
        "title": "Round 1",
        "questions": [
          {"question": "What is 2+2?", "answer": "4"},
          {"question": "What is the capital of France?", "answer": "Paris"}
        ]
      }
    ]
  }'
```

**Expected:** `200 OK` or appropriate response

#### Invalid Request - Missing Title
```bash
curl -X POST http://localhost:3001/api/admin/quizzes \
  -H "Content-Type: application/json" \
  -d '{
    "number": 999,
    "status": "draft",
    "rounds": []
  }'
```

**Expected:** `400 Bad Request` with validation error for missing title

#### Invalid Request - Missing Rounds
```bash
curl -X POST http://localhost:3001/api/admin/quizzes \
  -H "Content-Type: application/json" \
  -d '{
    "number": 999,
    "title": "Test Quiz",
    "status": "draft",
    "rounds": []
  }'
```

**Expected:** `400 Bad Request` with validation error for empty rounds array

#### Invalid Request - Invalid Status
```bash
curl -X POST http://localhost:3001/api/admin/quizzes \
  -H "Content-Type: application/json" \
  -d '{
    "number": 999,
    "title": "Test Quiz",
    "status": "invalid_status",
    "rounds": [
      {
        "category": "Test",
        "title": "Round 1",
        "questions": [{"question": "Q?", "answer": "A"}]
      }
    ]
  }'
```

**Expected:** `400 Bad Request` with validation error for invalid status enum

### 3. Test User Creation Validation

#### Valid Request
```bash
curl -X POST http://localhost:3001/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "name": "New User",
    "tier": "basic"
  }'
```

**Expected:** `201 Created` or appropriate response

#### Invalid Request - Bad Email
```bash
curl -X POST http://localhost:3001/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "name": "User"
  }'
```

**Expected:** `400 Bad Request` with email validation error

### 4. Test Query Parameter Validation

#### Valid Query Params
```bash
curl "http://localhost:3001/api/admin/users?page=1&limit=20&search=test&tier=premium"
```

**Expected:** `200 OK` with filtered results

#### Invalid Query Params
```bash
curl "http://localhost:3001/api/admin/users?page=0&limit=200"
```

**Expected:** 
- `page=0` should be coerced to default (1) or rejected
- `limit=200` may be capped at max (100)

### 5. Test Organisation Creation Validation

#### Valid Request
```bash
curl -X POST http://localhost:3001/api/admin/organisations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Organisation",
    "ownerUserId": "user-123",
    "maxSeats": 10,
    "plan": "TEAM"
  }'
```

**Expected:** `201 Created` or appropriate response

#### Invalid Request - Missing Required Fields
```bash
curl -X POST http://localhost:3001/api/admin/organisations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Organisation"
  }'
```

**Expected:** `400 Bad Request` with validation error for missing `ownerUserId`

### 6. Test Private League Creation Validation

#### Valid Request
```bash
curl -X POST http://localhost:3001/api/private-leagues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test League",
    "description": "A test league",
    "color": "#FF5733"
  }'
```

**Expected:** `200 OK` or `403 Forbidden` (if not premium)

#### Invalid Request - Missing Name
```bash
curl -X POST http://localhost:3001/api/private-leagues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "description": "A test league"
  }'
```

**Expected:** `400 Bad Request` with validation error for missing name

## Testing Error Response Format

All validation errors should return this format:

```json
{
  "error": "Request validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "errors": [
      {
        "path": "email",
        "message": "Invalid email",
        "code": "invalid_string"
      },
      {
        "path": "title",
        "message": "Required",
        "code": "invalid_type"
      }
    ],
    "_raw": [...]
  }
}
```

## Testing Checklist

### Signup Route (`/api/auth/signup`)
- [ ] Valid email signup works
- [ ] Missing email returns 400
- [ ] Invalid email format returns 400
- [ ] Missing method returns 400
- [ ] Phone method works (if implemented)
- [ ] Code method works (if implemented)

### Signin Route (`/api/auth/signin`)
- [ ] Valid signin works
- [ ] Invalid JSON returns 400

### Quiz Creation (`/api/admin/quizzes` POST)
- [ ] Valid quiz creation works
- [ ] Missing title returns 400
- [ ] Missing rounds returns 400
- [ ] Empty rounds array returns 400
- [ ] Invalid status returns 400
- [ ] Invalid quiz number returns 400

### User Creation (`/api/admin/users` POST)
- [ ] Valid user creation works
- [ ] Missing email returns 400
- [ ] Invalid email format returns 400
- [ ] Invalid tier returns 400

### Organisation Creation (`/api/admin/organisations` POST)
- [ ] Valid organisation creation works
- [ ] Missing name returns 400
- [ ] Missing ownerUserId returns 400
- [ ] Invalid plan returns 400

### Query Parameters
- [ ] Valid query params work
- [ ] Invalid page number handled gracefully
- [ ] Invalid limit handled gracefully
- [ ] Invalid sort order returns 400

### Private League Creation (`/api/private-leagues` POST)
- [ ] Valid league creation works (if premium)
- [ ] Missing name returns 400
- [ ] Invalid color format returns 400

## Unit Tests

The validation schemas have unit tests in:
- `apps/admin/src/lib/api-validation.test.ts`

Run with:
```bash
cd apps/admin
pnpm test api-validation
```

## Integration Testing

For full integration tests, you'll need:
1. Database connection
2. Authentication tokens
3. Test data setup

See `docs/guides/TESTING_GUIDE.md` for integration testing setup.

## Common Issues

### Issue: Tests fail with "Cannot find module"
**Solution:** Make sure you're in the correct directory (`apps/admin`) and dependencies are installed.

### Issue: Validation errors don't match expected format
**Solution:** Check that `handleApiError()` is being used and `ValidationError` is thrown correctly.

### Issue: Query params not being validated
**Solution:** Ensure you're using `validateQuery()` instead of manually parsing `searchParams`.

## Next Steps

1. Add more test cases for edge cases
2. Test with real database data
3. Add integration tests with authentication
4. Add E2E tests for full user flows

