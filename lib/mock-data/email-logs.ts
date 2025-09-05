/**
 * Mock Email Logs Data Service
 * Provides realistic mock data for email logs and history
 */

export interface EmailLog {
  id: string;
  template_type: 'welcome' | 'lesson_reminder' | 'password_reset' | 'newsletter' | 'notification';
  template_id: string;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  status: 'delivered' | 'failed' | 'bounced' | 'pending' | 'queued';
  sent_at: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  error_message?: string;
  smtp_config_id?: string;
  metadata?: {
    user_id?: string;
    lesson_id?: string;
    campaign_id?: string;
    ip_address?: string;
    user_agent?: string;
  };
  tracking?: {
    opens: number;
    clicks: number;
    last_opened?: string;
    last_clicked?: string;
  };
}

/**
 * Email status distribution for realistic mock data
 */
const STATUS_DISTRIBUTION = {
  delivered: 0.85,  // 85% delivered
  failed: 0.08,     // 8% failed
  bounced: 0.04,    // 4% bounced
  pending: 0.02,    // 2% pending
  queued: 0.01      // 1% queued
};

/**
 * Common email subjects by type
 */
const EMAIL_SUBJECTS = {
  welcome: [
    'Welcome to LinguaFlow!',
    'Get started with your language journey',
    'Your account is ready!',
    'Welcome aboard - Let\'s learn together'
  ],
  lesson_reminder: [
    'Your lesson starts in 15 minutes',
    'Reminder: Lesson with {{tutor_name}}',
    'Don\'t forget your upcoming lesson',
    'Lesson reminder - {{lesson_topic}}'
  ],
  password_reset: [
    'Reset your LinguaFlow password',
    'Password reset request',
    'Secure password reset link',
    'Your password reset instructions'
  ],
  newsletter: [
    'LinguaFlow Monthly Newsletter',
    'Language Learning Tips & Updates',
    'Your weekly progress report',
    'New features and improvements'
  ],
  notification: [
    'Important account update',
    'New message from your tutor',
    'Lesson rescheduled',
    'Payment confirmation'
  ]
};

/**
 * Generate realistic recipient data
 */
