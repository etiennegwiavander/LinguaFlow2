/**
 * Data Retention Policy Service
 * Implements automatic data purging and retention policies
 */

import { createClient } from '@supabase/supabase-js';
import { auditLogger, AUDIT_ACTIONS, AUDIT_RESOURCES } from './audit-logging-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface RetentionPolicy {
  id: string;
  dataType: string;
  retentionDays: number;
  autoDelete: boolean;
  legalBasis: string;
  description: string;
  lastExecuted?: Date;
  nextExecution?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RetentionExecution {
  policyId: string;
  executedAt: Date;
  recordsProcessed: number;
  recordsDeleted: number;
  errors: string[];
  executionTimeMs: number;
}

export interface DataInventoryItem {
  table: string;
  recordCount: number;
  oldestRecord?: Date;
  newestRecord?: Date;
  estimatedSize: string;
  retentionPolicy?: string;
}

class DataRetentionService {
  private supabase = createClient(supabaseUrl, supabaseServiceKey);

  /**
   * Create or update retention policy
   */
  async createRetentionPolicy(policy: Omit<RetentionPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<RetentionPolicy> {
    try {
      const { data, error } = await this.supabase
        .from('data_retention_policies')
        .insert({
          data_type: policy.dataType,
          retention_days: policy.retentionDays,
          auto_delete: policy.autoDelete,
          legal_basis: policy.legalBasis,
          description: policy.description,
          is_active: policy.isActive,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating retention policy:', error);
        throw new Error('Failed to create retention policy');
      }

      return this.mapRetentionPolicy(data);
    } catch (error) {
      console.error('Error in createRetentionPolicy:', error);
      throw new Error('Failed to create retention policy');
    }
  }

  /**
   * Get all retention policies
   */
  async getRetentionPolicies(): Promise<RetentionPolicy[]> {
    try {
      const { data, error } = await this.supabase
        .from('data_retention_policies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching retention policies:', error);
        return [];
      }

      return data?.map(this.mapRetentionPolicy) || [];
    } catch (error) {
      console.error('Error in getRetentionPolicies:', error);
      return [];
    }
  }

  /**
   * Execute retention policies
   */
  async executeRetentionPolicies(policyIds?: string[]): Promise<RetentionExecution[]> {
    const executions: RetentionExecution[] = [];

    try {
      // Get active policies
      let query = this.supabase
        .from('data_retention_policies')
        .select('*')
        .eq('is_active', true);

      if (policyIds && policyIds.length > 0) {
        query = query.in('id', policyIds);
      }

      const { data: policies, error } = await query;

      if (error) {
        console.error('Error fetching retention policies:', error);
        return executions;
      }

      // Execute each policy
      for (const policy of policies || []) {
        const execution = await this.executeSinglePolicy(policy);
        executions.push(execution);

        // Update last executed timestamp
        await this.supabase
          .from('data_retention_policies')
          .update({
            last_executed: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', policy.id);
      }

      return executions;
    } catch (error) {
      console.error('Error in executeRetentionPolicies:', error);
      return executions;
    }
  }

  /**
   * Execute single retention policy
   */
  private async executeSinglePolicy(policy: any): Promise<RetentionExecution> {
    const startTime = Date.now();
    const execution: RetentionExecution = {
      policyId: policy.id,
      executedAt: new Date(),
      recordsProcessed: 0,
      recordsDeleted: 0,
      errors: [],
      executionTimeMs: 0
    };

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retention_days);

      let recordsDeleted = 0;

      switch (policy.data_type) {
        case 'email_logs':
          recordsDeleted = await this.purgeEmailLogs(cutoffDate, policy.auto_delete);
          break;

        case 'test_emails':
          recordsDeleted = await this.purgeTestEmails(cutoffDate, policy.auto_delete);
          break;

        case 'audit_logs':
          recordsDeleted = await this.purgeAuditLogs(cutoffDate, policy.auto_delete);
          break;

        case 'unsubscribe_tokens':
          recordsDeleted = await this.purgeUnsubscribeTokens(cutoffDate, policy.auto_delete);
          break;

        case 'admin_sessions':
          recordsDeleted = await this.purgeAdminSessions(cutoffDate, policy.auto_delete);
          break;

        case 'template_history':
          recordsDeleted = await this.purgeTemplateHistory(cutoffDate, policy.auto_delete, policy.retention_days);
          break;

        default:
          execution.errors.push(`Unknown data type: ${policy.data_type}`);
      }

      execution.recordsDeleted = recordsDeleted;
      execution.recordsProcessed = recordsDeleted; // For deletion, processed = deleted

      // Log the retention execution
      await auditLogger.logEvent({
        userId: 'system',
        action: AUDIT_ACTIONS.DATA_PURGED,
        resource: AUDIT_RESOURCES.SYSTEM_SETTINGS,
        resourceId: policy.id,
        details: {
          policy_name: policy.data_type,
          retention_days: policy.retention_days,
          records_deleted: recordsDeleted,
          cutoff_date: cutoffDate.toISOString()
        }
      });

    } catch (error) {
      console.error(`Error executing retention policy ${policy.id}:`, error);
      execution.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    execution.executionTimeMs = Date.now() - startTime;
    return execution;
  }

  /**
   * Purge old email logs
   */
  private async purgeEmailLogs(cutoffDate: Date, autoDelete: boolean): Promise<number> {
    if (!autoDelete) return 0;

    try {
      const { data, error } = await this.supabase
        .from('email_logs')
        .delete()
        .lt('sent_at', cutoffDate.toISOString())
        .eq('is_test', false) // Don't delete test emails here
        .select('id');

      if (error) {
        console.error('Error purging email logs:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error in purgeEmailLogs:', error);
      return 0;
    }
  }

  /**
   * Purge old test emails
   */
  private async purgeTestEmails(cutoffDate: Date, autoDelete: boolean): Promise<number> {
    if (!autoDelete) return 0;

    try {
      const { data, error } = await this.supabase
        .from('email_logs')
        .delete()
        .lt('sent_at', cutoffDate.toISOString())
        .eq('is_test', true)
        .select('id');

      if (error) {
        console.error('Error purging test emails:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error in purgeTestEmails:', error);
      return 0;
    }
  }

  /**
   * Purge old audit logs
   */
  private async purgeAuditLogs(cutoffDate: Date, autoDelete: boolean): Promise<number> {
    if (!autoDelete) return 0;

    try {
      // Keep critical security events longer
      const { data, error } = await this.supabase
        .from('admin_audit_logs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString())
        .not('action', 'in', '(login_failed,unauthorized_access,session_expired)')
        .select('id');

      if (error) {
        console.error('Error purging audit logs:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error in purgeAuditLogs:', error);
      return 0;
    }
  }

  /**
   * Purge expired unsubscribe tokens
   */
  private async purgeUnsubscribeTokens(cutoffDate: Date, autoDelete: boolean): Promise<number> {
    if (!autoDelete) return 0;

    try {
      const { data, error } = await this.supabase
        .from('unsubscribe_tokens')
        .delete()
        .or(`expires_at.lt.${new Date().toISOString()},created_at.lt.${cutoffDate.toISOString()}`)
        .select('id');

      if (error) {
        console.error('Error purging unsubscribe tokens:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error in purgeUnsubscribeTokens:', error);
      return 0;
    }
  }

  /**
   * Purge expired admin sessions
   */
  private async purgeAdminSessions(cutoffDate: Date, autoDelete: boolean): Promise<number> {
    if (!autoDelete) return 0;

    try {
      const { data, error } = await this.supabase
        .from('admin_sessions')
        .delete()
        .or(`expires_at.lt.${new Date().toISOString()},created_at.lt.${cutoffDate.toISOString()}`)
        .select('id');

      if (error) {
        console.error('Error purging admin sessions:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error in purgeAdminSessions:', error);
      return 0;
    }
  }

  /**
   * Purge old template history (keep recent versions)
   */
  private async purgeTemplateHistory(cutoffDate: Date, autoDelete: boolean, retentionDays: number): Promise<number> {
    if (!autoDelete) return 0;

    try {
      // Keep at least the last 5 versions of each template
      const { data: templates } = await this.supabase
        .from('email_templates')
        .select('id');

      let totalDeleted = 0;

      for (const template of templates || []) {
        // Get history entries for this template, ordered by version
        const { data: history } = await this.supabase
          .from('email_template_history')
          .select('id, version, created_at')
          .eq('template_id', template.id)
          .order('version', { ascending: false });

        if (!history || history.length <= 5) {
          continue; // Keep all if 5 or fewer versions
        }

        // Keep the latest 5 versions, delete older ones that exceed retention period
        const versionsToDelete = history
          .slice(5) // Skip the latest 5 versions
          .filter(h => new Date(h.created_at) < cutoffDate)
          .map(h => h.id);

        if (versionsToDelete.length > 0) {
          const { data: deleted, error } = await this.supabase
            .from('email_template_history')
            .delete()
            .in('id', versionsToDelete)
            .select('id');

          if (!error) {
            totalDeleted += deleted?.length || 0;
          }
        }
      }

      return totalDeleted;
    } catch (error) {
      console.error('Error in purgeTemplateHistory:', error);
      return 0;
    }
  }

  /**
   * Get data inventory for retention analysis
   */
  async getDataInventory(): Promise<DataInventoryItem[]> {
    const inventory: DataInventoryItem[] = [];

    try {
      // Email logs
      const emailLogsStats = await this.getTableStats('email_logs', 'sent_at');
      inventory.push({
        table: 'email_logs',
        ...emailLogsStats,
        retentionPolicy: 'email_logs'
      });

      // Audit logs
      const auditLogsStats = await this.getTableStats('admin_audit_logs', 'timestamp');
      inventory.push({
        table: 'admin_audit_logs',
        ...auditLogsStats,
        retentionPolicy: 'audit_logs'
      });

      // Template history
      const templateHistoryStats = await this.getTableStats('email_template_history', 'created_at');
      inventory.push({
        table: 'email_template_history',
        ...templateHistoryStats,
        retentionPolicy: 'template_history'
      });

      // Unsubscribe tokens
      const unsubscribeTokensStats = await this.getTableStats('unsubscribe_tokens', 'created_at');
      inventory.push({
        table: 'unsubscribe_tokens',
        ...unsubscribeTokensStats,
        retentionPolicy: 'unsubscribe_tokens'
      });

      // Admin sessions
      const adminSessionsStats = await this.getTableStats('admin_sessions', 'created_at');
      inventory.push({
        table: 'admin_sessions',
        ...adminSessionsStats,
        retentionPolicy: 'admin_sessions'
      });

      return inventory;
    } catch (error) {
      console.error('Error getting data inventory:', error);
      return inventory;
    }
  }

  /**
   * Get statistics for a table
   */
  private async getTableStats(tableName: string, dateColumn: string): Promise<Omit<DataInventoryItem, 'table' | 'retentionPolicy'>> {
    try {
      // Get record count
      const { count, error: countError } = await this.supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error(`Error counting ${tableName}:`, countError);
        return {
          recordCount: 0,
          estimatedSize: '0 KB'
        };
      }

      // Get oldest and newest records
      const { data: oldest } = await this.supabase
        .from(tableName)
        .select(dateColumn)
        .order(dateColumn, { ascending: true })
        .limit(1)
        .single();

      const { data: newest } = await this.supabase
        .from(tableName)
        .select(dateColumn)
        .order(dateColumn, { ascending: false })
        .limit(1)
        .single();

      // Estimate size (rough calculation)
      const estimatedSizeKB = (count || 0) * 2; // Assume ~2KB per record on average
      const estimatedSize = estimatedSizeKB > 1024 
        ? `${(estimatedSizeKB / 1024).toFixed(1)} MB`
        : `${estimatedSizeKB} KB`;

      return {
        recordCount: count || 0,
        oldestRecord: oldest ? new Date((oldest as any)[dateColumn]) : undefined,
        newestRecord: newest ? new Date((newest as any)[dateColumn]) : undefined,
        estimatedSize
      };
    } catch (error) {
      console.error(`Error getting stats for ${tableName}:`, error);
      return {
        recordCount: 0,
        estimatedSize: '0 KB'
      };
    }
  }

  /**
   * Schedule automatic retention policy execution
   */
  async scheduleRetentionExecution(): Promise<void> {
    try {
      // This would typically be called by a cron job or scheduled task
      const executions = await this.executeRetentionPolicies();
      
      console.log('Scheduled retention execution completed:', {
        policiesExecuted: executions.length,
        totalRecordsDeleted: executions.reduce((sum, exec) => sum + exec.recordsDeleted, 0),
        errors: executions.flatMap(exec => exec.errors)
      });
    } catch (error) {
      console.error('Error in scheduled retention execution:', error);
    }
  }

  /**
   * Get retention compliance report
   */
  async getRetentionComplianceReport(): Promise<{
    policies: RetentionPolicy[];
    inventory: DataInventoryItem[];
    recentExecutions: RetentionExecution[];
    complianceStatus: 'compliant' | 'warning' | 'non_compliant';
    recommendations: string[];
  }> {
    try {
      const policies = await this.getRetentionPolicies();
      const inventory = await this.getDataInventory();
      
      // Get recent executions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: executionData } = await this.supabase
        .from('retention_executions')
        .select('*')
        .gte('executed_at', thirtyDaysAgo.toISOString())
        .order('executed_at', { ascending: false });

      const recentExecutions = executionData?.map(exec => ({
        policyId: exec.policy_id,
        executedAt: new Date(exec.executed_at),
        recordsProcessed: exec.records_processed,
        recordsDeleted: exec.records_deleted,
        errors: exec.errors || [],
        executionTimeMs: exec.execution_time_ms
      })) || [];

      // Determine compliance status
      let complianceStatus: 'compliant' | 'warning' | 'non_compliant' = 'compliant';
      const recommendations: string[] = [];

      // Check for tables without retention policies
      const tablesWithoutPolicies = inventory.filter(item => !item.retentionPolicy);
      if (tablesWithoutPolicies.length > 0) {
        complianceStatus = 'warning';
        recommendations.push(`Consider adding retention policies for: ${tablesWithoutPolicies.map(t => t.table).join(', ')}`);
      }

      // Check for inactive policies
      const inactivePolicies = policies.filter(p => !p.isActive);
      if (inactivePolicies.length > 0) {
        complianceStatus = 'warning';
        recommendations.push(`${inactivePolicies.length} retention policies are inactive`);
      }

      // Check for old data that should be purged
      const oldDataItems = inventory.filter(item => {
        const policy = policies.find(p => p.dataType === item.retentionPolicy);
        if (!policy || !item.oldestRecord) return false;
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);
        
        return item.oldestRecord < cutoffDate;
      });

      if (oldDataItems.length > 0) {
        complianceStatus = 'non_compliant';
        recommendations.push(`${oldDataItems.length} tables have data exceeding retention periods`);
      }

      return {
        policies,
        inventory,
        recentExecutions,
        complianceStatus,
        recommendations
      };
    } catch (error) {
      console.error('Error generating retention compliance report:', error);
      return {
        policies: [],
        inventory: [],
        recentExecutions: [],
        complianceStatus: 'non_compliant',
        recommendations: ['Error generating compliance report']
      };
    }
  }

  /**
   * Map database record to RetentionPolicy interface
   */
  private mapRetentionPolicy(data: any): RetentionPolicy {
    return {
      id: data.id,
      dataType: data.data_type,
      retentionDays: data.retention_days,
      autoDelete: data.auto_delete,
      legalBasis: data.legal_basis,
      description: data.description,
      lastExecuted: data.last_executed ? new Date(data.last_executed) : undefined,
      nextExecution: data.next_execution ? new Date(data.next_execution) : undefined,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}

// Export factory function instead of singleton to avoid build-time initialization
export function createDataRetentionService() {
  return new DataRetentionService();
}