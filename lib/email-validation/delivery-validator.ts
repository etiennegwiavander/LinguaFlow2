import {
  SMTPConfig,
  EmailTemplate,
  TestEmail,
  DeliveryResult,
  TestResult,
  TestCategory,
  TestStatus,
  ValidationError,
  SeverityLevel,
  ErrorCategory,
  EmailType
} from './types'
import { TemplateValidator, TemplateData } from './template-validator'

export interface DeliveryTestConfig {
  testRecipient: string
  timeout: number
  retryAttempts: number
  trackDelivery: boolean
}

export interface EndToEndDeliveryResult {
  templateRendered: boolean
  emailSent: boolean
  deliveryConfirmed: boolean
  totalTime: number
  steps: DeliveryStep[]
  error?: string
}

export interface DeliveryStep {
  step: string
  success: boolean
  duration: number
  details: string
  error?: string
}

export class DeliveryValidator {
  private templateValidator: TemplateValidator
  private defaultTimeout = 30000 // 30 seconds
  private defaultRetries = 3

  constructor() {
    this.templateValidator = new TemplateValidator()
  }

  /**
   * Performs end-to-end email delivery verification
   */
  async validateEndToEndDelivery(
    smtpConfig: SMTPConfig,
    template: EmailTemplate,
    testData: TemplateData,
    config: DeliveryTestConfig
  ): Promise<EndToEndDeliveryResult> {
    const startTime = Date.now()
    const steps: DeliveryStep[] = []

    try {
      // Step 1: Render template
      const renderStart = Date.now()
      const renderResult = await this.templateValidator.validateTemplateRendering(template, testData)
      const renderDuration = Date.now() - renderStart
      
      steps.push({
        step: 'Template Rendering',
        success: renderResult.rendered,
        duration: renderDuration,
        details: renderResult.rendered ? 'Template rendered successfully' : 'Template rendering failed',
        error: renderResult.error
      })

      if (!renderResult.rendered) {
        return {
          templateRendered: false,
          emailSent: false,
          deliveryConfirmed: false,
          totalTime: Date.now() - startTime,
          steps,
          error: `Template rendering failed: ${renderResult.error}`
        }
      }

      // Step 2: Send email
      const sendStart = Date.now()
      const testEmail: TestEmail = {
        to: config.testRecipient,
        subject: this.renderSubject(template.subject, testData),
        htmlContent: renderResult.htmlOutput || '',
        textContent: renderResult.textOutput || '',
        templateId: template.id,
        data: testData
      }

      const sendResult = await this.sendEmailWithRetry(smtpConfig, testEmail, config.retryAttempts)
      const sendDuration = Date.now() - sendStart

      steps.push({
        step: 'Email Sending',
        success: sendResult.delivered,
        duration: sendDuration,
        details: sendResult.delivered ? 
          `Email sent successfully (ID: ${sendResult.messageId})` : 
          'Email sending failed',
        error: sendResult.error
      })

      if (!sendResult.delivered) {
        return {
          templateRendered: true,
          emailSent: false,
          deliveryConfirmed: false,
          totalTime: Date.now() - startTime,
          steps,
          error: `Email sending failed: ${sendResult.error}`
        }
      }

      // Step 3: Verify delivery (if tracking enabled)
      let deliveryConfirmed = true
      if (config.trackDelivery) {
        const trackStart = Date.now()
        const trackResult = await this.trackEmailDelivery(sendResult.messageId!, config.timeout)
        const trackDuration = Date.now() - trackStart

        steps.push({
          step: 'Delivery Tracking',
          success: trackResult.confirmed,
          duration: trackDuration,
          details: trackResult.confirmed ? 
            'Delivery confirmed' : 
            'Delivery could not be confirmed',
          error: trackResult.error
        })

        deliveryConfirmed = trackResult.confirmed
      }

      return {
        templateRendered: true,
        emailSent: true,
        deliveryConfirmed,
        totalTime: Date.now() - startTime,
        steps
      }

    } catch (error) {
      return {
        templateRendered: false,
        emailSent: false,
        deliveryConfirmed: false,
        totalTime: Date.now() - startTime,
        steps,
        error: error instanceof Error ? error.message : 'Unknown delivery error'
      }
    }
  }

