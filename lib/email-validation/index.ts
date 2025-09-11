// Email Validation System - Main Exports

// Core Orchestrator
export { EmailValidationOrchestrator } from './email-validation-orchestrator'
export type { ValidationConfig, ValidationOptions } from './email-validation-orchestrator'

// Individual Validators
export { SMTPValidator } from './smtp-validator'
export { TemplateValidator } from './template-validator'
export { DeliveryValidator } from './delivery-validator'
export { IntegrationValidator } from './integration-validator'

// Validator-specific types
export type { TemplateData } from './template-validator'
export type { DeliveryTestConfig, EndToEndDeliveryResult, DeliveryStep } from './delivery-validator'
export type { WorkflowTestConfig, WorkflowResult, WorkflowStep } from './integration-validator'

// Core Types
export * from './types'

// Re-export commonly used types for convenience
export type {
  ValidationResult,
  ValidationReport,
  TestResult,
  SMTPConfig,
  EmailTemplate,
  ValidationError,
  ValidationIssue
} from './types'