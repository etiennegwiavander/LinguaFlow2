import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log('🔵 Password reset API called');
  console.log('🔵 Environment check:', {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY),
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
  });
  
  try {
    // Support both environment variable names (dev vs production)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
      console.error('❌ No service role key found in environment');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    // Create admin client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Create regular client for Edge Function calls
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );
    
    console.log('🔵 Supabase clients created successfully');

    const { email } = await request.json();
    console.log('🔵 Email received:', email ? 'Yes' : 'No');
    console.log('📧 Email received:', email);

    if (!email) {
      console.log('❌ No email provided');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists using admin client (bypasses RLS)
    console.log('🔍 Looking up user in database with admin client...');
    const { data: user, error: userError } = await supabaseAdmin
      .from('tutors')
      .select('id, email, first_name, last_name')
      .eq('email', email)
      .maybeSingle();
    
    console.log('👤 User lookup result:', { found: !!user, error: userError?.message });

    if (userError) {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (!user) {
      // Don't reveal if user exists or not for security
      console.log('⚠️  User not found, returning success anyway (security)');
      return NextResponse.json(
        { success: true, message: 'If an account with that email exists, a reset link has been sent.' }
      );
    }

    console.log('✅ User found, generating reset token...');
    
    // Generate secure reset token
    const resetToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in database
    console.log('💾 Storing reset token in database...');
    const { error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .upsert({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (tokenError) {
      console.error('❌ Error storing reset token:', tokenError);
      return NextResponse.json(
        { error: 'Failed to generate reset token' },
        { status: 500 }
      );
    }

    console.log('✅ Token stored, preparing to send email...');
    
    // Send password reset email directly via Resend Edge Function
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password-simple?token=${resetToken}`;
    
    console.log('📨 Calling Edge Function to send email...');
    console.log('🔗 Reset URL:', resetUrl);
    const { data, error: emailError } = await supabase.functions.invoke('send-integrated-email', {
      body: {
        smtpConfigId: 'default',
        templateId: 'password-reset',
        recipientEmail: email,
        subject: 'Reset Your LinguaFlow Password',
        templateData: {
          templateType: 'password_reset',
          userName: user.first_name || 'User'
        },
        priority: 'high',
        userId: user.id,
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
              <p>Hi ${user.first_name || 'there'},</p>
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
                Need help? Contact us at ${process.env.SUPPORT_EMAIL || 'support@linguaflow.com'}
              </p>
            </div>
          </body>
          </html>
        `,
        text: `Hi ${user.first_name || 'there'},\n\nWe received a request to reset your password for your LinguaFlow account.\n\nClick this link to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, you can safely ignore this email.\n\nNeed help? Contact us at ${process.env.SUPPORT_EMAIL || 'support@linguaflow.com'}`
      }
    });

    if (emailError) {
      console.error('❌ Failed to send password reset email:', emailError);
      console.error('❌ Error details:', JSON.stringify(emailError, null, 2));
      return NextResponse.json(
        { error: 'Failed to send reset email' },
        { status: 500 }
      );
    }

    console.log('✅ Edge Function response:', data);
    console.log('🎉 Password reset email sent successfully!');
    
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.'
    });

  } catch (error: any) {
    console.error('❌ Password reset error:', error);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Stack trace:', error?.stack);
    
    // Ensure we always return valid JSON
    try {
      return NextResponse.json(
        { 
          error: 'Internal server error',
          details: error?.message || 'Unknown error'
        },
        { status: 500 }
      );
    } catch (jsonError) {
      console.error('❌ Failed to return JSON response:', jsonError);
      // Fallback to plain text response
      return new NextResponse('Internal server error', { status: 500 });
    }
  }
}