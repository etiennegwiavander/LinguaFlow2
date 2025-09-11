#!/usr/bin/env node

/**
 * Setup default email templates for the email management system
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const defaultTemplates = [
  {
    type: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to LinguaFlow! 🎉',
    html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to LinguaFlow</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">Welcome to LinguaFlow! 🎉</h1>
        <p style="font-size: 18px; color: #666;">Your AI-powered language tutoring platform</p>
    </div>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #1e40af; margin-top: 0;">Hello {{firstName}}!</h2>
        <p>Thank you for joining LinguaFlow. We're excited to help you on your language learning journey!</p>
        
        <h3 style="color: #1e40af;">What's Next?</h3>
        <ul style="padding-left: 20px;">
            <li>Complete your tutor profile</li>
            <li>Add your first students</li>
            <li>Generate personalized lesson materials</li>
            <li>Explore our AI-powered features</li>
        </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{dashboardUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Get Started
        </a>
    </div>
    
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
        <p>Need help? Contact us at <a href="mailto:support@linguaflow.com">support@linguaflow.com</a></p>
        <p>© 2024 LinguaFlow. All rights reserved.</p>
    </div>
</body>
</html>`,
    text_content: `Welcome to LinguaFlow!

Hello {{firstName}},

Thank you for joining LinguaFlow. We're excited to help you on your language learning journey!

What's Next?
- Complete your tutor profile
- Add your first students  
- Generate personalized lesson materials
- Explore our AI-powered features

Get started: {{dashboardUrl}}

Need help? Contact us at support@linguaflow.com

© 2024 LinguaFlow. All rights reserved.`,
    is_active: true,
    created_by: 'system'
  },
  {
    type: 'password_reset',
    name: 'Password Reset',
    subject: 'Reset Your LinguaFlow Password',
    html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #dc2626; margin-bottom: 10px;">Password Reset Request 🔐</h1>
        <p style="font-size: 18px; color: #666;">LinguaFlow Account Security</p>
    </div>
    
    <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
        <h2 style="color: #991b1b; margin-top: 0;">Hello {{userName}},</h2>
        <p>We received a request to reset your password for your LinguaFlow account.</p>
        
        <p><strong>If you requested this:</strong> Click the button below to reset your password. This link will expire in {{expiryTime}}.</p>
        
        <p><strong>If you didn't request this:</strong> You can safely ignore this email. Your password will not be changed.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{resetUrl}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
        </a>
    </div>
    
    <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #666;">
            <strong>Security tip:</strong> If you didn't request this reset, please check your account security and consider changing your password.
        </p>
    </div>
    
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
        <p>Need help? Contact us at <a href="mailto:support@linguaflow.com">support@linguaflow.com</a></p>
        <p>© 2024 LinguaFlow. All rights reserved.</p>
    </div>
</body>
</html>`,
    text_content: `Password Reset Request

Hello {{userName}},

We received a request to reset your password for your LinguaFlow account.

If you requested this: Use the link below to reset your password. This link will expire in {{expiryTime}}.

Reset your password: {{resetUrl}}

If you didn't request this: You can safely ignore this email. Your password will not be changed.

Security tip: If you didn't request this reset, please check your account security and consider changing your password.

Need help? Contact us at support@linguaflow.com

© 2024 LinguaFlow. All rights reserved.`,
    is_active: true,
    created_by: 'system'
  },
  {
    type: 'lesson_reminder',
    name: 'Lesson Reminder',
    subject: 'Upcoming Lesson Reminder - {{lessonTitle}}',
    html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lesson Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #059669; margin-bottom: 10px;">Lesson Reminder 📚</h1>
        <p style="font-size: 18px; color: #666;">Your upcoming LinguaFlow lesson</p>
    </div>
    
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #059669;">
        <h2 style="color: #065f46; margin-top: 0;">Hello {{studentName}},</h2>
        <p>This is a friendly reminder about your upcoming lesson:</p>
        
        <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <h3 style="color: #065f46; margin-top: 0;">{{lessonTitle}}</h3>
            <p><strong>Date:</strong> {{lessonDate}}</p>
            <p><strong>Time:</strong> {{lessonTime}}</p>
            <p><strong>Duration:</strong> {{duration}} minutes</p>
            {{#if meetingLink}}
            <p><strong>Meeting Link:</strong> <a href="{{meetingLink}}">Join Lesson</a></p>
            {{/if}}
        </div>
        
        {{#if lessonNotes}}
        <div style="background: #fef3c7; padding: 10px; border-radius: 4px; margin: 10px 0;">
            <p style="margin: 0;"><strong>Notes:</strong> {{lessonNotes}}</p>
        </div>
        {{/if}}
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{lessonUrl}}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Lesson Materials
        </a>
    </div>
    
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
        <p>Need to reschedule? Contact your tutor or <a href="mailto:support@linguaflow.com">support@linguaflow.com</a></p>
        <p>© 2024 LinguaFlow. All rights reserved.</p>
    </div>
</body>
</html>`,
    text_content: `Lesson Reminder

Hello {{studentName}},

This is a friendly reminder about your upcoming lesson:

{{lessonTitle}}
Date: {{lessonDate}}
Time: {{lessonTime}}
Duration: {{duration}} minutes
{{#if meetingLink}}Meeting Link: {{meetingLink}}{{/if}}

{{#if lessonNotes}}Notes: {{lessonNotes}}{{/if}}

View lesson materials: {{lessonUrl}}

Need to reschedule? Contact your tutor or support@linguaflow.com

© 2024 LinguaFlow. All rights reserved.`,
    is_active: true,
    created_by: 'system'
  }
];

async function setupDefaultTemplates() {
  console.log('🔧 Setting up default email templates...\n');

  try {
    for (const template of defaultTemplates) {
      console.log(`📧 Creating ${template.type} template...`);
      
      // Check if template already exists
      const { data: existing } = await supabase
        .from('email_templates')
        .select('id')
        .eq('type', template.type)
        .maybeSingle();

      if (existing) {
        console.log(`   ⚠️  Template ${template.type} already exists, skipping...`);
        continue;
      }

      // Create the template
      const { data, error } = await supabase
        .from('email_templates')
        .insert(template)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(`   ✅ Created ${template.type} template (ID: ${data.id})`);
    }

    console.log('\n🎉 Default email templates setup complete!');
    
    // Verify templates
    console.log('\n📋 Verifying templates...');
    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('type, name, is_active')
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    templates.forEach(template => {
      console.log(`   ✅ ${template.type}: ${template.name} (Active: ${template.is_active})`);
    });

  } catch (error) {
    console.error('❌ Error setting up templates:', error);
    process.exit(1);
  }
}

// Run the setup
setupDefaultTemplates().catch(console.error);