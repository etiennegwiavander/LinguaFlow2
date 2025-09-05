import { supabase as supabaseClient } from '@/lib/supabase';

export interface EmailAlert {
  id: string;
  type: 'bounce_rate' | 'delivery_failure' | 'high_volume' | 'smtp_error';
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  metadata?: any;
  acknowledged?: boolean;
}

export interface BounceRateMonitoringConfig {
  bounceRateThreshold: number;
  failureRateThreshold: number;
  dailyVolumeThreshold: number;
  monitoringWindowHours: number;
}

export class EmailAnalyticsService {
  private supabase = supabaseClient;

  /**
   * Get bounce rate monitoring configuration from settings
   */
  async getMonitoringConfig(): Promise<BounceRateMonitoringConfig> {
    const { data: settings } = await this.supabase
      .from('email_settings')
      .select('setting_key, setting_value')
      .in('setting_key', [
        'bounce_rate_threshold',
        'failure_rate_threshold', 
        'daily_email_limit',
        'monitoring_window_hours'
      ]);

    const config: BounceRateMonitoringConfig = {
      bounceRateThreshold: 0.05, // 5% default
      failureRateThreshold: 0.10, // 10% default
      dailyVolumeThreshold: 1000, // 1000 emails default
      monitoringWindowHours: 24 // 24 hours default
    };

    settings?.forEach(setting => {
      switch (setting.setting_key) {
        case 'bounce_rate_threshold':
          config.bounceRateThreshold = parseFloat(setting.setting_value) || config.bounceRateThreshold;
          break;
        case 'failure_rate_threshold':
          config.failureRateThreshold = parseFloat(setting.setting_value) || config.failureRateThreshold;
          break;
        case 'daily_email_limit':
          config.dailyVolumeThreshold = parseInt(setting.setting_value) || config.dailyVolumeThreshold;
          break;
        case 'monitoring_window_hours':
          config.monitoringWindowHours = parseInt(setting.setting_value) || config.monitoringWindowHours;
          break;
      }
    });

    return config;
  }

  /**
   * Calculate bounce rate for a given time period
   */
  async calculateBounceRate(startDate: Date, endDate: Date, emailType?: string): Promise<{
    bounceRate: number;
    totalSent: number;
    totalBounced: number;
  }> {
    let query = this.supabase
      .from('email_logs')
      .select('status')
      .gte('sent_at', startDate.toISOString())
      .lte('sent_at', endDate.toISOString())
      .eq('is_test', false); // Exclude test emails

    if (emailType) {
      query = query.eq('template_type', emailType);
    }

    const { data: logs, error } = await query;

    if (error) {
      throw new Error(`Failed to calculate bounce rate: ${error.message}`);
    }

    const totalSent = logs?.length || 0;
    const totalBounced = logs?.filter(log => log.status === 'bounced').length || 0;
    const bounceRate = totalSent > 0 ? totalBounced / totalSent : 0;

    return {
      bounceRate,
      totalSent,
      totalBounced
    };
  }

  /**
   * Calculate delivery failure rate for a given time period
   */
  async calculateFailureRate(startDate: Date, endDate: Date, emailType?: string): Promise<{
    failureRate: number;
    totalSent: number;
    totalFailed: number;
  }> {
    let query = this.supabase
      .from('email_logs')
      .select('status')
      .gte('sent_at', startDate.toISOString())
      .lte('sent_at', endDate.toISOString())
      .eq('is_test', false); // Exclude test emails

    if (emailType) {
      query = query.eq('template_type', emailType);
    }

    const { data: logs, error } = await query;

    if (error) {
      throw new Error(`Failed to calculate failure rate: ${error.message}`);
    }

    const totalSent = logs?.length || 0;
    const totalFailed = logs?.filter(log => log.status === 'failed').length || 0;
    const failureRate = totalSent > 0 ? totalFailed / totalSent : 0;

    return {
      failureRate,
      totalSent,
      totalFailed
    };
  }

