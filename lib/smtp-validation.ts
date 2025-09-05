/**
 * SMTP Configuration Validation
 * Provider-specific validation logic for SMTP configurations
 */

export type SMTPProvider = 'gmail' | 'sendgrid' | 'aws-ses' | 'custom';

export interface SMTPConfig {
  provider: SMTPProvider;
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: 'tls' | 'ssl' | 'none';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Provider-specific SMTP configurations
 */
const PROVIDER_CONFIGS = {
  gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    encryption: 'tls' as const,
    usernamePattern: /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
    requiresAppPassword: true,
  },
  sendgrid: {
    host: 'smtp.sendgrid.net',
    port: 587,
    encryption: 'tls' as const,
    usernamePattern: /^apikey$/,
    requiresApiKey: true,
  },
  'aws-ses': {
    host: /^email-smtp\.[a-z0-9-]+\.amazonaws\.com$/,
    ports: [25, 465, 587, 2465, 2587],
    encryption: 'tls' as const,
    usernamePattern: /^[A-Z0-9]{20}$/,
    requiresAccessKey: true,
  },
  custom: {
    // No specific validation for custom providers
  },
};

/**
 * Validates SMTP configuration based on provider
 */
export function validateSMTPConfig(config: SMTPConfig): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Basic validation
  if (!config.host?.trim()) {
    result.errors.push('Host is required');
  }

  if (!config.port || config.port < 1 || config.port > 65535) {
    result.errors.push('Port must be between 1 and 65535');
  }

  if (!config.username?.trim()) {
    result.errors.push('Username is required');
  }

  if (!config.password?.trim()) {
    result.errors.push('Password is required');
  }

  if (!['tls', 'ssl', 'none'].includes(config.encryption)) {
    result.errors.push('Encryption must be tls, ssl, or none');
  }

  // Provider-specific validation
  switch (config.provider) {
    case 'gmail':
      validateGmailConfig(config, result);
      break;
    case 'sendgrid':
      validateSendGridConfig(config, result);
      break;
    case 'aws-ses':
      validateAWSSESConfig(config, result);
      break;
    case 'custom':
      validateCustomConfig(config, result);
      break;
    default:
      result.errors.push('Invalid provider');
  }

  result.isValid = result.errors.length === 0;
  return result;
}

function validateGmailConfig(config: SMTPConfig, result: ValidationResult): void {
  const gmailConfig = PROVIDER_CONFIGS.gmail;

  if (config.host !== gmailConfig.host) {
    result.errors.push(`Gmail host must be ${gmailConfig.host}`);
  }

  if (config.port !== gmailConfig.port) {
    result.errors.push(`Gmail port must be ${gmailConfig.port}`);
  }

  if (config.encryption !== gmailConfig.encryption) {
    result.errors.push(`Gmail encryption must be ${gmailConfig.encryption}`);
  }

  if (!gmailConfig.usernamePattern.test(config.username)) {
    result.errors.push('Gmail username must be a valid Gmail address');
  }

  if (gmailConfig.requiresAppPassword) {
    result.warnings.push('Gmail requires an App Password, not your regular password');
  }
}

function validateSendGridConfig(config: SMTPConfig, result: ValidationResult): void {
  const sendgridConfig = PROVIDER_CONFIGS.sendgrid;

  if (config.host !== sendgridConfig.host) {
    result.errors.push(`SendGrid host must be ${sendgridConfig.host}`);
  }

  if (config.port !== sendgridConfig.port) {
    result.errors.push(`SendGrid port must be ${sendgridConfig.port}`);
  }

  if (config.encryption !== sendgridConfig.encryption) {
    result.errors.push(`SendGrid encryption must be ${sendgridConfig.encryption}`);
  }

  if (!sendgridConfig.usernamePattern.test(config.username)) {
    result.errors.push('SendGrid username must be "apikey"');
  }

  if (sendgridConfig.requiresApiKey && !config.password.startsWith('SG.')) {
    result.warnings.push('SendGrid password should be an API key starting with "SG."');
  }
}

function validateAWSSESConfig(config: SMTPConfig, result: ValidationResult): void {
  const awsConfig = PROVIDER_CONFIGS['aws-ses'];

  if (!awsConfig.host.test(config.host)) {
    result.errors.push('AWS SES host must match pattern: email-smtp.[region].amazonaws.com');
  }

  if (!awsConfig.ports.includes(config.port)) {
    result.errors.push(`AWS SES port must be one of: ${awsConfig.ports.join(', ')}`);
  }

  if (config.encryption !== awsConfig.encryption) {
    result.errors.push(`AWS SES encryption must be ${awsConfig.encryption}`);
  }

  if (!awsConfig.usernamePattern.test(config.username)) {
    result.errors.push('AWS SES username must be a 20-character access key ID');
  }

  if (awsConfig.requiresAccessKey) {
    result.warnings.push('AWS SES requires SMTP credentials, not regular AWS access keys');
  }
}

function validateCustomConfig(config: SMTPConfig, result: ValidationResult): void {
  // Basic validation for custom providers
  if (config.host.includes('gmail') && config.provider !== 'gmail') {
    result.warnings.push('This appears to be Gmail - consider using the Gmail provider');
  }

  if (config.host.includes('sendgrid') && config.provider !== 'sendgrid') {
    result.warnings.push('This appears to be SendGrid - consider using the SendGrid provider');
  }

  if (config.host.includes('amazonaws') && config.provider !== 'aws-ses') {
    result.warnings.push('This appears to be AWS SES - consider using the AWS SES provider');
  }

  // Common port warnings
  if (config.port === 25) {
    result.warnings.push('Port 25 is often blocked by ISPs - consider using 587 or 465');
  }

  if (config.port === 465 && config.encryption !== 'ssl') {
    result.warnings.push('Port 465 typically requires SSL encryption');
  }

  if (config.port === 587 && config.encryption === 'none') {
    result.warnings.push('Port 587 typically requires TLS encryption');
  }
}

/**
 * Gets provider-specific help text
 */
export function getProviderHelpText(provider: SMTPProvider): string {
  switch (provider) {
    case 'gmail':
      return 'For Gmail, use your Gmail address as username and generate an App Password in your Google Account settings. Regular passwords will not work.';
    case 'sendgrid':
      return 'For SendGrid, use "apikey" as username and your SendGrid API key as password. Create API keys in your SendGrid dashboard.';
    case 'aws-ses':
      return 'For AWS SES, use SMTP credentials (not regular AWS keys). Generate SMTP credentials in the AWS SES console for your region.';
    case 'custom':
      return 'For custom SMTP providers, enter the settings provided by your email service provider. Contact your provider if you need assistance.';
    default:
      return '';
  }
}

/**
 * Gets default configuration for a provider
 */
export function getProviderDefaults(provider: SMTPProvider): Partial<SMTPConfig> {
  switch (provider) {
    case 'gmail':
      return {
        host: PROVIDER_CONFIGS.gmail.host,
        port: PROVIDER_CONFIGS.gmail.port,
        encryption: PROVIDER_CONFIGS.gmail.encryption,
      };
    case 'sendgrid':
      return {
        host: PROVIDER_CONFIGS.sendgrid.host,
        port: PROVIDER_CONFIGS.sendgrid.port,
        encryption: PROVIDER_CONFIGS.sendgrid.encryption,
        username: 'apikey',
      };
    case 'aws-ses':
      return {
        port: 587,
        encryption: PROVIDER_CONFIGS['aws-ses'].encryption,
      };
    case 'custom':
      return {
        port: 587,
        encryption: 'tls',
      };
    default:
      return {};
  }
}