require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Base email template style matching password reset
const getStyledEmailTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header with gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 60px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600; letter-spacing: -0.5px;">
                                ${title}
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            ${content}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f7fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 10px 0; font-size: 14px; color: #718096;">
                                <strong>LinguaFlow</strong> - AI-Powered Language Teaching Platform
                            </p>
                            <p style="margin: 0; font-size: 13px; color: #a0aec0;">
                                This email was sent to {{user_email}}
                            </p>
                            <p style="margin: 10px 0 0 0; font-size: 13px; color: #a0aec0;">
                                © 2025 LinguaFlow. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

const templates = {
  welcome: {
    name: 'Default Welcome Email',
    subject: 'Welcome to {{app_name}} - Start Your Teaching Journey!',
    html_content: getStyledEmailTemplate(
      'Welcome to Your Teaching Journey!',
      `
            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                Hi {{user_name}},
            </p>
            
            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                🎉 <strong>Congratulations!</strong> You've successfully joined LinguaFlow, the revolutionary platform that creates <strong>hyper-personalized multilingual lessons</strong> to meet your students' evolving needs. We're thrilled to have you on board!
            </p>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 15px; line-height: 22px; color: #92400e;">
                    <strong>🌟 What makes LinguaFlow special?</strong> Our AI doesn't just translate content—it creates culturally relevant, personally tailored lessons that adapt in real-time to each student's learning journey.
                </p>
            </div>
            
            <p style="margin: 20px 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                Your tutor dashboard is now active and ready for you to explore!
            </p>
            
            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td align="center" style="padding: 20px 0;">
                        <a href="{{dashboard_url}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                            Access Your Dashboard
                        </a>
                    </td>
                </tr>
            </table>
            
            <div style="background-color: #f0f9ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px;">🌟 LinguaFlow's Game-Changing Features:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 15px; line-height: 24px;">
                    <li style="margin-bottom: 10px;"><strong>Hyper-Personalized Multilingual Lessons:</strong> Create lessons that adapt to each student's learning style, pace, and cultural background</li>
                    <li style="margin-bottom: 10px;"><strong>AI-Powered Content Generation:</strong> Generate culturally relevant content that evolves with your students' progress</li>
                    <li style="margin-bottom: 10px;"><strong>Dynamic Language Adaptation:</strong> Seamlessly switch between languages and adjust complexity in real-time</li>
                    <li style="margin-bottom: 10px;"><strong>Intelligent Analytics:</strong> Deep insights into each student's learning patterns and progress</li>
                    <li style="margin-bottom: 10px;"><strong>Contextual Conversations:</strong> Generate discussion topics that match your student's interests and profession</li>
                    <li style="margin-bottom: 10px;"><strong>Smart Vocabulary Building:</strong> Personalized flashcards that adapt to learning speed and retention</li>
                </ul>
            </div>
            
            <h3 style="color: #1e40af; font-size: 18px; margin: 30px 0 15px 0;">🚀 Your Journey to Hyper-Personalized Teaching:</h3>
            <ol style="margin: 0 0 20px 0; padding-left: 20px; color: #4a5568; font-size: 15px; line-height: 24px;">
                <li style="margin-bottom: 10px;"><strong>Complete your profile:</strong> Add your teaching languages, cultural expertise, and specializations</li>
                <li style="margin-bottom: 10px;"><strong>Explore the AI tools:</strong> Discover how our multilingual content generation works</li>
                <li style="margin-bottom: 10px;"><strong>Create your first personalized lesson:</strong> Experience the power of adaptive, culturally-aware content</li>
                <li style="margin-bottom: 10px;"><strong>Add your first student:</strong> Set up their learning profile for maximum personalization</li>
                <li style="margin-bottom: 10px;"><strong>Watch the magic happen:</strong> See how lessons evolve based on your student's progress</li>
            </ol>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 15px; line-height: 22px; color: #92400e;">
                    <strong>💡 Pro Tip:</strong> The more you tell our AI about your students (their interests, goals, cultural background, and learning preferences), the more personalized and effective their lessons become!
                </p>
            </div>
            
            <p style="margin: 20px 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                Ready to revolutionize your teaching with hyper-personalized, multilingual lessons? If you have any questions, our support team is here to help at <a href="mailto:{{support_email}}" style="color: #3b82f6; text-decoration: none;">{{support_email}}</a>
            </p>
            
            <p style="margin: 20px 0 0 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                Welcome to the future of personalized language education! 🌟
            </p>
            
            <p style="margin: 20px 0 0 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                Best regards,<br>
                <strong>The LinguaFlow Team</strong><br>
                <em style="color: #718096;">Empowering tutors with AI-driven personalization</em>
            </p>
      `
    ),
    placeholders: ['user_name', 'user_email', 'app_name', 'dashboard_url', 'support_email']
  },
  
  password_reset: {
    name: 'Default Password Reset',
    subject: 'Reset Your Password - {{app_name}}',
    html_content: getStyledEmailTemplate(
      'Reset Your Password',
      `
            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                Hi {{user_name}},
            </p>
            
            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                We received a request to reset your password for your LinguaFlow account.
            </p>
            
            <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                Click the button below to reset your password:
            </p>
            
            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td align="center" style="padding: 20px 0;">
                        <a href="{{reset_link}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                            Reset Password
                        </a>
                    </td>
                </tr>
            </table>
            
            <p style="margin: 30px 0 20px 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                Or copy and paste this link into your browser:
            </p>
            
            <p style="margin: 0 0 30px 0; font-size: 14px; line-height: 20px; color: #3b82f6; word-break: break-all;">
                {{reset_link}}
            </p>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 15px; line-height: 22px; color: #92400e;">
                    <strong>⚠️ Security Note:</strong> If you didn't request this password reset, please ignore this email or contact our support team if you have concerns.
                </p>
            </div>
            
            <p style="margin: 20px 0 0 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                Best regards,<br>
                <strong>The LinguaFlow Team</strong>
            </p>
      `
    ),
    placeholders: ['user_name', 'user_email', 'reset_link', 'app_name']
  },
  
  lesson_reminder: {
    name: 'Default Lesson Reminder',
    subject: 'Reminder: {{lesson_title}} with {{tutor_name}}',
    html_content: getStyledEmailTemplate(
      'Upcoming Lesson Reminder',
      `
            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                Hi {{student_name}},
            </p>
            
            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                This is a friendly reminder about your upcoming lesson with {{tutor_name}}.
            </p>
            
            <div style="background-color: #f0f9ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px;">📚 Lesson Details:</h3>
                <p style="margin: 0 0 10px 0; font-size: 15px; color: #4a5568;"><strong>Lesson:</strong> {{lesson_title}}</p>
                <p style="margin: 0 0 10px 0; font-size: 15px; color: #4a5568;"><strong>Date:</strong> {{lesson_date}}</p>
                <p style="margin: 0 0 10px 0; font-size: 15px; color: #4a5568;"><strong>Time:</strong> {{lesson_time}}</p>
                <p style="margin: 0; font-size: 15px; color: #4a5568;"><strong>Tutor:</strong> {{tutor_name}}</p>
            </div>
            
            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td align="center" style="padding: 20px 0;">
                        <a href="{{lesson_url}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                            View Lesson Materials
                        </a>
                    </td>
                </tr>
            </table>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 15px; line-height: 22px; color: #92400e;">
                    <strong>💡 Tip:</strong> Review your lesson materials beforehand to get the most out of your session!
                </p>
            </div>
            
            <p style="margin: 20px 0 0 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                Looking forward to your lesson!<br>
                <strong>The LinguaFlow Team</strong>
            </p>
      `
    ),
    placeholders: ['student_name', 'tutor_name', 'lesson_title', 'lesson_date', 'lesson_time', 'lesson_url', 'user_email']
  }
};

async function updateTemplates() {
  console.log('🔄 Updating email templates with styled content...\n');

  for (const [type, templateData] of Object.entries(templates)) {
    try {
      const { data, error} = await supabase
        .from('email_templates')
        .update({
          subject: templateData.subject,
          html_content: templateData.html_content,
          placeholders: templateData.placeholders,
          updated_at: new Date().toISOString()
        })
        .eq('type', type)
        .eq('is_active', true)
        .select();

      if (error) {
        console.error(`❌ Failed to update ${type} template:`, error.message);
      } else if (data && data.length > 0) {
        console.log(`✅ Updated ${type} template: ${templateData.name}`);
      } else {
        console.log(`⚠️  No template found for type: ${type}`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${type} template:`, error.message);
    }
  }

  console.log('\n🎉 Email template update complete!');
  console.log('\n📝 All templates now have:');
  console.log('   ✓ Consistent gradient header design');
  console.log('   ✓ Professional styling matching password reset');
  console.log('   ✓ Enhanced content with emojis and highlights');
  console.log('   ✓ Proper placeholder support');
}

updateTemplates();