function generateRecipientData(): { email: string; name: string } {
  const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Lisa', 'James', 'Anna', 'Robert', 'Maria'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  
  return {
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`
  };
}

/**
 * Generate email status based on distribution
 */
function generateEmailStatus(): EmailLog['status'] {
  const random = Math.random();
  let cumulative = 0;
  
  for (const [status, probability] of Object.entries(STATUS_DISTRIBUTION)) {
    cumulative += probability;
    if (random <= cumulative) {
      return status as EmailLog['status'];
    }
  }
  
  return 'delivered'; // fallback
}

/**
 * Generate tracking data based on status
 */
function generateTrackingData(status: EmailLog['status'], sentAt: Date): EmailLog['tracking'] {
  if (status !== 'delivered') {
    return { opens: 0, clicks: 0 };
  }
  
  const opens = Math.random() > 0.6 ? Math.floor(Math.random() * 3) + 1 : 0; // 40% open rate
  const clicks = opens > 0 && Math.random() > 0.8 ? Math.floor(Math.random() * 2) + 1 : 0; // 20% click rate
  
  const tracking: EmailLog['tracking'] = { opens, clicks };
  
  if (opens > 0) {
    const openTime = new Date(sentAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
    tracking.last_opened = openTime.toISOString();
  }
  
  if (clicks > 0) {
    const clickTime = new Date(sentAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
    tracking.last_clicked = clickTime.toISOString();
  }
  
  return tracking;
}

/**
 * Generate metadata for email log
 */
function generateMetadata(templateType: EmailLog['template_type']): EmailLog['metadata'] {
  const metadata: EmailLog['metadata'] = {
    user_id: `user-${Math.random().toString(36).substr(2, 9)}`,
    ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };
  
  if (templateType === 'lesson_reminder') {
    metadata.lesson_id = `lesson-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  if (templateType === 'newsletter') {
    metadata.campaign_id = `campaign-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  return metadata;
}

/**
 * Generate error message for failed emails
 */
function generateErrorMessage(status: EmailLog['status']): string | undefined {
  if (status === 'failed') {
    const errors = [
      'SMTP authentication failed',
      'Recipient address rejected',
      'Message size exceeds limit',
      'Temporary server error',
      'Rate limit exceeded',
      'Invalid recipient domain'
    ];
    return errors[Math.floor(Math.random() * errors.length)];
  }
  
  if (status === 'bounced') {
    const bounceReasons = [
      'Mailbox full',
      'Invalid email address',
      'Domain not found',
      'Recipient server unavailable',
      'Message blocked by spam filter'
    ];
    return bounceReasons[Math.floor(Math.random() * bounceReasons.length)];
  }
  
  return undefined;
}

/**
 * Generate a single mock email log
 */
function generateMockEmailLog(
  templateType?: EmailLog['template_type'],
  customData?: Partial<EmailLog>
): EmailLog {
  const type = templateType || (['welcome', 'lesson_reminder', 'password_reset', 'newsletter', 'notification'] as const)[Math.floor(Math.random() * 5)];
  const recipient = generateRecipientData();
  const status = generateEmailStatus();
  
  const now = new Date();
  const sentAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days
  
  let deliveredAt: string | undefined;
  if (status === 'delivered') {
    deliveredAt = new Date(sentAt.getTime() + Math.random() * 60 * 60 * 1000).toISOString(); // Within 1 hour
  }
  
  const subjects = EMAIL_SUBJECTS[type];
  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  
  return {
    id: `email-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    template_type: type,
    template_id: `template-${type}-${Math.random().toString(36).substr(2, 9)}`,
    recipient_email: recipient.email,
    recipient_name: recipient.name,
    subject,
    status,
    sent_at: sentAt.toISOString(),
    delivered_at: deliveredAt,
    error_message: generateErrorMessage(status),
    smtp_config_id: `smtp-config-${Math.random().toString(36).substr(2, 9)}`,
    metadata: generateMetadata(type),
    tracking: generateTrackingData(status, sentAt),
    ...customData
  };
}

/**
 * Generate multiple mock email logs
 */
export function generateMockEmailLogs(count: number = 100): EmailLog[] {
  const logs: EmailLog[] = [];
  
  for (let i = 0; i < count; i++) {
    logs.push(generateMockEmailLog());
  }
  
  // Sort by sent_at descending (newest first)
  return logs.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
}

/**
 * Get mock email logs with filters
 */
export function getMockEmailLogsWithFilters(filters: {
  template_type?: string;
  status?: string;
  recipient_email?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}): { logs: EmailLog[]; total: number } {
  let logs = generateMockEmailLogs(500); // Generate larger dataset for filtering
  
  // Apply filters
  if (filters.template_type) {
    logs = logs.filter(log => log.template_type === filters.template_type);
  }
  
  if (filters.status) {
    logs = logs.filter(log => log.status === filters.status);
  }
  
  if (filters.recipient_email) {
    logs = logs.filter(log => 
      log.recipient_email.toLowerCase().includes(filters.recipient_email!.toLowerCase())
    );
  }
  
  if (filters.start_date) {
    const startDate = new Date(filters.start_date);
    logs = logs.filter(log => new Date(log.sent_at) >= startDate);
  }
  
  if (filters.end_date) {
    const endDate = new Date(filters.end_date);
    logs = logs.filter(log => new Date(log.sent_at) <= endDate);
  }
  
  const total = logs.length;
  
  // Apply pagination
  const offset = filters.offset || 0;
  const limit = filters.limit || 50;
  logs = logs.slice(offset, offset + limit);
  
  return { logs, total };
}

/**
 * Get email log statistics
 */
export function getMockEmailLogStats(filters?: {
  start_date?: string;
  end_date?: string;
  template_type?: string;
}): {
  total_sent: number;
  delivered: number;
  failed: number;
  bounced: number;
  pending: number;
  queued: number;
  delivery_rate: number;
  bounce_rate: number;
  open_rate: number;
  click_rate: number;
} {
  const { logs } = getMockEmailLogsWithFilters({
    ...filters,
    limit: 1000 // Get more data for accurate stats
  });
  
  const stats = {
    total_sent: logs.length,
    delivered: logs.filter(l => l.status === 'delivered').length,
    failed: logs.filter(l => l.status === 'failed').length,
    bounced: logs.filter(l => l.status === 'bounced').length,
    pending: logs.filter(l => l.status === 'pending').length,
    queued: logs.filter(l => l.status === 'queued').length,
    delivery_rate: 0,
    bounce_rate: 0,
    open_rate: 0,
    click_rate: 0
  };
  
  if (stats.total_sent > 0) {
    stats.delivery_rate = stats.delivered / stats.total_sent;
    stats.bounce_rate = stats.bounced / stats.total_sent;
  }
  
  const deliveredLogs = logs.filter(l => l.status === 'delivered');
  if (deliveredLogs.length > 0) {
    const opened = deliveredLogs.filter(l => l.tracking && l.tracking.opens > 0).length;
    const clicked = deliveredLogs.filter(l => l.tracking && l.tracking.clicks > 0).length;
    
    stats.open_rate = opened / deliveredLogs.length;
    stats.click_rate = clicked / deliveredLogs.length;
  }
  
  return stats;
}

/**
 * Get a specific email log by ID
 */
export function getMockEmailLogById(id: string): EmailLog | null {
  const logs = generateMockEmailLogs(100);
  return logs.find(log => log.id === id) || null;
}

/**
 * Get recent email activity
 */
export function getMockRecentEmailActivity(limit: number = 10): EmailLog[] {
  const logs = generateMockEmailLogs(50);
  return logs.slice(0, limit);
}

/**
 * Export email logs (simulate export functionality)
 */
export function exportMockEmailLogs(filters?: {
  template_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}): {
  filename: string;
  data: EmailLog[];
  format: 'csv' | 'json';
} {
  const { logs } = getMockEmailLogsWithFilters({
    ...filters,
    limit: 10000 // Export all matching logs
  });
  
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `email-logs-${timestamp}.csv`;
  
  return {
    filename,
    data: logs,
    format: 'csv'
  };
}