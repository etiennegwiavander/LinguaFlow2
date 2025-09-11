import {
  ValidationResult,
  ValidationReport,
  ValidationPhase,
  ValidationStatus,
  TestResult,
  SMTPConfig,
  EmailTemplate,
  ValidationSummary,
  ValidationIssue,
  SeverityLevel,
  TestStatus
} from './types'
import { SMTPValidator } from './smtp-validator'
import { TemplateValidator, TemplateData } from './template-validator'
import { DeliveryValidator, DeliveryTestConfig } from './delivery-validator'
import { IntegrationValidator, WorkflowTestConfig } from './integration-validator'

export interface ValidationConfig {
  testRecipient: string
  timeout: number
  validateDelivery: boolean
  skipNonCriticalTests: boolean
  generateDetailedReport: boolean
}

export interface ValidationOptions {
  phases?: ValidationPhase[]
  smtpConfigs?: SMTPConfig[]
  templates?: EmailTemplate[]
  testData?: Record<string, TemplateData>
}

export class EmailValidationOrchestrator {
  private smtpValidator: SMTPValidator
  private templateValidator: TemplateValidator
  private deliveryValidator: DeliveryValidator
  private integrationValidator: IntegrationValidator

  constructor() {
    this.smtpValidator = new SMTPValidator()
    this.templateValidator = new TemplateValidator()
    this.deliveryValidator = new DeliveryValidator()
    this.integrationValidator = new IntegrationValidator()
  }

  /**
   * Runs full email system validation
   */
  async runFullValidation(
    config: ValidationConfig,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    const startTime = Date.now()
    const allResults: TestResult[] = []
    
    try {
      // Default phases if not specified
      const phases = options.phases || [
        ValidationPhase.SMTP_VALIDATION,
        ValidationPhase.TEMPLATE_VALIDATION,
        ValidationPhase.DELIVERY_VALIDATION,
        ValidationPhase.INTEGRATION_VALIDATION
      ]

      // Run each validation phase
      for (const phase of phases) {
        const phaseResults = await this.runValidationPhase(phase, config, options)
        allResults.push(...phaseResults)

        // Stop on critical failures if not skipping
        if (!config.skipNonCriticalTests && this.hasCriticalFailures(phaseResults)) {
          break
        }
      }

      const summary = this.generateValidationSummary(allResults)
      const passed = this.determineOverallStatus(allResults, config.skipNonCriticalTests)

      return {
        passed,
        results: allResults,
        summary,
        timestamp: new Date()
      }

    } catch (error) {
      return {
        passed: false,
        results: allResults,
        summary: this.generateValidationSummary(allResults),
        timestamp: new Date()
      }
    }
  }

  /**
   * Runs validation for specific test types
   */
  async runSpecificTests(
    phases: ValidationPhase[],
    config: ValidationConfig,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    return this.runFullValidation(config, { ...options, phases })
  }

  /**
   * Generates comprehensive validation report
   */
  async generateValidationReport(
    validationResult: ValidationResult,
    config: ValidationConfig
  ): ValidationReport {
    const issues = this.extractValidationIssues(validationResult.results)
    const recommendations = this.generateRecommendations(validationResult.results, issues)

    return {
      id: `validation-${Date.now()}`,
      timestamp: validationResult.timestamp,
      phase: this.determineReportPhase(validationResult.results),
      overallStatus: this.determineValidationStatus(validationResult),
      testResults: validationResult.results,
      issues,
      recommendations
    }
  }

  /**
   * Validates SMTP configurations
   */
  async validateSMTPConfigurations(configs: SMTPConfig[]): Promise<TestResult[]> {
    const results: TestResult[] = []

    for (const config of configs) {
      const configResults = await this.smtpValidator.runComprehensiveTests(config)
      results.push(...configResults)
    }

    return results
  }

  /**
   * Validates email templates
   */
  async validateEmailTemplates(
    templates: EmailTemplate[],
    testData?: Record<string, TemplateData>
  ): Promise<TestResult[]> {
    const results: TestResult[] = []

    for (const template of templates) {
      const data = testData?.[template.id] || undefined
      const templateResults = await this.templateValidator.runComprehensiveTests(template, data)
      results.push(...templateResults)
    }

    return results
  }

