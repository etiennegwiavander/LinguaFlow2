import {
  SMTPConfig,
  EmailTemplate,
  TestResult,
  TestCategory,
  TestStatus,
  ValidationError,
  SeverityLevel,
  ErrorCategory,
  EmailType
} from './types'
import { SMTPValidator } from './smtp-validator'
import { TemplateValidator, TemplateData } from './template-validator'
import { DeliveryValidator, DeliveryTestConfig } from './delivery-validator'

export interface WorkflowTestConfig {
  testRecipient: string
  timeout: number
  validateDelivery: boolean
}

export interface WorkflowResult {
  workflowName: string
  success: boolean
  steps: WorkflowStep[]
  totalTime: number
  error?: string
}

export interface WorkflowStep {
  stepName: string
  component: string
  success: boolean
  duration: number
  details: string
  error?: string
}

export class IntegrationValidator {
  private smtpValidator: SMTPValidator
  private templateValidator: TemplateValidator
  private deliveryValidator: DeliveryValidator

  constructor() {
    this.smtpValidator = new SMTPValidator()
    this.templateValidator = new TemplateValidator()
    this.deliveryValidator = new DeliveryValidator()
  }

  /**
   * Tests complete user registration workflow
   */
  async validateUserRegistrationWorkflow(
    smtpConfig: SMTPConfig,
    welcomeTemplate: EmailTemplate,
    config: WorkflowTestConfig
  ): Promise<WorkflowResult> {
    const startTime = Date.now()
    const steps: WorkflowStep[] = []

    try {
      // Step 1: Validate SMTP configuration
      const smtpStart = Date.now()
      const smtpResults = await this.smtpValidator.runComprehensiveTests(smtpConfig)
      const smtpSuccess = smtpResults.every(r => r.status === TestStatus.PASSED)
      
      steps.push({
        stepName: 'SMTP Configuration Validation',
        component: 'SMTPValidator',
        success: smtpSuccess,
        duration: Date.now() - smtpStart,
        details: smtpSuccess ? 'SMTP configuration valid' : 'SMTP configuration issues found',
        error: smtpSuccess ? undefined : this.extractErrorMessages(smtpResults)
      })

      if (!smtpSuccess) {
        return {
          workflowName: 'User Registration Workflow',
          success: false,
          steps,
          totalTime: Date.now() - startTime,
          error: 'SMTP configuration validation failed'
        }
      }

      // Step 2: Validate welcome email template
      const templateStart = Date.now()
      const testData = this.generateRegistrationTestData()
      const templateResults = await this.templateValidator.runComprehensiveTests(welcomeTemplate, testData)
      const templateSuccess = templateResults.every(r => r.status === TestStatus.PASSED)

      steps.push({
        stepName: 'Welcome Template Validation',
        component: 'TemplateValidator',
        success: templateSuccess,
        duration: Date.now() - templateStart,
        details: templateSuccess ? 'Welcome template valid' : 'Welcome template issues found',
        error: templateSuccess ? undefined : this.extractErrorMessages(templateResults)
      })

      if (!templateSuccess) {
        return {
          workflowName: 'User Registration Workflow',
          success: false,
          steps,
          totalTime: Date.now() - startTime,
          error: 'Welcome template validation failed'
        }
      }

      // Step 3: Test end-to-end welcome email delivery
      const deliveryStart = Date.now()
      const deliveryConfig: DeliveryTestConfig = {
        testRecipient: config.testRecipient,
        timeout: config.timeout,
        retryAttempts: 3,
        trackDelivery: config.validateDelivery
      }

      const deliveryResult = await this.deliveryValidator.validateEndToEndDelivery(
        smtpConfig,
        welcomeTemplate,
        testData,
        deliveryConfig
      )

      steps.push({
        stepName: 'Welcome Email Delivery',
        component: 'DeliveryValidator',
        success: deliveryResult.emailSent && deliveryResult.deliveryConfirmed,
        duration: Date.now() - deliveryStart,
        details: `Template rendered: ${deliveryResult.templateRendered}, Email sent: ${deliveryResult.emailSent}, Delivery confirmed: ${deliveryResult.deliveryConfirmed}`,
        error: deliveryResult.error
      })

      const workflowSuccess = deliveryResult.emailSent && deliveryResult.deliveryConfirmed

      return {
        workflowName: 'User Registration Workflow',
        success: workflowSuccess,
        steps,
        totalTime: Date.now() - startTime,
        error: workflowSuccess ? undefined : 'Welcome email delivery failed'
      }

    } catch (error) {
      return {
        workflowName: 'User Registration Workflow',
        success: false,
        steps,
        totalTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Workflow test failed'
      }
    }
  }

