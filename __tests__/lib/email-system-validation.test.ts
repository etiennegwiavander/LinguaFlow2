import { emailValidationRules } from '@/components/admin/EmailFormValidation';
import { smtpValidator } from '@/lib/smtp-validation';
import { emailTemplateValidator } from '@/lib/email-template-utils';

describe('Email System Validation Tests', () => {
  describe('SMTP Configuration Validation', () => {
    it('should validate Gmail SMTP configuration', () => {
      const config = {
        provider: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        username: 'test@gmail.com',
        password: 'app-password',
        encryption: 'tls' as const,
      };

      const result = smtpValidator.validateConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid SMTP configuration', () => {
      const config = {
        provider: 'gmail',
        host: '',
        port: 0,
        username: 'invalid-email',
        password: '',
        encryption: 'none' as const,
      };

      const result = smtpValidator.validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate SendGrid configuration', () => {
      const config = {
        provider: 'sendgrid',
        host: 'smtp.sendgrid.net',
        port: 587,
        username: 'apikey',
        password: 'SG.test-api-key',
        encryption: 'tls' as const,
      };

      const result = smtpValidator.validateConfig(config);
      expect(result.isValid).toBe(true);
    });

    it('should validate AWS SES configuration', () => {
      const config = {
        provider: 'aws-ses',
        host: 'email-smtp.us-east-1.amazonaws.com',
        port: 587,
        username: 'AKIAIOSFODNN7EXAMPLE',
        password: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        encryption: 'tls' as const,
      };

      const result = smtpValidator.validateConfig(config);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Email Template Validation', () => {
    it('should validate welcome email template', () => {
      const template = {
        name: 'Welcome Email',
        type: 'welcome',
        subject: 'Welcome to {{app_name}}!',
        html_content: '<h1>Welcome {{user_name}}!</h1><p>Thanks for joining {{app_name}}.</p>',
        text_content: 'Welcome {{user_name}}! Thanks for joining {{app_name}}.',
        placeholders: ['app_name', 'user_name'],
      };

      const result = emailTemplateValidator.validate(template);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing placeholders', () => {
      const template = {
        name: 'Test Template',
        type: 'custom',
        subject: 'Hello {{user_name}}!',
        html_content: '<p>Welcome {{user_name}} to {{app_name}}!</p>',
        text_content: 'Welcome {{user_name}} to {{app_name}}!',
        placeholders: ['user_name'], // Missing app_name
      };

      const result = emailTemplateValidator.validate(template);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing placeholder: app_name');
    });

    it('should detect XSS attempts in templates', () => {
      const template = {
        name: 'Malicious Template',
        type: 'custom',
        subject: 'Test',
        html_content: '<script>alert("xss")</script><p>Hello {{user_name}}</p>',
        text_content: 'Hello {{user_name}}',
        placeholders: ['user_name'],
      };

      const result = emailTemplateValidator.validate(template);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Potentially unsafe HTML content detected');
    });

    it('should validate lesson reminder template', () => {
      const template = {
        name: 'Lesson Reminder',
        type: 'lesson_reminder',
        subject: 'Reminder: {{lesson_title}} starts soon!',
        html_content: `
          <h2>Don't forget your lesson!</h2>
          <p>Hi {{user_name}},</p>
          <p>Your lesson "{{lesson_title}}" starts at {{lesson_time}}.</p>
          <p>Join here: {{lesson_url}}</p>
        `,
        text_content: 'Hi {{user_name}}, your lesson "{{lesson_title}}" starts at {{lesson_time}}. Join: {{lesson_url}}',
        placeholders: ['user_name', 'lesson_title', 'lesson_time', 'lesson_url'],
      };

      const result = emailTemplateValidator.validate(template);
      expect(result.isValid).toBe(true);
    });

    it('should validate password reset template', () => {
      const template = {
        name: 'Password Reset',
        type: 'password_reset',
        subject: 'Reset your password',
        html_content: `
          <h2>Password Reset Request</h2>
          <p>Hi {{user_name}},</p>
          <p>Click here to reset your password: <a href="{{reset_url}}">Reset Password</a></p>
          <p>This link expires in {{expiry_time}}.</p>
        `,
        text_content: 'Hi {{user_name}}, reset your password: {{reset_url}} (expires in {{expiry_time}})',
        placeholders: ['user_name', 'reset_url', 'expiry_time'],
      };

      const result = emailTemplateValidator.validate(template);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Form Validation Rules', () => {
    it('should validate email addresses', () => {
      expect(emailValidationRules.email('test@example.com')).toBe(true);
      expect(emailValidationRules.email('invalid-email')).toBe(false);
      expect(emailValidationRules.email('')).toBe(false);
    });

    it('should validate required fields', () => {
      expect(emailValidationRules.required('test')).toBe(true);
      expect(emailValidationRules.required('')).toBe(false);
      expect(emailValidationRules.required(null)).toBe(false);
      expect(emailValidationRules.required(undefined)).toBe(false);
    });

    it('should validate port numbers', () => {
      expect(emailValidationRules.port(587)).toBe(true);
      expect(emailValidationRules.port(25)).toBe(true);
      expect(emailValidationRules.port(465)).toBe(true);
      expect(emailValidationRules.port(0)).toBe(false);
      expect(emailValidationRules.port(70000)).toBe(false);
    });

    it('should validate template names', () => {
      expect(emailValidationRules.templateName('Welcome Email')).toBe(true);
      expect(emailValidationRules.templateName('Test-Template_123')).toBe(true);
      expect(emailValidationRules.templateName('')).toBe(false);
      expect(emailValidationRules.templateName('a'.repeat(256))).toBe(false);
    });

    it('should validate placeholder syntax', () => {
      expect(emailValidationRules.placeholder('{{user_name}}')).toBe(true);
      expect(emailValidationRules.placeholder('{{app_name}}')).toBe(true);
      expect(emailValidationRules.placeholder('{user_name}')).toBe(false);
      expect(emailValidationRules.placeholder('user_name')).toBe(false);
    });
  });

  describe('Security Validation', () => {
    it('should validate admin permissions', () => {
      const adminUser = { role: 'admin', permissions: ['email_management'] };
      const regularUser = { role: 'user', permissions: [] };

      expect(emailValidationRules.adminAccess(adminUser)).toBe(true);
      expect(emailValidationRules.adminAccess(regularUser)).toBe(false);
    });

    it('should validate SMTP credentials format', () => {
      // Gmail app password format
      expect(emailValidationRules.gmailAppPassword('abcd efgh ijkl mnop')).toBe(true);
      expect(emailValidationRules.gmailAppPassword('invalid')).toBe(false);

      // SendGrid API key format
      expect(emailValidationRules.sendgridApiKey('SG.1234567890abcdef')).toBe(true);
      expect(emailValidationRules.sendgridApiKey('invalid-key')).toBe(false);

      // AWS credentials format
      expect(emailValidationRules.awsAccessKey('AKIAIOSFODNN7EXAMPLE')).toBe(true);
      expect(emailValidationRules.awsSecretKey('wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY')).toBe(true);
    });

    it('should validate rate limiting parameters', () => {
      expect(emailValidationRules.rateLimit({ emails_per_hour: 100 })).toBe(true);
      expect(emailValidationRules.rateLimit({ emails_per_hour: 10000 })).toBe(false);
      expect(emailValidationRules.rateLimit({ emails_per_hour: 0 })).toBe(false);
    });
  });
});