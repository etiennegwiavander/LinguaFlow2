/*
  # Update Lesson Reminders to 20 Minutes

  1. Changes
    - Update reminder timing from 30 minutes to 20 minutes
    - Update lesson reminder email template subject and content
    - Maintain existing functionality and formatting

  2. Security
    - Maintains existing RLS policies
    - Uses existing authentication mechanisms
*/

-- Update lesson reminder timing to 20 minutes
UPDATE email_settings 
SET 
  setting_value = jsonb_build_object('minutes', 20, 'enabled', true),
  updated_at = now()
WHERE setting_key = 'lesson_reminder_timing';

-- Update lesson reminder email template subject to reflect 20 minutes
UPDATE email_templates
SET 
  subject = '🔔 Lesson in 20 Minutes: {{student_name}} - {{lesson_time}}',
  html_content = REPLACE(
    REPLACE(html_content, 'in 30 minutes', 'in 20 minutes'),
    'Lesson in 30 Minutes', 'Lesson in 20 Minutes'
  ),
  text_content = REPLACE(
    REPLACE(text_content, 'in 30 Minutes', 'in 20 Minutes'),
    'Starting in 30 Minutes', 'Starting in 20 Minutes'
  ),
  updated_at = now()
WHERE type = 'lesson_reminder' AND is_active = true;

-- Update table comment
COMMENT ON TABLE email_templates IS 'Email templates for various notification types. Lesson reminders are sent 20 minutes before scheduled lessons from Google Calendar.';
