# 30-Minute Lesson Reminder System - Ready to Deploy

## Summary

Automated lesson reminder emails now trigger **30 minutes before each lesson** with actionable preparation steps for tutors.

## What Was Created

### 1. Database Migration ✅
**File**: `supabase/migrations/20251103000001_update_lesson_reminders_30min.sql`

- Updates reminder timing from 15 to 30 minutes
- Enhanced email template with preparation checklist
- Professional HTML design with clear CTAs

### 2. Updated Edge Function ✅
**File**: `supabase/functions/schedule-lesson-reminders/index.ts`

Changes:
- Works with actual `calendar_events` table structure
- Extracts student names from event summaries
- Sends reminders to tutors (not students)
- Includes direct links to student profiles
- High-priority email delivery

### 3. Deployment Script ✅
**File**: `scripts/deploy-30min-reminders.ps1`

Automates:
- Database migration
- Edge Function deployment
- Verification steps

### 4. Documentation ✅
**File**: `docs/30-minute-lesson-reminders.md`

Comprehensive guide covering:
- How it works
- Configuration
- Testing
- Troubleshooting
- Customization

## Key Features

### 📧 Enhanced Email Template
```
Subject: 🔔 Lesson in 30 Minutes: {{student_name}} - {{lesson_time}}

Content:
- Lesson details (student, topic, date, time, location)
- 5-step preparation checklist
- Quick links to dashboard and student profile
- Professional, responsive design
```

### ✅ Preparation Checklist
1. Review student profile
2. Prepare materials
3. Check discussion topics
4. Test your setup
5. Review last lesson notes

### 🔗 Quick Links
- Dashboard
- Student Profile (with search pre-filled)
- Settings

## How It Works

```
Every 5 minutes (cron job):
  ├─ Check Google Calendar events
  ├─ Find lessons starting in 30-35 minutes
  ├─ Extract student name from event summary
  ├─ Check if reminder already sent
  ├─ Render email with lesson details
  └─ Send to tutor via SMTP
```

## Deployment Steps

### Option 1: Automated (Recommended)
```powershell
.\scripts\deploy-30min-reminders.ps1
```

### Option 2: Manual
```bash
# 1. Apply migration
supabase db push

# 2. Deploy function
supabase functions deploy schedule-lesson-reminders --no-verify-jwt
```

## Testing

### Quick Test
1. Add event to Google Calendar: "TestStudent - Test Lesson"
2. Set start time to 32 minutes from now
3. Wait 2-7 minutes for cron job
4. Check tutor email inbox

### Manual Trigger
```bash
supabase functions invoke schedule-lesson-reminders
```

## Configuration

### Reminder Timing
- **Default**: 30 minutes before lesson
- **Window**: 30-35 minutes (5-minute window)
- **Frequency**: Checks every 5 minutes

### Email Template
- **Type**: `lesson_reminder`
- **Editable**: Yes (via Admin Portal)
- **Priority**: High
- **Status**: Active

## Student Name Extraction

Supports these formats:
- `"Julia - preply lesson"` → "Julia"
- `"John Smith - English Lesson"` → "John Smith"
- `"Maria - Conversation"` → "Maria"

## Monitoring

### View Email Logs
Admin Portal > Email Management > Email Logs
- Filter by type: "Lesson Reminder"
- Check delivery status
- View sent count

### Check Cron Job
```sql
SELECT * FROM cron_job_status 
WHERE jobname = 'automated-lesson-reminders';
```

## Files Modified/Created

### New Files
- ✅ `supabase/migrations/20251103000001_update_lesson_reminders_30min.sql`
- ✅ `scripts/deploy-30min-reminders.ps1`
- ✅ `docs/30-minute-lesson-reminders.md`
- ✅ `LESSON-REMINDERS-30MIN-READY.md`

### Modified Files
- ✅ `supabase/functions/schedule-lesson-reminders/index.ts`

## Next Steps

1. **Deploy**: Run `.\scripts\deploy-30min-reminders.ps1`
2. **Test**: Schedule a test lesson in Google Calendar
3. **Verify**: Check email logs in Admin Portal
4. **Customize**: Edit template if needed via Admin Portal

## Troubleshooting

### No Reminders Received?
1. Check cron job is active
2. Verify SMTP configuration
3. Check email template is active
4. View Edge Function logs
5. Ensure Google Calendar is synced

### Wrong Student Names?
- Update event summary format: `"StudentName - Description"`
- Re-sync Google Calendar

### Want Different Timing?
```sql
UPDATE email_settings 
SET setting_value = jsonb_build_object('minutes', 45, 'enabled', true)
WHERE setting_key = 'lesson_reminder_timing';
```

## Benefits

✅ **Proactive**: Tutors get advance notice
✅ **Actionable**: Clear preparation steps
✅ **Convenient**: Direct links to resources
✅ **Professional**: Well-designed email template
✅ **Automated**: No manual intervention needed
✅ **Customizable**: Edit template via Admin Portal

---

**Status**: Ready to Deploy 🚀
**Deployment Time**: ~2 minutes
**Testing Time**: ~5-10 minutes
