# Lesson Reminder Email Fix Summary

## Problem Identified

**Reminder emails were not being sent even though the cron job was working perfectly.**

### Root Cause
The `schedule-lesson-reminders` Edge Function was checking for an SMTP configuration in the database and **skipping all emails if no SMTP config was found**, even though:
- The `send-integrated-email` function works perfectly with Resend API (doesn't need SMTP config)
- RESEND_API_KEY environment variable is set
- Email template exists and is active
- Cron job is running correctly

### Diagnosis Results
```
✅ Cron job working (external cron-job.org)
✅ Edge Function accessible and executing
✅ Email template exists and is active
✅ RESEND_API_KEY environment variable set
✅ Reminder timing configured (20 minutes)
❌ NO SMTP configuration in database (CRITICAL BLOCKER)
```

## The Fix

### Changed File
`supabase/functions/schedule-lesson-reminders/index.ts`

### What Changed

**Before** (Lines 130-137):
```typescript
// Get active SMTP config
const { data: smtpConfig, error: smtpError } = await supabaseClient
  .from('email_smtp_configs')
  .select('*')
  .eq('is_active', true)
  .maybeSingle()

if (smtpError || !smtpConfig) {
  errors.push(`No active SMTP configuration found`)
  continue  // ❌ This skips the email!
}
```

**After**:
```typescript
// Get active SMTP config (optional - Resend API can work without it)
const { data: smtpConfig } = await supabaseClient
  .from('email_smtp_configs')
  .select('*')
  .eq('is_active', true)
  .maybeSingle()

// Use default SMTP config ID if none found (Resend will handle it)
const smtpConfigId = smtpConfig?.id || 'default'
```

### Why This Works

1. **SMTP config is now optional** - Function doesn't fail if it's missing
2. **Uses 'default' as fallback** - send-integrated-email accepts this
3. **Resend API handles delivery** - No SMTP config needed when using Resend
4. **Backwards compatible** - Still uses SMTP config if one exists

## Deployment Steps

### 1. Deploy the Fixed Function
```powershell
# Run the deployment script
.\scripts\deploy-reminder-fix.ps1

# Or manually:
supabase functions deploy schedule-lesson-reminders
```

### 2. Verify the Fix
```bash
# Test the function
node scripts/test-reminder-fix.js

# Check function logs
supabase functions logs schedule-lesson-reminders
```

### 3. Monitor Results
```bash
# Check email logs for reminders
node scripts/check-email-error-logs.js

# Diagnose any remaining issues
node scripts/diagnose-reminder-email-failure.js
```

## How Reminder System Works Now

### Flow
```
1. Cron-job.org hits Edge Function every 5 minutes
   ↓
2. schedule-lesson-reminders function executes
   ↓
3. Queries calendar_events for lessons in 20-25 min window
   ↓
4. For each event:
   - Extracts student name from event summary
   - Checks if reminder already sent
   - Checks tutor notification preferences
   - Gets email template (required)
   - Gets SMTP config (optional - uses 'default' if missing)
   - Renders template with lesson data
   ↓
5. Calls send-integrated-email function
   ↓
6. send-integrated-email:
   - Uses Resend API (RESEND_API_KEY)
   - Sends email to tutor
   - Logs result in email_logs table
   ↓
7. Tutor receives reminder email 20 minutes before lesson
```

### Timing
- **Reminder Window**: 20-25 minutes before lesson start
- **Cron Frequency**: Every 5 minutes
- **Configurable**: Via `email_settings` table (`lesson_reminder_timing`)

## Testing the Fix

### Create a Test Event
To test if reminders are working:

1. **Create a calendar event** 20-25 minutes from now
2. **Wait for cron job** to run (max 5 minutes)
3. **Check email_logs** table:
   ```sql
   SELECT * FROM email_logs 
   WHERE template_type = 'lesson_reminder' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
4. **Check your email** inbox

### Manual Test
```bash
# Invoke the function manually
node scripts/test-reminder-fix.js

# Or via Supabase CLI
supabase functions invoke schedule-lesson-reminders
```

## Monitoring

### Check Email Logs
```sql
-- Recent reminder emails
SELECT 
  recipient_email,
  subject,
  status,
  created_at,
  sent_at,
  error_message
FROM email_logs
WHERE template_type = 'lesson_reminder'
ORDER BY created_at DESC
LIMIT 10;
```

### Check Function Logs
```bash
# View Edge Function logs
supabase functions logs schedule-lesson-reminders --tail

# Or in Supabase Dashboard:
# Project → Edge Functions → schedule-lesson-reminders → Logs
```

### Check Cron Job Status
Visit cron-job.org dashboard to verify:
- Job is enabled
- Job is running every 5 minutes
- Recent executions show success (200 status)

## Expected Behavior

### When Reminders Work
- Email appears in `email_logs` with status `sent` or `delivered`
- Tutor receives email 20 minutes before lesson
- Email includes:
  - Student name (extracted from calendar event)
  - Lesson date and time
  - Link to dashboard
  - Link to student profile

### When Reminders Don't Send
Legitimate reasons:
- No calendar events in the 20-25 minute window
- Reminder already sent for that event
- Tutor has disabled lesson reminders in preferences
- Email template is not active

## Troubleshooting

### If Reminders Still Don't Work

1. **Check RESEND_API_KEY**
   ```bash
   # In Supabase Dashboard:
   # Project Settings → Edge Functions → Secrets
   # Verify RESEND_API_KEY is set
   ```

2. **Check Email Template**
   ```sql
   SELECT * FROM email_templates 
   WHERE type = 'lesson_reminder' 
   AND is_active = true;
   ```
   Should return 1 active template.

3. **Check Calendar Events**
   ```sql
   SELECT * FROM calendar_events 
   WHERE start_time > NOW() 
   AND start_time < NOW() + INTERVAL '2 hours'
   ORDER BY start_time;
   ```

4. **Check Function Logs**
   ```bash
   supabase functions logs schedule-lesson-reminders --tail
   ```
   Look for errors or "No lessons found" messages.

5. **Test Manually**
   ```bash
   node scripts/test-reminder-fix.js
   ```

## Additional Notes

### SMTP Config (Optional)
While SMTP config is no longer required, you can still create one if you want to:
- Use a custom email sender address
- Track emails through your own SMTP server
- Have more control over email delivery

To create SMTP config:
1. Go to Admin Portal → Email Management → SMTP Configuration
2. Add your SMTP details
3. Test the configuration
4. Activate it

### Resend API
The system uses Resend API for email delivery:
- **Pros**: Simple, reliable, no SMTP config needed
- **Cons**: Requires RESEND_API_KEY environment variable
- **Sender**: Emails come from `LinguaFlow <noreply@linguaflow.online>`

### Future Improvements
- [ ] Add retry logic for failed reminders
- [ ] Support multiple reminder times (e.g., 1 hour + 20 min)
- [ ] Add SMS reminders option
- [ ] Dashboard widget showing upcoming reminders
- [ ] Email delivery status tracking (opens, clicks)

## Summary

**The fix is simple but critical**: Made SMTP configuration optional in the reminder function so it works with Resend API directly. This unblocks the entire reminder system and allows emails to be sent as designed.

**Status**: ✅ Fixed and ready to deploy

**Impact**: Reminder emails will now be sent 20 minutes before each lesson, as long as:
- Calendar events exist
- Email template is active
- RESEND_API_KEY is set
- Cron job is running
