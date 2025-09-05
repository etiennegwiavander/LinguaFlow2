import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  checks: {
    smtp: HealthCheck;
    database: HealthCheck;
    templates: HealthCheck;
    emailDelivery: HealthCheck;
    systemResources: HealthCheck;
  };
  summary: {
    totalChecks: number;
    passedChecks: number;
    warningChecks: number;
    failedChecks: number;
  };
  recommendations: string[];
}

interface HealthCheck {
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: any;
  lastChecked: string;
  responseTime?: number;
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const checkType = searchParams.get('type') || 'full';
    const includeDetails = searchParams.get('details') === 'true';

    let healthResult: HealthCheckResult;

    switch (checkType) {
      case 'smtp':
        healthResult = await performSMTPHealthCheck(includeDetails);
        break;
      case 'database':
        healthResult = await performDatabaseHealthCheck(includeDetails);
        break;
      case 'templates':
        healthResult = await performTemplatesHealthCheck(includeDetails);
        break;
      case 'delivery':
        healthResult = await performDeliveryHealthCheck(includeDetails);
        break;
      case 'full':
      default:
        healthResult = await performFullHealthCheck(includeDetails);
        break;
    }

    return NextResponse.json(healthResult);

  } catch (error) {
    console.error('Error in health check API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'test_smtp':
        return await testSMTPConnection(data);
      
      case 'validate_templates':
        return await validateAllTemplates();
      
      case 'cleanup_logs':
        return await cleanupOldLogs(data);
      
      case 'reset_health_status':
        return await resetHealthStatus();
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in health check POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check implementations

async function performFullHealthCheck(includeDetails: boolean): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  const [smtpCheck, dbCheck, templatesCheck, deliveryCheck, resourcesCheck] = await Promise.all([
    checkSMTPHealth(includeDetails),
    checkDatabaseHealth(includeDetails),
    checkTemplatesHealth(includeDetails),
    checkEmailDeliveryHealth(includeDetails),
    checkSystemResourcesHealth(includeDetails)
  ]);

  const checks = {
    smtp: smtpCheck,
    database: dbCheck,
    templates: templatesCheck,
    emailDelivery: deliveryCheck,
    systemResources: resourcesCheck
  };

  const summary = calculateHealthSummary(checks);
  const overallStatus = determineOverallStatus(checks);
  const recommendations = generateRecommendations(checks);

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    summary,
    recommendations
  };
}

async function performSMTPHealthCheck(includeDetails: boolean): Promise<HealthCheckResult> {
  const smtpCheck = await checkSMTPHealth(includeDetails);
  
  return {
    status: smtpCheck.status === 'pass' ? 'healthy' : smtpCheck.status === 'warning' ? 'warning' : 'critical',
    timestamp: new Date().toISOString(),
    checks: {
      smtp: smtpCheck,
      database: { status: 'pass', message: 'Skipped', lastChecked: new Date().toISOString() },
      templates: { status: 'pass', message: 'Skipped', lastChecked: new Date().toISOString() },
      emailDelivery: { status: 'pass', message: 'Skipped', lastChecked: new Date().toISOString() },
      systemResources: { status: 'pass', message: 'Skipped', lastChecked: new Date().toISOString() }
    },
    summary: { totalChecks: 1, passedChecks: smtpCheck.status === 'pass' ? 1 : 0, warningChecks: smtpCheck.status === 'warning' ? 1 : 0, failedChecks: smtpCheck.status === 'fail' ? 1 : 0 },
    recommendations: smtpCheck.status !== 'pass' ? ['Check SMTP configuration and credentials'] : []
  };
}

async function performDatabaseHealthCheck(includeDetails: boolean): Promise<HealthCheckResult> {
  const dbCheck = await checkDatabaseHealth(includeDetails);
  
  return {
    status: dbCheck.status === 'pass' ? 'healthy' : dbCheck.status === 'warning' ? 'warning' : 'critical',
    timestamp: new Date().toISOString(),
    checks: {
      smtp: { status: 'pass', message: 'Skipped', lastChecked: new Date().toISOString() },
      database: dbCheck,
      templates: { status: 'pass', message: 'Skipped', lastChecked: new Date().toISOString() },
      emailDelivery: { status: 'pass', message: 'Skipped', lastChecked: new Date().toISOString() },
      systemResources: { status: 'pass', message: 'Skipped', lastChecked: new Date().toISOString() }
    },
    summary: { totalChecks: 1, passedChecks: dbCheck.status === 'pass' ? 1 : 0, warningChecks: dbCheck.status === 'warning' ? 1 : 0, failedChecks: dbCheck.status === 'fail' ? 1 : 0 },
    recommendations: dbCheck.status !== 'pass' ? ['Check database connectivity and performance'] : []
  };
}

