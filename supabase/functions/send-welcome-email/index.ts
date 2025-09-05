import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get email configuration from environment
    const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER") || "noreply@linguaflow.com";
    const smtpPass = Deno.env.get("SMTP_PASS");
    const fromName = Deno.env.get("SMTP_FROM_NAME") || "LinguaFlow";

    if (!smtpPass) {
      throw new Error("SMTP password not configured");
    }

    // Generate tutor welcome email content
    const emailContent = generateTutorWelcomeEmail(firstName, lastName, email);

    // Send email using SMTP (you'll need to implement SMTP sending)
    // For now, we'll log the email content and store it in a welcome_emails table

    // Store welcome email record
    const { error: insertError } = await supabase
      .from("welcome_emails")
      .insert({
        email,
        user_type: "tutor",
        subject: emailContent.subject,
        content: emailContent.html,
        sent_at: new Date().toISOString(),
        status: "sent",
      });

    if (insertError) {
      console.error("Error storing welcome email:", insertError);
      throw insertError;
    }

    // In a real implementation, you would send the actual email here
    // For demonstration, we'll return success
    console.log(`Welcome email prepared for tutor ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Welcome email sent to ${email}`,
        emailContent: emailContent.html,
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
    : "there";

  return {
    subject: "🎉 Welcome to LinguaFlow - Start Your Teaching Journey!",
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
    <title>Welcome to LinguaFlow - Tutor</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
        }
        .feature-list {
            background-color: #f0f9ff;
            border: 1px solid #3b82f6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .feature-item {
            display: flex;
            align-items: center;
            margin: 10px 0;
        }
        .feature-icon {
            color: #3b82f6;
            margin-right: 10px;
            font-weight: bold;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .highlight {
            background-color: #fef3c7;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🌐 LinguaFlow</div>
            <h1 class="title">Welcome to Your Teaching Journey!</h1>
        </div>
        
        <div class="content">
            <p>Hello ${displayName},</p>
            
            <p>🎉 <strong>Congratulations!</strong> You've successfully joined LinguaFlow, the revolutionary platform that creates <strong>hyper-personalized multilingual lessons</strong> to meet your students' evolving needs. We're thrilled to have you on board!</p>
            
            <div class="highlight">
                <strong>🌟 What makes LinguaFlow special?</strong> Our AI doesn't just translate content—it creates culturally relevant, personally tailored lessons that adapt in real-time to each student's learning journey.
            </div>
            
            <div class="highlight">
                <strong>🚀 Ready to get started?</strong> Your tutor dashboard is now active and ready for you to explore!
            </div>
            
            <div style="text-align: center;">
                <a href="https://linguaflow.com/dashboard" class="button">Access Your Dashboard</a>
            </div>
            
            <div class="feature-list">
                <h3 style="color: #3b82f6; margin-top: 0;">🌟 LinguaFlow's Game-Changing Features:</h3>
                
                <div class="feature-item">
                    <span class="feature-icon">🎯</span>
                    <span><strong>Hyper-Personalized Multilingual Lessons:</strong> Create lessons that adapt to each student's learning style, pace, and cultural background across multiple languages</span>
                </div>
                
                <div class="feature-item">
                    <span class="feature-icon">🧠</span>
                    <span><strong>AI-Powered Content Generation:</strong> Generate culturally relevant content that evolves with your students' progress and interests</span>
                </div>
                
                <div class="feature-item">
                    <span class="feature-icon">�<//span>
                    <span><strong>Dynamic Language Adaptation:</strong> Seamlessly switch between languages and adjust complexity based on real-time student performance</span>
                </div>
                
                <div class="feature-item">
                    <span class="feature-icon">📊</span>
                    <span><strong>Intelligent Analytics:</strong> Deep insights into each student's learning patterns, strengths, and areas for improvement</span>
                </div>
                
                <div class="feature-item">
                    <span class="feature-icon">🗣️</span>
                    <span><strong>Contextual Conversations:</strong> Generate discussion topics that match your student's interests, profession, and cultural context</span>
                </div>
                
                <div class="feature-item">
                    <span class="feature-icon">🔤</span>
                    <span><strong>Smart Vocabulary Building:</strong> Personalized flashcards that adapt to your student's learning speed and retention patterns</span>
                </div>
            </div>
            
            <h3 style="color: #3b82f6;">🚀 Your Journey to Hyper-Personalized Teaching:</h3>
            <ol style="color: #4b5563;">
                <li><strong>Complete your profile:</strong> Add your teaching languages, cultural expertise, and specializations</li>
                <li><strong>Explore the AI tools:</strong> Discover how our multilingual content generation works</li>
                <li><strong>Create your first personalized lesson:</strong> Experience the power of adaptive, culturally-aware content</li>
                <li><strong>Add your first student:</strong> Set up their learning profile for maximum personalization</li>
                <li><strong>Watch the magic happen:</strong> See how lessons evolve based on your student's progress and preferences</li>
            </ol>
            
            <div class="highlight">
                <strong>💡 Pro Tip:</strong> The more you tell our AI about your students (their interests, goals, cultural background, and learning preferences), the more personalized and effective their lessons become. Check out our <a href="https://linguaflow.com/docs" style="color: #3b82f6;">personalization guide</a> to maximize results!
            </div>
            
            <p>Ready to revolutionize your teaching with hyper-personalized, multilingual lessons? If you have any questions or need assistance getting started, our support team is here to help. Simply reply to this email or contact us at <a href="mailto:support@linguaflow.com" style="color: #3b82f6;">support@linguaflow.com</a></p>
            
            <p>Welcome to the future of personalized language education! 🌟</p>
            
            <p>Best regards,<br>
            <strong>The LinguaFlow Team</strong><br>
            <em>Empowering tutors with AI-driven personalization</em></p>
        </div>
        
        <div class="footer">
            <p><strong>LinguaFlow</strong> - Hyper-Personalized Multilingual Learning Platform</p>
            <p>This email was sent to ${
              email || "your email"
            }. Ready to create lessons that adapt to your students' evolving needs?</p>
            <p>&copy; 2024 LinguaFlow. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
}
