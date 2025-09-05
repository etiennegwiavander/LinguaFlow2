import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/email/templates/[id] - Get specific template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Return mock template data based on ID
    const mockTemplates: Record<string, any> = {
      'welcome-001': {
        id: 'welcome-001',
        type: 'welcome',
        name: 'Welcome Email Template',
        subject: 'Welcome to {{app_name}}!',
        html_content: '<html><body><h1>Welcome {{user_name}}!</h1><p>Thank you for joining {{app_name}}.</p></body></html>',
        text_content: 'Welcome {{user_name}}! Thank you for joining {{app_name}}.',
        placeholders: ['user_name', 'app_name', 'user_email'],
        is_active: true,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      'reminder-001': {
        id: 'reminder-001',
        type: 'lesson_reminder',
        name: 'Lesson Reminder Template',
        subject: 'Your lesson with {{tutor_name}} starts in 15 minutes',
        html_content: '<html><body><h2>Lesson Reminder</h2><p>Hi {{student_name}}, your lesson starts in 15 minutes!</p></body></html>',
        text_content: 'Hi {{student_name}}, your lesson with {{tutor_name}} starts in 15 minutes!',
        placeholders: ['student_name', 'tutor_name', 'lesson_time'],
        is_active: true,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };

    const template = mockTemplates[params.id];
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error in GET /api/admin/email/templates/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/email/templates/[id] - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, subject, htmlContent, textContent, placeholders, isActive } = body;
    
    // Return mock updated template
    const updatedTemplate = {
      id: params.id,
      type: 'welcome', // Mock type
      name: name || 'Updated Template',
      subject: subject || 'Updated Subject',
      html_content: htmlContent || '<html><body>Updated content</body></html>',
      text_content: textContent || 'Updated text content',
      placeholders: Array.isArray(placeholders) ? placeholders : [],
      is_active: isActive !== undefined ? isActive : true,
      version: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return NextResponse.json({ template: updatedTemplate });
  } catch (error) {
    console.error('Error in PUT /api/admin/email/templates/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/email/templates/[id] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Return mock success response
    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/email/templates/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}