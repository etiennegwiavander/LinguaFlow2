import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Check if user is admin
async function isAdminUser(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  
  const token = authHeader.replace('Bearer ', '');
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

// Simple placeholder replacement function
function replacePlaceholders(content: string, data: Record<string, any>): string {
  let result = content;
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  result = result.replace(placeholderRegex, (match, placeholder) => {
    const key = placeholder.trim();
    return data[key] !== undefined && data[key] !== null ? String(data[key]) : match;
  });
  return result;
}

// Simple sample data generator
function getSampleData(templateType: string): Record<string, any> {
  const baseData = {
    user_name: 'John Doe',
    user_email: 'john.doe@example.com',
    platform_name: 'LinguaFlow',
    support_email: 'support@linguaflow.com',
  };
  
  switch (templateType) {
    case 'welcome':
      return {
        ...baseData,
        login_url: 'https://app.linguaflow.com/login',
      };
    case 'lesson_reminder':
      return {
        ...baseData,
        lesson_title: 'Advanced English Conversation',
        lesson_date: 'March 15, 2024',
        lesson_time: '2:00 PM EST',
      };
    case 'password_reset':
      return {
        ...baseData,
        reset_url: 'https://app.linguaflow.com/reset-password?token=abc123',
        expiry_time: '24 hours',
      };
    default:
      return baseData;
  }
}

// GET /api/admin/email/templates/[id]/preview - Get preview with default sample data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin permissions
    if (!(await isAdminUser(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (templateError) {
      if (templateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      console.error('Error fetching template:', templateError);
      return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
    }
    
    // Generate sample data based on template type
    const sampleData = getSampleData(template.type);
    
    // Generate preview content
    const previewSubject = replacePlaceholders(template.subject, sampleData);
    const previewHtmlContent = replacePlaceholders(template.html_content, sampleData);
    const previewTextContent = template.text_content 
      ? replacePlaceholders(template.text_content, sampleData)
      : null;
    
    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        type: template.type,
        placeholders: template.placeholders
      },
      preview: {
        subject: previewSubject,
        htmlContent: previewHtmlContent,
        textContent: previewTextContent
      },
      sampleData,
      unresolvedPlaceholders: [],
      warnings: []
    });
  } catch (error) {
    console.error('Error in GET /api/admin/email/templates/[id]/preview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/email/templates/[id]/preview - Generate preview with custom test parameters
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
    const { testParameters } = body;

    if (!testParameters || typeof testParameters !== 'object') {
      return NextResponse.json({ error: 'Test parameters are required' }, { status: 400 });
    }

    // Get the template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (templateError) {
      if (templateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      console.error('Error fetching template:', templateError);
      return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
    }
    
    // Generate preview content with test parameters
    const subject = replacePlaceholders(template.subject, testParameters);
    const htmlContent = replacePlaceholders(template.html_content, testParameters);
    const textContent = template.text_content 
      ? replacePlaceholders(template.text_content, testParameters)
      : '';
    
    return NextResponse.json({
      subject,
      htmlContent,
      textContent
    });
  } catch (error) {
    console.error('Error in POST /api/admin/email/templates/[id]/preview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}