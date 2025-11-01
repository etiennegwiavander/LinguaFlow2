import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get SMTP configurations
    const { data: smtpConfigs } = await supabase
      .from('email_smtp_configs')
      .select('*');
    
    // Get email templates
    const { data: templates } = await supabase
      .from('email_templates')
      .select('*');
    
    // Get recent email logs
    const { data: recentLogs } = await supabase
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(10);
    
    // Calculate statistics
    const activeConfigs = smtpConfigs?.filter(config => config.is_active).length || 0;
    const activeTemplates = templates?.filter(template => template.is_active).length || 0;
    const totalEmailsSent = recentLogs?.length || 0;
    
    // Get today's email count
    const today = new Date().toISOString().split('T')[0];
    const { data: todayLogs } = await supabase
      .from('email_logs')
      .select('*')
      .gte('sent_at', today + 'T00:00:00')
      .lt('sent_at', today + 'T23:59:59');
    
    const todayCount = todayLogs?.length || 0;
    
    // Calculate success rate
    const successfulEmails = recentLogs?.filter(log => log.status === 'delivered').length || 0;
    const successRate = totalEmailsSent > 0 ? (successfulEmails / totalEmailsSent) * 100 : 100;
    
    // Generate alerts based on system state
    const alerts = [];
    
    // Check if no SMTP configs are active
    if (activeConfigs === 0) {
      alerts.push({
        id: 'no-smtp',
        type: 'smtp_error',
        message: 'No active SMTP configurations. Email sending is disabled.',
        severity: 'high',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if no templates are active
    if (activeTemplates === 0) {
      alerts.push({
        id: 'no-templates',
        type: 'template_error',
        message: 'No active email templates. Create or activate templates to send emails.',
        severity: 'medium',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check for high failure rate
    if (totalEmailsSent > 0 && successRate < 80) {
      alerts.push({
        id: 'low-success',
        type: 'delivery_failure',
        message: `Low delivery rate detected: ${Math.round(successRate)}%. Check SMTP configuration.`,
        severity: 'high',
        timestamp: new Date().toISOString()
      });
    }
    
    // Group templates by type to create emailTypes
    const emailTypes = [
      {
        type: 'welcome',
        name: 'Welcome Emails',
        description: 'Sent to new users upon registration',
        is_active: templates?.some(t => t.type === 'welcome' && t.is_active) || false,
        template_count: templates?.filter(t => t.type === 'welcome').length || 0,
        success_rate: 100,
        total_sent_24h: 0
      },
      {
        type: 'password_reset',
        name: 'Password Reset',
        description: 'Password recovery emails',
        is_active: templates?.some(t => t.type === 'password_reset' && t.is_active) || false,
        template_count: templates?.filter(t => t.type === 'password_reset').length || 0,
        success_rate: 100,
        total_sent_24h: 0
      },
      {
        type: 'lesson_reminder',
        name: 'Lesson Reminders',
        description: 'Upcoming lesson notifications',
        is_active: templates?.some(t => t.type === 'lesson_reminder' && t.is_active) || false,
        template_count: templates?.filter(t => t.type === 'lesson_reminder').length || 0,
        success_rate: 100,
        total_sent_24h: 0
      }
    ];

    const dashboardData = {
      emailTypes: emailTypes,
      overview: {
        totalEmailsSent,
        emailsToday: todayCount,
        successRate: Math.round(successRate),
        activeConfigs,
        activeTemplates
      },
      recentActivity: recentLogs?.map(log => ({
        id: log.id,
        type: 'email_sent',
        message: `Email sent to ${log.recipient_email}`,
        timestamp: log.sent_at,
        status: log.status === 'delivered' ? 'success' : 'error',
        details: {
          email: log.recipient_email,
          template_name: log.template_type
        }
      })) || [],
      systemHealth: {
        status: activeConfigs > 0 && activeTemplates > 0 ? 'healthy' : 'warning',
        emailService: 'operational',
        database: 'operational',
        smtpConnection: activeConfigs > 0 ? 'connected' : 'disconnected',
        smtpConnections: activeConfigs > 0 ? 'operational' : 'warning',
        activeTemplates: activeTemplates,
        totalTemplates: templates?.length || 0,
        recentErrors: 0,
        lastHealthCheck: new Date().toISOString()
      },
      quickStats: {
        emails_sent_24h: todayCount,
        emails_delivered_24h: todayLogs?.filter(log => log.status === 'delivered').length || 0,
        active_templates: activeTemplates,
        pending_emails: 0,
        bounce_rate_24h: 0,
        delivery_rate_24h: Math.round(successRate),
        smtp_configured: activeConfigs > 0,
        delivery_rate: Math.round(successRate),
        deliveryRate: successRate,
        avgResponseTime: '1.2s',
        queueSize: 0,
        errorRate: Math.round(100 - successRate)
      },
      alerts: alerts,
      lastUpdated: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

