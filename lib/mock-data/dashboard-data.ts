/**
 * Mock Dashboard Data Service
 * Provides realistic mock data for the email management dashboard
 */

import { generateMockEmailAnalytics } from './email-analytics';
import { generateMockEmailTemplates } from './email-templates';
import { generateMockSMTPConfigs } from './smtp-configs';
import { getMockEmailLogStats, getMockRecentEmailActivity } from './email-logs';

export interface EmailType {
  type: 'welcome' | 'lesson_reminder' | 'password_reset' | 'newsletter' | 'notification';
  name: string;
  description: string;
  is_active: boolean;
  template_count: number;
  last_sent?: string;
  success_rate: number;
  total_sent_24h: number;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  smtpConnection: 'connected' | 'disconnected' | 'error';
  activeTemplates: number;
  totalTemplates: number;
  recentErrors: number;
  lastHealthCheck: string;
}

export interface QuickStats {
  emails_sent_24h: number;
  emails_delivered_24h: number;
  active_templates: number;
  pending_emails: number;
  bounce_rate_24h: number;
  delivery_rate_24h: number;
}

export interface Activity {
  id: string;
  type: 'email_sent' | 'template_updated' | 'smtp_configured' | 'error_occurred' | 'test_completed';
  message: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
  details?: {
    email?: string;
    template_name?: string;
    error_message?: string;
  };
}

export interface Alert {
  id: string;
  type: 'bounce_rate' | 'delivery_failure' | 'smtp_error' | 'template_error' | 'queue_backup';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  is_resolved: boolean;
  action_required?: string;
}

export interface DashboardData {
  emailTypes: EmailType[];
  systemHealth: SystemHealth;
  quickStats: QuickStats;
  recentActivity: Activity[];
  alerts: Alert[];
  lastUpdated: string;
}

/**
 * Generate email type configurations
 */
function generateEmailTypes(): EmailType[] {
  const types: Array<{
    type: EmailType['type'];
    name: string;
    description: string;
  }> = [
    {
      type: 'welcome',
      name: 'Welcome Emails',
      description: 'Sent to new users upon registration'
    },
    {
      type: 'lesson_reminder',
      name: 'Lesson Reminders',
      description: 'Automated reminders for upcoming lessons'
    },
    {
      type: 'password_reset',
      name: 'Password Reset',
      description: 'Security emails for password recovery'
    },
    {
      type: 'newsletter',
      name: 'Newsletter',
      description: 'Monthly updates and language tips'
    },
    {
      type: 'notification',
      name: 'Notifications',
      description: 'General system and account notifications'
    }
  ];

  return types.map(typeConfig => ({
    ...typeConfig,
    is_active: Math.random() > 0.2, // 80% active
    template_count: Math.floor(Math.random() * 5) + 1,
    last_sent: Math.random() > 0.3 ? 
      new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : 
      undefined,
    success_rate: 0.85 + Math.random() * 0.13, // 85-98%
    total_sent_24h: Math.floor(Math.random() * 50) + 5
  }));
}

/**
 * Generate system health status
 */
function generateSystemHealth(): SystemHealth {
  const smtpConnection = Math.random() > 0.1 ? 'connected' : 'error';
  const activeTemplates = Math.floor(Math.random() * 15) + 8;
  const totalTemplates = activeTemplates + Math.floor(Math.random() * 5);
  const recentErrors = Math.floor(Math.random() * 5);
  
  let status: SystemHealth['status'] = 'healthy';
  if (smtpConnection === 'error' || recentErrors > 3) {
    status = 'critical';
  } else if (recentErrors > 1) {
    status = 'warning';
  }

  return {
    status,
    smtpConnection,
    activeTemplates,
    totalTemplates,
    recentErrors,
    lastHealthCheck: new Date().toISOString()
  };
}

/**
 * Generate quick statistics
 */
function generateQuickStats(): QuickStats {
  const emailsSent = Math.floor(Math.random() * 200) + 50;
  const deliveryRate = 0.92 + Math.random() * 0.06; // 92-98%
  const emailsDelivered = Math.floor(emailsSent * deliveryRate);
  const bounceRate = 0.01 + Math.random() * 0.04; // 1-5%

  return {
    emails_sent_24h: emailsSent,
    emails_delivered_24h: emailsDelivered,
    active_templates: Math.floor(Math.random() * 15) + 8,
    pending_emails: Math.floor(Math.random() * 20),
    bounce_rate_24h: bounceRate,
    delivery_rate_24h: deliveryRate
  };
}

/**
 * Generate recent activity feed
 */
