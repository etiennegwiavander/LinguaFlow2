const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function diagnose() {
  console.log('=== PASSWORD RESET DIAGNOSTIC ===\n');
  
  // Check 1: Environment variables
  console.log('1. Checking environment variables...');
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasResendKey = !!process.env.RESEND_API_KEY;
  
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${hasSupabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${hasAnonKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   RESEND_API_KEY: ${hasResendKey ? '✅ Set' : '❌ Missing'}`);
  
  if (!hasSupabaseUrl || !hasAnonKey) {
    console.log('\n❌ Missing required Supabase credentials!');
    return;
  }
  
  // Check 2: Test Edge Function directly
  console.log('\n2. Testing Edge Function directly...');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    const { data, error } = await supabase.functions.invoke('send-integrated-email', {
      body: {
        smtpConfigId: 'test',
        templateId: 'test',
        recipientEmail: 'vanshidy@gmail.com',
        subject: 'Diagnostic Test',
        templateData: { test: true },
        htmlContent: '<p>Test</p>',
        textContent: 'Test'
      }
    });
    
    if (error) {
      console.log('   ❌ Edge Function error:', error.message);
      console.log('   Full error:', JSON.stringify(error, null, 2));
    } else {
      console.log('   ✅ Edge Function responded');
      console.log('   Response:', JSON.stringify(data, null, 2));
      
      if (data && data.resendId) {
        console.log('\n   🎉 EMAIL SENT! Check Resend dashboard');
      }
    }
  } catch (err) {
    console.log('   ❌ Exception:', err.message);
  }
  
  // Check 3: Recommendations
  console.log('\n3. Recommendations:');
  console.log('   - Check Supabase Edge Function logs in dashboard');
  console.log('   - Verify RESEND_API_KEY is set in Edge Function secrets');
  console.log('   - Check dev server terminal for errors');
  console.log('   - Verify Resend API key is valid at https://resend.com/api-keys');
}

diagnose();
