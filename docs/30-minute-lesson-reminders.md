# 30-Minute Lesson Reminder System

## Overview

Automated email reminders sent to tutors 30 minutes before their scheduled lessons from Google Calendar, with actionable preparation steps.

## Features

### ✅ Automated Scheduling
- Cron job runs every 5 minutes
- Checks for lessons starting in 30-35 minutes
- Sends reminder emails automatically
- Prevents duplicate reminders

### 📧 Enhanced Email Template
The reminder email includes:
- **Lesson Details**: Student name, topic, date, time, location
- **Preparation Checklist**: 5 actionable steps
- **Quick Links**: Dashboard, student profile, settings
- **Professional Design**: Modern, responsive HTML template

### 🎯 Preparation Checklist
Each reminder includes these action items:
1. **Review student profile** - Check learning goals and progress
2. **Prepare materials** - Have lesson plan and resources ready
3. **Check discussion topics** - Review conversation starters
4. **Test your setup** - Ensure tech is working
5. **Review last lesson notes** - Refresh your memory

## How It Works

### 1. Calendar Sync
- Tutors connect Google Calendar
- Events are synced to `calendar_events` table
- Student names extracted from event summaries

### 2. Reminder Scheduling
```
Every 5 minutes:
  ├─ Check for lessons in 30-35 minute window
  ├─ Extract student name from event summary
  ├─ Check if reminder already sent
  ├─ Check tutor notification preferences
  ├─ Render email template with lesson data
  └─ Send email via SMTP
```

### 3. Email Delivery
- Uses active SMTP configuration
- High priority delivery
- Logs sent to `email_logs` table
- Tracks delivery status

## Configuration

### Reminder Timing
Stored in `email_settings` table:
```sql
{
  "minutes": 30,
  "enabled": true
}
```

### Email Template
- **Type**: `lesson_reminder`
- **Subject**: `🔔 Lesson in 30 Minutes: {{student_name}} - {{lesson_time}}`
- **Priority**: High
- **Editable**: Yes (via Admin Portal)

## Template Variables

Available placeholders in the email template:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{tutor_name}}` | Tutor's full name | "John Smith" |
| `{{student_name}}` | Student name from event | "Julia" |
| `{{lesson_title}}` | Event summary | "Julia - English Lesson" |
| `{{lesson_date}}` | Formatted date | "Monday, November 3, 2025" |
| `{{lesson_time}}` | Formatted time | "02:30 PM" |
| `{{location}}` | Event location | "Zoom" or "In-person" |
| `{{dashboard_url}}` | Link to dashboard | "https://app.com/dashboard" |
| `{{student_profile_url}}` | Link to student | "https://app.com/students?searchName=Julia" |
| `{{settings_url}}` | Link to settings | "https://app.com/settings" |

## Student Name Extraction

The system extracts student names from Google Calendar event summaries:

**Supported Formats:**
- `"Julia - preply lesson"` → Student: "Julia"
- `"John Smith - English Lesson"` → Student: "John Smith"
- `"Maria - Conversation Practice"` → Student: "Maria"

**Logic:**
```typescript
const extractStudentName = (summary: string): string => {
  const parts = summary.split(' - ')
  return parts[0].trim()
}
```

## Notification Preferences

Tutors can disable reminders in Settings:
- Table: `user_notification_preferences`
- Field: `lesson_reminders` (boolean)
- Default: `true` (enabled)

## Deployment

### Prerequisites
- Supabase CLI installed
- Google Calendar connected
- SMTP configuration active
- Email template exists

### Deploy Command
```powershell
.\scripts\deploy-30min-reminders.ps1
```

This will:
1. Apply database migration
2. Deploy Edge Function
3. Update cron job

### Manual Deployment
```bash
# Apply migration
supabase db push

# Deploy function
supabase functions deploy schedule-lesson-reminders --no-verify-jwt
```

## Testing

### Method 1: Schedule Test Lesson
1. Add event to Google Calendar
2. Set start time to 30-35 minutes from now
3. Format: "TestStudent - Test Lesson"
4. Wait for cron job (runs every 5 minutes)
5. Check email inbox

### Method 2: Manual Trigger
```bash
# Trigger via Supabase CLI
supabase functions invoke schedule-lesson-reminders