  /**
   * Validates email delivery
   */
  async validateEmailDelivery(
    smtpConfig: SMTPConfig,
    templates: EmailTemplate[],
    config: ValidationConfig
  ): Promise<TestResult[]> {
    const deliveryConfig: DeliveryTestConfig = {
      testRecipient: config.testRecipient,
      timeout: config.timeout,
      retryAttempts: 3,
      trackDelivery: config.validateDelivery
    }

    return this.deliveryValidator.validateMultipleEmailTypes(smtpConfig, templates, deliveryConfig)
  }

  /**
   * Validates integration workflows
   */
  async validateIntegrationWorkflows(
    smtpConfig: SMTPConfig,
    templates: EmailTemplate[],
    config: ValidationConfig
  ): Promise<TestResult[]> {
    const workflowConfig: WorkflowTestConfig = {
      testRecipient: config.testRecipient,
      timeout: config.timeout,
      validateDelivery: config.validateDelivery
    }

    return this.integrationValidator.runComprehensiveIntegrationTests(smtpConfig, templates, workflowConfig)
  }

  /**
   * Private helper methods
   */
  private async runValidationPhase(
    phase: ValidationPhase,
    config: ValidationConfig,
    options: ValidationOptions
  ): Promise<TestResult[]> {
    switch (phase) {
      case ValidationPhase.SMTP_VALIDATION:
        if (options.smtpConfigs && options.smtpConfigs.length > 0) {
          return this.validateSMTPConfigurations(options.smtpConfigs)
        }
        return []

      case ValidationPhase.TEMPLATE_VALIDATION:
        if (options.templates && options.templates.length > 0) {
          return this.validateEmailTemplates(options.templates, options.testData)
        }
        return []

      case ValidationPhase.DELIVERY_VALIDATION:
        if (options.smtpConfigs?.[0] && options.templates && options.templates.length > 0) {
          return this.validateEmailDelivery(options.smtpConfigs[0], options.templates, config)
        }
        return []

      case ValidationPhase.INTEGRATION_VALIDATION:
        if (options.smtpConfigs?.[0] && options.templates && options.templates.length > 0) {
          return this.validateIntegrationWorkflows(options.smtpConfigs[0], options.templates, config)
        }
        return []

      default:
        return []
    }
  }

  private generateValidationSummary(results: TestResult[]): ValidationSummary {
    const totalTests = results.length
    const passedTests = results.filter(r => r.status === TestStatus.PASSED).length
    const failedTests = results.filter(r => r.status === TestStatus.FAILED).length
    
    const criticalIssues = results.reduce((count, result) => {
      if (result.errors) {
        return count + result.errors.filter(e => e.severity === SeverityLevel.CRITICAL).length
      }
      return count
    }, 0)

    const warnings = results.reduce((count, result) => {
      if (result.errors) {
        return count + result.errors.filter(e => 
          e.severity === SeverityLevel.MEDIUM || e.severity === SeverityLevel.LOW
        ).length
      }
      return count
    }, 0)

    return {
      totalTests,
      passedTests,
      failedTests,
      criticalIssues,
      warnings
    }
  }

  private determineOverallStatus(results: TestResult[], skipNonCritical: boolean): boolean {
    if (results.length === 0) return false

    const criticalFailures = results.some(result => 
      result.status === TestStatus.FAILED && 
      result.errors?.some(e => e.severity === SeverityLevel.CRITICAL)
    )

    if (criticalFailures) return false

    if (skipNonCritical) {
      // Only check critical tests
      const criticalTests = results.filter(result =>
        result.errors?.some(e => e.severity === SeverityLevel.CRITICAL) || 
        result.status === TestStatus.PASSED
      )
      return criticalTests.every(r => r.status === TestStatus.PASSED)
    }

    // All tests must pass
    return results.every(r => r.status === TestStatus.PASSED)
  }

  private hasCriticalFailures(results: TestResult[]): boolean {
    return results.some(result => 
      result.status === TestStatus.FAILED && 
      result.errors?.some(e => e.severity === SeverityLevel.CRITICAL)
    )
  }