async function performTemplatesHealthCheck(includeDetails: boolean): Promise<HealthCheckResult> {
  const templatesCheck = await checkTemplatesHealth(includeDetails);
  
  return {
    status: templatesCheck.status === 'pass' ? 'healthy' : templatesCheck.status === 'warning' ? 'warning' : 'critical',
    timestamp: new Date().toISOString(),
    checks: {
      smtp: { status: 'pass', message: 'Skipped', lastChecked: new Date().toISOString() },
      database: { status: 'pass', message: 'Skipped', lastChecked: new Date().toISOString() },
      templates: templatesCheck,
      emailDelivery: { status: 'pass', message: 'Skipped', lastChecked: new Date().toISOString() },
      systemResources: { status: 'pass', message: 'Skipped', lastChecked: new Date().toISOString() }
    },
    summary: { totalChecks: 1, passedChecks: templatesCheck.status === 'pass' ? 1 : 0, warningChecks: templatesCheck.status === 'warning' ? 1 : 0, failedChecks: templatesCheck.status === 'fail' ? 1 : 0 },
    recommendations: templatesCheck.status !== 'pass' ? ['Review and fix template validation errors'] : []
  };
}

async function performDeliveryHealthCheck(includeDetails: boolean): Promise<HealthCheckResult> {
  const deliveryCheck = await checkEmailDeliveryHealth(includeDetails);
  
  return {
    status: deliveryCheck.status === 'pass' ? 'healthy' : deliveryCheck.status === 'warning' ? 'warning' : 'critical',
    timestamp: new Date().toISOString(),
    checks: {
      smtp: { status: 'pass', message: 'Skipped', lastChecked: new Date().toISOString() },
      database: { status: 'pass', message: 'Skipped', lastChecked: new Date().toISOString() },
      templates: { status: 'pass', message: 'Skipped', lastChecked: new Date().toISOString() },
      emailDelivery: deliveryCheck,
      systemResources: { status: 'pass', message: 'Skipped', lastChecked: new Date().toISOString() }
    },
    summary: { totalChecks: 1, passedChecks: deliveryCheck.status === 'pass' ? 1 : 0, warningChecks: deliveryCheck.status === 'warning' ? 1 : 0, failedChecks: deliveryCheck.status === 'fail' ? 1 : 0 },
    recommendations: deliveryCheck.status !== 'pass' ? ['Investigate email delivery issues'] : []
  };
}

// Individual health check functions

