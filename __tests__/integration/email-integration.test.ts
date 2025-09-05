/**
 * Integration tests for email system integration with existing application features
 */

import { EmailIntegrationService } from '@/lib/email-integration-service';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'test-log-id' }, error: null }))
        }))
      })),
      upsert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null }))
        }))
      }))
    })),
    functions: {
      invoke: jest.fn(() => Promise.resolve({ data: { logId: 'test-log-id' }, error: null }))
    }
  }
}));

// Mock email encryption
jest.mock('@/lib/email-encryption', () => ({
  decryptPassword: jest.fn(() => 'decrypted-password')
}));

describe('Email Integration Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct template data', async () => {
      const mockSupabase = require('@/lib/supabase').supabase;
      
      // Mock SMTP config
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(() => Promise.resolve({ 
              data: { id: 'smtp-1', provider: 'gmail', is_active: true }, 
              error: null 
            }))
          }))
        }))
      });

      // Mock email template
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn(() => Promise.resolve({ 
                data: { 
                  id: 'template-1', 
                  type: 'welcome',
                  subject: 'Welcome {{user_name}}!',
                  html_content: '<p>Hello {{user_name}}</p>',
                  text_content: 'Hello {{user_name}}'
                }, 
                error: null 
              }))
            }))
          }))
        }))
      });

      const result = await EmailIntegrationService.sendWelcomeEmail('test@example.com', {
        firstName: 'John',
        lastName: 'Doe'
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('send-integrated-email', {
        body: expect.objectContaining({
          recipientEmail: 'test@example.com',
          subject: 'Welcome John!',
          templateData: expect.objectContaining({
            user_name: 'John',
            user_email: 'test@example.com'
          })
        })
      });
    });

    it('should handle missing SMTP configuration', async () => {
      const mockSupabase = require('@/lib/supabase').supabase;
      
      // Mock no SMTP config
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      });

      const result = await EmailIntegrationService.sendWelcomeEmail('test@example.com', {
        firstName: 'John'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active SMTP configuration found');
    });

    it('should handle missing email template', async () => {
      const mockSupabase = require('@/lib/supabase').supabase;
      
      // Mock SMTP config exists
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(() => Promise.resolve({ 
              data: { id: 'smtp-1', provider: 'gmail' }, 
              error: null 
            }))
          }))
        }))
      });

      // Mock no email template
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          }))
        }))
      });

      const result = await EmailIntegrationService.sendWelcomeEmail('test@example.com', {
        firstName: 'John'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active template found for type: welcome');
    });
  });

  describe('sendLessonReminder', () => {
    it('should send lesson reminder with correct template data', async () => {
      const mockSupabase = require('@/lib/supabase').supabase;
      
      // Mock user preferences (allow reminders)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(() => Promise.resolve({ 
              data: { lesson_reminders: true }, 
              error: null 
            }))
          }))
        }))
      });

      // Mock SMTP config
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(() => Promise.resolve({ 
              data: { id: 'smtp-1', provider: 'gmail' }, 
              error: null 
            }))
          }))
        }))
      });

      // Mock email template
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn(() => Promise.resolve({ 
                data: { 
                  id: 'template-2', 
                  type: 'lesson_reminder',
                  subject: 'Reminder: {{lesson_title}}',
                  html_content: '<p>Your lesson {{lesson_title}} starts at {{lesson_time}}</p>',
                  text_content: 'Your lesson {{lesson_title}} starts at {{lesson_time}}'
                }, 
                error: null 
              }))
            }))
          }))
        }))
      });

      const result = await EmailIntegrationService.sendLessonReminder(
        'student@example.com',
        {
          title: 'English Conversation',
          date: '2023-12-01',
          time: '10:00 AM',
          tutorName: 'Jane Smith'
        },
        'user-123'
      );

      expect(result.success).toBe(true);
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('send-integrated-email', {
        body: expect.objectContaining({
          recipientEmail: 'student@example.com',
          subject: 'Reminder: English Conversation',
          templateData: expect.objectContaining({
            lesson_title: 'English Conversation',
            lesson_time: '10:00 AM',
            tutor_name: 'Jane Smith'
          })
        })
      });
    });

    it('should respect user notification preferences', async () => {
      const mockSupabase = require('@/lib/supabase').supabase;
      
      // Mock user preferences (disable reminders)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(() => Promise.resolve({ 
              data: { lesson_reminders: false }, 
              error: null 
            }))
          }))
        }))
      });

      const result = await EmailIntegrationService.sendLessonReminder(
        'student@example.com',
        {
          title: 'English Conversation',
          date: '2023-12-01',
          time: '10:00 AM'
        },
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('User has disabled this email type');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct template data', async () => {
      const mockSupabase = require('@/lib/supabase').supabase;
      
      // Mock SMTP config
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(() => Promise.resolve({ 
              data: { id: 'smtp-1', provider: 'gmail' }, 
              error: null 
            }))
          }))
        }))
      });

      // Mock email template
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn(() => Promise.resolve({ 
                data: { 
                  id: 'template-3', 
                  type: 'password_reset',
                  subject: 'Reset Your Password',
                  html_content: '<p>Click here to reset: {{reset_url}}</p>',
                  text_content: 'Reset URL: {{reset_url}}'
                }, 
                error: null 
              }))
            }))
          }))
        }))
      });

      const result = await EmailIntegrationService.sendPasswordResetEmail(
        'user@example.com',
        {
          userName: 'John Doe',
          resetUrl: 'https://app.com/reset?token=abc123',
          expiryTime: '1 hour'
        }
      );

      expect(result.success).toBe(true);
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('send-integrated-email', {
        body: expect.objectContaining({
          recipientEmail: 'user@example.com',
          subject: 'Reset Your Password',
          templateData: expect.objectContaining({
            user_name: 'John Doe',
            reset_url: 'https://app.com/reset?token=abc123',
            expiry_time: '1 hour'
          }),
          priority: 'high'
        })
      });
    });
  });
});