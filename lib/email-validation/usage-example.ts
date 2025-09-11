/**
 * Email Validation System Usage Example
 * 
 * This file demonstrates how to use the comprehensive email validation system
 * to validate SMTP configurations, email templates, delivery, and integration workflows.
 */

import {
  EmailValidationOrchestrator,
  ValidationConfig,
  ValidationOptions,
  SMTPConfig,
  EmailTemplate,
  EmailType,
  EmailProvider,
  ValidationPhase
} from './index'

// Example usage of the Email Validation System
export async function runEmailValidationExample() {
  // 1. Create the orchestrator
  const orchestrator = new EmailValidationOrchestrator()

  // 2. Configure validation settings
  const validationConfig: ValidationConfig = {
    testRecipient: 'test@linguaflow.com',
    timeout: 30000, // 30 seconds
    validateDelivery: true,
    skipNonCriticalTests: false,
    generateDetailedReport: true
  }

  // 3. Define SMTP configuration
  const smtpConfig: SMTPConfig = {
    id: 'primary-smtp',
    name: 'Primary SMTP Server',
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'noreply@linguaflow.com',
      pass: process.env.SMTP_PASS || 'your-app-password'
    },
    provider: EmailProvider.GMAIL
  }

  // 4. Define email templates
  const welcomeTemplate: EmailTemplate = {
    id: 'welcome-email',
    type: EmailType.WELCOME,
    name: 'Welcome Email Template',
    subject: 'Welcome to LinguaFlow, {{userName}}!',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to LinguaFlow!</h1>
        <p>Hi {{userName}},</p>
        <p>Thank you for joining LinguaFlow! We're excited to help you on your language learning journey.</p>
        <p>Your account has been created with the email: <strong>{{userEmail}}</strong></p>
        <p>To get started, please click the button below to activate your account:</p>
        <a href="{{activationLink}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Activate Account
        </a>
        <p>If you have any questions, feel free to contact our support team at {{supportEmail}}.</p>
        <p>Best regards,<br>The LinguaFlow Team</p>
      </div>
    `,
    textContent: `
      Welcome to LinguaFlow!
      
      Hi {{userName}},
      
      Thank you for joining LinguaFlow! We're excited to help you on your language learning journey.
      
      Your account has been created with the email: {{userEmail}}
      
      To get started, please visit this link to activate your account:
      {{activationLink}}
      
      If you have any questions, feel free to contact our support team at {{supportEmail}}.
      
      Best regards,
      The LinguaFlow Team
    `,
    placeholders: ['userName', 'userEmail', 'activationLink', 'supportEmail']
  }

  const passwordResetTemplate: EmailTemplate = {
    id: 'password-reset',
    type: EmailType.PASSWORD_RESET,
    name: 'Password Reset Template',
    subject: 'Reset Your LinguaFlow Password',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Password Reset Request</h1>
        <p>Hi {{userName}},</p>
        <p>We received a request to reset your password for your LinguaFlow account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="{{resetLink}}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
        <p><strong>This link will expire in {{expirationTime}}.</strong></p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>The LinguaFlow Team</p>
      </div>
    `,
    textContent: `
      Password Reset Request
      
      Hi {{userName}},
      
      We received a request to reset your password for your LinguaFlow account.
      
      Please visit this link to reset your password:
      {{resetLink}}
      
      This link will expire in {{expirationTime}}.
      
      If you didn't request this password reset, please ignore this email.
      
      Best regards,
      The LinguaFlow Team
    `,
    placeholders: ['userName', 'resetLink', 'expirationTime']
  }

  // 5. Set up validation options
  const validationOptions: ValidationOptions = {
    phases: [
      ValidationPhase.SMTP_VALIDATION,
      ValidationPhase.TEMPLATE_VALIDATION,
      ValidationPhase.DELIVERY_VALIDATION,
      ValidationPhase.INTEGRATION_VALIDATION
    ],
    smtpConfigs: [smtpConfig],
    templates: [welcomeTemplate, passwordResetTemplate],
    testData: {
      'welcome-email': {
        userName: 'John Doe',
        userEmail: 'john.doe@example.com',
        activationLink: 'https://linguaflow.com/activate?token=abc123',
        supportEmail: 'support@linguaflow.com'
      },
      'password-reset': {
        userName: 'John Doe',
        resetLink: 'https://linguaflow.com/reset-password?token=xyz789',
        expirationTime: '24 hours'
      }
    }
  }

  try {
    console.log('🚀 Starting comprehensive email validation...')
    
    // 6. Run full validation
    const validationResult = await orchestrator.runFullValidation(validationConfig, validationOptions)
    
    console.log('\n📊 Validation Results:')
    console.log(`✅ Overall Status: ${validationResult.passed ? 'PASSED' : 'FAILED'}`)
    console.log(`📈 Total Tests: ${validationResult.summary.totalTests}`)
    console.log(`✅ Passed: ${validationResult.summary.passedTests}`)
    console.log(`❌ Failed: ${validationResult.summary.failedTests}`)
    console.log(`🚨 Critical Issues: ${validationResult.summary.criticalIssues}`)
    console.log(`⚠️  Warnings: ${validationResult.summary.warnings}`)

    // 7. Generate detailed report
    const report = await orchestrator.generateValidationReport(validationResult, validationConfig)
    
    console.log('\n📋 Detailed Report:')
    console.log(`📄 Report ID: ${report.id}`)
    console.log(`📅 Generated: ${report.timestamp.toISOString()}`)
    console.log(`🎯 Phase: ${report.phase}`)
    console.log(`📊 Status: ${report.overallStatus}`)
    
    if (report.issues.length > 0) {
      console.log('\n🚨 Issues Found:')
      report.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`)
        if (issue.suggestedFixes.length > 0) {
          console.log(`     💡 Suggested fixes:`)
          issue.suggestedFixes.forEach(fix => {
            console.log(`        - ${fix}`)
          })
        }
      })
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:')
      report.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`)
      })
    }

    // 8. Show individual test results
    console.log('\n🔍 Individual Test Results:')
    validationResult.results.forEach((result, index) => {
      const status = result.status === 'passed' ? '✅' : '❌'
      console.log(`  ${status} ${result.testName} (${result.duration}ms)`)
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(error => {
          console.log(`      ❌ ${error.message}`)
        })
      }
    })

    return {
      success: validationResult.passed,
      report,
      validationResult
    }

  } catch (error) {
    console.error('❌ Email validation failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Example of running specific validation phases
export async function runSpecificValidationExample() {
  const orchestrator = new EmailValidationOrchestrator()
  
  const config: ValidationConfig = {
    testRecipient: 'test@linguaflow.com',
    timeout: 15000,
    validateDelivery: false, // Skip delivery validation for faster testing
    skipNonCriticalTests: true,
    generateDetailedReport: false
  }

  // Only run SMTP and Template validation
  const phases = [ValidationPhase.SMTP_VALIDATION, ValidationPhase.TEMPLATE_VALIDATION]
  
  const options: ValidationOptions = {
    phases,
    smtpConfigs: [{
      id: 'test-smtp',
      name: 'Test SMTP',
      host: 'smtp.test.com',
      port: 587,
      secure: false,
      auth: { user: 'test@test.com', pass: 'testpass' },
      provider: EmailProvider.CUSTOM
    }],
    templates: [{
      id: 'test-template',
      type: EmailType.WELCOME,
      name: 'Test Template',
      subject: 'Test {{name}}',
      htmlContent: '<p>Hello {{name}}</p>',
      textContent: 'Hello {{name}}',
      placeholders: ['name']
    }]
  }

  const result = await orchestrator.runSpecificTests(phases, config, options)
  
  console.log('🎯 Specific Validation Results:')
  console.log(`Status: ${result.passed ? 'PASSED' : 'FAILED'}`)
  console.log(`Tests Run: ${result.summary.totalTests}`)
  
  return result
}

// Example usage in a deployment script
export async function validateEmailSystemForDeployment(): Promise<boolean> {
  console.log('🚀 Validating email system for deployment...')
  
  const result = await runEmailValidationExample()
  
  if (result.success) {
    console.log('✅ Email system validation passed - ready for deployment!')
    return true
  } else {
    console.log('❌ Email system validation failed - deployment blocked!')
    console.log('Please fix the issues above before deploying.')
    return false
  }
}

// Export for use in other modules
export {
  EmailValidationOrchestrator,
  ValidationConfig,
  ValidationOptions,
  SMTPConfig,
  EmailTemplate
}