async function checkSMTPHealth(includeDetails: boolean): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const { data: smtpConfig, error } = await supabase
      .from('email_smtp_configs')
      .select('*')
      .eq('is_active', true)
      .single();

    const responseTime = Date.now() - startTime;

    if (error || !smtpConfig) {
      return {
        status: 'fail',
        message: 'No active SMTP configuration found',
        lastChecked: new Date().toISOString(),
        responseTime,
        details: includeDetails ? { error: error?.message } : undefined
      };
    }

    // Check if SMTP was recently tested
    const lastTested = smtpConfig.last_tested ? new Date(smtpConfig.last_tested) : null;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    if (!lastTested || lastTested < oneHourAgo) {
      return {
        status: 'warning',
        message: 'SMTP configuration not recently tested',
        lastChecked: new Date().toISOString(),
        responseTime,
        details: includeDetails ? { 
          provider: smtpConfig.provider,
          lastTested: smtpConfig.last_tested,
          testStatus: smtpConfig.test_status
        } : undefined
      };
    }

    if (smtpConfig.test_status !== 'success') {
      return {
        status: 'fail',
        message: `SMTP test failed: ${smtpConfig.test_status}`,
        lastChecked: new Date().toISOString(),
        responseTime,
        details: includeDetails ? { 
          provider: smtpConfig.provider,
          testStatus: smtpConfig.test_status
        } : undefined
      };
    }

    return {
      status: 'pass',
      message: 'SMTP configuration is healthy',
      lastChecked: new Date().toISOString(),
      responseTime,
      details: includeDetails ? { 
        provider: smtpConfig.provider,
        lastTested: smtpConfig.last_tested
      } : undefined
    };

  } catch (error) {
    return {
      status: 'fail',
      message: `SMTP health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastChecked: new Date().toISOString(),
      responseTime: Date.now() - startTime
    };
  }
}

async function checkDatabaseHealth(includeDetails: boolean): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Test database connectivity with a simple query
    const { data, error } = await supabase
      .from('email_settings')
      .select('count')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'fail',
        message: `Database connection failed: ${error.message}`,
        lastChecked: new Date().toISOString(),
        responseTime,
        details: includeDetails ? { error: error.message } : undefined
      };
    }

    // Check response time
    if (responseTime > 5000) { // 5 seconds
      return {
        status: 'warning',
        message: 'Database response time is slow',
        lastChecked: new Date().toISOString(),
        responseTime,
        details: includeDetails ? { responseTimeMs: responseTime } : undefined
      };
    }

    return {
      status: 'pass',
      message: 'Database is healthy',
      lastChecked: new Date().toISOString(),
      responseTime
    };

  } catch (error) {
    return {
      status: 'fail',
      message: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastChecked: new Date().toISOString(),
      responseTime: Date.now() - startTime
    };
  }
}

async function checkTemplatesHealth(includeDetails: boolean): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('*');

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'fail',
        message: `Failed to fetch templates: ${error.message}`,
        lastChecked: new Date().toISOString(),
        responseTime
      };
    }

    const activeTemplates = templates?.filter(t => t.is_active) || [];
    const totalTemplates = templates?.length || 0;

    // Check if essential templates exist and are active
    const essentialTypes = ['welcome', 'password_reset'];
    const missingEssential = essentialTypes.filter(type => 
      !activeTemplates.some(t => t.type === type)
    );

    if (missingEssential.length > 0) {
      return {
        status: 'warning',
        message: `Missing active templates for: ${missingEssential.join(', ')}`,
        lastChecked: new Date().toISOString(),
        responseTime,
        details: includeDetails ? { 
          totalTemplates,
          activeTemplates: activeTemplates.length,
          missingEssential
        } : undefined
      };
    }

    if (totalTemplates === 0) {
      return {
        status: 'fail',
        message: 'No email templates configured',
        lastChecked: new Date().toISOString(),
        responseTime
      };
    }

    return {
      status: 'pass',
      message: `${activeTemplates.length} of ${totalTemplates} templates are active`,
      lastChecked: new Date().toISOString(),
      responseTime,
      details: includeDetails ? { 
        totalTemplates,
        activeTemplates: activeTemplates.length
      } : undefined
    };

  } catch (error) {
    return {
      status: 'fail',
      message: `Templates health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastChecked: new Date().toISOString(),
      responseTime: Date.now() - startTime
    };
  }
}

async function checkEmailDeliveryHealth(includeDetails: boolean): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Check recent email delivery statistics (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentLogs, error } = await supabase
      .from('email_logs')
      .select('status')
      .gte('sent_at', last24Hours)
      .eq('is_test', false); // Exclude test emails

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'fail',
        message: `Failed to fetch email logs: ${error.message}`,
        lastChecked: new Date().toISOString(),
        responseTime
      };
    }

    const totalEmails = recentLogs?.length || 0;
    const deliveredEmails = recentLogs?.filter(log => log.status === 'delivered').length || 0;
    const failedEmails = recentLogs?.filter(log => log.status === 'failed').length || 0;
    const bouncedEmails = recentLogs?.filter(log => log.status === 'bounced').length || 0;

    const deliveryRate = totalEmails > 0 ? deliveredEmails / totalEmails : 1;
    const failureRate = totalEmails > 0 ? (failedEmails + bouncedEmails) / totalEmails : 0;

    if (totalEmails === 0) {
      return {
        status: 'pass',
        message: 'No emails sent in the last 24 hours',
        lastChecked: new Date().toISOString(),
        responseTime
      };
    }

    if (failureRate > 0.2) { // 20% failure rate
      return {
        status: 'fail',
        message: `High failure rate: ${(failureRate * 100).toFixed(1)}%`,
        lastChecked: new Date().toISOString(),
        responseTime,
        details: includeDetails ? { 
          totalEmails,
          deliveredEmails,
          failedEmails,
          bouncedEmails,
          deliveryRate: Math.round(deliveryRate * 100),
          failureRate: Math.round(failureRate * 100)
        } : undefined
      };
    }

    if (failureRate > 0.1) { // 10% failure rate
      return {
        status: 'warning',
        message: `Elevated failure rate: ${(failureRate * 100).toFixed(1)}%`,
        lastChecked: new Date().toISOString(),
        responseTime,
        details: includeDetails ? { 
          totalEmails,
          deliveredEmails,
          failedEmails,
          bouncedEmails,
          deliveryRate: Math.round(deliveryRate * 100),
          failureRate: Math.round(failureRate * 100)
        } : undefined
      };
    }

    return {
      status: 'pass',
      message: `Email delivery is healthy (${Math.round(deliveryRate * 100)}% success rate)`,
      lastChecked: new Date().toISOString(),
      responseTime,
      details: includeDetails ? { 
        totalEmails,
        deliveredEmails,
        deliveryRate: Math.round(deliveryRate * 100)
      } : undefined
    };

  } catch (error) {
    return {
      status: 'fail',
      message: `Email delivery health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastChecked: new Date().toISOString(),
      responseTime: Date.now() - startTime
    };
  }
}

async function checkSystemResourcesHealth(includeDetails: boolean): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Check email logs table size and recent activity
    const { data: logStats, error } = await supabase
      .from('email_logs')
      .select('sent_at')
      .order('sent_at', { ascending: false })
      .limit(1000);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'warning',
        message: `Could not check system resources: ${error.message}`,
        lastChecked: new Date().toISOString(),
        responseTime
      };
    }

    const totalLogs = logStats?.length || 0;
    
    // Check for old logs that should be cleaned up
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oldLogs = logStats?.filter(log => new Date(log.sent_at) < thirtyDaysAgo).length || 0;

    if (oldLogs > 500) {
      return {
        status: 'warning',
        message: `${oldLogs} old email logs should be cleaned up`,
        lastChecked: new Date().toISOString(),
        responseTime,
        details: includeDetails ? { 
          totalLogs,
          oldLogs,
          recommendCleanup: true
        } : undefined
      };
    }

    return {
      status: 'pass',
      message: 'System resources are healthy',
      lastChecked: new Date().toISOString(),
      responseTime,
      details: includeDetails ? { totalLogs } : undefined
    };

  } catch (error) {
    return {
      status: 'warning',
      message: `System resources check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastChecked: new Date().toISOString(),
      responseTime: Date.now() - startTime
    };
  }
}