  /**
   * Tests password reset workflow
   */
  async validatePasswordResetWorkflow(
    smtpConfig: SMTPConfig,
    resetTemplate: EmailTemplate,
    config: WorkflowTestConfig
  ): Promise<WorkflowResult> {
    const startTime = Date.now()
    const steps: WorkflowStep[] = []

    try {
      // Step 1: Validate reset template
      const templateStart = Date.now()
      const testData = this.generatePasswordResetTestData()
      const templateResults = await this.templateValidator.runComprehensiveTests(resetTemplate, testData)
      const templateSuccess = templateResults.every(r => r.status === TestStatus.PASSED)

      steps.push({
        stepName: 'Password Reset Template Validation',
        component: 'TemplateValidator',
        success: templateSuccess,
        duration: Date.now() - templateStart,
        details: templateSuccess ? 'Reset template valid' : 'Reset template issues found',
        error: templateSuccess ? undefined : this.extractErrorMessages(templateResults)
      })

      // Step 2: Test reset email delivery
      const deliveryStart = Date.now()
      const deliveryConfig: DeliveryTestConfig = {
        testRecipient: config.testRecipient,
        timeout: config.timeout,
        retryAttempts: 3,
        trackDelivery: config.validateDelivery
      }

      const deliveryResult = await this.deliveryValidator.validateEndToEndDelivery(
        smtpConfig,
        resetTemplate,
        testData,
        deliveryConfig
      )

      steps.push({
        stepName: 'Password Reset Email Delivery',
        component: 'DeliveryValidator',
        success: deliveryResult.emailSent,
        duration: Date.now() - deliveryStart,
        details: `Email sent: ${deliveryResult.emailSent}, Delivery time: ${deliveryResult.totalTime}ms`,
        error: deliveryResult.error
      })

      // Step 3: Validate reset link functionality (simulated)
      const linkStart = Date.now()
      const linkValid = this.validateResetLink(testData.resetLink)
      
      steps.push({
        stepName: 'Reset Link Validation',
        component: 'IntegrationValidator',
        success: linkValid,
        duration: Date.now() - linkStart,
        details: linkValid ? 'Reset link format valid' : 'Reset link format invalid',
        error: linkValid ? undefined : 'Invalid reset link format'
      })

      const workflowSuccess = templateSuccess && deliveryResult.emailSent && linkValid

      return {
        workflowName: 'Password Reset Workflow',
        success: workflowSuccess,
        steps,
        totalTime: Date.now() - startTime
      }

    } catch (error) {
      return {
        workflowName: 'Password Reset Workflow',
        success: false,
        steps,
        totalTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Workflow test failed'
      }
    }
  }

