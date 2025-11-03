/*
  # Update Lesson Reminders to 30 Minutes

  1. Changes
    - Update reminder timing from 15 minutes to 30 minutes
    - Update lesson reminder email template with actionable preparation steps
    - Add better formatting and clear call-to-action

  2. Security
    - Maintains existing RLS policies
    - Uses existing authentication mechanisms
*/

-- Update lesson reminder timing to 30 minutes
UPDATE email_settings 
SET 
  setting_value = jsonb_build_object('minutes', 30, 'enabled', true),
  updated_at = now()
WHERE setting_key = 'lesson_reminder_timing';

-- Update lesson reminder email template with better content and actionable steps
UPDATE email_templates
SET 
  subject = '🔔 Lesson in 30 Minutes: {{student_name}} - {{lesson_time}}',
  html_content = '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .lesson-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .action-items { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
    .action-items h3 { color: #856404; margin-top: 0; }
    .action-items ul { margin: 10px 0; padding-left: 20px; }
    .action-items li { margin: 8px 0; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
    .button:hover { background: #5568d3; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .emoji { font-size: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji">🎓</div>
      <h1 style="margin: 10px 0;">Lesson Starting Soon!</h1>
      <p style="margin: 5px 0; opacity: 0.9;">Your lesson begins in 30 minutes</p>
    </div>
    
    <div class="content">
      <p>Hi <strong>{{tutor_name}}</strong>,</p>
      
      <p>This is your reminder that you have an upcoming lesson:</p>
      
      <div class="lesson-info">
        <h3 style="margin-top: 0; color: #667eea;">📚 Lesson Details</h3>
        <p><strong>Student:</strong> {{student_name}}</p>
        <p><strong>Topic:</strong> {{lesson_title}}</p>
        <p><strong>Date:</strong> {{lesson_date}}</p>
        <p><strong>Time:</strong> {{lesson_time}}</p>
        {{#if location}}<p><strong>Location:</strong> {{location}}</p>{{/if}}
      </div>
      
      <div class="action-items">
        <h3>✅ Quick Preparation Checklist</h3>
        <ul>
          <li><strong>Review student profile</strong> - Check their learning goals, weaknesses, and recent progress</li>
          <li><strong>Prepare materials</strong> - Have your lesson plan, exercises, and resources ready</li>
          <li><strong>Check discussion topics</strong> - Review any conversation starters or vocabulary flashcards</li>
          <li><strong>Test your setup</strong> - Ensure your internet connection, camera, and microphone are working</li>
          <li><strong>Review last lesson notes</strong> - Refresh your memory on what you covered previously</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{dashboard_url}}" class="button">📊 Go to Dashboard</a>
        <a href="{{student_profile_url}}" class="button">👤 View Student Profile</a>
      </div>
      
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
        <strong>Pro Tip:</strong> Arriving a few minutes early shows professionalism and gives you time to settle in. Your students will appreciate it! 🌟
      </p>
    </div>
    
    <div class="footer">
      <p>LinguaFlow - Empowering Language Tutors</p>
      <p>You''re receiving this because you have lesson reminders enabled.</p>
      <p><a href="{{settings_url}}" style="color: #667eea;">Manage notification preferences</a></p>
    </div>
  </div>
</body>
</html>',
  text_content = 'LESSON REMINDER - Starting in 30 Minutes

Hi {{tutor_name}},

Your lesson is coming up soon!

LESSON DETAILS:
- Student: {{student_name}}
- Topic: {{lesson_title}}
- Date: {{lesson_date}}
- Time: {{lesson_time}}
{{#if location}}- Location: {{location}}{{/if}}

QUICK PREPARATION CHECKLIST:
✓ Review student profile - Check their learning goals and progress
✓ Prepare materials - Have your lesson plan and resources ready
✓ Check discussion topics - Review conversation starters
✓ Test your setup - Ensure tech is working properly
✓ Review last lesson notes - Refresh your memory

QUICK LINKS:
Dashboard: {{dashboard_url}}
Student Profile: {{student_profile_url}}
Settings: {{settings_url}}

Pro Tip: Arriving early shows professionalism and gives you time to prepare!

---
LinguaFlow - Empowering Language Tutors
Manage preferences: {{settings_url}}',
  updated_at = now()
WHERE type = 'lesson_reminder' AND is_active = true;

-- Add comment explaining the update
COMMENT ON TABLE email_templates IS 'Email templates for various notification types. Lesson reminders are sent 30 minutes before scheduled lessons from Google Calendar.';
