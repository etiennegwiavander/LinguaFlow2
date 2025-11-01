/**
 * Individual SMTP Configuration Management API
 * Handles update and delete operations for specific SMTP configurations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encryptPassword, decryptPassword } from '@/lib/email-encryption';
import { validateSMTPConfig, SMTPConfig } from '@/lib/smtp-validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// PUT /api/admin/email/smtp-config/[id] - Update SMTP configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // TODO: Add proper admin authentication check
    // For now, we're using service role key which bypasses RLS

    const { id } = params;
    const body = await request.json();
    const { provider, host, port, username, password, encryption, is_active } = body;

    // Validate required fields
    if (!provider || !host || !port || !username || !encryption) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get existing configuration to check if password is being updated
    const { data: existingConfig, error: fetchError } = await supabase
      .from('email_smtp_configs')
      .select('password_encrypted')
      .eq('id', id)
      .single();

    if (fetchError || !existingConfig) {
      return NextResponse.json(
        { error: 'SMTP configuration not found' },
        { status: 404 }
      );
    }

    // Determine password to use
    let passwordToUse = existingConfig.password_encrypted;
    if (password && password !== '***HIDDEN***') {
      // Validate new configuration with new password
      const config: SMTPConfig = { provider, host, port, username, password, encryption };
      const validation = validateSMTPConfig(config);
      
      if (!validation.isValid) {
        return NextResponse.json(
          { 
            error: 'Invalid SMTP configuration',
            details: validation.errors,
            warnings: validation.warnings
          },
          { status: 400 }
        );
      }

      passwordToUse = encryptPassword(password);
    } else {
      // Validate configuration with existing password
      try {
        const existingPassword = decryptPassword(existingConfig.password_encrypted);
        const config: SMTPConfig = { provider, host, port, username, password: existingPassword, encryption };
        const validation = validateSMTPConfig(config);
        
        if (!validation.isValid) {
          return NextResponse.json(
            { 
              error: 'Invalid SMTP configuration',
              details: validation.errors,
              warnings: validation.warnings
            },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to validate existing password' },
          { status: 500 }
        );
      }
    }

    // If this is being set as active, deactivate other configs
    if (is_active === true) {
      await supabase
        .from('email_smtp_configs')
        .update({ is_active: false })
        .neq('id', id);
    }

    // Update configuration
    const { data: updatedConfig, error } = await supabase
      .from('email_smtp_configs')
      .update({
        provider,
        host,
        port: parseInt(port),
        username,
        password_encrypted: passwordToUse,
        encryption,
        is_active: is_active === true,
        // Reset test status when configuration changes
        test_status: null,
        last_tested: null,
      })
      .eq('id', id)
      .select(`
        id,
        provider,
        host,
        port,
        username,
        encryption,
        is_active,
        last_tested,
        test_status,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error updating SMTP config:', error);
      return NextResponse.json(
        { error: 'Failed to update SMTP configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({ config: updatedConfig });

  } catch (error) {
    console.error('Unexpected error in PUT /api/admin/email/smtp-config/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/email/smtp-config/[id] - Delete SMTP configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // TODO: Add proper admin authentication check
    // For now, we're using service role key which bypasses RLS

    const { id } = params;

    // Check if this is the active configuration
    const { data: config, error: fetchError } = await supabase
      .from('email_smtp_configs')
      .select('is_active')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'SMTP configuration not found' },
        { status: 404 }
      );
    }

    if (config.is_active) {
      return NextResponse.json(
        { error: 'Cannot delete active SMTP configuration. Please activate another configuration first.' },
        { status: 400 }
      );
    }

    // Delete configuration
    const { error } = await supabase
      .from('email_smtp_configs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting SMTP config:', error);
      return NextResponse.json(
        { error: 'Failed to delete SMTP configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'SMTP configuration deleted successfully' });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/admin/email/smtp-config/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}