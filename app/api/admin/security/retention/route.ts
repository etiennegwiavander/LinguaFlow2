/**
 * Data Retention Policies API
 * Manages data retention policies and automatic purging
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAdminSession, getClientIP, ADMIN_PERMISSIONS, hasPermission } from '@/lib/admin-auth-middleware';
import { dataRetentionService } from '@/lib/data-retention-service';
import { logSecurityEvent, logDataOperation, AUDIT_ACTIONS } from '@/lib/audit-logging-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/admin/security/retention - Get retention policies and compliance report
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Enhanced admin authentication
    const authResult = await validateAdminSession(request);
    if (!authResult.success || !authResult.user) {
      await logSecurityEvent(
        'unknown',
        AUDIT_ACTIONS.UNAUTHORIZED_ACCESS,
        { resource: 'retention_policies', action: 'read' },
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
        { resource: 'retention_policies', action: 'read' },
        getClientIP(request),
        request.headers.get('user-agent') || undefined
      );
      return NextResponse.json({ error: 'System admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeReport = searchParams.get('includeReport') === 'true';

    // Get retention policies
    const policies = await dataRetentionService.getRetentionPolicies();

    let response: any = { policies };

    // Include compliance report if requested
    if (includeReport) {
      const complianceReport = await dataRetentionService.getRetentionComplianceReport();
      response = { ...response, ...complianceReport };
    }

    // Log access
    await logSecurityEvent(
      authResult.user.id,
      'retention_policies_accessed',
      { 
        policies_count: policies.length,
        include_report: includeReport
      },
      getClientIP(request),
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json(response);

  } catch (error) {
    console.error('Unexpected error in GET /api/admin/security/retention:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/security/retention - Create new retention policy
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
    const { dataType, retentionDays, autoDelete, legalBasis, description, isActive } = body;

    // Validate required fields
    if (!dataType || !retentionDays || !legalBasis) {
      return NextResponse.json({
        error: 'Missing required fields: dataType, retentionDays, legalBasis'
      }, { status: 400 });
    }

    // Validate retention days
    if (retentionDays < 1 || retentionDays > 3650) { // Max 10 years
      return NextResponse.json({
        error: 'Retention days must be between 1 and 3650'
      }, { status: 400 });
    }

    // Create retention policy
    const policy = await dataRetentionService.createRetentionPolicy({
      dataType,
      retentionDays,
      autoDelete: autoDelete || false,
      legalBasis,
      description: description || '',
      isActive: isActive !== false
    });

    // Log policy creation
    await logDataOperation(
      authResult.user.id,
      AUDIT_ACTIONS.SETTINGS_UPDATED,
      'retention_policy',
      {
        policy_id: policy.id,
        data_type: policy.dataType,
        retention_days: policy.retentionDays,
        auto_delete: policy.autoDelete
      },
      getClientIP(request),
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({
      message: 'Retention policy created successfully',
      policy
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in POST /api/admin/security/retention:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/security/retention/execute - Execute retention policies
export async function PUT(request: NextRequest) {
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
    const { policyIds, dryRun = false } = body;

    // Execute retention policies
    const executions = await dataRetentionService.executeRetentionPolicies(policyIds);

    // Calculate totals
    const totalRecordsDeleted = executions.reduce((sum, exec) => sum + exec.recordsDeleted, 0);
    const totalErrors = executions.flatMap(exec => exec.errors);

    // Log execution
    await logDataOperation(
      authResult.user.id,
      AUDIT_ACTIONS.DATA_PURGED,
      'retention_execution',
      {
        policies_executed: executions.length,
        total_records_deleted: totalRecordsDeleted,
        errors_count: totalErrors.length,
        dry_run: dryRun
      },
      getClientIP(request),
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({
      message: 'Retention policies executed successfully',
      executions,
      summary: {
        policiesExecuted: executions.length,
        totalRecordsDeleted,
        totalErrors: totalErrors.length,
        errors: totalErrors
      }
    });

  } catch (error) {
    console.error('Unexpected error in PUT /api/admin/security/retention/execute:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}