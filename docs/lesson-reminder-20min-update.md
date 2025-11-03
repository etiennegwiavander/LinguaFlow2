# Lesson Reminder Update: 20 Minutes

## Summary
Updated the lesson reminder system from **30 minutes** to **20 minutes** before scheduled lessons.

## Changes Made

### 1. Database Migration
- **File**: `supabase/migrations/20251103000007_update_lesson_reminders_20min.sql`
- Updated `email_settings` table: `lesson_reminder_timing` → 20 minutes
- Updated email template subject: "Lesson in 20 Minutes"
- Updated email template content to reflect 20-minute timing

### 2. How It Works
The system uses a **dynamic database setting** rather than hardcoded values:

```typescript
// Edge Function reads from database
const { data: settingsData } = await supabaseClient
  .from('email_settings')
  .select('setting_value')
  .eq('setting_key', 'lesson_reminder_timing')
  .maybeSingle()

const reminderMinutes = settingsData?.setting_value?.minutes || 30
```

### 3. Reminder Window
- **Old**: 30-35 minutes before lesson
- **New**: 20-25 minutes before lesson
- **Cron frequency**: Every 5 minutes
- **Window size**: 5 minutes (to catch all lessons)

## Testing

Run the test script to verify:
```bash
node scripts/test-20min-reminder-window.js
```

This will show:
- Current database setting (should be 20 minutes)
- Reminder window times
- Any upcoming lessons in the window

## Email Template Updates

The email templates now show:
- Subject: "🔔 Lesson in 20 Minutes: {{student_name}} - {{lesson_time}}"
- Content references "20 minutes" instead of "30 minutes"

## Cron Job Configuration

No changes needed to cron-job.org setup. The existing configuration continues to work:
- **URL**: `https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/schedule-lesson-reminders`
- **Schedule**: Every 5 minutes (`*/5 * * * *`)
- **Method**: POST

The Edge Function automatically reads the new 20-minute setting from the database.

## Future Adjustments

To change the reminder timing in the future, simply update the database:

```sql
UPDATE email_settings 
SET setting_value = jsonb_build_object('minutes', 15, 'enabled', true)
WHERE setting_key = 'lesson_reminder_timing';
```

No code changes or redeployment needed!
