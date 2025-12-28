require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const newWelcomeEmailHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Welcome to Your Teaching Journey!</title></head><body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><!-- Header with gradient --><tr><td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 60px 40px; text-align: center;"><h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600; letter-spacing: -0.5px;">Welcome to Your Teaching Journey!</h1></td></tr><!-- Content --><tr><td style="padding: 40px;"><p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #4a5568;">Hi {{user_name}},</p><p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #4a5568;">🎉 <strong>Congratulations!</strong> You've successfully joined LinguaFlow, the revolutionary platform that creates <strong>hyper-personalized multilingual lessons</strong> to meet your students' evolving needs. We're thrilled to have you on board!</p><div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;"><p style="margin: 0; font-size: 15px; line-height: 22px; color: #92400e;"><strong>🌟 What makes LinguaFlow special?</strong> Our AI doesn't just translate content—it creates culturally relevant, personally tailored lessons that adapt in real-time to each student's learning journey.</p></div><p style="margin: 20px 0; font-size: 16px; line-height: 24px; color: #4a5568;">Your tutor dashboard is now active and ready for you to explore!</p><!-- CTA Button --><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding: 20px 0;"><a href="https://linguaflow.online/auth/login" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: 600; font-size: 16px;">Access Your Dashboard</a></td></tr></table><div style="background-color: #f0f9ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 30px 0;"><h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px;">🌟 LinguaFlow's Game-Changing Features:</h3><ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 15px; line-height: 24px;"><li style="margin-bottom: 10px;"><strong>Hyper-Personalized Multilingual Lessons:</strong> Create lessons that adapt to each student's learning style, pace, and cultural background</li><li style="margin-bottom: 10px;"><strong>AI-Powered Content Generation:</strong> Generate culturally relevant content that evolves with your students' progress</li><li style="margin-bottom: 10px;"><strong>Dynamic Language Adaptation:</strong> Seamlessly switch between languages and adjust complexity in real-time</li><li style="margin-bottom: 10px;"><strong>Intelligent Analytics:</strong> Deep insights into each student's learning patterns and progress</li><li style="margin-bottom: 10px;"><strong>Contextual Conversations:</strong> Generate discussion topics that match your student's interests and profession</li><li style="margin-bottom: 10px;"><strong>Smart Vocabulary Building:</strong> Personalized flashcards that adapt to learning speed and retention</li></ul></div><h3 style="color: #1e40af; font-size: 18px; margin: 30px 0 15px 0;">🚀 Your Journey to Hyper-Personalized Teaching:</h3><ol style="margin: 0 0 20px 0; padding-left: 20px; color: #4a5568; font-size: 15px; line-height: 24px;"><li style="margin-bottom: 10px;"><strong>Complete your profile:</strong> Add your teaching languages, cultural expertise, and specializations</li><li style="margin-bottom: 10px;"><strong>Explore the AI tools:</strong> Discover how our multilingual content generation works</li><li style="margin-bottom: 10px;"><strong>Create your first personalized lesson:</strong> Experience the power of adaptive, culturally-aware content</li><li style="margin-bottom: 10px;"><strong>Add your first student:</strong> Set up their learning profile for maximum personalization</li><li style="margin-bottom: 10px;"><strong>Watch the magic happen:</strong> See how lessons evolve based on your student's progress</li></ol><div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;"><p style="margin: 0; font-size: 15px; line-height: 22px; color: #92400e;"><strong>💡 Pro Tip:</strong> The more you tell our AI about your students (their interests, goals, cultural background, and learning preferences), the more personalized and effective their lessons become!</p></div><p style="margin: 20px 0; font-size: 16px; line-height: 24px; color: #4a5568;">Ready to revolutionize your teaching with hyper-personalized, multilingual lessons? If you have any questions, our support team is here to help at <a href="mailto:support@linguaflow.online" style="color: #3b82f6; text-decoration: none;">support@linguaflow.online</a></p><p style="margin: 20px 0 0 0; font-size: 16px; line-height: 24px; color: #4a5568;">Welcome to the future of personalized language education! 🌟</p><p style="margin: 20px 0 0 0; font-size: 16px; line-height: 24px; color: #4a5568;">Best regards,<br><strong>The LinguaFlow Team</strong><br><em style="color: #718096;">Empowering tutors with AI-driven personalization</em></p></td></tr><!-- Footer --><tr><td style="background-color: #f7fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;"><p style="margin: 0 0 10px 0; font-size: 14px; color: #718096;"><strong>LinguaFlow</strong> - AI-Powered Language Teaching Platform</p><p style="margin: 0; font-size: 13px; color: #a0aec0;">This email was sent to {{user_email}}</p><p style="margin: 10px 0 0 0; font-size: 13px; color: #a0aec0;">© 2025 LinguaFlow. All rights reserved.</p></td></tr></table></td></tr></table></body></html>`;