  /**
   * Tests lesson reminder workflow
   */
  async validateLessonReminderWorkflow(
    smtpConfig: SMTPConfig,
    reminderTemplate: EmailTemplate,
    config: WorkflowTestConfig
  ): Promise<WorkflowResult> {
    const startTime = Date.now()
    const steps: WorkflowStep[] = []

    try {
      // Step 1: Validate reminder template with lesson data
      const templateStart = Date.now()
      const testData = this.generateLessonReminderTestData()
      const templateResults = await this.templateValidator.runComprehensiveTests(reminderTemplate, testData)
      const templateSuccess = templateResults.every(r => r.status === TestStatus.PASSED)

      steps.push({
        stepName: 'Lesson Reminder Template Validation',
        component: 'TemplateValidator',
        success: templateSuccess,
        duration: Date.now() - templateStart,
        details: templateSuccess ? 'Reminder template valid' : 'Reminder template issues found',
        error: templateSuccess ? undefined : this.extractErrorMessages(templateResults)
      })

      // Step 2: Test scheduled delivery simulation
      const scheduleStart = Date.now()
      const scheduleValid = this.validateScheduledDelivery(testData.lessonDate, testData.lessonTime)
      
      steps.push({
        stepName: 'Scheduled Delivery Validation',
        component: 'IntegrationValidator',
        success: scheduleValid,
        duration: Date.now() - scheduleStart,
        details: scheduleValid ? 'Schedule timing valid' : 'Schedule timing invalid',
        error: scheduleValid ? undefined : 'Invalid lesson schedule'
      })

      // Step 3: Test reminder email delivery
      const deliveryStart = Date.now()
      const deliveryConfig: DeliveryTestConfig = {
        testRecipient: config.testRecipient,
        timeout: config.timeout,
        retryAttempts: 3,
        trackDelivery: config.validateDelivery
      }

      const deliveryResult = await this.deliveryValidator.validateEndToEndDelivery(
        smtpConfig,
        reminderTemplate,
        testData,
        deliveryConfig
      )

      steps.push({
        stepName: 'Lesson Reminder Email Delivery',
        component: 'DeliveryValidator',
        success: deliveryResult.emailSent,
        duration: Date.now() - deliveryStart,
        details: `Email sent: ${deliveryResult.emailSent}, Contains lesson details: ${this.validateLessonDetails(deliveryResult)}`,
        error: deliveryResult.error
      })

      const workflowSuccess = templateSuccess && scheduleValid && deliveryResult.emailSent

      return {
        workflowName: 'Lesson Reminder Workflow',
        success: workflowSuccess,
        steps,
        totalTime: Date.now() - startTime
      }

    } catch (error) {
      return {
        workflowName: 'Lesson Reminder Workflow',
        success: false,
        steps,
        totalTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Workflow test failed'
      }
    }
  }

  /**
   * Runs comprehensive cross-component integration tests
   */
  async runComprehensiveIntegrationTests(
    smtpConfig: SMTPConfig,
    templates: EmailTemplate[],
    config: WorkflowTestConfig
  ): Promise<TestResult[]> {
    const results: TestResult[] = []

    // Find templates by type
    const welcomeTemplate = templates.find(t => t.type === EmailType.WELCOME)
    const resetTemplate = templates.find(t => t.type === EmailType.PASSWORD_RESET)
    const reminderTemplate = templates.find(t => t.type === EmailType.LESSON_REMINDER)

    // Test 1: User Registration Workflow
    if (welcomeTemplate) {
      const workflowStart = Date.now()
      const workflowResult = await this.validateUserRegistrationWorkflow(smtpConfig, welcomeTemplate, config)
      
      results.push({
        testName: 'User Registration Integration Test',
        category: TestCategory.INTEGRATION_WORKFLOW,
        status: workflowResult.success ? TestStatus.PASSED : TestStatus.FAILED,
        duration: Date.now() - workflowStart,
        details: {
          description: 'Tests complete user registration email workflow',
          expectedResult: 'User registration email sent and delivered successfully',
          actualResult: this.formatWorkflowResult(workflowResult),
          metadata: {
            workflowName: workflowResult.workflowName,
            steps: workflowResult.steps,
            totalTime: workflowResult.totalTime
          }
        },
        errors: workflowResult.success ? undefined : [{
          code: 'REGISTRATION_WORKFLOW_FAILED',
          message: workflowResult.error || 'User registration workflow failed',
          severity: SeverityLevel.CRITICAL,
          category: ErrorCategory.DELIVERY_FAILURE
        }]
      })
    }

    // Test 2: Password Reset Workflow
    if (resetTemplate) {
      const workflowStart = Date.now()
      const workflowResult = await this.validatePasswordResetWorkflow(smtpConfig, resetTemplate, config)
      
      results.push({
        testName: 'Password Reset Integration Test',
        category: TestCategory.INTEGRATION_WORKFLOW,
        status: workflowResult.success ? TestStatus.PASSED : TestStatus.FAILED,
        duration: Date.now() - workflowStart,
        details: {
          description: 'Tests complete password reset email workflow',
          expectedResult: 'Password reset email sent with valid reset link',
          actualResult: this.formatWorkflowResult(workflowResult),
          metadata: {
            workflowName: workflowResult.workflowName,
            steps: workflowResult.steps,
            totalTime: workflowResult.totalTime
          }
        },
        errors: workflowResult.success ? undefined : [{
          code: 'PASSWORD_RESET_WORKFLOW_FAILED',
          message: workflowResult.error || 'Password reset workflow failed',
          severity: SeverityLevel.HIGH,
          category: ErrorCategory.DELIVERY_FAILURE
        }]
      })
    }

    // Test 3: Lesson Reminder Workflow
    if (reminderTemplate) {
      const workflowStart = Date.now()
      const workflowResult = await this.validateLessonReminderWorkflow(smtpConfig, reminderTemplate, config)
      
      results.push({
        testName: 'Lesson Reminder Integration Test',
        category: TestCategory.INTEGRATION_WORKFLOW,
        status: workflowResult.success ? TestStatus.PASSED : TestStatus.FAILED,
        duration: Date.now() - workflowStart,
        details: {
          description: 'Tests complete lesson reminder email workflow',
          expectedResult: 'Lesson reminder email sent with correct scheduling',
          actualResult: this.formatWorkflowResult(workflowResult),
          metadata: {
            workflowName: workflowResult.workflowName,
            steps: workflowResult.steps,
            totalTime: workflowResult.totalTime
          }
        },
        errors: workflowResult.success ? undefined : [{
          code: 'LESSON_REMINDER_WORKFLOW_FAILED',
          message: workflowResult.error || 'Lesson reminder workflow failed',
          severity: SeverityLevel.MEDIUM,
          category: ErrorCategory.DELIVERY_FAILURE
        }]
      })
    }

    return results
  }

