import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  firstName?: string;
  lastName?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName }: WelcomeEmailRequest =
      await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const { createClient } = await import(
      "https://esm.sh/@supabase/supabase-js@2"
    );
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured - skipping email send");
      return new Response(
        JSON.stringify({
          success: true,
          message: `Welcome email skipped (no API key configured) for ${email}`,
          note: "Configure RESEND_API_KEY to enable email sending",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Fetch welcome email template from database
    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("type", "welcome")
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      console.error("Failed to fetch welcome email template:", templateError);
      // Fallback to hardcoded template
      const emailContent = generateTutorWelcomeEmail(
        firstName,
        lastName,
        email
      );

      // Send with fallback template
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "LinguaFlow <noreply@linguaflow.online>",
          to: [email],
          subject: emailContent.subject,
          html: emailContent.html,
        }),
      });

      if (!resendResponse.ok) {
        const errorData = await resendResponse.text();
        console.error("Resend API error:", errorData);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Welcome email sent to ${email} (using fallback template)`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Replace placeholders in template
    const displayName = firstName
      ? `${firstName}${lastName ? ` ${lastName}` : ""}`
      : "Tutor";

    const placeholders: Record<string, string> = {
      user_name: displayName,
      user_email: email,
      app_name: "LinguaFlow",
      login_url: "https://linguaflow.online/dashboard",
      dashboard_url: "https://linguaflow.online/dashboard",
      support_email: "support@linguaflow.online",
    };

    let subject = template.subject;
    let htmlContent = template.html_content;
    let textContent = template.text_content || "";

    // Replace all placeholders
    Object.entries(placeholders).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, "g"), value);
      htmlContent = htmlContent.replace(new RegExp(placeholder, "g"), value);
      textContent = textContent.replace(new RegExp(placeholder, "g"), value);
    });

    // Send email using Resend API with verified domain
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "LinguaFlow <noreply@linguaflow.online>",
        to: [email],
        subject: subject,
        html: htmlContent,
        text: textContent || undefined,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error("Resend API error:", errorData);

      // Don't throw error - just log it and return success
      // This prevents signup from failing due to email issues
      console.warn(`Email send failed but continuing: ${errorData}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: `Account created for ${email} (email notification pending)`,
          emailStatus: "failed",
          error: errorData,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const resendData = await resendResponse.json();
    console.log(`Welcome email sent to ${email}, Resend ID: ${resendData.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Welcome email sent to ${email}`,
        templateUsed: template.name,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to send welcome email",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

function generateTutorWelcomeEmail(
  firstName?: string,
  lastName?: string,
  email?: string
) {
  const displayName = firstName
    ? `${firstName}${lastName ? ` ${lastName}` : ""}`
    : "Tutor";

  return {
    subject: "Welcome to LinguaFlow!",
    html: generateTutorWelcomeHTML(displayName, email),
  };
}

function generateTutorWelcomeHTML(displayName: string, email?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to LinguaFlow</title>
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
                                Welcome to LinguaFlow!
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                                Hi ${displayName},
                            </p>
                            
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                                Welcome to <strong>LinguaFlow</strong>! We're thrilled to have you join our community of language tutors who are transforming education with AI-powered personalization.
                            </p>
                            
                            <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                                Your account is now active and ready to use. Click the button below to access your dashboard and start creating personalized lessons:
                            </p>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="https://linguaflow.online/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                            Access Your Dashboard
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 30px 0 20px 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                                <strong>What you can do with LinguaFlow:</strong>
                            </p>
                            
                            <ul style="margin: 0 0 30px 0; padding-left: 20px; color: #4a5568; font-size: 15px; line-height: 24px;">
                                <li style="margin-bottom: 10px;">Create AI-powered personalized lessons for your students</li>
                                <li style="margin-bottom: 10px;">Generate discussion topics and vocabulary flashcards</li>
                                <li style="margin-bottom: 10px;">Track student progress and adapt content in real-time</li>
                                <li style="margin-bottom: 10px;">Manage multiple students with individual learning profiles</li>
                            </ul>
                            
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                                If you have any questions or need help getting started, feel free to reply to this email. We're here to help!
                            </p>
                            
                            <p style="margin: 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                                Best regards,<br>
                                <strong>The LinguaFlow Team</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f7fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 10px 0; font-size: 14px; color: #718096;">
                                <strong>LinguaFlow</strong> - AI-Powered Language Teaching Platform
                            </p>
                            <p style="margin: 0; font-size: 13px; color: #a0aec0;">
                                This email was sent to ${email || "your email"}
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
}
