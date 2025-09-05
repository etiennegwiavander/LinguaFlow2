'use client';

import { useState, useCallback } from 'react';
import { EmailError, emailErrors } from '@/components/admin/EmailErrorMessages';
import { Notification, emailNotifications } from '@/components/admin/EmailNotifications';

interface UseEmailErrorHandlingReturn {
  errors: EmailError[];
  notifications: Notification[];
  isLoading: boolean;
  addError: (error: EmailError) => void;
  addNotification: (notification: Notification) => void;
  clearErrors: () => void;
  clearNotifications: () => void;
  dismissNotification: (id: string) => void;
  setLoading: (loading: boolean) => void;
  handleAsyncOperation: <T>(
    operation: () => Promise<T>,
    options?: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
    }
  ) => Promise<T | null>;
}

export function useEmailErrorHandling(): UseEmailErrorHandlingReturn {
  const [errors, setErrors] = useState<EmailError[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addError = useCallback((error: EmailError) => {
    setErrors(prev => [...prev, error]);
  }, []);

  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [...prev, notification]);
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const handleAsyncOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<T | null> => {
    try {
      setIsLoading(true);
      clearErrors();

      const result = await operation();

      if (options.successMessage) {
        addNotification({
          id: `success-${Date.now()}`,
          type: 'success',
          title: 'Operation Successful',
          message: options.successMessage,
          duration: 4000
        });
      }

      options.onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      // Try to parse structured error response
      let emailError: EmailError;
      
      if (error instanceof Error) {
        // Check for specific error patterns
        if (errorMessage.includes('SMTP') && errorMessage.includes('connection')) {
          emailError = emailErrors.smtpConnectionFailed(errorMessage);
        } else if (errorMessage.includes('authentication') || errorMessage.includes('auth')) {
          emailError = emailErrors.smtpAuthFailed(errorMessage);
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          emailError = emailErrors.networkError(errorMessage);
        } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
          emailError = emailErrors.permissionDenied(errorMessage);
        } else if (errorMessage.includes('validation')) {
          emailError = emailErrors.validationError(errorMessage);
        } else {
          emailError = {
            code: 'UNKNOWN_ERROR',
            message: options.errorMessage || errorMessage,
            details: errorMessage
          };
        }
      } else {
        emailError = {
          code: 'UNKNOWN_ERROR',
          message: options.errorMessage || 'An unexpected error occurred',
          details: String(error)
        };
      }

      addError(emailError);
      options.onError?.(error instanceof Error ? error : new Error(String(error)));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [addError, addNotification, clearErrors]);

  return {
    errors,
    notifications,
    isLoading,
    addError,
    addNotification,
    clearErrors,
    clearNotifications,
    dismissNotification,
    setLoading,
    handleAsyncOperation
  };
}

// Specialized hooks for specific email operations
export function useSMTPConfigHandling() {
  const baseHandling = useEmailErrorHandling();

  const testSMTPConnection = useCallback(async (config: any) => {
    return baseHandling.handleAsyncOperation(
      async () => {
        const response = await fetch(`/api/admin/email/smtp-config/${config.id}/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'SMTP test failed');
        }

        return response.json();
      },
      {
        successMessage: `Successfully connected to ${config.provider} SMTP server`,
        errorMessage: 'Failed to connect to SMTP server'
      }
    );
  }, [baseHandling]);

  const saveSMTPConfig = useCallback(async (config: any) => {
    return baseHandling.handleAsyncOperation(
      async () => {
        const response = await fetch('/api/admin/email/smtp-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to save SMTP configuration');
        }

        return response.json();
      },
      {
        successMessage: `SMTP configuration for ${config.provider} saved successfully`,
        errorMessage: 'Failed to save SMTP configuration'
      }
    );
  }, [baseHandling]);

  return {
    ...baseHandling,
    testSMTPConnection,
    saveSMTPConfig
  };
}

export function useEmailTemplateHandling() {
  const baseHandling = useEmailErrorHandling();

  const saveTemplate = useCallback(async (template: any) => {
    return baseHandling.handleAsyncOperation(
      async () => {
        const response = await fetch('/api/admin/email/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(template)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to save template');
        }

        return response.json();
      },
      {
        successMessage: `Email template "${template.name}" saved successfully`,
        errorMessage: 'Failed to save email template'
      }
    );
  }, [baseHandling]);

  const previewTemplate = useCallback(async (templateId: string, data: any) => {
    return baseHandling.handleAsyncOperation(
      async () => {
        const response = await fetch(`/api/admin/email/templates/${templateId}/preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to generate preview');
        }

        return response.json();
      },
      {
        errorMessage: 'Failed to generate template preview'
      }
    );
  }, [baseHandling]);

  return {
    ...baseHandling,
    saveTemplate,
    previewTemplate
  };
}

export function useEmailTestHandling() {
  const baseHandling = useEmailErrorHandling();

  const sendTestEmail = useCallback(async (testData: any) => {
    return baseHandling.handleAsyncOperation(
      async () => {
        const response = await fetch('/api/admin/email/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to send test email');
        }

        return response.json();
      },
      {
        successMessage: `Test email sent to ${testData.recipientEmail}`,
        errorMessage: 'Failed to send test email'
      }
    );
  }, [baseHandling]);

  return {
    ...baseHandling,
    sendTestEmail
  };
}