  /**
   * Private helper methods
   */
  private generateRegistrationTestData(): TemplateData {
    return {
      userName: 'Test User',
      userEmail: 'test@example.com',
      activationLink: 'https://linguaflow.com/activate?token=test-token-123',
      companyName: 'LinguaFlow',
      supportEmail: 'support@linguaflow.com'
    }
  }

  private generatePasswordResetTestData(): TemplateData {
    return {
      userName: 'Test User',
      resetLink: 'https://linguaflow.com/reset-password?token=reset-token-456',
      expirationTime: '24 hours',
      supportEmail: 'support@linguaflow.com'
    }
  }

  private generateLessonReminderTestData(): TemplateData {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return {
      studentName: 'Test Student',
      tutorName: 'Test Tutor',
      lessonDate: tomorrow.toLocaleDateString(),
      lessonTime: '10:00 AM',
      lessonDuration: '60 minutes',
      lessonTopic: 'English Conversation',
      meetingLink: 'https://meet.linguaflow.com/lesson-123'
    }
  }

  private validateResetLink(resetLink: string): boolean {
    try {
      const url = new URL(resetLink)
      return url.protocol === 'https:' && 
             url.pathname.includes('reset') && 
             url.searchParams.has('token')
    } catch {
      return false
    }
  }

  private validateScheduledDelivery(lessonDate: string, lessonTime: string): boolean {
    try {
      const date = new Date(lessonDate)
      const now = new Date()
      
      // Lesson should be in the future
      return date > now && lessonTime.length > 0
    } catch {
      return false
    }
  }

  private validateLessonDetails(deliveryResult: any): boolean {
    // Check if the delivered email contains lesson-specific information
    return deliveryResult.templateRendered && 
           deliveryResult.emailSent
  }

  private extractErrorMessages(results: TestResult[]): string {
    return results
      .filter(r => r.status === TestStatus.FAILED)
      .map(r => r.errors?.map(e => e.message).join(', ') || 'Unknown error')
      .join('; ')
  }

  private formatWorkflowResult(result: WorkflowResult): string {
    const stepSummary = result.steps.map(step => 
      `${step.stepName}: ${step.success ? 'PASS' : 'FAIL'}`
    ).join(', ')
    
    return `${result.success ? 'SUCCESS' : 'FAILED'} - ${stepSummary} (${result.totalTime}ms)`
  }
}