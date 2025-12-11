# Quick Testing Guide for Zod Validation

## ✅ Unit Tests - PASSING

All validation schema tests are passing:

```bash
cd apps/admin
pnpm test api-validation
```

**Result:** 15 tests passing ✓

## 🧪 Manual Testing

### Quick Test Script

Run the automated test script:

```bash
# Make sure your dev server is running on localhost:3001
cd /Users/fong/Desktop/schoolquiz-1
./scripts/test-zod-validation.sh
```

This will test all migrated endpoints automatically.

### Manual curl Tests

#### Test 1: Valid Signup
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"method":"email","email":"test@example.com","password":"test123"}'
```

**Expected:** `200 OK` or `409 Conflict` (if email exists)

#### Test 2: Invalid Signup (Missing Email)
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"method":"email","password":"test123"}'
```

**Expected:** `400 Bad Request` with validation error:
```json
{
  "error": "Request validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "errors": [
      {
        "path": "...",
        "message": "Required field missing for selected signup method",
        "code": "..."
      }
    ]
  }
}
```

#### Test 3: Invalid Quiz Creation
```bash
curl -X POST http://localhost:3001/api/admin/quizzes \
  -H "Content-Type: application/json" \
  -d '{"number":999,"status":"draft","rounds":[]}'
```

**Expected:** `400 Bad Request` - Missing title

#### Test 4: Invalid User Creation
```bash
curl -X POST http://localhost:3001/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email","name":"Test"}'
```

**Expected:** `400 Bad Request` - Invalid email format

## ✅ What to Verify

1. **Valid requests work** - Should get `200`/`201` status codes
2. **Invalid requests return 400** - With structured error details
3. **Error format is consistent** - All validation errors use the same structure
4. **Field-level errors** - Error messages point to specific fields

## 🚀 Next Steps

1. Test in browser - Use the admin UI to test form submissions
2. Test with invalid data - Try submitting forms with missing/invalid fields
3. Check error display - Ensure frontend shows validation errors properly

## 📚 Full Testing Guide

See `docs/guides/TESTING_ZOD_VALIDATION.md` for comprehensive testing instructions.