async function updateWelcomeEmailTemplate() {
  console.log('🔄 Updating Welcome Email Template...');
  console.log('='.repeat(80));

  try {
    // First, find the welcome email template
    const { data: templates, error: fetchError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('type', 'welcome')
      .eq('is_active', true);

    if (fetchError) {
      console.error('❌ Error fetching templates:', fetchError.message);
      return;
    }

    if (!templates || templates.length === 0) {
      console.log('❌ No active welcome email template found');
      console.log('   Creating a new one...');
      
      // Create new template
      const { data: newTemplate, error: createError } = await supabase
        .from('email_templates')
        .insert({
          name: 'Welcome Email - Updated',
          type: 'welcome',
          subject: 'Welcome to Your Teaching Journey! 🌟',
          html_content: newWelcomeEmailHTML,
          text_content: 'Welcome to LinguaFlow! Your account has been created successfully.',
          is_active: true,
          placeholders: ['{{user_name}}', '{{user_email}}'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating template:', createError.message);
        return;
      }

      console.log('✅ New welcome email template created!');
      console.log(`   Template ID: ${newTemplate.id}`);
      console.log(`   Template Name: ${newTemplate.name}`);
      return;
    }

    const template = templates[0];
    console.log(`📧 Found welcome email template: ${template.name}`);
    console.log(`   Template ID: ${template.id}`);
    console.log(`   Current Subject: ${template.subject}`);

    // Update the template
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('email_templates')
      .update({
        subject: 'Welcome to Your Teaching Journey! 🌟',
        html_content: newWelcomeEmailHTML,
        text_content: 'Welcome to LinguaFlow! Your account has been created successfully. Visit https://linguaflow.online/auth/login to access your dashboard.',
        updated_at: new Date().toISOString(),
        placeholders: ['{{user_name}}', '{{user_email}}']
      })
      .eq('id', template.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating template:', updateError.message);
      console.error('   Details:', updateError);
      return;
    }

    console.log('\n✅ Welcome email template updated successfully!');
    console.log(`   Template ID: ${updatedTemplate.id}`);
    console.log(`   New Subject: ${updatedTemplate.subject}`);
    console.log(`   HTML Content Length: ${updatedTemplate.html_content.length} characters`);
    console.log(`   Last Updated: ${updatedTemplate.updated_at}`);

    console.log('\n📋 Template Features:');
    console.log('   ✅ Professional gradient header');
    console.log('   ✅ Comprehensive feature list');
    console.log('   ✅ Step-by-step onboarding guide');
    console.log('   ✅ Call-to-action button');
    console.log('   ✅ Support contact information');
    console.log('   ✅ Branded footer');
    console.log('   ✅ Mobile-responsive design');

    console.log('\n🎉 New users will now receive the updated welcome email!');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    console.error(error.stack);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Update complete!\n');
}

updateWelcomeEmailTemplate().catch(console.error);
