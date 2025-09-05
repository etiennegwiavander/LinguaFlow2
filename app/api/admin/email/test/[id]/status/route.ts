/**
 * Email Test Status Tracking API
 * Provides status updates for test email deliveries
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!;

interface TestStatusResponse {
  testId: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  recipientEmail: string;
  subject: string;
  sentAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
  errorCode?: string;
  retryAttempts?: number;
  metadata?: Record<string, any>;
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

// GET /api/admin/email/test/[id]/status - Get test email status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<TestStatusResponse | { error: string }>> {
  try {
    // Check admin permissions
    if (!(await isAdminUser(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testId = params.id;
    
    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get test email log
    const { data: testLog, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('id', testId)
      .eq('is_test', true)
      .single();
    
    if (error || !testLog) {
      console.error('Error fetching test log:', error);
      return NextResponse.json({ error: 'Test email not found' }, { status: 404 });
    }
    
    // Extract retry attempts from metadata
    const metadata = testLog.metadata || {};
    const retryAttempts = metadata.retry_attempt || 0;
    
    const response: TestStatusResponse = {
      testId: testLog.id,
      status: testLog.status,
      recipientEmail: testLog.recipient_email,
      subject: testLog.subject,
      sentAt: testLog.sent_at,
      deliveredAt: testLog.delivered_at,
      errorMessage: testLog.error_message,
      errorCode: testLog.error_code,
      retryAttempts,
      metadata
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/email/test/[id]/status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/email/test/[id]/status - Update test email status (for webhook callbacks)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<{ success: boolean; message?: string }>> {
  try {
    // Check admin permissions
    if (!(await isAdminUser(request))) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const testId = params.id;
    const body = await request.json();
    const { status, errorMessage, errorCode, deliveredAt } = body;
    
    if (!testId) {
      return NextResponse.json({ success: false, message: 'Test ID is required' }, { status: 400 });
    }
    
    if (!status || !['pending', 'sent', 'delivered', 'failed'].includes(status)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Valid status is required (pending, sent, delivered, failed)' 
      }, { status: 400 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify test email exists
    const { data: existingTest, error: fetchError } = await supabase
      .from('email_logs')
      .select('id, metadata')
      .eq('id', testId)
      .eq('is_test', true)
      .single();
    
    if (fetchError || !existingTest) {
      return NextResponse.json({ success: false, message: 'Test email not found' }, { status: 404 });
    }
    
    // Prepare update data
    const updateData: any = {
      status,
      metadata: {
        ...existingTest.metadata,
        status_updated_at: new Date().toISOString()
      }
    };
    
    if (errorMessage) {
      updateData.error_message = errorMessage;
    }
    
    if (errorCode) {
      updateData.error_code = errorCode;
    }
    
    if (deliveredAt) {
      updateData.delivered_at = deliveredAt;
    } else if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }
    
    // Update test email status
    const { error: updateError } = await supabase
      .from('email_logs')
      .update(updateData)
      .eq('id', testId);
    
    if (updateError) {
      console.error('Error updating test status:', updateError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to update test status' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test status updated successfully' 
    });
    
  } catch (error) {
    console.error('Unexpected error in PUT /api/admin/email/test/[id]/status:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}