  private extractValidationIssues(results: TestResult[]): ValidationIssue[] {
    const issues: ValidationIssue[] = []

    results.forEach((result, index) => {
      if (result.errors) {
        result.errors.forEach((error, errorIndex) => {
          issues.push({
            id: `issue-${index}-${errorIndex}`,
            category: error.category,
            severity: error.severity,
            description: error.message,
            suggestedFixes: this.generateSuggestedFixes(error),
            resolved: false
          })
        })
      }
    })

    return issues
  }

  private generateSuggestedFixes(error: any): string[] {
    const fixes: string[] = []

    switch (error.code) {
      case 'SMTP_CONNECTION_FAILED':
        fixes.push('Verify SMTP server host and port configuration')
        fixes.push('Check network connectivity to SMTP server')
        fixes.push('Ensure firewall allows SMTP traffic')
        break
      case 'SMTP_AUTH_FAILED':
        fixes.push('Verify SMTP username and password')
        fixes.push('Check if two-factor authentication is required')
        fixes.push('Ensure account has SMTP access enabled')
        break
      case 'TEMPLATE_RENDER_FAILED':
        fixes.push('Check template syntax for errors')
        fixes.push('Verify all required data is provided')
        fixes.push('Test template with sample data')
        break
      case 'EMAIL_DELIVERY_FAILED':
        fixes.push('Check SMTP configuration and authentication')
        fixes.push('Verify recipient email address format')
        fixes.push('Check email content for spam triggers')
        break
      default:
        fixes.push('Review error details and system logs')
        fixes.push('Contact system administrator if issue persists')
    }

    return fixes
  }

  private generateRecommendations(results: TestResult[], issues: ValidationIssue[]): string[] {
    const recommendations: string[] = []

    // Critical issues recommendations
    const criticalIssues = issues.filter(i => i.severity === SeverityLevel.CRITICAL)
    if (criticalIssues.length > 0) {
      recommendations.push(`Address ${criticalIssues.length} critical issues before deployment`)
    }

    // Performance recommendations
    const slowTests = results.filter(r => r.duration > 5000) // > 5 seconds
    if (slowTests.length > 0) {
      recommendations.push('Consider optimizing email delivery performance - some tests took longer than expected')
    }

    // Template recommendations
    const templateFailures = results.filter(r => 
      r.testName.includes('Template') && r.status === TestStatus.FAILED
    )
    if (templateFailures.length > 0) {
      recommendations.push('Review and update email templates to fix rendering issues')
    }

    // SMTP recommendations
    const smtpFailures = results.filter(r => 
      r.testName.includes('SMTP') && r.status === TestStatus.FAILED
    )
    if (smtpFailures.length > 0) {
      recommendations.push('Verify SMTP configuration and credentials')
    }

    // General recommendations
    if (issues.length === 0 && results.every(r => r.status === TestStatus.PASSED)) {
      recommendations.push('All email validation tests passed - system is ready for deployment')
    }

    return recommendations
  }

  private determineReportPhase(results: TestResult[]): ValidationPhase {
    // Determine the primary phase based on test categories
    const categories = results.map(r => r.category)
    
    if (categories.includes('integration_workflow')) {
      return ValidationPhase.INTEGRATION_VALIDATION
    } else if (categories.includes('email_delivery')) {
      return ValidationPhase.DELIVERY_VALIDATION
    } else if (categories.includes('template_rendering')) {
      return ValidationPhase.TEMPLATE_VALIDATION
    } else {
      return ValidationPhase.SMTP_VALIDATION
    }
  }

  private determineValidationStatus(result: ValidationResult): ValidationStatus {
    if (result.passed) {
      return ValidationStatus.PASSED
    }

    const hasCriticalIssues = result.summary.criticalIssues > 0
    if (hasCriticalIssues) {
      return ValidationStatus.FAILED
    }

    const hasWarnings = result.summary.warnings > 0
    if (hasWarnings) {
      return ValidationStatus.WARNING
    }

    return ValidationStatus.FAILED
  }
}