  /**
   * Check for high volume alerts
   */
  async checkVolumeAlerts(config: BounceRateMonitoringConfig): Promise<EmailAlert[]> {
    const alerts: EmailAlert[] = [];
    const windowStart = new Date(Date.now() - config.monitoringWindowHours * 60 * 60 * 1000);
    const windowEnd = new Date();

    const { data: recentLogs, error } = await this.supabase
      .from('email_logs')
      .select('id')
      .gte('sent_at', windowStart.toISOString())
      .lte('sent_at', windowEnd.toISOString())
      .eq('is_test', false);

    if (error) {
      console.error('Error checking volume alerts:', error);
      return alerts;
    }

    const recentCount = recentLogs?.length || 0;
    const threshold80 = config.dailyVolumeThreshold * 0.8;
    const threshold90 = config.dailyVolumeThreshold * 0.9;

    if (recentCount > threshold90) {
      alerts.push({
        id: `volume-high-${Date.now()}`,
        type: 'high_volume',
        message: `Critical: ${recentCount}/${config.dailyVolumeThreshold} emails sent in last ${config.monitoringWindowHours} hours (${((recentCount / config.dailyVolumeThreshold) * 100).toFixed(1)}%)`,
        severity: 'high',
        timestamp: new Date().toISOString(),
        metadata: {
          emailCount: recentCount,
          threshold: config.dailyVolumeThreshold,
          windowHours: config.monitoringWindowHours
        }
      });
    } else if (recentCount > threshold80) {
      alerts.push({
        id: `volume-medium-${Date.now()}`,
        type: 'high_volume',
        message: `Warning: ${recentCount}/${config.dailyVolumeThreshold} emails sent in last ${config.monitoringWindowHours} hours (${((recentCount / config.dailyVolumeThreshold) * 100).toFixed(1)}%)`,
        severity: 'medium',
        timestamp: new Date().toISOString(),
        metadata: {
          emailCount: recentCount,
          threshold: config.dailyVolumeThreshold,
          windowHours: config.monitoringWindowHours
        }
      });
    }

    return alerts;
  }

  /**
   * Check for bounce rate alerts
   */
  async checkBounceRateAlerts(config: BounceRateMonitoringConfig): Promise<EmailAlert[]> {
    const alerts: EmailAlert[] = [];
    const windowStart = new Date(Date.now() - config.monitoringWindowHours * 60 * 60 * 1000);
    const windowEnd = new Date();

    try {
      const bounceData = await this.calculateBounceRate(windowStart, windowEnd);
      
      if (bounceData.totalSent > 10 && bounceData.bounceRate > config.bounceRateThreshold) {
        const severity = bounceData.bounceRate > config.bounceRateThreshold * 2 ? 'high' : 'medium';
        
        alerts.push({
          id: `bounce-rate-${Date.now()}`,
          type: 'bounce_rate',
          message: `Bounce rate (${(bounceData.bounceRate * 100).toFixed(2)}%) exceeds threshold (${(config.bounceRateThreshold * 100).toFixed(2)}%) - ${bounceData.totalBounced}/${bounceData.totalSent} emails bounced`,
          severity,
          timestamp: new Date().toISOString(),
          metadata: {
            bounceRate: bounceData.bounceRate,
            threshold: config.bounceRateThreshold,
            totalSent: bounceData.totalSent,
            totalBounced: bounceData.totalBounced,
            windowHours: config.monitoringWindowHours
          }
        });
      }
    } catch (error) {
      console.error('Error checking bounce rate alerts:', error);
    }

    return alerts;
  }

