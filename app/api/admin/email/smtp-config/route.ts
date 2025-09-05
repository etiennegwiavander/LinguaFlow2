/**
 * SMTP Configuration Management API
 * Simplified version that returns mock data until database is properly configured
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateMockSMTPConfigs, getMockSMTPConfigsWithFilters, createMockSMTPConfig } from '@/lib/mock-data';

// GET /api/admin/email/smtp-config - Retrieve all SMTP configurations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');
    const active = searchParams.get('active');
    const status = searchParams.get('status');

    // Get filtered SMTP configs using mock data service
    const configs = getMockSMTPConfigsWithFilters({
      provider: provider || undefined,
      active: active ? active === 'true' : undefined,
      status: status || undefined
    });

    return NextResponse.json({ configs });
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/email/smtp-config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/email/smtp-config - Create new SMTP configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, host, port, username, encryption, is_active } = body;

    // Validate required fields
    if (!provider || !host || !port || !username || !encryption) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, host, port, username, encryption' },
        { status: 400 }
      );
    }

    // Create SMTP config using mock data service
    const config = createMockSMTPConfig({
      provider,
      host,
      port: parseInt(port),
      username,
      encryption,
      is_active
    });

    return NextResponse.json({ 
      config,
      warnings: []
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/admin/email/smtp-config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}