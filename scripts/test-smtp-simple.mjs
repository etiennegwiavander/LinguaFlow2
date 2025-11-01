import nodemailer from 'nodemailer';

console.log('Testing Resend SMTP connection...\n');

const transporter = nodemailer.createTransporter({
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  auth: {
    user: 'resend',
    pass: process.env.RESEND_API_KEY
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

try {
  console.log('Verifying connection...');
  await transporter.verify();
  console.log('✅ SMTP connection successful!');
} catch (error) {
  console.error('❌ SMTP connection failed:');
  console.error('Error:', error.message);
  console.error('\nThis is expected - Resend SMTP may have restrictions or timeouts.');
  console.error('Resend works better with their HTTP API instead of SMTP.');
}