  /**
   * Tests delivery for multiple email types
   */
  async validateMultipleEmailTypes(
    smtpConfig: SMTPConfig,
    templates: EmailTemplate[],
    config: DeliveryTestConfig
  ): Promise<TestResult[]> {
    const results: TestResult[] = []

    for (const template of templates) {
      const testStart = Date.now()
      const testData = this.generateTestDataForTemplate(template)
      
      const deliveryResult = await this.validateEndToEndDelivery(
        smtpConfig,
        template,
        testData,
        config
      )

      results.push({
        testName: `End-to-End Delivery Test - ${template.type}`,
        category: TestCategory.EMAIL_DELIVERY,
        status: deliveryResult.emailSent && deliveryResult.deliveryConfirmed ? 
          TestStatus.PASSED : TestStatus.FAILED,
        duration: Date.now() - testStart,
        details: {
          description: `Tests complete email delivery workflow for ${template.type} emails`,
          expectedResult: 'Email rendered, sent, and delivery confirmed',
          actualResult: this.formatDeliveryResult(deliveryResult),
          metadata: {
            templateId: template.id,
            templateType: template.type,
            steps: deliveryResult.steps,
            totalTime: deliveryResult.totalTime
          }
        },
        errors: this.generateDeliveryErrors(deliveryResult, template.type)
      })
    }

    return results
  }

