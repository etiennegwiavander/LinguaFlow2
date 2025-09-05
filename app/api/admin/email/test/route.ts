/**
 * Email Testing API
 * Handles sending test emails and tracking their status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptPassword } from '@/lib/email-encryption';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!;

interface TestEmailRequest {
  templateId: string;
  recipientEmail: string;
  testParameters: Record<string, any>;
}

interface TestEmailResponse {
  testId: string;
  status: 'pending' | 'sent' | 'failed';
  message?: string;
  previewHtml?: string;
}

// Check if user is admin
async function isAdminUser(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) return false;
  
  // Check if user has admin role
  const { data: adminCheck } = await supabase
    .from('email_settings')
    .select('setting_value')
    .eq('setting_key', 'admin_emails')
    .single();
  
  if (adminCheck?.setting_value) {
    const adminEmails = JSON.parse(adminCheck.setting_value as string);
    return adminEmails.includes(user.email);
  }
  
  return false;
}

// Generate email content with parameter substitution
function generateEmailContent(template: any, parameters: Record<string, any>): { subject: string; htmlContent: string; textContent: string } {
  let subject = template.subject;
  let htmlContent = template.html_content;
  let textContent = template.text_content || '';
  
  // Replace placeholders with actual values
  Object.entries(parameters).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    const stringValue = String(value);
    
    subject = subject.replace(new RegExp(placeholder, 'g'), stringValue);
    htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), stringValue);
    textContent = textContent.replace(new RegExp(placeholder, 'g'), stringValue);
  });
  
  return { subject, htmlContent, textContent };
}

// Send email using Supabase Edge Function
async function sendTestEmail(
  smtpConfig: any,
  recipientEmail: string,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Decrypt SMTP password
    const decryptedPassword = decryptPassword(smtpConfig.password_encrypted);
    
    // Call Supabase Edge Function for email sending
    const { data, error } = await supabase.functions.invoke('send-test-email', {
      body: {
        smtpConfig: {
          ...smtpConfig,
          password: decryptedPassword
        },
        email: {
          to: recipientEmail,
          subject,
          html: htmlContent,
          text: textContent
        }
      }
    });
    
    if (error) {
      console.error('Edge function error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending test email:', error);
    return { success: false, error: 'Failed to send test email' };
  }
}

// Retry logic for failed test deliveries
async function retryTestEmail(testId: string, maxRetries: number = 3): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Get retry settings
  const { data: retrySettings } = await supabase
    .from('email_settings')
    .select('setting_value')
    .eq('setting_key', 'retry_delay_minutes')
    .single();
  
  const retryDelayMinutes = retrySettings?.setting_value ? parseInt(retrySettings.setting_value as string) : 5;
  
  // Implement exponential backoff
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const delay = retryDelayMinutes * Math.pow(2, attempt - 1) * 60 * 1000; // Convert to milliseconds
    
    setTimeout(async () => {
      // Get test email details
      const { data: testEmail } = await supabase
        .from('email_logs')
        .select('*')
        .eq('id', testId)
        .single();
      
      if (!testEmail || testEmail.status === 'sent') return;
      
      // Retry sending logic would go here
      // For now, just update the status to indicate retry attempt
      await supabase
        .from('email_logs')
        .update({
          status: 'pending',
          metadata: {
            ...testEmail.metadata,
            retry_attempt: attempt,
            last_retry_at: new Date().toISOString()
          }
        })
        .eq('id', testId);
    }, delay);
  }
}

// POST /api/admin/email/test - Send test email
export async function POST(request: NextRequest): Promise<NextResponse<TestEmailResponse>> {
  try {
    // Check admin permissions
    if (!(await isAdminUser(request))) {
      return NextResponse.json({ 
        testId: '', 
        status: 'failed', 
        message: 'Unauthorized' 
      } as TestEmailResponse, { status: 401 });
    }

    const body: TestEmailRequest = await request.json();
    const { templateId, recipientEmail, testParameters } = body;
    
    // Validate required fields
    if (!templateId || !recipientEmail || !testParameters) {
      return NextResponse.json({
        testId: '',
        status: 'failed',
        message: 'Missing required fields: templateId, recipientEmail, testParameters'
      } as TestEmailResponse, { status: 400 });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json({
        testId: '',
        status: 'failed',
        message: 'Invalid email format'
      } as TestEmailResponse, { status: 400 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get email template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single();
    
    if (templateError || !template) {
      return NextResponse.json({
        testId: '',
        status: 'failed',
        message: 'Template not found'
      } as TestEmailResponse, { status: 404 });
    }
    
    // Get active SMTP configuration
    const { data: smtpConfig, error: smtpError } = await supabase
      .from('email_smtp_configs')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (smtpError || !smtpConfig) {
      return NextResponse.json({
        testId: '',
        status: 'failed',
        message: 'No active SMTP configuration found'
      } as TestEmailResponse, { status: 400 });
    }
    
    // Generate email content with parameter substitution
    const { subject, htmlContent, textContent } = generateEmailContent(template, testParameters);
    
    // Create test email log entry
    const { data: testLog, error: logError } = await supabase
      .from('email_logs')
      .insert({
        template_id: templateId,
        template_type: template.type,
        recipient_email: recipientEmail,
        subject,
        status: 'pending',
        is_test: true,
        metadata: {
          test_parameters: testParameters,
          smtp_config_id: smtpConfig.id,
          created_at: new Date().toISOString()
        }
      })
      .select('id')
      .single();
    
    if (logError || !testLog) {
      console.error('Error creating test log:', logError);
      return NextResponse.json({
        testId: '',
        status: 'failed',
        message: 'Failed to create test log'
      } as TestEmailResponse, { status: 500 });
    }
    
    const testId = testLog.id;
    
    // Send test email
    const sendResult = await sendTestEmail(
      smtpConfig,
      recipientEmail,
      subject,
      htmlContent,
      textContent
    );
    
    // Update test log with result
    const updateData = sendResult.success 
      ? { 
          status: 'sent' as const,
          metadata: {
            test_parameters: testParameters,
            smtp_config_id: smtpConfig.id,
            sent_at: new Date().toISOString()
          }
        }
      : { 
          status: 'failed' as const,
          error_message: sendResult.error,
          metadata: {
            test_parameters: testParameters,
            smtp_config_id: smtpConfig.id,
            error_at: new Date().toISOString()
          }
        };
    
    await supabase
      .from('email_logs')
      .update(updateData)
      .eq('id', testId);
    
    // If failed, schedule retry
    if (!sendResult.success) {
      retryTestEmail(testId);
    }
    
    return NextResponse.json({
      testId,
      status: sendResult.success ? 'sent' : 'failed',
      message: sendResult.success ? 'Test email sent successfully' : sendResult.error,
      previewHtml: htmlContent
    } as TestEmailResponse, { status: sendResult.success ? 200 : 500 });
    
  } catch (error) {
    console.error('Unexpected error in POST /api/admin/email/test:', error);
    return NextResponse.json({
      testId: '',
      status: 'failed',
      message: 'Internal server error'
    } as TestEmailResponse, { status: 500 });
  }
}