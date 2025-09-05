/**
 * GDPR Compliance Service
 * Handles user data protection and privacy compliance for email templates
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables with safe defaults
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Check if environment variables are available
const isConfigured = !!(supabaseUrl && supabaseServiceKey);

export interface PersonalDataField {
  field: string;
  type: 'email' | 'name' | 'phone' | 'address' | 'identifier' | 'other';
  required: boolean;
  purpose: string;
  retention: number; // days
}

export interface DataProcessingConsent {
  userId: string;
  purpose: string;
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
}

export interface DataRetentionPolicy {
  dataType: string;
  retentionDays: number;
  autoDelete: boolean;
  legalBasis: string;
  description: string;
}

export interface GDPRRequest {
  userId: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  details?: Record<string, any>;
}

class GDPRComplianceService {
  private supabase: any = null;
  
  constructor() {
    // Only create Supabase client if properly configured
    if (isConfigured) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseServiceKey);
      } catch (error) {
        console.error('Failed to initialize GDPR service Supabase client:', error);
        this.supabase = null;
      }
    }
  }
  
  private checkConfiguration(): boolean {
    if (!isConfigured || !this.supabase) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('GDPR service not configured - operation skipped');
      }
      return false;
    }
    return true;
  }

  /**
   * Validate email template for GDPR compliance
   */
  async validateTemplateCompliance(templateContent: string, templateType: string): Promise<{
    compliant: boolean;
    issues: string[];
    warnings: string[];
    personalDataFields: PersonalDataField[];
  }> {
    if (!this.checkConfiguration()) {
      return {
        compliant: true,
        issues: [],
        warnings: ['GDPR service not configured'],
        personalDataFields: []
      };
    }
    
    const issues: string[] = [];
    const warnings: string[] = [];
    const personalDataFields: PersonalDataField[] = [];

    // Extract placeholders from template
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const placeholders = [...templateContent.matchAll(placeholderRegex)].map(match => match[1].trim());

    // Check for personal data fields
    for (const placeholder of placeholders) {
      const field = this.classifyPersonalDataField(placeholder);
      if (field) {
        personalDataFields.push(field);
      }
    }

    // Check for required GDPR elements
    const hasUnsubscribeLink = /unsubscribe|opt.?out/i.test(templateContent);
    const hasPrivacyPolicy = /privacy.?policy|data.?protection/i.test(templateContent);
    const hasDataController = /data.?controller|responsible.?for.?data/i.test(templateContent);

    // Validate based on template type
    if (templateType === 'marketing' || templateType === 'newsletter') {
      if (!hasUnsubscribeLink) {
        issues.push('Marketing emails must include an unsubscribe link');
      }
      if (!hasPrivacyPolicy) {
        warnings.push('Consider including a link to your privacy policy');
      }
    }

    // Check for sensitive data
    const hasSensitiveData = personalDataFields.some(field => 
      ['phone', 'address', 'identifier'].includes(field.type)
    );

    if (hasSensitiveData && !hasPrivacyPolicy) {
      issues.push('Templates with sensitive personal data must reference privacy policy');
    }

    // Check for data minimization
    if (personalDataFields.length > 5) {
      warnings.push('Consider reducing the amount of personal data used in this template');
    }

    // Validate consent requirements
    const requiresConsent = this.requiresExplicitConsent(templateType, personalDataFields);
    if (requiresConsent && !this.hasConsentReference(templateContent)) {
      warnings.push('This template may require explicit consent references');
    }

    return {
      compliant: issues.length === 0,
      issues,
      warnings,
      personalDataFields
    };
  }

  /**
   * Anonymize personal data in email logs
   */
  async anonymizeEmailLogs(userId: string): Promise<number> {
    try {
      // Get all email logs for the user
      const { data: logs, error } = await this.supabase
        .from('email_logs')
        .select('*')
        .eq('recipient_email', userId); // Assuming userId is email for this context

      if (error) {
        console.error('Error fetching email logs for anonymization:', error);
        return 0;
      }

      let anonymizedCount = 0;

      for (const log of logs || []) {
        const anonymizedData = this.anonymizeLogData(log);
        
        const { error: updateError } = await this.supabase
          .from('email_logs')
          .update(anonymizedData)
          .eq('id', log.id);

        if (!updateError) {
          anonymizedCount++;
        }
      }

      return anonymizedCount;
    } catch (error) {
      console.error('Error in anonymizeEmailLogs:', error);
      return 0;
    }
  }

  /**
   * Export user's personal data (GDPR Article 20)
   */
  async exportUserData(userId: string): Promise<{
    emailLogs: any[];
    templateData: any[];
    consentRecords: any[];
    metadata: Record<string, any>;
  }> {
    try {
      // Get email logs
      const { data: emailLogs } = await this.supabase
        .from('email_logs')
        .select('*')
        .or(`recipient_email.eq.${userId},metadata->>user_id.eq.${userId}`);

      // Get template interactions
      const { data: templateData } = await this.supabase
        .from('email_template_history')
        .select('*')
        .eq('created_by', userId);

      // Get consent records
      const { data: consentRecords } = await this.supabase
        .from('gdpr_consent_records')
        .select('*')
        .eq('user_id', userId);

      return {
        emailLogs: emailLogs || [],
        templateData: templateData || [],
        consentRecords: consentRecords || [],
        metadata: {
          exportedAt: new Date().toISOString(),
          exportedBy: 'system',
          dataTypes: ['email_logs', 'template_data', 'consent_records']
        }
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw new Error('Failed to export user data');
    }
  }

  /**
   * Delete user's personal data (Right to be forgotten)
   */
  async deleteUserData(userId: string, verificationToken: string): Promise<{
    success: boolean;
    deletedRecords: Record<string, number>;
    errors: string[];
  }> {
    const deletedRecords: Record<string, number> = {};
    const errors: string[] = [];

    try {
      // Verify deletion request
      const isVerified = await this.verifyDeletionRequest(userId, verificationToken);
      if (!isVerified) {
        return {
          success: false,
          deletedRecords: {},
          errors: ['Invalid verification token']
        };
      }

      // Delete email logs
      const { data: deletedLogs, error: logsError } = await this.supabase
        .from('email_logs')
        .delete()
        .or(`recipient_email.eq.${userId},metadata->>user_id.eq.${userId}`)
        .select('id');

      if (logsError) {
        errors.push(`Failed to delete email logs: ${logsError.message}`);
      } else {
        deletedRecords.email_logs = deletedLogs?.length || 0;
      }

      // Delete consent records
      const { data: deletedConsent, error: consentError } = await this.supabase
        .from('gdpr_consent_records')
        .delete()
        .eq('user_id', userId)
        .select('id');

      if (consentError) {
        errors.push(`Failed to delete consent records: ${consentError.message}`);
      } else {
        deletedRecords.consent_records = deletedConsent?.length || 0;
      }

      // Anonymize audit logs (don't delete for compliance)
      const { data: auditLogs } = await this.supabase
        .from('admin_audit_logs')
        .select('id')
        .eq('user_id', userId);

      if (auditLogs?.length) {
        const { error: auditError } = await this.supabase
          .from('admin_audit_logs')
          .update({
            user_id: 'anonymized',
            details: { anonymized: true, original_count: auditLogs.length }
          })
          .eq('user_id', userId);

        if (auditError) {
          errors.push(`Failed to anonymize audit logs: ${auditError.message}`);
        } else {
          deletedRecords.audit_logs_anonymized = auditLogs.length;
        }
      }

      return {
        success: errors.length === 0,
        deletedRecords,
        errors
      };
    } catch (error) {
      console.error('Error in deleteUserData:', error);
      return {
        success: false,
        deletedRecords: {},
        errors: ['Internal error during data deletion']
      };
    }
  }

  /**
   * Record user consent for data processing
   */
  async recordConsent(consent: DataProcessingConsent): Promise<void> {
    try {
      await this.supabase
        .from('gdpr_consent_records')
        .insert({
          user_id: consent.userId,
          purpose: consent.purpose,
          granted: consent.granted,
          granted_at: consent.grantedAt?.toISOString(),
          revoked_at: consent.revokedAt?.toISOString(),
          legal_basis: consent.legalBasis,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error recording consent:', error);
      throw new Error('Failed to record consent');
    }
  }

  /**
   * Check if user has given consent for specific purpose
   */
  async hasConsent(userId: string, purpose: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('gdpr_consent_records')
        .select('granted, revoked_at')
        .eq('user_id', userId)
        .eq('purpose', purpose)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return false;
      }

      return data.granted && !data.revoked_at;
    } catch (error) {
      console.error('Error checking consent:', error);
      return false;
    }
  }

  /**
   * Apply data retention policies
   */
  async applyRetentionPolicies(): Promise<{
    purgedRecords: Record<string, number>;
    errors: string[];
  }> {
    const purgedRecords: Record<string, number> = {};
    const errors: string[] = [];

    try {
      // Get retention policies
      const { data: policies } = await this.supabase
        .from('gdpr_retention_policies')
        .select('*')
        .eq('auto_delete', true);

      for (const policy of policies || []) {
        try {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - policy.retention_days);

          let deletedCount = 0;

          switch (policy.data_type) {
            case 'email_logs':
              const { data: deletedLogs } = await this.supabase
                .from('email_logs')
                .delete()
                .lt('sent_at', cutoffDate.toISOString())
                .select('id');
              deletedCount = deletedLogs?.length || 0;
              break;

            case 'test_emails':
              const { data: deletedTests } = await this.supabase
                .from('email_logs')
                .delete()
                .eq('is_test', true)
                .lt('sent_at', cutoffDate.toISOString())
                .select('id');
              deletedCount = deletedTests?.length || 0;
              break;

            case 'audit_logs':
              const { data: deletedAudits } = await this.supabase
                .from('admin_audit_logs')
                .delete()
                .lt('timestamp', cutoffDate.toISOString())
                .select('id');
              deletedCount = deletedAudits?.length || 0;
              break;
          }

          purgedRecords[policy.data_type] = deletedCount;
        } catch (policyError) {
          errors.push(`Failed to apply retention policy for ${policy.data_type}: ${policyError}`);
        }
      }

      return { purgedRecords, errors };
    } catch (error) {
      console.error('Error applying retention policies:', error);
      return {
        purgedRecords: {},
        errors: ['Failed to apply retention policies']
      };
    }
  }

  /**
   * Generate GDPR compliance report
   */
  async generateComplianceReport(): Promise<{
    summary: Record<string, any>;
    dataInventory: any[];
    consentStatus: any[];
    retentionCompliance: any[];
  }> {
    try {
      // Data inventory
      const { data: emailLogs } = await this.supabase
        .from('email_logs')
        .select('template_type, count(*)')
        .group('template_type');

      const { data: templates } = await this.supabase
        .from('email_templates')
        .select('type, count(*)')
        .group('type');

      // Consent status
      const { data: consentStats } = await this.supabase
        .from('gdpr_consent_records')
        .select('purpose, granted, count(*)')
        .group('purpose, granted');

      // Retention compliance
      const { data: retentionStatus } = await this.supabase
        .from('gdpr_retention_policies')
        .select('*');

      return {
        summary: {
          totalEmailLogs: emailLogs?.reduce((sum, item) => sum + item.count, 0) || 0,
          totalTemplates: templates?.reduce((sum, item) => sum + item.count, 0) || 0,
          activeRetentionPolicies: retentionStatus?.length || 0,
          lastComplianceCheck: new Date().toISOString()
        },
        dataInventory: [...(emailLogs || []), ...(templates || [])],
        consentStatus: consentStats || [],
        retentionCompliance: retentionStatus || []
      };
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw new Error('Failed to generate compliance report');
    }
  }

  /**
   * Classify personal data field type
   */
  private classifyPersonalDataField(fieldName: string): PersonalDataField | null {
    const field = fieldName.toLowerCase();
    
    if (field.includes('email')) {
      return {
        field: fieldName,
        type: 'email',
        required: true,
        purpose: 'Communication',
        retention: 365
      };
    }
    
    if (field.includes('name') || field.includes('first') || field.includes('last')) {
      return {
        field: fieldName,
        type: 'name',
        required: false,
        purpose: 'Personalization',
        retention: 365
      };
    }
    
    if (field.includes('phone') || field.includes('mobile')) {
      return {
        field: fieldName,
        type: 'phone',
        required: false,
        purpose: 'Communication',
        retention: 365
      };
    }
    
    if (field.includes('address') || field.includes('street') || field.includes('city')) {
      return {
        field: fieldName,
        type: 'address',
        required: false,
        purpose: 'Service delivery',
        retention: 365
      };
    }
    
    if (field.includes('id') || field.includes('user') || field.includes('customer')) {
      return {
        field: fieldName,
        type: 'identifier',
        required: false,
        purpose: 'Account management',
        retention: 365
      };
    }
    
    return null;
  }

  /**
   * Check if template type requires explicit consent
   */
  private requiresExplicitConsent(templateType: string, personalDataFields: PersonalDataField[]): boolean {
    const marketingTypes = ['marketing', 'newsletter', 'promotional'];
    const hasSensitiveData = personalDataFields.some(field => 
      ['phone', 'address'].includes(field.type)
    );
    
    return marketingTypes.includes(templateType) || hasSensitiveData;
  }

  /**
   * Check if template has consent reference
   */
  private hasConsentReference(content: string): boolean {
    const consentKeywords = [
      'consent', 'permission', 'opt.?in', 'agree', 'terms',
      'privacy policy', 'data protection', 'unsubscribe'
    ];
    
    return consentKeywords.some(keyword => 
      new RegExp(keyword, 'i').test(content)
    );
  }

  /**
   * Anonymize log data
   */
  private anonymizeLogData(log: any): any {
    return {
      ...log,
      recipient_email: this.anonymizeEmail(log.recipient_email),
      subject: 'ANONYMIZED',
      metadata: {
        ...log.metadata,
        anonymized: true,
        anonymized_at: new Date().toISOString()
      }
    };
  }

  /**
   * Anonymize email address
   */
  private anonymizeEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return 'anonymized@example.com';
    }
    
    const [local, domain] = email.split('@');
    const anonymizedLocal = local.length > 2 
      ? local.substring(0, 2) + '*'.repeat(local.length - 2)
      : '**';
    
    return `${anonymizedLocal}@${domain}`;
  }

  /**
   * Verify deletion request token
   */
  private async verifyDeletionRequest(userId: string, token: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('gdpr_deletion_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('verification_token', token)
        .eq('status', 'verified')
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('Error verifying deletion request:', error);
      return false;
    }
  }
}

// Export singleton instance
export const gdprService = new GDPRComplianceService();