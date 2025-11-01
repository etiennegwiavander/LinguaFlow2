const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testPasswordResetEmail() {
  const testEmail = "vanshidy@gmail.com";
  const testName = "Test User";
  const resetUrl = "http://localhost:3000/auth/reset-password?token=test123";

  console.log("Testing password reset email via Edge Function...\n");
  console.log(`Sending to: ${testEmail}\n`);

  try {
    const { data, error } = await supabase.functions.invoke(
      "send-integrated-email",
      {
        body: {
          smtpConfigId: "default",
          templateId: "password-reset",
          recipientEmail: testEmail,
          subject: "Reset Your LinguaFlow Password",
          templateData: {
            templateType: "password_reset",
            userName: testName,
          },
          priority: "high",
          htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Reset Your Password</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Hi ${testName},</p>
              <p>We received a request to reset your password for your LinguaFlow account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="background: white; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="font-size: 12px; color: #666;">
                Need help? Contact us at support@linguaflow.com
              </p>
            </div>
          </body>
          </html>
        `,
          textContent: `Hi ${testName},\n\nWe received a request to reset your password for your LinguaFlow account.\n\nClick this link to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, you can safely ignore this email.\n\nNeed help? Contact us at support@linguaflow.com`,
        },
      }
    );

    if (error) {
      console.log("❌ ERROR:", error.message);
      console.log("Full error:", JSON.stringify(error, null, 2));
    } else {
      console.log("✅ SUCCESS!");
      console.log("Response:", JSON.stringify(data, null, 2));
      console.log("\nCheck your email at:", testEmail);
      console.log("Check Resend dashboard: https://resend.com/emails");
    }
  } catch (error) {
    console.error("❌ EXCEPTION:", error.message);
  }
}

testPasswordResetEmail();
