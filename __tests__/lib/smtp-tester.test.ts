import { SMTPTester } from '@/lib/smtp-tester';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(),
}));

describe('SMTPTester', () => {
  let smtpTester: SMTPTester;

  beforeEach(() => {
    smtpTester = new SMTPTester();
    jest.clearAllMocks();
  });

  describe('testConnection', () => {
    it('should successfully test SMTP connection', async () => {
      const mockTransporter = {
        verify: jest.fn().mockResolvedValue(true),
      };

      const nodemailer = require('nodemailer');
      nodemailer.createTransporter.mockReturnValue(mockTransporter);

      const config = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'password123',
        },
      };

      const result = await smtpTester.testConnection(config);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Connection successful');
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should handle connection failure', async () => {
      const mockTransporter = {
        verify: jest.fn().mockRejectedValue(new Error('Connection failed')),
      };

      const nodemailer = require('nodemailer');
      nodemailer.createTransporter.mockReturnValue(mockTransporter);

      const config = {
        host: 'invalid-smtp.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'wrongpassword',
        },
      };

      const result = await smtpTester.testConnection(config);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Connection failed');
      expect(result.error).toBeDefined();
    });

    it('should handle timeout errors', async () => {
      const mockTransporter = {
        verify: jest.fn().mockRejectedValue(new Error('Timeout')),
      };

      const nodemailer = require('nodemailer');
      nodemailer.createTransporter.mockReturnValue(mockTransporter);

      const config = {
        host: 'slow-smtp.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'password123',
        },
      };

      const result = await smtpTester.testConnection(config);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Timeout');
    });
  });

  describe('sendTestEmail', () => {
    it('should successfully send test email', async () => {
      const mockTransporter = {
        sendMail: jest.fn().mockResolvedValue({
          messageId: 'test-message-id',
          response: '250 OK',
        }),
      };

      const nodemailer = require('nodemailer');
      nodemailer.createTransporter.mockReturnValue(mockTransporter);

      const config = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'password123',
        },
      };

      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>This is a test email</p>',
      };

      const result = await smtpTester.sendTestEmail(config, emailData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>This is a test email</p>',
      });
    });

    it('should handle email sending failure', async () => {
      const mockTransporter = {
        sendMail: jest.fn().mockRejectedValue(new Error('Send failed')),
      };

      const nodemailer = require('nodemailer');
      nodemailer.createTransporter.mockReturnValue(mockTransporter);

      const config = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'password123',
        },
      };

      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>This is a test email</p>',
      };

      const result = await smtpTester.sendTestEmail(config, emailData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Send failed');
    });
  });

  describe('validateConfiguration', () => {
    it('should validate correct SMTP configuration', () => {
      const config = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'password123',
        },
      };

      const result = smtpTester.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const config = {
        host: '',
        port: 587,
        secure: false,
        auth: {
          user: '',
          pass: 'password123',
        },
      };

      const result = smtpTester.validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Host is required');
      expect(result.errors).toContain('Username is required');
    });

    it('should validate port ranges', () => {
      const config = {
        host: 'smtp.gmail.com',
        port: 99999,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'password123',
        },
      };

      const result = smtpTester.validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Port must be between 1 and 65535');
    });
  });
});