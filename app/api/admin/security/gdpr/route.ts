/**
 * GDPR Compliance API
 * Handles GDPR compliance features including data export, deletion, and consent management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAdminSession, getClientIP, ADMIN_PERMISSIONS, hasPermission } from '@/lib/admin-auth-middleware';
import { gdprService } from '@/lib/gdpr-compliance-service';
import { logSecurityEvent, logDataOperation, AUDIT_ACTIONS } from '@/lib/audit-logging-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/admin/security/gdpr - Get GDPR compliance report
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Enhanced admin authentication
    const authResult = await validateAdminSession(request);
    if (!authResult.success || !authResult.user) {
      await logSecurityEvent(
        'unknown',
        AUDIT_ACTIONS.UNAUTHORIZED_ACCESS,
        { resource: 'gdpr_compliance', action: 'read' },
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
        { resource: 'gdpr_compliance', action: 'read' },
        getClientIP(request),
        request.headers.get('user-agent') || undefined
      );
      return NextResponse.json({ error: 'System admin access required' }, { status: 403 });
    }

    // Generate compliance report
    const complianceReport = await gdprService.generateComplianceReport();

    // Log access
    await logSecurityEvent(
      authResult.user.id,
      'gdpr_compliance_report_accessed',
      { report_summary: complianceReport.summary },
      getClientIP(request),
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json(complianceReport);

  } catch (error) {
    console.error('Unexpected error in GET /api/admin/security/gdpr:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/security/gdpr/validate-template - Validate template for GDPR compliance
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Enhanced admin authentication
    const authResult = await validateAdminSession(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    // Check template read permission
    if (!hasPermission(authResult.user, ADMIN_PERMISSIONS.EMAIL_TEMPLATE_READ)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { templateContent, templateType } = body;

    // Validate required fields
    if (!templateContent || !templateType) {
      return NextResponse.json({
        error: 'Missing required fields: templateContent, templateType'
      }, { status: 400 });
    }

    // Validate template compliance
    const validation = await gdprService.validateTemplateCompliance(templateContent, templateType);

    // Log validation
    await logDataOperation(
      authResult.user.id,
      'gdpr_template_validation',
      'email_template',
      {
        template_type: templateType,
        compliant: validation.compliant,
        issues_count: validation.issues.length,
        warnings_count: validation.warnings.length
      },
      getClientIP(request),
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json(validation);

  } catch (error) {
    console.error('Unexpected error in POST /api/admin/security/gdpr/validate-template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}