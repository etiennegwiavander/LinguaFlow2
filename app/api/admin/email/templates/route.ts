import { NextRequest, NextResponse } from 'next/server';
import { generateMockEmailTemplates, getMockTemplatesWithFilters, createMockTemplate } from '@/lib/mock-data';

// GET /api/admin/email/templates - List all templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const active = searchParams.get('active');
    const search = searchParams.get('search');
    
    // Get filtered templates using mock data service
    const templates = getMockTemplatesWithFilters({
      type: type || undefined,
      active: active ? active === 'true' : undefined,
      search: search || undefined
    });
    
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error in GET /api/admin/email/templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/email/templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, name, subject, html_content, text_content, is_active } = body;
    
    // Validate required fields
    if (!type || !name || !subject || !html_content) {
      return NextResponse.json({ 
        error: 'Missing required fields: type, name, subject, html_content' 
      }, { status: 400 });
    }
    
    // Create template using mock data service
    const template = createMockTemplate({
      type,
      name,
      subject,
      html_content,
      text_content,
      is_active
    });
    
    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/email/templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}