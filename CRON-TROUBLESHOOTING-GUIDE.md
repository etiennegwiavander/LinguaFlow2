# Lesson Reminder Cron Job Troubleshooting Guide

## Problem: Reminder emails not being sent

### Root Cause Analysis

The reminder system has 3 components that must all work:
1. **External Cron Job** (cron-job.org) - Triggers the Edge Function every 5 minutes
2. **Edge Function** (schedule-lesson-reminders) - Finds lessons and sends emails
3. **Email Service** (Resend) - Delivers the emails

If there's no record on Resend, the Edge Function was never called.

## Step 1: Verify Cron Job is Configured

Go to https://cron-job.org and check:

### Required Configuration:
- **URL**: `https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/schedule-lesson-reminders`
- **Method**: POST
- **Schedule**: `*/5 * * * *` (every 5 minutes)
- **Headers**:
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybXV3amNqY3lvaHNya2d5YXBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMDMxNDAsImV4cCI6MjA2NDY3OTE0MH0.qXvAH9G_9vU7fy07SOYM2nnywS8LgvDYnuJPCa982kQ
  Content-Type: application/json
  ```
- **Status**: ENABLED ✅

### Check Execution History:
1. Click on your cron job in the dashboard
2. View "Execution History" tab
3. Look for recent executions (should be every 5 minutes)
4. Check response codes (should be 200)

## Step 2: Test Edge Function Manually

Run this to verify the Edge Function works:
```bash
node scripts/test-cron-trigger-now.js
```

Expected output:
- Status: 200
- Success: true
- Scheduled: 0 or more (depending on events in window)

## Step 3: Create Test Event

To test the full flow, create a test event 32 minutes in the future:
```bash
node scripts/create-test-event-for-reminder.js
```

This will:
1. Create a calendar event 32 minutes from now
2. Wait for the cron job to trigger (within 5 minutes)
3. Check if reminder email is sent

## Step 4: Check Logs

After the cron runs, check what happened:
```bash
node scripts/check-cron-execution-logs.js
```

Look for:
- New entries in email_logs table
- Status: 'sent' or 'failed'
- Any error messages

## Common Issues

### Issue 1: Cron Job Not Configured
**Symptom**: No executions in cron-job.org history
**Fix**: Set up the cron job following Step 1

### Issue 2: Cron Job Disabled
**Symptom**: Cron job exists but not running
**Fix**: Enable the cron job in cron-job.org dashboard

### Issue 3: Wrong Authorization Header
**Symptom**: 401 Unauthorized responses
**Fix**: Update the Authorization header with the correct anon key

### Issue 4: No Events in Window
**Symptom**: Edge Function returns "No lessons found"
**Fix**: This is normal if no events are 30-35 minutes away. Create a test event.

### Issue 5: Email Format Error
**Symptom**: Email logs show "Invalid from field" error
**Fix**: Already fixed in latest deployment. Redeploy if needed:
```bash
supabase functions deploy schedule-lesson-reminders
supabase functions deploy send-integrated-email
```

## Verification Checklist

- [ ] Cron job exists on cron-job.org
- [ ] Cron job is ENABLED
- [ ] Cron job runs every 5 minutes
- [ ] Execution history shows 200 responses
- [ ] Edge Function works when called manually
- [ ] Test event created successfully
- [ ] Email appears in email_logs table
- [ ] Email delivered to Resend
- [ ] Email received in inbox

## Quick Test

Run all diagnostic scripts in sequence:
```bash
# 1. Test Edge Function
node scripts/test-cron-trigger-now.js

# 2. Create test event
node scripts/create-test-event-for-reminder.js

# 3. Wait 5 minutes, then check logs
node scripts/check-cron-execution-logs.js

# 4. Check calendar sync
node scripts/check-calendar-sync-status.js
```

## Support

If issues persist:
1. Check Supabase Edge Function logs in dashboard
2. Check Resend dashboard for email delivery status
3. Verify email template is active in database
4. Verify SMTP config is active in database
