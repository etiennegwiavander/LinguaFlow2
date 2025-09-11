// Email Validation System Types
export interface ValidationResult {
  passed: boolean
  results: TestResult[]
  summary: ValidationSummary
  timestamp: Date
}

export interface TestResult {
  testName: string
  category: TestCategory
  status: TestStatus
  duration: number
  details: TestDetails
  errors?: ValidationError[]
}

export interface ValidationSummary {
  totalTests: number
  passedTests: number
  failedTests: number
  criticalIssues: number
  warnings: number
}

export interface TestDetails {
  description: string
  expectedResult: string
  actualResult: string
  metadata?: Record<string, any>
}

export interface ValidationError {
  code: string
  message: string
  severity: SeverityLevel
  category: ErrorCategory
  details?: Record<string, any>
}

export enum TestCategory {
  SMTP_CONNECTIVITY = 'smtp_connectivity',
  SMTP_AUTHENTICATION = 'smtp_authentication',
  EMAIL_DELIVERY = 'email_delivery',
  TEMPLATE_RENDERING = 'template_rendering',
  PLACEHOLDER_SUBSTITUTION = 'placeholder_substitution',
  ASSET_VALIDATION = 'asset_validation',
  INTEGRATION_WORKFLOW = 'integration_workflow'
}

export enum TestStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  ERROR = 'error'
}

export enum SeverityLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum ErrorCategory {
  SMTP_CONFIG = 'smtp_config',
  TEMPLATE_RENDERING = 'template_rendering',
  DELIVERY_FAILURE = 'delivery_failure',
  AUTHENTICATION = 'authentication',
  ENVIRONMENT = 'environment',
  ASSET_MISSING = 'asset_missing'
}

export interface SMTPConfig {
  id: string
  name: string
  host: string
  port: number
  secure: boolean
  auth: SMTPAuth
  provider: EmailProvider
}

export interface SMTPAuth {
  user: string
  pass: string
}

export enum EmailProvider {
  GMAIL = 'gmail',
  OUTLOOK = 'outlook',
  SENDGRID = 'sendgrid',
  MAILGUN = 'mailgun',
  CUSTOM = 'custom'
}

export interface EmailTemplate {
  id: string
  type: EmailType
  name: string
  subject: string
  htmlContent: string
  textContent: string
  placeholders: string[]
  assets?: TemplateAsset[]
}

export interface TemplateAsset {
  type: AssetType
  path: string
  required: boolean
}

export enum AssetType {
  IMAGE = 'image',
  CSS = 'css',
  FONT = 'font'
}

export enum EmailType {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  LESSON_REMINDER = 'lesson_reminder',
  ADMIN_NOTIFICATION = 'admin_notification'
}

export interface TestEmail {
  to: string
  subject: string
  htmlContent: string
  textContent: string
  templateId?: string
  data?: Record<string, any>
}

export interface ConnectivityResult {
  connected: boolean
  responseTime: number
  error?: string
}

export interface AuthResult {
  authenticated: boolean
  error?: string
}

export interface DeliveryResult {
  delivered: boolean
  messageId?: string
  deliveryTime: number
  error?: string
}

export interface RenderResult {
  rendered: boolean
  htmlOutput?: string
  textOutput?: string
  error?: string
}

export interface PlaceholderResult {
  allPlaceholdersReplaced: boolean
  missingPlaceholders: string[]
  invalidPlaceholders: string[]
}

export interface AssetResult {
  allAssetsValid: boolean
  missingAssets: string[]
  invalidAssets: string[]
}

export interface ValidationReport {
  id: string
  timestamp: Date
  phase: ValidationPhase
  overallStatus: ValidationStatus
  testResults: TestResult[]
  issues: ValidationIssue[]
  recommendations: string[]
}

export interface ValidationIssue {
  id: string
  category: ErrorCategory
  severity: SeverityLevel
  description: string
  suggestedFixes: string[]
  resolved: boolean
}

export enum ValidationPhase {
  SMTP_VALIDATION = 'smtp_validation',
  TEMPLATE_VALIDATION = 'template_validation',
  DELIVERY_VALIDATION = 'delivery_validation',
  INTEGRATION_VALIDATION = 'integration_validation'
}

export enum ValidationStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  WARNING = 'warning',
  IN_PROGRESS = 'in_progress'
}