# Or via SQL
SELECT trigger_lesson_reminders();
```

### Method 3: Admin Portal
1. Go to Admin Portal > Email Management
2. Click "Schedule Reminders" button
3. View results in Email Logs

## Monitoring

### Check Cron Job Status
```sql
SELECT * FROM cron_job_status 
WHERE jobname = 'automated-lesson-reminders';
```

### View Email Logs
```sql
SELECT * FROM email_logs 
WHERE template_type = 'lesson_reminder'
ORDER BY created_at DESC
LIMIT 10;
```

### Check Pending Reminders
```sql
SELECT 
  ce.summary,
  ce.start_time,
  t.email as tutor_email,
  EXTRACT(EPOCH FROM (ce.start_time - NOW())) / 60 as minutes_until_lesson
FROM calendar_events ce
JOIN tutors t ON ce.tutor_id = t.id
WHERE ce.start_time BETWEEN NOW() + INTERVAL '30 minutes' 
  AND NOW() + INTERVAL '35 minutes'
ORDER BY ce.start_time;
```

## Troubleshooting

### Reminders Not Sending

**Check 1: Cron Job Active**
```sql
SELECT active FROM cron.job 
WHERE jobname = 'automated-lesson-reminders';
```

**Check 2: SMTP Configuration**
```sql
SELECT is_active FROM email_smtp_configs 
WHERE is_active = true;
```

**Check 3: Email Template**
```sql
SELECT is_active FROM email_templates 
WHERE type = 'lesson_reminder' AND is_active = true;
```

**Check 4: Edge Function Logs**
```bash
supabase functions logs schedule-lesson-reminders --limit 20
```

### Wrong Student Names

If student names are extracted incorrectly:
1. Check event summary format in Google Calendar
2. Ensure format is: `"StudentName - Description"`
3. Update event summaries if needed
4. Re-sync calendar

### Duplicate Reminders

The system prevents duplicates by checking `email_logs`:
- Matches on: `google_event_id` + `recipient_email`
- Statuses checked: sent, delivered, pending, scheduled

## Customization

### Change Reminder Timing
```sql
UPDATE email_settings 
SET setting_value = jsonb_build_object('minutes', 45, 'enabled', true)
WHERE setting_key = 'lesson_reminder_timing';
```

### Edit Email Template
1. Go to Admin Portal > Email Management
2. Find "Lesson Reminder" template
3. Click "Edit"
4. Modify subject, HTML, or text content
5. Save changes

### Disable Reminders
```sql
UPDATE email_settings 
SET setting_value = jsonb_build_object('minutes', 30, 'enabled', false)
WHERE setting_key = 'lesson_reminder_timing';
```

## Database Schema

### Tables Used
- `calendar_events` - Google Calendar synced events
- `email_templates` - Reminder email template
- `email_settings` - Reminder timing configuration
- `email_logs` - Sent reminder tracking
- `email_smtp_configs` - SMTP delivery settings
- `user_notification_preferences` - User opt-in/out
- `tutors` - Tutor information

### Cron Job
- **Name**: `automated-lesson-reminders`
- **Schedule**: `*/5 * * * *` (every 5 minutes)
- **Function**: `schedule-lesson-reminders`
- **Authentication**: Service role key

## Security

- ✅ Service role authentication for cron jobs
- ✅ RLS policies on all tables
- ✅ User notification preferences respected
- ✅ Duplicate prevention
- ✅ Email logs for audit trail

## Performance

- **Cron Frequency**: Every 5 minutes
- **Query Window**: 5-minute window (30-35 min before lesson)
- **Average Processing**: < 1 second per lesson
- **Email Delivery**: < 5 seconds via SMTP

## Future Enhancements

Potential improvements:
- [ ] SMS reminders via Twilio
- [ ] Push notifications
- [ ] Customizable reminder timing per tutor
- [ ] Multiple reminders (e.g., 1 hour + 30 min)
- [ ] Reminder for students too
- [ ] Integration with lesson materials
- [ ] AI-generated preparation suggestions

## Support

For issues or questions:
1. Check Edge Function logs
2. Review email logs in Admin Portal
3. Verify SMTP configuration
4. Test with manual trigger
5. Check cron job status

---

**Status**: ✅ Active and Deployed
**Last Updated**: November 3, 2025
**Version**: 1.0.0
