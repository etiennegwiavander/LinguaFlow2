const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSupportEmail() {
  console.log('🧪 Testing Support Email Functionality\n');

  const testTicketData = {
    ticketId: 'test-' + Date.now(),
    userName: 'Test User',
    userEmail: 'test@example.com',
    subject: 'Test Support Ticket',
    message: 'This is a test message to verify email functionality.',
    impact: 'medium',
    attachmentCount: 0,
  };

  console.log('📧 Sending test email to:', 'linguaflowservices@gmail.com');
  console.log('📝 Ticket data:', testTicketData);

  try {
    // Test the API route
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('/v1', '')}/api/support/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ticketData: testTicketData }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('\n✅ Email sent successfully!');
      console.log('Response:', result);
    } else {
      console.log('\n❌ Email failed');
      console.log('Error:', result);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }

  console.log('\n📋 Note: Check your email inbox at linguaflowservices@gmail.com');
  console.log('If email is not received, you may need to configure SMTP settings in Supabase.');
}

testSupportEmail();
