import { validateSMTPConfig, testSMTPConnection, getProviderDefaults } from '../../lib/smtp-validation';

// Mock nodemailer
const mockTransporter = {
  verify: jest.fn(),
  sendMail: jest.fn(),
  close: jest.fn()
};

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter)
}));

describe('SMTP Validation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateSMTPConfig', () => {
    it('should validate complete SMTP configuration', async () => {
      const config = {
        provider: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        username: 'test@gmail.com',
        password: 'password123',
        encryption: 'tls'
      };

      const result = await validateSMTPConfig(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate required fields', async () => {
      const config = {
        provider: 'gmail',
        // Missing required fields
      };

      const result = await validateSMTPConfig(config as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Host is required');
      expect(result.errors).toContain('Port is required');
      expect(result.errors).toContain('Username is required');
      expect(result.errors).toContain('Password is required');
    });

    it('should validate email format for username', async () => {
      const config = {
        provider: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        username: 'invalid-email',
        password: 'password123',
        encryption: 'tls'
      };

      const result = await validateSMTPConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Username must be a valid email address');
    });

    it('should validate port range', async () => {
      const config = {
        provider: 'custom',
        host: 'smtp.example.com',
        port: 99999, // Invalid port
        username: 'test@example.com',
        password: 'password123',
        encryption: 'tls'
      };

      const result = await validateSMTPConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Port must be between 1 and 65535');
    });

    it('should validate encryption type', async () => {
      const config = {
        provider: 'custom',
        host: 'smtp.example.com',
        port: 587,
        username: 'test@example.com',
        password: 'password123',
        encryption: 'invalid' as any
      };

      const result = await validateSMTPConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Encryption must be one of: tls, ssl, none');
    });

    it('should validate Gmail-specific requirements', async () => {
      const config = {
        provider: 'gmail',
        host: 'smtp.wrong.com', // Wrong host for Gmail
        port: 587,
        username: 'test@gmail.com',
        password: 'password123',
        encryption: 'tls'
      };

      const result = await validateSMTPConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Gmail requires smtp.gmail.com as host');
    });

    it('should validate SendGrid-specific requirements', async () => {
      const config = {
        provider: 'sendgrid',
        host: 'smtp.sendgrid.net',
        port: 587,
        username: 'wrong-username', // Should be 'apikey'
        password: 'sg.api-key',
        encryption: 'tls'
      };

      const result = await validateSMTPConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('SendGrid username must be "apikey"');
    });

    it('should validate AWS SES requirements', async () => {
      const config = {
        provider: 'aws-ses',
        host: 'email-smtp.us-east-1.amazonaws.com',
        port: 587,
        username: 'AKIAIOSFODNN7EXAMPLE',
        password: 'short', // Too short for AWS SES
        encryption: 'tls'
      };

      const result = await validateSMTPConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('AWS SES password must be at least 20 characters');
    });

    it('should allow custom provider with any valid configuration', async () => {
      const config = {
        provider: 'custom',
        host: 'mail.mycompany.com',
        port: 25,
        username: 'noreply@mycompany.com',
        password: 'customPassword',
        encryption: 'none'
      };

      const result = await validateSMTPConfig(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('testSMTPConnection', () => {
    it('should test SMTP connection successfully', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const config = {
        host: 'smtp.gmail.com',
        port: 587,
        username: 'test@gmail.com',
        password: 'password123',
        encryption: 'tls'
      };

      const result = await testSMTPConnection(config);

      expect(result.success).toBe(true);
      expect(result.message).toBe('SMTP connection successful');
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should handle connection timeout', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection timeout'));

      const config = {
        host: 'smtp.example.com',
        port: 587,
        username: 'test@example.com',
        password: 'password123',
        encryption: 'tls'
      };

      const result = await testSMTPConnection(config);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Connection timeout');
      expect(result.errorCode).toBe('CONNECTION_TIMEOUT');
    });

    it('should handle authentication failure', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Invalid login: 535 Authentication failed'));

      const config = {
        host: 'smtp.gmail.com',
        port: 587,
        username: 'test@gmail.com',
        password: 'wrongpassword',
        encryption: 'tls'
      };

      const result = await testSMTPConnection(config);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Authentication failed');
      expect(result.errorCode).toBe('AUTH_FAILED');
    });

    it('should handle DNS resolution errors', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('getaddrinfo ENOTFOUND smtp.nonexistent.com'));

      const config = {
        host: 'smtp.nonexistent.com',
        port: 587,
        username: 'test@example.com',
        password: 'password123',
        encryption: 'tls'
      };

      const result = await testSMTPConnection(config);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Host not found');
      expect(result.errorCode).toBe('HOST_NOT_FOUND');
    });

    it('should handle SSL/TLS errors', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('SSL Error: certificate verify failed'));

      const config = {
        host: 'smtp.example.com',
        port: 465,
        username: 'test@example.com',
        password: 'password123',
        encryption: 'ssl'
      };

      const result = await testSMTPConnection(config);

      expect(result.success).toBe(false);
      expect(result.message).toContain('SSL/TLS error');
      expect(result.errorCode).toBe('SSL_ERROR');
    });

    it('should handle port connection refused', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:587'));

      const config = {
        host: 'localhost',
        port: 587,
        username: 'test@example.com',
        password: 'password123',
        encryption: 'tls'
      };

      const result = await testSMTPConnection(config);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Connection refused');
      expect(result.errorCode).toBe('CONNECTION_REFUSED');
    });

    it('should create transporter with correct configuration', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const config = {
        host: 'smtp.gmail.com',
        port: 587,
        username: 'test@gmail.com',
        password: 'password123',
        encryption: 'tls'
      };

      await testSMTPConnection(config);

      const nodemailer = require('nodemailer');
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // TLS
        auth: {
          user: 'test@gmail.com',
          pass: 'password123'
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000
      });
    });

    it('should handle SSL encryption correctly', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const config = {
        host: 'smtp.gmail.com',
        port: 465,
        username: 'test@gmail.com',
        password: 'password123',
        encryption: 'ssl'
      };

      await testSMTPConnection(config);

      const nodemailer = require('nodemailer');
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          secure: true // SSL
        })
      );
    });

    it('should close transporter after test', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const config = {
        host: 'smtp.gmail.com',
        port: 587,
        username: 'test@gmail.com',
        password: 'password123',
        encryption: 'tls'
      };

      await testSMTPConnection(config);

      expect(mockTransporter.close).toHaveBeenCalled();
    });

    it('should close transporter even on error', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Test error'));

      const config = {
        host: 'smtp.gmail.com',
        port: 587,
        username: 'test@gmail.com',
        password: 'password123',
        encryption: 'tls'
      };

      await testSMTPConnection(config);

      expect(mockTransporter.close).toHaveBeenCalled();
    });
  });

  describe('getProviderDefaults', () => {
    it('should return Gmail defaults', () => {
      const defaults = getProviderDefaults('gmail');

      expect(defaults).toEqual({
        host: 'smtp.gmail.com',
        port: 587,
        encryption: 'tls'
      });
    });

    it('should return SendGrid defaults', () => {
      const defaults = getProviderDefaults('sendgrid');

      expect(defaults).toEqual({
        host: 'smtp.sendgrid.net',
        port: 587,
        encryption: 'tls',
        username: 'apikey'
      });
    });

    it('should return AWS SES defaults', () => {
      const defaults = getProviderDefaults('aws-ses');

      expect(defaults).toEqual({
        host: 'email-smtp.us-east-1.amazonaws.com',
        port: 587,
        encryption: 'tls'
      });
    });

    it('should return empty defaults for custom provider', () => {
      const defaults = getProviderDefaults('custom');

      expect(defaults).toEqual({});
    });

    it('should handle unknown provider', () => {
      const defaults = getProviderDefaults('unknown' as any);

      expect(defaults).toEqual({});
    });
  });

  describe('Provider-specific validation', () => {
    it('should validate Gmail app password format', async () => {
      const config = {
        provider: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        username: 'test@gmail.com',
        password: 'short', // Too short for app password
        encryption: 'tls'
      };

      const result = await validateSMTPConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Gmail requires an app password (16 characters)');
    });

    it('should validate SendGrid API key format', async () => {
      const config = {
        provider: 'sendgrid',
        host: 'smtp.sendgrid.net',
        port: 587,
        username: 'apikey',
        password: 'invalid-api-key', // Should start with 'SG.'
        encryption: 'tls'
      };

      const result = await validateSMTPConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('SendGrid API key must start with "SG."');
    });

    it('should validate AWS SES region in host', async () => {
      const config = {
        provider: 'aws-ses',
        host: 'email-smtp.invalid-region.amazonaws.com',
        port: 587,
        username: 'AKIAIOSFODNN7EXAMPLE',
        password: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        encryption: 'tls'
      };

      const result = await validateSMTPConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid AWS region in host');
    });
  });

  describe('Security validation', () => {
    it('should warn about unencrypted connections', async () => {
      const config = {
        provider: 'custom',
        host: 'smtp.example.com',
        port: 25,
        username: 'test@example.com',
        password: 'password123',
        encryption: 'none'
      };

      const result = await validateSMTPConfig(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Unencrypted connection is not recommended for production');
    });

    it('should validate strong passwords for custom providers', async () => {
      const config = {
        provider: 'custom',
        host: 'smtp.example.com',
        port: 587,
        username: 'test@example.com',
        password: '123', // Weak password
        encryption: 'tls'
      };

      const result = await validateSMTPConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should validate secure ports', async () => {
      const config = {
        provider: 'custom',
        host: 'smtp.example.com',
        port: 23, // Insecure port
        username: 'test@example.com',
        password: 'password123',
        encryption: 'none'
      };

      const result = await validateSMTPConfig(config);

      expect(result.warnings).toContain('Port 23 is not a standard SMTP port');
    });
  });
});