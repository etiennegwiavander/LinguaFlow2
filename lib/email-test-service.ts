/**
 * Email Test Service
 * Provides utilities for testing email functionality
 * Simplified version using mock data
 */

export interface TestEmailRequest {
  templateId: string;
  recipientEmail: string;
  testParameters: Record<string, any>;
}

export interface TestEmailResult {
  testId: string;
  status: 'pending' | 'sent' | 'failed';
  message?: string;
  previewHtml?: string;
}

export interface TestEmailStatus {
  testId: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  recipientEmail: string;
  subject: string;
  sentAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
  errorCode?: string;
  retryAttempts?: number;
  metadata?: Record<string, any>;
}

export interface TestEmailHistory {
  tests: TestEmailStatus[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export class EmailTestService {
  /**
   * Send a test email (mock implementation)
   */
  async sendTestEmail(request: TestEmailRequest): Promise<TestEmailResult> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock test result
      const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const success = Math.random() > 0.2; // 80% success rate
      
      return {
        testId,
        status: success ? 'sent' : 'failed',
        message: success ? 'Test email sent successfully' : 'Failed to send test email',
        previewHtml: `<h1>Test Email</h1><p>Template: ${request.templateId}</p><p>Recipient: ${request.recipientEmail}</p>`
      };
    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  }

  /**
   * Get test email status (mock implementation)
   */
  async getTestStatus(testId: string): Promise<TestEmailStatus> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate mock status
      const statuses: TestEmailStatus['status'][] = ['delivered', 'sent', 'failed', 'pending'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      return {
        testId,
        status,
        recipientEmail: 'test@example.com',
        subject: 'Test Email Subject',
        sentAt: status !== 'pending' ? new Date().toISOString() : undefined,
        deliveredAt: status === 'delivered' ? new Date().toISOString() : undefined,
        errorMessage: status === 'failed' ? 'SMTP connection failed' : undefined,
        retryAttempts: status === 'failed' ? 1 : 0,
        metadata: { testMode: true }
      };
    } catch (error) {
      console.error('Error getting test status:', error);
      throw error;
    }
  }

  /**
   * Get test email history (mock implementation)
   */
  async getTestHistory(
    page: number = 1, 
    pageSize: number = 20,
    filters?: {
      templateType?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<TestEmailHistory> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate mock test history
      const tests: TestEmailStatus[] = [];
      const totalCount = Math.floor(Math.random() * 50) + 10;
      const itemsToShow = Math.min(pageSize, totalCount - (page - 1) * pageSize);
      
      for (let i = 0; i < itemsToShow; i++) {
        const testId = `test-${Date.now() - i * 60000}-${Math.random().toString(36).substr(2, 9)}`;
        const statuses: TestEmailStatus['status'][] = ['delivered', 'sent', 'failed'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        tests.push({
          testId,
          status,
          recipientEmail: `test${i}@example.com`,
          subject: `Test Email ${i + 1}`,
          sentAt: new Date(Date.now() - i * 60000).toISOString(),
          deliveredAt: status === 'delivered' ? new Date(Date.now() - i * 60000 + 30000).toISOString() : undefined,
          errorMessage: status === 'failed' ? 'Connection timeout' : undefined,
          retryAttempts: status === 'failed' ? Math.floor(Math.random() * 3) : 0,
          metadata: { testMode: true, templateType: filters?.templateType || 'welcome' }
        });
      }
      
      return {
        tests,
        totalCount,
        page,
        pageSize
      };
    } catch (error) {
      console.error('Error getting test history:', error);
      // Return empty history as fallback
      return {
        tests: [],
        totalCount: 0,
        page,
        pageSize
      };
    }
  }

  /**
   * Generate email preview without sending (mock implementation)
   */
  async generatePreview(templateId: string, testParameters: Record<string, any>): Promise<{ subject: string; htmlContent: string; textContent: string }> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Generate mock preview
      const subject = `Test Subject - ${templateId}`;
      const htmlContent = `
        <html>
          <body>
            <h1>Email Preview</h1>
            <p>Template ID: ${templateId}</p>
            <p>Test Parameters:</p>
            <ul>
              ${Object.entries(testParameters).map(([key, value]) => 
                `<li><strong>${key}:</strong> ${value}</li>`
              ).join('')}
            </ul>
            <p>This is a preview of how your email will look.</p>
          </body>
        </html>
      `;
      const textContent = `Email Preview\nTemplate ID: ${templateId}\nTest Parameters: ${JSON.stringify(testParameters, null, 2)}\nThis is a preview of how your email will look.`;
      
      return {
        subject,
        htmlContent,
        textContent
      };
    } catch (error) {
      console.error('Error generating preview:', error);
      throw error;
    }
  }

  /**
   * Validate test parameters against template placeholders (mock implementation)
   */
  async validateTestParameters(templateId: string, testParameters: Record<string, any>): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock validation - assume some common placeholders
      const commonPlaceholders = ['user_name', 'user_email', 'app_name', 'current_year'];
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check for missing common placeholders
      commonPlaceholders.forEach(placeholder => {
        if (!(placeholder in testParameters)) {
          errors.push(`Missing required parameter: ${placeholder}`);
        }
      });

      // Check for extra parameters (just warnings for mock)
      Object.keys(testParameters).forEach(param => {
        if (!commonPlaceholders.includes(param)) {
          warnings.push(`Extra parameter provided: ${param}`);
        }
      });

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      console.error('Error validating test parameters:', error);
      return { isValid: false, errors: ['Validation error'], warnings: [] };
    }
  }
}

// Export singleton instance
export const emailTestService = new EmailTestService();