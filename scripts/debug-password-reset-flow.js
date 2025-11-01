const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugPasswordResetFlow() {
  const testEmail = 'vanshidy@gmail.com';
  
  console.log('=== DEBUGGING PASSWORD RESET FLOW ===\n');
  
  // Step 1: Check if user exists
  console.log('Step 1: Checking if user exists...');
  const { data: user, error: userError } = await supabase
    .from('tutors')
    .select('id, email, first_name, last_name')
    .eq('email', testEmail)
    .maybeSingle();
  
  if (userError) {
    console.log('❌ User lookup error:', userError.message);
    return;
  }
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  console.log('✅ User found:', user.email);
  console.log('   Name:', user.first_name, user.last_name);
  console.log('   ID:', user.id);
  
  // Step 2: Test Edge Function directly with detailed logging
  console.log('\nStep 2: Testing Edge Function with detailed logging...');
  
  const resetUrl = 'http://localhost:3000/auth/reset-password?token=debug-test-123';
  
  try {
    const { data, error } = await supabase.functions.invoke('send-integrated-email', {
      body: {
        smtpConfigId: 'default',
        templateId: 'password-reset',
        recipientEmail: testEmail,
        subject: 'Reset Your LinguaFlow Password (Debug Test)',
        templateData: {
          templateType: 'password_reset',
          userName: user.first_name || 'User'
        },
        priority: 'high',
        userId: user.id,
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1>Password Reset Debug Test</h1>
            <p>Hi ${user.first_name || 'there'},</p>
            <p>This is a debug test email.</p>
            <p><a href="${resetUrl}">Reset Password</a></p>
          </body>
          </html>
        `,
        textContent: `Hi ${user.first_name || 'there'},\n\nThis is a debug test email.\n\nReset link: ${resetUrl}`
      }
    });

    if (error) {
      console.log('❌ Edge Function error:', error);
      console.log('   Message:', error.message);
      console.log('   Full error:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Edge Function response:', JSON.stringify(data, null, 2));
      
      if (data && data.success) {
        console.log('\n✅ Email should be sent!');
        console.log('   Resend ID:', data.resendId);
        console.log('   Check Resend dashboard: https://resend.com/emails');
      } else {
        console.log('\n⚠️  Edge Function returned success=false');
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
    console.log('   Stack:', err.stack);
  }
  
  // Step 3: Check Supabase Edge Function logs
  console.log('\n=== NEXT STEPS ===');
  console.log('1. Check your dev server terminal for Edge Function logs');
  console.log('2. Check Supabase dashboard logs:');
  console.log('   https://supabase.com/dashboard/project/YOUR_PROJECT/logs/edge-functions');
  console.log('3. Verify RESEND_API_KEY is set in Edge Function secrets');
  console.log('4. Check Resend dashboard: https://resend.com/emails');
}

debugPasswordResetFlow();
