// Test Resend SMTP connection
async function testResendSMTP() {
  console.log('Testing Resend SMTP connection...\n');
  
  // Dynamic import for ES module
  const nodemailer = await import('nodemailer');
  
  const transporter = nodemailer.default.createTransporter({
    host: 'smtp.resend.com',
    port: 465,
    secure: true, // use SSL
    auth: {
      user: 'resend',
      pass: process.env.RESEND_API_KEY || 'your-api-key-here'
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000
  });

  try {
    console.log('Attempting to verify connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:');
    console.error('Error:', error.message);
    console.error('\nDetails:', error);
    return false;
  }
}

testResendSMTP();