function generateRecentActivity(): Activity[] {
  const activities: Activity[] = [];
  const activityTypes = [
    {
      type: 'email_sent' as const,
      messages: [
        'Welcome email sent to new user',
        'Lesson reminder sent successfully',
        'Password reset email delivered',
        'Newsletter sent to 150 subscribers'
      ],
      status: 'success' as const
    },
    {
      type: 'template_updated' as const,
      messages: [
        'Welcome email template updated',
        'Lesson reminder template modified',
        'New newsletter template created',
        'Password reset template activated'
      ],
      status: 'success' as const
    },
    {
      type: 'smtp_configured' as const,
      messages: [
        'SMTP configuration tested successfully',
        'New SMTP provider added',
        'SMTP settings updated',
        'Backup SMTP server configured'
      ],
      status: 'success' as const
    },
    {
      type: 'error_occurred' as const,
      messages: [
        'Email delivery failed - invalid recipient',
        'SMTP authentication error',
        'Template rendering error',
        'Rate limit exceeded'
      ],
      status: 'error' as const
    },
    {
      type: 'test_completed' as const,
      messages: [
        'Email template test completed',
        'SMTP connection test passed',
        'Delivery test successful',
        'Performance test completed'
      ],
      status: 'success' as const
    }
  ];

  for (let i = 0; i < 10; i++) {
    const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const message = activityType.messages[Math.floor(Math.random() * activityType.messages.length)];
    
    activities.push({
      id: `activity-${Date.now()}-${i}`,
      type: activityType.type,
      message,
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      status: activityType.status,
      details: generateActivityDetails(activityType.type)
    });
  }

  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Generate activity details based on type
 */
function generateActivityDetails(type: Activity['type']): Activity['details'] {
  switch (type) {
    case 'email_sent':
      return {
        email: `user${Math.floor(Math.random() * 1000)}@example.com`
      };
    case 'template_updated':
      return {
        template_name: ['Welcome Template', 'Lesson Reminder', 'Password Reset'][Math.floor(Math.random() * 3)]
      };
    case 'error_occurred':
      return {
        error_message: 'Connection timeout after 30 seconds'
      };
    default:
      return undefined;
  }
}

/**
 * Generate system alerts
 */
function generateAlerts(): Alert[] {
  const alerts: Alert[] = [];
  
  // Generate some alerts based on system health
  if (Math.random() > 0.7) { // 30% chance of bounce rate alert
    alerts.push({
      id: `alert-bounce-${Date.now()}`,
      type: 'bounce_rate',
      severity: 'medium',
      message: 'Bounce rate is above 3% for the last 24 hours',
      timestamp: new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000).toISOString(),
      is_resolved: false,
      action_required: 'Review email list quality and SMTP configuration'
    });
  }

  if (Math.random() > 0.8) { // 20% chance of SMTP error
    alerts.push({
      id: `alert-smtp-${Date.now()}`,
      type: 'smtp_error',
      severity: 'high',
      message: 'SMTP connection failed for backup server',
      timestamp: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000).toISOString(),
      is_resolved: false,
      action_required: 'Check SMTP credentials and server status'
    });
  }

  if (Math.random() > 0.9) { // 10% chance of queue backup
    alerts.push({
      id: `alert-queue-${Date.now()}`,
      type: 'queue_backup',
      severity: 'low',
      message: 'Email queue has 50+ pending emails',
      timestamp: new Date(Date.now() - Math.random() * 30 * 60 * 1000).toISOString(),
      is_resolved: false,
      action_required: 'Monitor queue processing and consider scaling'
    });
  }

  // Add some resolved alerts
  if (Math.random() > 0.5) {
    alerts.push({
      id: `alert-resolved-${Date.now()}`,
      type: 'delivery_failure',
      severity: 'medium',
      message: 'Temporary delivery issues resolved',
      timestamp: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toISOString(),
      is_resolved: true
    });
  }

  return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Generate complete dashboard data
 */
export function generateMockDashboardData(): DashboardData {
  return {
    emailTypes: generateEmailTypes(),
    systemHealth: generateSystemHealth(),
    quickStats: generateQuickStats(),
    recentActivity: generateRecentActivity(),
    alerts: generateAlerts(),
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Get dashboard data with real-time updates simulation
 */
export function getMockDashboardDataWithUpdates(): DashboardData {
  const data = generateMockDashboardData();
  
  // Simulate some real-time updates
  data.quickStats.pending_emails = Math.floor(Math.random() * 25);
  data.systemHealth.lastHealthCheck = new Date().toISOString();
  
  return data;
}

/**
 * Get system status summary
 */
export function getMockSystemStatus(): {
  status: 'operational' | 'degraded' | 'outage';
  services: Array<{
    name: string;
    status: 'operational' | 'degraded' | 'outage';
    uptime: number;
  }>;
  last_incident?: string;
} {
  const services = [
    { name: 'Email Delivery', status: 'operational' as 'operational' | 'degraded' | 'outage', uptime: 99.8 },
    { name: 'SMTP Service', status: 'operational' as 'operational' | 'degraded' | 'outage', uptime: 99.5 },
    { name: 'Template Engine', status: 'operational' as 'operational' | 'degraded' | 'outage', uptime: 99.9 },
    { name: 'Analytics', status: 'operational' as 'operational' | 'degraded' | 'outage', uptime: 99.7 }
  ];

  // Randomly degrade one service
  if (Math.random() > 0.9) {
    const serviceIndex = Math.floor(Math.random() * services.length);
    services[serviceIndex].status = 'degraded';
    services[serviceIndex].uptime = 95 + Math.random() * 4;
  }

  const overallStatus = services.some(s => s.status === 'outage') ? 'outage' :
                       services.some(s => s.status === 'degraded') ? 'degraded' : 'operational';

  return {
    status: overallStatus,
    services,
    last_incident: Math.random() > 0.7 ? 
      new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : 
      undefined
  };
}