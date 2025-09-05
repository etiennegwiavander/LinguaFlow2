import { NextRequest, NextResponse } from 'next/server';
import { generateMockDashboardData } from '@/lib/mock-data';

interface EmailType {
  type: string;
  name: string;
  isActive: boolean;
  templateId?: string;
  lastModified: string;
  usageStats: {
    totalSent: number;
    lastSent?: string;
    successRate: number;
  };
  schedulingConfig?: {
    enabled: boolean;
    timing: string; // e.g., "15 minutes before lesson"
    triggerEvent: string;
  };
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  smtpConnection: 'connected' | 'disconnected' | 'error';
  activeTemplates: number;
  totalTemplates: number;
  recentErrors: number;
  lastHealthCheck: string;
}

interface DashboardOverview {
  emailTypes: EmailType[];
  systemHealth: SystemHealth;
  quickStats: {
    totalEmailsSent24h: number;
    activeTemplates: number;
    configuredSMTP: boolean;
    pendingTests: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'template_updated' | 'email_sent' | 'smtp_configured' | 'test_completed';
    description: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error';
  }>;
  alerts: Array<{
    id: string;
    type: 'bounce_rate' | 'delivery_failure' | 'smtp_error' | 'template_error';
    message: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: string;
  }>;
}

export async function GET() {
  try {
    // Generate realistic mock dashboard data
    const dashboardData = generateMockDashboardData();

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error in dashboard API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    // Return mock success responses for now
    switch (action) {
      case 'toggle_email_type':
        return NextResponse.json({ 
          success: true, 
          message: `Email type ${data.emailType} ${data.isActive ? 'enabled' : 'disabled'}` 
        });
      
      case 'update_scheduling':
        return NextResponse.json({ 
          success: true, 
          message: `Scheduling configuration updated for ${data.emailType}` 
        });
      
      case 'bulk_template_operation':
        return NextResponse.json({ 
          success: true, 
          message: `${data.templateIds.length} template(s) ${data.operation}d` 
        });
      
      case 'system_health_check':
        return NextResponse.json({ 
          success: true, 
          healthReport: {
            smtpStatus: 'configured',
            templatesCount: 3,
            activeTemplatesCount: 3,
            lastChecked: new Date().toISOString()
          },
          message: 'System health check completed' 
        });
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in dashboard POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}