/**
 * Audit Logs API
 * Provides access to audit logs for security monitoring and compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAdminSession, getClientIP, ADMIN_PERMISSIONS, hasPermission } from '@/lib/admin-auth-middleware';
import { auditLogger, logSecurityEvent, AUDIT_ACTIONS } from '@/lib/audit-logging-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/admin/security/audit-logs - Retrieve audit logs with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Enhanced admin authentication
    const authResult = await validateAdminSession(request);
    if (!authResult.success || !authResult.user) {
      await logSecurityEvent(
        'unknown',
        AUDIT_ACTIONS.UNAUTHORIZED_ACCESS,
        { resource: 'audit_logs', action: 'read' },
        getClientIP(request),
        request.headers.get('user-agent') || undefined
      );
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    // Check system admin permission
    if (!hasPermission(authResult.user, ADMIN_PERMISSIONS.SYSTEM_ADMIN)) {
      await logSecurityEvent(
        authResult.user.id,
        AUDIT_ACTIONS.UNAUTHORIZED_ACCESS,
        { resource: 'audit_logs', action: 'read' },
        getClientIP(request),
        request.headers.get('user-agent') || undefined
      );
      return NextResponse.json({ error: 'System admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build filter object
    const filter: any = {
      limit: Math.min(limit, 1000), // Cap at 1000 records
      offset
    };

    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (resource) filter.resource = resource;
    if (dateFrom) filter.dateFrom = new Date(dateFrom);
    if (dateTo) filter.dateTo = new Date(dateTo);

    // Get audit logs
    const logs = await auditLogger.getAuditLogs(filter);

    // Get total count for pagination
    let query = supabase
      .from('admin_audit_logs')
      .select('*', { count: 'exact', head: true });

    if (userId) query = query.eq('user_id', userId);
    if (action) query = query.eq('action', action);
    if (resource) query = query.eq('resource', resource);
    if (dateFrom) query = query.gte('timestamp', new Date(dateFrom).toISOString());
    if (dateTo) query = query.lte('timestamp', new Date(dateTo).toISOString());

    const { count, error: countError } = await query;

    if (countError) {
      console.error('Error getting audit logs count:', countError);
    }

    // Log audit log access
    await logSecurityEvent(
      authResult.user.id,
      'audit_logs_accessed',
      {
        filter,
        results_count: logs.length,
        total_count: count || 0
      },
      getClientIP(request),
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({
      logs,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0)
      },
      filter
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/admin/security/audit-logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/security/audit-logs/export - Export audit logs
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Enhanced admin authentication
    const authResult = await validateAdminSession(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    // Check system admin permission
    if (!hasPermission(authResult.user, ADMIN_PERMISSIONS.SYSTEM_ADMIN)) {
      return NextResponse.json({ error: 'System admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { filter, format = 'csv' } = body;

    // Validate format
    if (!['csv', 'json'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Must be csv or json' }, { status: 400 });
    }

    // Export audit logs
    const exportData = await auditLogger.exportAuditLogs(filter, format);

    // Log export action
    await logSecurityEvent(
      authResult.user.id,
      AUDIT_ACTIONS.DATA_EXPORTED,
      {
        export_type: 'audit_logs',
        format,
        filter,
        size_bytes: exportData.length
      },
      getClientIP(request),
      request.headers.get('user-agent') || undefined
    );

    // Set appropriate headers for file download
    const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';

    return new NextResponse(exportData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': exportData.length.toString()
      }
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/admin/security/audit-logs/export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}