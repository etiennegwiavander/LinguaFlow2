import {
  EmailValidationOrchestrator,
  SMTPValidator,
  TemplateValidator,
  DeliveryValidator,
  IntegrationValidator,
  ValidationConfig,
  ValidationOptions,
  SMTPConfig,
  EmailTemplate,
  EmailType,
  EmailProvider,
  ValidationPhase,
  TestStatus,
  SeverityLevel
} from '../../lib/email-validation'

describe('Email Validation System', () => {
  let orchestrator: EmailValidationOrchestrator
  let smtpValidator: SMTPValidator
  let templateValidator: TemplateValidator
  let deliveryValidator: DeliveryValidator
  let integrationValidator: IntegrationValidator

  const mockSMTPConfig: SMTPConfig = {
    id: 'test-smtp',
    name: 'Test SMTP',
    host: 'smtp.test.com',
    port: 587,
    secure: false,
    auth: {
      user: 'test@test.com',
      pass: 'testpass'
    },
    provider: EmailProvider.CUSTOM
  }

  const mockEmailTemplate: EmailTemplate = {
    id: 'welcome-template',
    type: EmailType.WELCOME,
    name: 'Welcome Email',
    subject: 'Welcome {{userName}}!',
    htmlContent: '<h1>Welcome {{userName}}!</h1><p>Your email is {{userEmail}}</p>',
    textContent: 'Welcome {{userName}}! Your email is {{userEmail}}',
    placeholders: ['userName', 'userEmail']
  }

  const mockValidationConfig: ValidationConfig = {
    testRecipient: 'test@example.com',
    timeout: 10000,
    validateDelivery: true,
    skipNonCriticalTests: false,
    generateDetailedReport: true
  }

  beforeEach(() => {
    orchestrator = new EmailValidationOrchestrator()
    smtpValidator = new SMTPValidator()
    templateValidator = new TemplateValidator()
    deliveryValidator = new DeliveryValidator()
    integrationValidator = new IntegrationValidator()
  })

  describe('EmailValidationOrchestrator', () => {
    it('should create orchestrator instance', () => {
      expect(orchestrator).toBeInstanceOf(EmailValidationOrchestrator)
    })

    it('should run full validation with all phases', async () => {
      const options: ValidationOptions = {
        smtpConfigs: [mockSMTPConfig],
        templates: [mockEmailTemplate]
      }

      const result = await orchestrator.runFullValidation(mockValidationConfig, options)

      expect(result).toBeDefined()
      expect(result.timestamp).toBeInstanceOf(Date)
      expect(result.summary).toBeDefined()
      expect(result.summary.totalTests).toBeGreaterThan(0)
      expect(Array.isArray(result.results)).toBe(true)
    })

    it('should run specific validation phases', async () => {
      const phases = [ValidationPhase.SMTP_VALIDATION, ValidationPhase.TEMPLATE_VALIDATION]
      const options: ValidationOptions = {
        smtpConfigs: [mockSMTPConfig],
        templates: [mockEmailTemplate]
      }

      const result = await orchestrator.runSpecificTests(phases, mockValidationConfig, options)

      expect(result).toBeDefined()
      expect(result.results.length).toBeGreaterThan(0)
      
      // Should only contain SMTP and Template tests
      const categories = result.results.map(r => r.category)
      expect(categories.some(c => c.includes('smtp'))).toBe(true)
      expect(categories.some(c => c.includes('template'))).toBe(true)
    })

    it('should generate validation report', async () => {
      const mockResult = {
        passed: true,
        results: [],
        summary: {
          totalTests: 5,
          passedTests: 5,
          failedTests: 0,
          criticalIssues: 0,
          warnings: 0
        },
        timestamp: new Date()
      }

      const report = await orchestrator.generateValidationReport(mockResult, mockValidationConfig)

      expect(report).toBeDefined()
      expect(report.id).toMatch(/^validation-\d+$/)
      expect(report.timestamp).toBeInstanceOf(Date)
      expect(report.overallStatus).toBeDefined()
      expect(Array.isArray(report.testResults)).toBe(true)
      expect(Array.isArray(report.issues)).toBe(true)
      expect(Array.isArray(report.recommendations)).toBe(true)
    })
  })

  describe('SMTPValidator', () => {
    it('should validate SMTP connectivity', async () => {
      const result = await smtpValidator.validateConnectivity(mockSMTPConfig)

      expect(result).toBeDefined()
      expect(typeof result.connected).toBe('boolean')
      expect(typeof result.responseTime).toBe('number')
    })

    it('should validate SMTP authentication', async () => {
      const result = await smtpValidator.validateAuthentication(mockSMTPConfig)

      expect(result).toBeDefined()
      expect(typeof result.authenticated).toBe('boolean')
    })

    it('should run comprehensive SMTP tests', async () => {
      const results = await smtpValidator.runComprehensiveTests(mockSMTPConfig)

      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBeGreaterThan(0)
      
      results.forEach(result => {
        expect(result.testName).toBeDefined()
        expect(result.category).toBeDefined()
        expect(result.status).toBeDefined()
        expect(typeof result.duration).toBe('number')
        expect(result.details).toBeDefined()
      })
    })
  })

  describe('TemplateValidator', () => {
    it('should validate template rendering', async () => {
      const testData = {
        userName: 'Test User',
        userEmail: 'test@example.com'
      }

      const result = await templateValidator.validateTemplateRendering(mockEmailTemplate, testData)

      expect(result).toBeDefined()
      expect(typeof result.rendered).toBe('boolean')
      
      if (result.rendered) {
        expect(result.htmlOutput).toContain('Test User')
        expect(result.textOutput).toContain('test@example.com')
      }
    })

    it('should validate placeholder substitution', async () => {
      const result = await templateValidator.validatePlaceholderSubstitution(mockEmailTemplate)

      expect(result).toBeDefined()
      expect(typeof result.allPlaceholdersReplaced).toBe('boolean')
      expect(Array.isArray(result.missingPlaceholders)).toBe(true)
      expect(Array.isArray(result.invalidPlaceholders)).toBe(true)
    })

    it('should validate template assets', async () => {
      const result = await templateValidator.validateTemplateAssets(mockEmailTemplate)

      expect(result).toBeDefined()
      expect(typeof result.allAssetsValid).toBe('boolean')
      expect(Array.isArray(result.missingAssets)).toBe(true)
      expect(Array.isArray(result.invalidAssets)).toBe(true)
    })

    it('should run comprehensive template tests', async () => {
      const testData = {
        userName: 'Test User',
        userEmail: 'test@example.com'
      }

      const results = await templateValidator.runComprehensiveTests(mockEmailTemplate, testData)

      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBeGreaterThanOrEqual(3) // Rendering, Placeholder, Asset tests
      
      results.forEach(result => {
        expect(result.testName).toBeDefined()
        expect(result.category).toBeDefined()
        expect(result.status).toBeDefined()
        expect(typeof result.duration).toBe('number')
      })
    })
  })

  describe('DeliveryValidator', () => {
    it('should validate end-to-end delivery', async () => {
      const testData = {
        userName: 'Test User',
        userEmail: 'test@example.com'
      }

      const config = {
        testRecipient: 'test@example.com',
        timeout: 10000,
        retryAttempts: 3,
        trackDelivery: true
      }

      const result = await deliveryValidator.validateEndToEndDelivery(
        mockSMTPConfig,
        mockEmailTemplate,
        testData,
        config
      )

      expect(result).toBeDefined()
      expect(typeof result.templateRendered).toBe('boolean')
      expect(typeof result.emailSent).toBe('boolean')
      expect(typeof result.deliveryConfirmed).toBe('boolean')
      expect(typeof result.totalTime).toBe('number')
      expect(Array.isArray(result.steps)).toBe(true)
    })

    it('should validate multiple email types', async () => {
      const config = {
        testRecipient: 'test@example.com',
        timeout: 10000,
        retryAttempts: 3,
        trackDelivery: false
      }

      const results = await deliveryValidator.validateMultipleEmailTypes(
        mockSMTPConfig,
        [mockEmailTemplate],
        config
      )

      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBeGreaterThan(0)
      
      results.forEach(result => {
        expect(result.testName).toContain('End-to-End Delivery Test')
        expect(result.category).toBe('email_delivery')
      })
    })
  })

  describe('IntegrationValidator', () => {
    it('should validate user registration workflow', async () => {
      const config = {
        testRecipient: 'test@example.com',
        timeout: 10000,
        validateDelivery: true
      }

      const result = await integrationValidator.validateUserRegistrationWorkflow(
        mockSMTPConfig,
        mockEmailTemplate,
        config
      )

      expect(result).toBeDefined()
      expect(result.workflowName).toBe('User Registration Workflow')
      expect(typeof result.success).toBe('boolean')
      expect(Array.isArray(result.steps)).toBe(true)
      expect(typeof result.totalTime).toBe('number')
    })

    it('should run comprehensive integration tests', async () => {
      const config = {
        testRecipient: 'test@example.com',
        timeout: 10000,
        validateDelivery: false
      }

      const results = await integrationValidator.runComprehensiveIntegrationTests(
        mockSMTPConfig,
        [mockEmailTemplate],
        config
      )

      expect(Array.isArray(results)).toBe(true)
      
      results.forEach(result => {
        expect(result.testName).toContain('Integration Test')
        expect(result.category).toBe('integration_workflow')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid SMTP configuration', async () => {
      const invalidConfig: SMTPConfig = {
        ...mockSMTPConfig,
        host: '',
        port: 0
      }

      const result = await smtpValidator.validateConnectivity(invalidConfig)

      expect(result.connected).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle template with missing placeholders', async () => {
      const templateWithMissingPlaceholders: EmailTemplate = {
        ...mockEmailTemplate,
        htmlContent: '<h1>Welcome {{userName}}!</h1><p>Missing: {{missingField}}</p>',
        placeholders: ['userName', 'userEmail'] // missingField not declared
      }

      const result = await templateValidator.validatePlaceholderSubstitution(templateWithMissingPlaceholders)

      expect(result.allPlaceholdersReplaced).toBe(false)
      expect(result.invalidPlaceholders).toContain('missingField')
    })

    it('should handle validation errors gracefully', async () => {
      const options: ValidationOptions = {
        smtpConfigs: [{ ...mockSMTPConfig, host: '' }], // Invalid config
        templates: [mockEmailTemplate]
      }

      const result = await orchestrator.runFullValidation(mockValidationConfig, options)

      expect(result).toBeDefined()
      expect(result.passed).toBe(false)
      expect(result.summary.criticalIssues).toBeGreaterThan(0)
    })
  })

  describe('Performance', () => {
    it('should complete validation within reasonable time', async () => {
      const startTime = Date.now()
      
      const options: ValidationOptions = {
        smtpConfigs: [mockSMTPConfig],
        templates: [mockEmailTemplate]
      }

      await orchestrator.runFullValidation(mockValidationConfig, options)
      
      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(30000) // Should complete within 30 seconds
    })

    it('should handle concurrent validations', async () => {
      const options: ValidationOptions = {
        smtpConfigs: [mockSMTPConfig],
        templates: [mockEmailTemplate]
      }

      const promises = Array.from({ length: 3 }, () =>
        orchestrator.runFullValidation(mockValidationConfig, options)
      )

      const results = await Promise.all(promises)

      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(result.summary).toBeDefined()
      })
    })
  })
})