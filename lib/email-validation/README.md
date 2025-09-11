# Email Validation System

A comprehensive email validation system for LinguaFlow that provides end-to-end testing of email functionality including SMTP configuration, template validation, delivery testing, and integration workflow verification.

## Overview

The Email Validation System ensures that all email features work correctly before and after deployment by providing:

- **SMTP Validation**: Tests connectivity, authentication, and basic email sending
- **Template Validation**: Validates email template rendering, placeholder substitution, and assets
- **Delivery Validation**: Tests end-to-end email delivery with tracking
- **Integration Validation**: Tests complete email workflows (registration, password reset, etc.)

## Architecture

```
EmailValidationOrchestrator
├── SMTPValidator
├── TemplateValidator
├── DeliveryValidator
└── IntegrationValidator
```

## Quick Start

```typescript
import {
  EmailValidationOrchestrator,
  ValidationConfig,
} from "./email-validation";

// Create orchestrator
const orchestrator = new EmailValidationOrchestrator();

// Configure validation
const config: ValidationConfig = {
  testRecipient: "test@example.com",
  timeout: 30000,
  validateDelivery: true,
  skipNonCriticalTests: false,
  generateDetailedReport: true,
};

// Run validation
const result = await orchestrator.runFullValidation(config, {
  smtpConfigs: [smtpConfig],
  templates: [emailTemplate],
});

console.log(`Validation ${result.passed ? "PASSED" : "FAILED"}`);
```

## Components

### EmailValidationOrchestrator

The main orchestrator that coordinates all validation phases.

**Key Methods:**

- `runFullValidation()` - Runs complete validation suite
- `runSpecificTests()` - Runs specific validation phases
- `generateValidationReport()` - Creates detailed validation report

### SMTPValidator

Validates SMTP server configuration and connectivity.

**Tests:**

- SMTP connectivity (TCP connection)
- SMTP authentication (login verification)
- Email delivery (actual sending test)

**Usage:**

```typescript
const smtpValidator = new SMTPValidator();
const result = await smtpValidator.runComprehensiveTests(smtpConfig);
```

### TemplateValidator

Validates email templates for rendering and correctness.

**Tests:**

- Template rendering with test data
- Placeholder substitution validation
- Asset validation (images, CSS, fonts)

**Usage:**

```typescript
const templateValidator = new TemplateValidator();
const result = await templateValidator.runComprehensiveTests(
  template,
  testData
);
```

### DeliveryValidator

Tests end-to-end email delivery workflows.

**Tests:**

- Complete delivery pipeline (render → send → confirm)
- Multiple email type testing
- Delivery performance under load

**Usage:**

```typescript
const deliveryValidator = new DeliveryValidator();
const result = await deliveryValidator.validateEndToEndDelivery(
  smtpConfig,
  template,
  testData,
  deliveryConfig
);
```

### IntegrationValidator

Tests complete email workflows and cross-component integration.

**Tests:**

- User registration workflow
- Password reset workflow
- Lesson reminder workflow
- Cross-component integration

**Usage:**

```typescript
const integrationValidator = new IntegrationValidator();
const result = await integrationValidator.runComprehensiveIntegrationTests(
  smtpConfig,
  templates,
  workflowConfig
);
```

## Configuration

### ValidationConfig

Main configuration for the validation system:

```typescript
interface ValidationConfig {
  testRecipient: string; // Email address for test emails
  timeout: number; // Timeout for operations (ms)
  validateDelivery: boolean; // Whether to track email delivery
  skipNonCriticalTests: boolean; // Skip non-critical tests for faster validation
  generateDetailedReport: boolean; // Generate detailed validation report
}
```

### SMTPConfig

SMTP server configuration:

```typescript
interface SMTPConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  provider: EmailProvider;
}
```

### EmailTemplate

Email template definition:

```typescript
interface EmailTemplate {
  id: string;
  type: EmailType;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  placeholders: string[];
  assets?: TemplateAsset[];
}
```

## Validation Phases

The system supports four main validation phases:

1. **SMTP_VALIDATION** - Tests SMTP server configuration
2. **TEMPLATE_VALIDATION** - Tests email template rendering
3. **DELIVERY_VALIDATION** - Tests email delivery
4. **INTEGRATION_VALIDATION** - Tests complete workflows

You can run all phases or specific phases based on your needs.

## Error Handling

The system categorizes errors by severity:

- **CRITICAL** - Blocks deployment, requires immediate fix
- **HIGH** - Should be resolved before deployment
- **MEDIUM** - Can be deployed with monitoring
- **LOW** - Informational, can be addressed later

## Test Results

Each test returns a `TestResult` with:

```typescript
interface TestResult {
  testName: string;
  category: TestCategory;
  status: TestStatus; // PASSED, FAILED, SKIPPED, ERROR
  duration: number; // Test execution time (ms)
  details: TestDetails; // Detailed test information
  errors?: ValidationError[]; // Any errors encountered
}
```

## Validation Report

The system generates comprehensive reports with:

- Overall validation status
- Individual test results
- Issues found with severity levels
- Suggested fixes for each issue
- Recommendations for improvement

## Usage Examples

### Basic Validation

```typescript
import { runEmailValidationExample } from "./usage-example";

const result = await runEmailValidationExample();
if (result.success) {
  console.log("✅ Email system ready for deployment");
} else {
  console.log("❌ Issues found, check the report");
}
```

### Deployment Validation

```typescript
import { validateEmailSystemForDeployment } from "./usage-example";

const isReady = await validateEmailSystemForDeployment();
if (!isReady) {
  process.exit(1); // Block deployment
}
```

### Specific Phase Testing

```typescript
const result = await orchestrator.runSpecificTests(
  [ValidationPhase.SMTP_VALIDATION, ValidationPhase.TEMPLATE_VALIDATION],
  config,
  options
);
```

## Integration with CI/CD

The validation system can be integrated into CI/CD pipelines:

```bash
# In your deployment script
npm run validate-email-system
if [ $? -ne 0 ]; then
  echo "Email validation failed - blocking deployment"
  exit 1
fi
```

## Environment Variables

Required environment variables for validation:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@linguaflow.com
SMTP_PASS=your-app-password
TEST_EMAIL_RECIPIENT=test@linguaflow.com
```

## Testing

Run the validation system tests:

```bash
npm test __tests__/lib/email-validation-system.test.ts
```

## Performance

The validation system is designed for:

- **Fast execution** - Most tests complete within seconds
- **Concurrent testing** - Multiple validations can run simultaneously
- **Scalable** - Can handle multiple SMTP configs and templates
- **Reliable** - Includes retry logic and error recovery

## Best Practices

1. **Run validation before deployment** - Always validate email system before deploying
2. **Use test recipients** - Use dedicated test email addresses
3. **Monitor critical issues** - Address critical issues immediately
4. **Regular validation** - Run periodic validations in production
5. **Keep templates updated** - Validate templates after changes

## Troubleshooting

Common issues and solutions:

### SMTP Connection Failed

- Check host and port configuration
- Verify network connectivity
- Ensure firewall allows SMTP traffic

### Authentication Failed

- Verify username and password
- Check if 2FA is required
- Ensure SMTP access is enabled

### Template Rendering Failed

- Check template syntax
- Verify placeholder names
- Test with sample data

### Delivery Failed

- Check SMTP configuration
- Verify recipient email format
- Review email content for spam triggers

## Contributing

When adding new validation features:

1. Follow the existing validator pattern
2. Add comprehensive tests
3. Update type definitions
4. Document new functionality
5. Add usage examples

## License

This email validation system is part of the LinguaFlow project and follows the same license terms.
