/**
 * Audit Logging Service
 * Comprehensive logging for all configuration changes and admin actions
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables with safe defaults
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Check if environment variables are available
const isConfigured = !!(supabaseUrl && supabaseServiceKey);

export interface AuditLogEntry {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface AuditLogFilter {
  userId?: string;
  action?: string;
  resource?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

// Audit action types
export const AUDIT_ACTIONS = {
  // SMTP Configuration
  SMTP_CONFIG_CREATED: 'smtp_config_created',
  SMTP_CONFIG_UPDATED: 'smtp_config_updated',
  SMTP_CONFIG_DELETED: 'smtp_config_deleted',
  SMTP_CONFIG_TESTED: 'smtp_config_tested',
  SMTP_CONFIG_ACTIVATED: 'smtp_config_activated',
  SMTP_CONFIG_DEACTIVATED: 'smtp_config_deactivated',
  
  // Email Templates
  TEMPLATE_CREATED: 'template_created',
  TEMPLATE_UPDATED: 'template_updated',
  TEMPLATE_DELETED: 'template_deleted',
  TEMPLATE_ACTIVATED: 'template_activated',
  TEMPLATE_DEACTIVATED: 'template_deactivated',
  TEMPLATE_ROLLED_BACK: 'template_rolled_back',
  
  // Email Testing
  TEST_EMAIL_SENT: 'test_email_sent',
  TEST_EMAIL_FAILED: 'test_email_failed',
  
  // System Settings
  SETTINGS_UPDATED: 'settings_updated',
  ADMIN_USER_ADDED: 'admin_user_added',
  ADMIN_USER_REMOVED: 'admin_user_removed',
  PERMISSIONS_CHANGED: 'permissions_changed',
  
  // Security Events
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  SESSION_CREATED: 'session_created',
  SESSION_EXPIRED: 'session_expired',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  
  // Data Operations
  DATA_EXPORTED: 'data_exported',
  DATA_PURGED: 'data_purged',
  BACKUP_CREATED: 'backup_created',
  BACKUP_RESTORED: 'backup_restored'
} as const;

// Resource types
export const AUDIT_RESOURCES = {
  SMTP_CONFIG: 'smtp_config',
  EMAIL_TEMPLATE: 'email_template',
  EMAIL_TEST: 'email_test',
  EMAIL_LOG: 'email_log',
  SYSTEM_SETTINGS: 'system_settings',
  ADMIN_USER: 'admin_user',
  SESSION: 'session',
  EXPORT: 'export'
} as const;

class AuditLoggingService {
  private supabase: any = null;
  
  constructor() {
    // Only create Supabase client if properly configured
    if (isConfigured) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseServiceKey);
      } catch (error) {
        console.error('Failed to initialize Audit service Supabase client:', error);
        this.supabase = null;
      }
    }
  }
  
  private checkConfiguration(): boolean {
    if (!isConfigured || !this.supabase) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Audit service not configured - operation skipped');
      }
      return false;
    }
    return true;
  }

  /**
   * Log an audit event
   */
  async logEvent(entry: AuditLogEntry): Promise<void> {
    if (!this.checkConfiguration()) {
      return;
    }
    
    try {
      const { error } = await this.supabase
        .from('admin_audit_logs')
        .insert({
          user_id: entry.userId,
          action: entry.action,
          resource: entry.resource,
          resource_id: entry.resourceId,
          old_values: entry.oldValues,
          new_values: entry.newValues,
          details: entry.details,
          ip_address: entry.ipAddress,
          user_agent: entry.userAgent,
          session_id: entry.sessionId,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to log audit event:', error);
        // Store in fallback log for critical events
        await this.logToFallback(entry, error);
      }
    } catch (error) {
      console.error('Audit logging error:', error);
      await this.logToFallback(entry, error);
    }
  }

  /**
   * Log SMTP configuration changes
   */
  async logSMTPConfigChange(
    userId: string,
    action: string,
    configId: string,
    oldConfig?: any,
    newConfig?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      resource: AUDIT_RESOURCES.SMTP_CONFIG,
      resourceId: configId,
      oldValues: oldConfig ? this.sanitizeSMTPConfig(oldConfig) : undefined,
      newValues: newConfig ? this.sanitizeSMTPConfig(newConfig) : undefined,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log email template changes
   */
  async logTemplateChange(
    userId: string,
    action: string,
    templateId: string,
    oldTemplate?: any,
    newTemplate?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      resource: AUDIT_RESOURCES.EMAIL_TEMPLATE,
      resourceId: templateId,
      oldValues: oldTemplate,
      newValues: newTemplate,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log email test events
   */
  async logEmailTest(
    userId: string,
    action: string,
    testId: string,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      resource: AUDIT_RESOURCES.EMAIL_TEST,
      resourceId: testId,
      details: {
        ...details,
        // Remove sensitive data
        recipient_email: details.recipient_email ? '***@***.***' : undefined
      },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    userId: string,
    action: string,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      resource: AUDIT_RESOURCES.SESSION,
      details,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log data operations (export, purge, etc.)
   */
  async logDataOperation(
    userId: string,
    action: string,
    resource: string,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      resource,
      details,
      ipAddress,
      userAgent
    });
  }

  /**
   * Retrieve audit logs with filtering
   */
  async getAuditLogs(filter: AuditLogFilter = {}): Promise<any[]> {
    try {
      let query = this.supabase
        .from('admin_audit_logs')
        .select(`
          *,
          users:user_id (
            email
          )
        `)
        .order('timestamp', { ascending: false });

      if (filter.userId) {
        query = query.eq('user_id', filter.userId);
      }

      if (filter.action) {
        query = query.eq('action', filter.action);
      }

      if (filter.resource) {
        query = query.eq('resource', filter.resource);
      }

      if (filter.dateFrom) {
        query = query.gte('timestamp', filter.dateFrom.toISOString());
      }

      if (filter.dateTo) {
        query = query.lte('timestamp', filter.dateTo.toISOString());
      }

      if (filter.limit) {
        query = query.limit(filter.limit);
      }

      if (filter.offset) {
        query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAuditLogs:', error);
      return [];
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(dateFrom?: Date, dateTo?: Date): Promise<Record<string, number>> {
    try {
      let query = this.supabase
        .from('admin_audit_logs')
        .select('action, resource');

      if (dateFrom) {
        query = query.gte('timestamp', dateFrom.toISOString());
      }

      if (dateTo) {
        query = query.lte('timestamp', dateTo.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audit statistics:', error);
        return {};
      }

      const stats: Record<string, number> = {};
      
      data?.forEach(log => {
        const key = `${log.resource}:${log.action}`;
        stats[key] = (stats[key] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error in getAuditStatistics:', error);
      return {};
    }
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(
    filter: AuditLogFilter,
    format: 'csv' | 'json' = 'csv'
  ): Promise<string> {
    const logs = await this.getAuditLogs(filter);

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    // CSV format
    const headers = [
      'Timestamp',
      'User Email',
      'Action',
      'Resource',
      'Resource ID',
      'IP Address',
      'Details'
    ];

    const csvRows = [
      headers.join(','),
      ...logs.map(log => [
        log.timestamp,
        log.users?.email || 'Unknown',
        log.action,
        log.resource,
        log.resource_id || '',
        log.ip_address || '',
        JSON.stringify(log.details || {}).replace(/"/g, '""')
      ].map(field => `"${field}"`).join(','))
    ];

    return csvRows.join('\n');
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { data, error } = await this.supabase
        .from('admin_audit_logs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString())
        .select('id');

      if (error) {
        console.error('Error cleaning up audit logs:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error in cleanupOldLogs:', error);
      return 0;
    }
  }

  /**
   * Sanitize SMTP config for logging (remove sensitive data)
   */
  private sanitizeSMTPConfig(config: any): any {
    const sanitized = { ...config };
    if (sanitized.password) {
      sanitized.password = '***REDACTED***';
    }
    if (sanitized.password_encrypted) {
      sanitized.password_encrypted = '***REDACTED***';
    }
    return sanitized;
  }

  /**
   * Fallback logging for critical events when main logging fails
   */
  private async logToFallback(entry: AuditLogEntry, error: any): Promise<void> {
    try {
      // Log to a separate fallback table or external service
      console.error('AUDIT LOG FALLBACK:', {
        timestamp: new Date().toISOString(),
        entry,
        originalError: error
      });

      // Could also write to file system or external logging service
      // For now, just ensure it's logged to console with structured format
    } catch (fallbackError) {
      console.error('Fallback audit logging also failed:', fallbackError);
    }
  }
}

// Export singleton instance
export const auditLogger = new AuditLoggingService();

// Convenience functions for common audit operations
export const logSMTPConfigChange = auditLogger.logSMTPConfigChange.bind(auditLogger);
export const logTemplateChange = auditLogger.logTemplateChange.bind(auditLogger);
export const logEmailTest = auditLogger.logEmailTest.bind(auditLogger);
export const logSecurityEvent = auditLogger.logSecurityEvent.bind(auditLogger);
export const logDataOperation = auditLogger.logDataOperation.bind(auditLogger);