import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/email/templates - List all templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabase.from('email_templates').select('*', { count: 'exact' });
    
    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,subject.ilike.%${search}%`);
    }
    
    if (type) {
      query = query.eq('type', type);
    }
    
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    
    const { data: templates, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    const totalPages = Math.ceil((count || 0) / limit);
    
    return NextResponse.json({
      success: true,
      data: templates || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        search,
        type,
        status
      }
    });
  } catch (error) {
    console.error('Templates API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/admin/email/templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const templateData = await request.json();
    
    const { data: newTemplate, error } = await supabase
      .from('email_templates')
      .insert({
        name: templateData.name,
        type: templateData.type,
        subject: templateData.subject,
        html_content: templateData.html_content,
        text_content: templateData.text_content,
        placeholders: JSON.stringify(templateData.placeholders || []),
        is_active: templateData.is_active ?? true,
        is_default: templateData.is_default ?? false
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      data: newTemplate,
      message: 'Template created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create template' },
      { status: 500 }
    );
  }
}