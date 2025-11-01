import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encryptPassword } from '@/lib/email-encryption';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Supabase client moved inside functions

// GET /api/admin/email/smtp-config - Retrieve all SMTP configurations
export async function GET(request: NextRequest) {
  // Create Supabase client inside the function
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabase.from('email_smtp_configs').select('*', { count: 'exact' });
    
    // Apply filters
    if (provider) {
      query = query.eq('provider', provider);
    }
    
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    
    const { data: configs, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    const totalPages = Math.ceil((count || 0) / limit);
    
    return NextResponse.json({
      success: true,
      data: configs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        provider,
        status
      }
    });
  } catch (error) {
    console.error('SMTP Config API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SMTP configurations' },
      { status: 500 }
    );
  }
}

// POST /api/admin/email/smtp-config - Create new SMTP configuration
export async function POST(request: NextRequest) {
  // Create Supabase client inside the function
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const configData = await request.json();
    
    // If this config should be active, deactivate all other configs first
    if (configData.is_active) {
      const { error: deactivateError } = await supabase
        .from('email_smtp_configs')
        .update({ is_active: false })
        .eq('is_active', true);
      
      if (deactivateError) {
        console.error('Error deactivating existing configs:', deactivateError);
        // Continue anyway - the constraint will handle it
      }
    }
    
    // Encrypt the password before storing
    const encryptedPassword = encryptPassword(configData.password);
    
    const { data: newConfig, error } = await supabase
      .from('email_smtp_configs')
      .insert({
        name: configData.name,
        provider: configData.provider,
        host: configData.host,
        port: configData.port,
        username: configData.username,
        password_encrypted: encryptedPassword,
        from_email: configData.from_email,
        from_name: configData.from_name,
        encryption: configData.encryption || 'tls',
        is_active: configData.is_active ?? true,
        is_default: configData.is_default ?? false,
        priority: configData.priority || 1
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      data: newConfig,
      message: 'SMTP configuration created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create SMTP config error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to create SMTP configuration',
        details: error?.details || error?.hint || undefined
      },
      { status: 500 }
    );
  }
}