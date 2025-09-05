'use client';

import React from 'react';
import { 
  AlertTriangle, 
  Wifi, 
  Key, 
  Mail, 
  Server, 
  Clock, 
  Shield,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface EmailError {
  code: string;
  message: string;
  details?: string;
  field?: string;
}

interface EmailErrorMessageProps {
  error: EmailError;
  onRetry?: () => void;
  className?: string;
}

const errorConfigs = {
  // SMTP Configuration Errors
  'SMTP_CONNECTION_FAILED': {
    icon: Wifi,
    title: 'Connection Failed',
    color: 'destructive' as const,
    troubleshooting: [
      'Verify the SMTP server hostname and port number',
      'Check if your firewall allows outbound connections on the specified port',
      'Ensure the SMTP server is accessible from your network',
      'Try using a different port (587 for TLS, 465 for SSL, 25 for unencrypted)'
    ]
  },
  'SMTP_AUTH_FAILED': {
    icon: Key,
    title: 'Authentication Failed',
    color: 'destructive' as const,
    troubleshooting: [
      'Double-check your username and password',
      'For Gmail, use an App Password instead of your regular password',
      'Ensure two-factor authentication is properly configured',
      'Check if your account has SMTP access enabled'
    ]
  },
  'SMTP_TIMEOUT': {
    icon: Clock,
    title: 'Connection Timeout',
    color: 'destructive' as const,
    troubleshooting: [
      'Check your internet connection stability',
      'Try again in a few minutes - the server might be temporarily busy',
      'Verify the SMTP server is not experiencing downtime',
      'Consider increasing the timeout value if using a slow connection'
    ]
  },
  'SMTP_TLS_ERROR': {
    icon: Shield,
    title: 'TLS/SSL Error',
    color: 'destructive' as const,
    troubleshooting: [
      'Verify the encryption method (TLS/SSL) matches your provider requirements',
      'Check if the SMTP server certificate is valid',
      'Try switching between TLS and SSL encryption',
      'Ensure your system date and time are correct'
    ]
  },

  // Template Errors
  'TEMPLATE_VALIDATION_FAILED': {
    icon: Mail,
    title: 'Template Validation Error',
    color: 'destructive' as const,
    troubleshooting: [
      'Check for missing required placeholders',
      'Ensure all HTML tags are properly closed',
      'Verify placeholder syntax uses correct format: {{placeholder_name}}',
      'Remove any unsupported HTML elements or attributes'
    ]
  },
  'TEMPLATE_SAVE_FAILED': {
    icon: Server,
    title: 'Save Failed',
    color: 'destructive' as const,
    troubleshooting: [
      'Check your internet connection',
      'Ensure you have permission to modify email templates',
      'Try reducing the template size if it\'s very large',
      'Refresh the page and try again'
    ]
  },

  // Email Sending Errors
  'EMAIL_SEND_FAILED': {
    icon: Mail,
    title: 'Email Send Failed',
    color: 'destructive' as const,
    troubleshooting: [
      'Verify the recipient email address is valid',
      'Check if your SMTP configuration is working',
      'Ensure you haven\'t exceeded your email provider\'s rate limits',
      'Try sending to a different email address to test'
    ]
  },
  'EMAIL_RATE_LIMITED': {
    icon: Clock,
    title: 'Rate Limit Exceeded',
    color: 'destructive' as const,
    troubleshooting: [
      'Wait a few minutes before sending more emails',
      'Check your email provider\'s sending limits',
      'Consider upgrading your email service plan',
      'Spread out email sending over a longer time period'
    ]
  },

  // General Errors
  'NETWORK_ERROR': {
    icon: Wifi,
    title: 'Network Error',
    color: 'destructive' as const,
    troubleshooting: [
      'Check your internet connection',
      'Try refreshing the page',
      'Disable any VPN or proxy that might interfere',
      'Contact your network administrator if the problem persists'
    ]
  },
  'PERMISSION_DENIED': {
    icon: Shield,
    title: 'Permission Denied',
    color: 'destructive' as const,
    troubleshooting: [
      'Ensure you have admin privileges',
      'Try logging out and logging back in',
      'Contact your system administrator for access',
      'Check if your session has expired'
    ]
  },
  'VALIDATION_ERROR': {
    icon: AlertTriangle,
    title: 'Validation Error',
    color: 'destructive' as const,
    troubleshooting: [
      'Check all required fields are filled out',
      'Ensure email addresses are in valid format',
      'Verify numeric fields contain valid numbers',
      'Remove any special characters that might cause issues'
    ]
  }
};

export function EmailErrorMessage({ error, onRetry, className }: EmailErrorMessageProps) {
  const config = errorConfigs[error.code as keyof typeof errorConfigs] || {
    icon: AlertTriangle,
    title: 'Unknown Error',
    color: 'destructive' as const,
    troubleshooting: [
      'Try refreshing the page',
      'Check your internet connection',
      'Contact support if the problem persists'
    ]
  };

  const Icon = config.icon;

  return (
    <Alert variant={config.color} className={cn('', className)}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        {config.title}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="ml-2 h-6 px-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">{error.message}</p>
        
        {error.details && (
          <div className="bg-gray-50 p-3 rounded mb-3">
            <p className="text-sm font-medium text-gray-700 mb-1">Details:</p>
            <p className="text-sm text-gray-600">{error.details}</p>
          </div>
        )}

        <div className="bg-blue-50 p-3 rounded">
          <p className="text-sm font-medium text-blue-800 mb-2">Troubleshooting steps:</p>
          <ul className="text-sm text-blue-700 space-y-1">
            {config.troubleshooting.map((step, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-block w-4 h-4 rounded-full bg-blue-200 text-blue-800 text-xs flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
}

interface FormFieldErrorProps {
  error?: string;
  field: string;
  className?: string;
}

export function FormFieldError({ error, field, className }: FormFieldErrorProps) {
  if (!error) return null;

  return (
    <div className={cn('flex items-center space-x-1 text-red-600 text-sm mt-1', className)}>
      <AlertTriangle className="h-3 w-3 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
}

interface EmailErrorSummaryProps {
  errors: EmailError[];
  onRetryAll?: () => void;
  onClearErrors?: () => void;
  className?: string;
}

export function EmailErrorSummary({ 
  errors, 
  onRetryAll, 
  onClearErrors, 
  className 
}: EmailErrorSummaryProps) {
  if (errors.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-red-800">
          {errors.length} Error{errors.length > 1 ? 's' : ''} Found
        </h3>
        <div className="flex space-x-2">
          {onRetryAll && (
            <Button variant="outline" size="sm" onClick={onRetryAll}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry All
            </Button>
          )}
          {onClearErrors && (
            <Button variant="ghost" size="sm" onClick={onClearErrors}>
              Clear
            </Button>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        {errors.map((error, index) => (
          <EmailErrorMessage key={index} error={error} />
        ))}
      </div>
    </div>
  );
}

// Helper function to create standardized error objects
export function createEmailError(
  code: string, 
  message: string, 
  details?: string, 
  field?: string
): EmailError {
  return { code, message, details, field };
}

// Common error creators
export const emailErrors = {
  smtpConnectionFailed: (details?: string) => 
    createEmailError('SMTP_CONNECTION_FAILED', 'Unable to connect to SMTP server', details),
  
  smtpAuthFailed: (details?: string) => 
    createEmailError('SMTP_AUTH_FAILED', 'SMTP authentication failed', details),
  
  templateValidationFailed: (details?: string, field?: string) => 
    createEmailError('TEMPLATE_VALIDATION_FAILED', 'Template validation failed', details, field),
  
  emailSendFailed: (details?: string) => 
    createEmailError('EMAIL_SEND_FAILED', 'Failed to send email', details),
  
  networkError: (details?: string) => 
    createEmailError('NETWORK_ERROR', 'Network connection error', details),
  
  permissionDenied: (details?: string) => 
    createEmailError('PERMISSION_DENIED', 'You do not have permission to perform this action', details),
  
  validationError: (message: string, field?: string) => 
    createEmailError('VALIDATION_ERROR', message, undefined, field)
};