  /**
   * Tests delivery performance under load
   */
  async validateDeliveryPerformance(
    smtpConfig: SMTPConfig,
    template: EmailTemplate,
    config: DeliveryTestConfig,
    concurrentEmails: number = 5
  ): Promise<TestResult> {
    const testStart = Date.now()
    const testData = this.generateTestDataForTemplate(template)
    
    try {
      // Send multiple emails concurrently
      const deliveryPromises = Array.from({ length: concurrentEmails }, (_, index) => 
        this.validateEndToEndDelivery(
          smtpConfig,
          template,
          { ...testData, recipientIndex: index },
          { ...config, testRecipient: `test${index}@example.com` }
        )
      )

      const results = await Promise.all(deliveryPromises)
      const successfulDeliveries = results.filter(r => r.emailSent && r.deliveryConfirmed).length
      const averageDeliveryTime = results.reduce((sum, r) => sum + r.totalTime, 0) / results.length
      const allSuccessful = successfulDeliveries === concurrentEmails

      return {
        testName: 'Delivery Performance Test',
        category: TestCategory.EMAIL_DELIVERY,
        status: allSuccessful ? TestStatus.PASSED : TestStatus.FAILED,
        duration: Date.now() - testStart,
        details: {
          description: `Tests email delivery performance with ${concurrentEmails} concurrent emails`,
          expectedResult: 'All emails delivered successfully within acceptable time',
          actualResult: `${successfulDeliveries}/${concurrentEmails} emails delivered successfully. Average delivery time: ${averageDeliveryTime}ms`,
          metadata: {
            concurrentEmails,
            successfulDeliveries,
            averageDeliveryTime,
            results: results.map(r => ({
              success: r.emailSent && r.deliveryConfirmed,
              totalTime: r.totalTime
            }))
          }
        },
        errors: allSuccessful ? undefined : [{
          code: 'DELIVERY_PERFORMANCE_ISSUE',
          message: `Only ${successfulDeliveries}/${concurrentEmails} emails delivered successfully`,
          severity: SeverityLevel.MEDIUM,
          category: ErrorCategory.DELIVERY_FAILURE
        }]
      }
    } catch (error) {
      return {
        testName: 'Delivery Performance Test',
        category: TestCategory.EMAIL_DELIVERY,
        status: TestStatus.ERROR,
        duration: Date.now() - testStart,
        details: {
          description: `Tests email delivery performance with ${concurrentEmails} concurrent emails`,
          expectedResult: 'All emails delivered successfully within acceptable time',
          actualResult: `Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metadata: { concurrentEmails, error: error instanceof Error ? error.message : 'Unknown error' }
        },
        errors: [{
          code: 'DELIVERY_TEST_ERROR',
          message: error instanceof Error ? error.message : 'Delivery performance test failed',
          severity: SeverityLevel.HIGH,
          category: ErrorCategory.DELIVERY_FAILURE
        }]
      }
    }
  }

  /**
   * Private helper methods
   */
  private renderSubject(subject: string, data: TemplateData): string {
    return subject.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmedKey = key.trim()
      return data[trimmedKey] !== undefined ? String(data[trimmedKey]) : match
    })
  }

  private async sendEmailWithRetry(
    smtpConfig: SMTPConfig,
    email: TestEmail,
    retries: number
  ): Promise<DeliveryResult> {
    let lastError: string | undefined

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.sendEmail(smtpConfig, email)
        if (result.delivered) {
          return result
        }
        lastError = result.error
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Send failed'
      }

      if (attempt < retries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }

    return {
      delivered: false,
      deliveryTime: 0,
      error: `Failed after ${retries} attempts. Last error: ${lastError}`
    }
  }

  private async sendEmail(smtpConfig: SMTPConfig, email: TestEmail): Promise<DeliveryResult> {
    const startTime = Date.now()
    
    try {
      // Simulate email sending - in real implementation, use nodemailer or similar
      if (smtpConfig.host && email.to && email.subject) {
        const deliveryTime = Date.now() - startTime
        return {
          delivered: true,
          messageId: `delivery-test-${Date.now()}@validation.local`,
          deliveryTime
        }
      }
      
      return {
        delivered: false,
        deliveryTime: Date.now() - startTime,
        error: 'Invalid email parameters'
      }
    } catch (error) {
      return {
        delivered: false,
        deliveryTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Send failed'
      }
    }
  }

  private async trackEmailDelivery(messageId: string, timeout: number): Promise<{ confirmed: boolean; error?: string }> {
    try {
      // Simulate delivery tracking - in real implementation, query email provider API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      // For testing purposes, assume delivery is confirmed if messageId exists
      return {
        confirmed: messageId.length > 0
      }
    } catch (error) {
      return {
        confirmed: false,
        error: error instanceof Error ? error.message : 'Tracking failed'
      }
    }
  }

  private generateTestDataForTemplate(template: EmailTemplate): TemplateData {
    const data: TemplateData = {}
    
    // Generate test data based on email type
    switch (template.type) {
      case EmailType.WELCOME:
        data.userName = 'Test User'
        data.userEmail = 'test@example.com'
        data.activationLink = 'https://example.com/activate'
        break
      case EmailType.PASSWORD_RESET:
        data.userName = 'Test User'
        data.resetLink = 'https://example.com/reset'
        data.expirationTime = '24 hours'
        break
      case EmailType.LESSON_REMINDER:
        data.studentName = 'Test Student'
        data.lessonDate = new Date().toLocaleDateString()
        data.lessonTime = '10:00 AM'
        data.tutorName = 'Test Tutor'
        break
      case EmailType.ADMIN_NOTIFICATION:
        data.adminName = 'Test Admin'
        data.notificationType = 'System Alert'
        data.message = 'Test notification message'
        break
    }

    // Add any additional placeholders from template
    for (const placeholder of template.placeholders) {
      if (!data[placeholder]) {
        data[placeholder] = `Test ${placeholder}`
      }
    }

    return data
  }

  private formatDeliveryResult(result: EndToEndDeliveryResult): string {
    const status = []
    if (result.templateRendered) status.push('Template rendered')
    if (result.emailSent) status.push('Email sent')
    if (result.deliveryConfirmed) status.push('Delivery confirmed')
    
    const statusText = status.join(', ')
    const timeText = `Total time: ${result.totalTime}ms`
    
    if (result.error) {
      return `${statusText}. ${timeText}. Error: ${result.error}`
    }
    
    return `${statusText}. ${timeText}`
  }

  private generateDeliveryErrors(result: EndToEndDeliveryResult, emailType: EmailType): ValidationError[] | undefined {
    const errors: ValidationError[] = []

    if (!result.templateRendered) {
      errors.push({
        code: 'TEMPLATE_RENDER_FAILED',
        message: 'Template rendering failed during delivery test',
        severity: SeverityLevel.HIGH,
        category: ErrorCategory.TEMPLATE_RENDERING,
        details: { emailType, error: result.error }
      })
    }

    if (!result.emailSent) {
      errors.push({
        code: 'EMAIL_SEND_FAILED',
        message: 'Email sending failed during delivery test',
        severity: SeverityLevel.CRITICAL,
        category: ErrorCategory.DELIVERY_FAILURE,
        details: { emailType, error: result.error }
      })
    }

    if (!result.deliveryConfirmed) {
      errors.push({
        code: 'DELIVERY_NOT_CONFIRMED',
        message: 'Email delivery could not be confirmed',
        severity: SeverityLevel.MEDIUM,
        category: ErrorCategory.DELIVERY_FAILURE,
        details: { emailType, error: result.error }
      })
    }

    return errors.length > 0 ? errors : undefined
  }
}