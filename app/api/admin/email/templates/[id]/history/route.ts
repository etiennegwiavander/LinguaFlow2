import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client lazily
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Check if user is admin
async function isAdminUser(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await getSupabaseClient().auth.getUser(token);
  
  if (error || !user) return false;
  
  // Check if user has admin role
  const { data: adminCheck } = await getSupabaseClient()
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

// GET /api/admin/email/templates/[id]/history - Get template version history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin permissions
    if (!(await isAdminUser(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First verify the template exists
    const { data: template, error: templateError } = await getSupabaseClient()
      .from('email_templates')
      .select('id, name, type')
      .eq('id', params.id)
      .single();
    
    if (templateError) {
      if (templateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      console.error('Error fetching template:', templateError);
      return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
    }
    
    // Get template history with user information
    const { data: history, error } = await getSupabaseClient()
      .from('email_template_history')
      .select(`
        *,
        created_by_user:created_by (
          email,
          raw_user_meta_data
        )
      `)
      .eq('template_id', params.id)
      .order('version', { ascending: false });
    
    if (error) {
      console.error('Error fetching template history:', error);
      return NextResponse.json({ error: 'Failed to fetch template history' }, { status: 500 });
    }
    
    // Format the response to include user information
    const formattedHistory = history?.map(item => ({
      id: item.id,
      templateId: item.template_id,
      version: item.version,
      subject: item.subject,
      htmlContent: item.html_content,
      textContent: item.text_content,
      placeholders: item.placeholders,
      createdAt: item.created_at,
      createdBy: {
        id: item.created_by,
        email: item.created_by_user?.email || 'Unknown',
        name: item.created_by_user?.raw_user_meta_data?.name || 'Unknown User'
      }
    })) || [];
    
    return NextResponse.json({ 
      template: {
        id: template.id,
        name: template.name,
        type: template.type
      },
      history: formattedHistory 
    });
  } catch (error) {
    console.error('Error in GET /api/admin/email/templates/[id]/history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/email/templates/[id]/history - Rollback to a specific version
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin permissions
    if (!(await isAdminUser(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { version } = body;
    
    if (!version || typeof version !== 'number') {
      return NextResponse.json({ 
        error: 'Version number is required' 
      }, { status: 400 });
    }
    
    // Get the historical version
    const { data: historicalVersion, error: historyError } = await getSupabaseClient()
      .from('email_template_history')
      .select('*')
      .eq('template_id', params.id)
      .eq('version', version)
      .single();
    
    if (historyError) {
      if (historyError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      }
      console.error('Error fetching historical version:', historyError);
      return NextResponse.json({ error: 'Failed to fetch historical version' }, { status: 500 });
    }
    
    // Get current user for the rollback
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user } } = await getSupabaseClient().auth.getUser(token!);
    
    // Update the current template with the historical version data
    // This will trigger the history creation via database trigger
    const { data: updatedTemplate, error: updateError } = await getSupabaseClient()
      .from('email_templates')
      .update({
        subject: historicalVersion.subject,
        html_content: historicalVersion.html_content,
        text_content: historicalVersion.text_content,
        placeholders: historicalVersion.placeholders,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error rolling back template:', updateError);
      return NextResponse.json({ error: 'Failed to rollback template' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: `Template rolled back to version ${version}`,
      template: updatedTemplate 
    });
  } catch (error) {
    console.error('Error in POST /api/admin/email/templates/[id]/history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}