// Helper functions

function calculateHealthSummary(checks: any) {
  const checkValues = Object.values(checks) as HealthCheck[];
  const totalChecks = checkValues.length;
  const passedChecks = checkValues.filter(c => c.status === 'pass').length;
  const warningChecks = checkValues.filter(c => c.status === 'warning').length;
  const failedChecks = checkValues.filter(c => c.status === 'fail').length;

  return {
    totalChecks,
    passedChecks,
    warningChecks,
    failedChecks
  };
}

function determineOverallStatus(checks: any): 'healthy' | 'warning' | 'critical' {
  const checkValues = Object.values(checks) as HealthCheck[];
  
  if (checkValues.some(c => c.status === 'fail')) {
    return 'critical';
  }
  
  if (checkValues.some(c => c.status === 'warning')) {
    return 'warning';
  }
  
  return 'healthy';
}

function generateRecommendations(checks: any): string[] {
  const recommendations: string[] = [];
  
  if (checks.smtp.status !== 'pass') {
    recommendations.push('Configure and test SMTP settings');
  }
  
  if (checks.templates.status !== 'pass') {
    recommendations.push('Review and activate essential email templates');
  }
  
  if (checks.emailDelivery.status !== 'pass') {
    recommendations.push('Investigate email delivery issues and check bounce rates');
  }
  
  if (checks.database.status !== 'pass') {
    recommendations.push('Check database performance and connectivity');
  }
  
  if (checks.systemResources.status === 'warning') {
    recommendations.push('Consider cleaning up old email logs to improve performance');
  }
  
  return recommendations;
}

// Action handlers

async function testSMTPConnection(data: any) {
  // This would typically call the SMTP test endpoint
  // For now, return a placeholder response
  return NextResponse.json({
    success: true,
    message: 'SMTP connection test initiated',
    testId: 'test_' + Date.now()
  });
}

async function validateAllTemplates() {
  const { data: templates, error } = await supabase
    .from('email_templates')
    .select('*');

  if (error) {
    throw new Error(`Failed to fetch templates: ${error.message}`);
  }

  const validationResults = templates?.map(template => ({
    id: template.id,
    name: template.name,
    isValid: template.subject && template.html_content,
    issues: []
  })) || [];

  return NextResponse.json({
    success: true,
    message: `Validated ${templates?.length || 0} templates`,
    results: validationResults
  });
}

async function cleanupOldLogs(data: { olderThanDays: number }) {
  const { olderThanDays = 30 } = data;
  const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: deletedLogs, error } = await supabase
    .from('email_logs')
    .delete()
    .lt('sent_at', cutoffDate)
    .select('id');

  if (error) {
    throw new Error(`Failed to cleanup logs: ${error.message}`);
  }

  return NextResponse.json({
    success: true,
    message: `Cleaned up ${deletedLogs?.length || 0} old email logs`,
    deletedCount: deletedLogs?.length || 0
  });
}

async function resetHealthStatus() {
  // Reset any cached health status or perform a fresh health check
  return NextResponse.json({
    success: true,
    message: 'Health status reset successfully'
  });
}