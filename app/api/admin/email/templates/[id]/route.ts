import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Supabase client moved inside functions

// GET /api/admin/email/templates/[id] - Get single template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Create Supabase client inside the function
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Template not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ 
      success: true,
      data: template 
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/email/templates/[id] - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Create Supabase client inside the function
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const templateData = await request.json();
    
    const { data: updatedTemplate, error } = await supabase
      .from('email_templates')
      .update({
        name: templateData.name,
        type: templateData.type,
        subject: templateData.subject,
        html_content: templateData.html_content,
        text_content: templateData.text_content,
        placeholders: JSON.stringify(templateData.placeholders || []),
        is_active: templateData.is_active ?? true,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      data: updatedTemplate,
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Update template error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/email/templates/[id] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Create Supabase client inside the function
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', params.id);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
