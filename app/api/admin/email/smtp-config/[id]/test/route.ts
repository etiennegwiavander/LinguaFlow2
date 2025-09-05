/**
 * SMTP Configuration Testing API
 * Tests SMTP connection and authentication for specific configurations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptPassword } from '@/lib/email-encryption';
import { testSMTPConnection, sendTestEmail, isValidEmail } from '@/lib/smtp-tester';
import { SMTPConfig } from '@/lib/smtp-validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/admin/email/smtp-config/[id]/test - Test SMTP configuration
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { testType = 'connection', testEmail } = body;

    // Get SMTP configuration
    const { data: config, error: fetchError } = await supabase
      .from('email_smtp_configs')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !config) {
      return NextResponse.json(
        { error: 'SMTP configuration not found' },
        { status: 404 }
      );
    }

    // Decrypt password
    let decryptedPassword: string;
    try {
      decryptedPassword = decryptPassword(config.password_encrypted);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to decrypt SMTP password' },
        { status: 500 }
      );
    }

    // Prepare SMTP configuration for testing
    const smtpConfig: SMTPConfig = {
      provider: config.provider,
      host: config.host,
      port: config.port,
      username: config.username,
      password: decryptedPassword,
      encryption: config.encryption,
    };

    let testResult;
    let logMessage = '';

    if (testType === 'email' && testEmail) {
      // Validate test email parameters
      if (!testEmail.to || !isValidEmail(testEmail.to)) {
        return NextResponse.json(
          { error: 'Valid recipient email address is required' },
          { status: 400 }
        );
      }

      if (!testEmail.subject) {
        return NextResponse.json(
          { error: 'Email subject is required' },
          { status: 400 }
        );
      }

      // Send test email
      testResult = await sendTestEmail(smtpConfig, {
        to: testEmail.to,
        subject: testEmail.subject,
        html: testEmail.html,
        text: testEmail.text,
      });

      logMessage = `Test email sent to ${testEmail.to}`;

      // Log the test email
      await supabase
        .from('email_logs')
        .insert({
          template_type: 'smtp_test',
          recipient_email: testEmail.to,
          subject: testEmail.subject,
          status: testResult.success ? 'sent' : 'failed',
          error_message: testResult.success ? null : testResult.message,
          is_test: true,
          metadata: {
            smtp_config_id: id,
            test_type: 'email',
            test_details: testResult.details,
          },
        });

    } else {
      // Test connection only
      testResult = await testSMTPConnection(smtpConfig);
      logMessage = 'SMTP connection test';
    }

    // Update SMTP configuration with test results
    const testStatus = testResult.success ? 'success' : 'failed';
    await supabase
      .from('email_smtp_configs')
      .update({
        last_tested: new Date().toISOString(),
        test_status: testStatus,
      })
      .eq('id', id);

    // Log the test attempt
    await supabase
      .from('email_logs')
      .insert({
        template_type: 'smtp_connection_test',
        recipient_email: 'system@test',
        subject: logMessage,
        status: testResult.success ? 'sent' : 'failed',
        error_message: testResult.success ? null : testResult.message,
        is_test: true,
        metadata: {
          smtp_config_id: id,
          test_type: testType,
          test_details: testResult.details,
        },
      });

    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
      details: testResult.details,
      testType,
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/admin/email/smtp-config/[id]/test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}