  /**
   * Check for delivery failure alerts
   */
  async checkDeliveryFailureAlerts(config: BounceRateMonitoringConfig): Promise<EmailAlert[]> {
    const alerts: EmailAlert[] = [];
    const windowStart = new Date(Date.now() - config.monitoringWindowHours * 60 * 60 * 1000);
    const windowEnd = new Date();

    try {
      const failureData = await this.calculateFailureRate(windowStart, windowEnd);
      
      if (failureData.totalSent > 10 && failureData.failureRate > config.failureRateThreshold) {
        const severity = failureData.failureRate > config.failureRateThreshold * 2 ? 'high' : 'medium';
        
        alerts.push({
          id: `failure-rate-${Date.now()}`,
          type: 'delivery_failure',
          message: `Delivery failure rate (${(failureData.failureRate * 100).toFixed(2)}%) exceeds threshold (${(config.failureRateThreshold * 100).toFixed(2)}%) - ${failureData.totalFailed}/${failureData.totalSent} emails failed`,
          severity,
          timestamp: new Date().toISOString(),
          metadata: {
            failureRate: failureData.failureRate,
            threshold: config.failureRateThreshold,
            totalSent: failureData.totalSent,
            totalFailed: failureData.totalFailed,
            windowHours: config.monitoringWindowHours
          }
        });
      }
    } catch (error) {
      console.error('Error checking delivery failure alerts:', error);
    }

    return alerts;
  }

  /**
   * Check for SMTP configuration errors
   */
  async checkSMTPAlerts(): Promise<EmailAlert[]> {
    const alerts: EmailAlert[] = [];

    try {
      // Check for failed SMTP tests in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const { data: failedConfigs, error } = await this.supabase
        .from('email_smtp_configs')
        .select('id, provider, test_status, last_tested')
        .eq('is_active', true)
        .eq('test_status', 'failed')
        .gte('last_tested', oneHourAgo.toISOString());

      if (error) {
        console.error('Error checking SMTP alerts:', error);
        return alerts;
      }

      failedConfigs?.forEach(config => {
        alerts.push({
          id: `smtp-error-${config.id}`,
          type: 'smtp_error',
          message: `SMTP configuration for ${config.provider} is failing connection tests`,
          severity: 'high',
          timestamp: new Date().toISOString(),
          metadata: {
            configId: config.id,
            provider: config.provider,
            lastTested: config.last_tested
          }
        });
      });
    } catch (error) {
      console.error('Error checking SMTP alerts:', error);
    }

    return alerts;
  }

  /**
   * Generate comprehensive alerts for the email system
   */
  async generateAlerts(): Promise<EmailAlert[]> {
    const config = await this.getMonitoringConfig();
    
    const [volumeAlerts, bounceAlerts, failureAlerts, smtpAlerts] = await Promise.all([
      this.checkVolumeAlerts(config),
      this.checkBounceRateAlerts(config),
      this.checkDeliveryFailureAlerts(config),
      this.checkSMTPAlerts()
    ]);

    return [
      ...volumeAlerts,
      ...bounceAlerts,
      ...failureAlerts,
      ...smtpAlerts
    ].sort((a, b) => {
      // Sort by severity (high first) then by timestamp (newest first)
      const severityOrder = { high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }

  /**
   * Get email statistics for a specific time range
   */
  async getEmailStatistics(startDate: Date, endDate: Date, emailType?: string): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    totalBounced: number;
    totalPending: number;
    deliveryRate: number;
    bounceRate: number;
    failureRate: number;
  }> {
    let query = this.supabase
      .from('email_logs')
      .select('status')
      .gte('sent_at', startDate.toISOString())
      .lte('sent_at', endDate.toISOString())
      .eq('is_test', false);

    if (emailType) {
      query = query.eq('template_type', emailType);
    }

    const { data: logs, error } = await query;

    if (error) {
      throw new Error(`Failed to get email statistics: ${error.message}`);
    }

    const totalSent = logs?.length || 0;
    const totalDelivered = logs?.filter(log => log.status === 'delivered').length || 0;
    const totalFailed = logs?.filter(log => log.status === 'failed').length || 0;
    const totalBounced = logs?.filter(log => log.status === 'bounced').length || 0;
    const totalPending = logs?.filter(log => log.status === 'pending').length || 0;

    const deliveryRate = totalSent > 0 ? totalDelivered / totalSent : 0;
    const bounceRate = totalSent > 0 ? totalBounced / totalSent : 0;
    const failureRate = totalSent > 0 ? totalFailed / totalSent : 0;

    return {
      totalSent,
      totalDelivered,
      totalFailed,
      totalBounced,
      totalPending,
      deliveryRate,
      bounceRate,
      failureRate
    };
  }
}