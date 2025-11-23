# Testing the Scheduling System

## Quick Test Steps

### 1. Verify API is Working

```bash
# List jobs (should return empty array initially)
curl http://localhost:3000/api/admin/scheduling/jobs

# Expected response:
# {"jobs":[]}
```

### 2. Create a Test Job via API

```bash
# Create a PUBLISH_QUIZ job
curl -X POST http://localhost:3000/api/admin/scheduling/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "PUBLISH_QUIZ",
    "name": "Test Publish Quiz",
    "description": "Testing the scheduling system",
    "scheduledFor": "2025-01-25T10:00:00Z",
    "config": {
      "quizId": "YOUR_QUIZ_ID_HERE"
    },
    "maxAttempts": 3
  }'
```

### 3. Test via UI

1. Visit `http://localhost:3000/admin/scheduling`
2. Click "Create Job"
3. Fill in the form:
   - Job Type: Publish Quiz
   - Job Name: Test Job
   - Date: Tomorrow
   - Time: 10:00 AM
   - Select a quiz from the dropdown
4. Click "Create Job"
5. Verify the job appears in the table

### 4. Test Manual Execution

```bash
# Execute a job manually (replace JOB_ID)
curl -X POST http://localhost:3000/api/admin/scheduling/jobs/JOB_ID/execute
```

### 5. Test Cron Endpoint

```bash
# Process all due jobs
curl -X POST http://localhost:3000/api/admin/scheduling/cron
```

## Expected Behavior

- ✅ Jobs list should load (empty initially)
- ✅ Creating a job should succeed and appear in the list
- ✅ Job status should be "PENDING" or "SCHEDULED"
- ✅ Manual execution should work and update status to "COMPLETED"
- ✅ Cron endpoint should process due jobs

## Troubleshooting

### If jobs list returns error:
- Check database connection
- Verify table was created correctly
- Check Prisma client is up to date: `cd packages/db && pnpm db:generate`

### If creating job fails:
- Check that quiz ID exists in database
- Verify date/time is in the future
- Check browser console for errors

### If execution fails:
- Check job config has required fields (e.g., quizId for PUBLISH_QUIZ)
- Verify quiz exists in database
- Check server logs for detailed error messages

