'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmailErrorBoundary } from './EmailErrorBoundary';
import { EmailOperationLoading } from './EmailLoadingStates';
import { EmailErrorMessage, EmailErrorSummary, emailErrors } from './EmailErrorMessages';
import { 
  NotificationContainer, 
  EmailConfirmationDialogs, 
  emailNotifications 
} from './EmailNotifications';
import { 
  ValidatedFormField, 
  emailValidationRules, 
  FormValidationSummary 
} from './EmailFormValidation';
import { TooltipHelp, ContextualHelp, fieldHelp } from './EmailHelpSystem';
import { useEmailErrorHandling } from '@/hooks/useEmailErrorHandling';

/**
 * Example component demonstrating comprehensive error handling and user feedback
 * for email management operations. This serves as a reference implementation
 * showing how all the error handling components work together.
 */
export function EmailManagementExample() {
  const {
    errors,
    notifications,
    isLoading,
    addError,
    addNotification,
    clearErrors,
    dismissNotification,
    handleAsyncOperation
  } = useEmailErrorHandling();

  const [formData, setFormData] = useState({
    email: '',
    smtpHost: '',
    port: '',
    password: ''
  });

  const [confirmations, setConfirmations] = useState({
    deleteTemplate: { isOpen: false, templateName: '' },
    deleteSMTPConfig: { isOpen: false, configName: '' },
    sendTestEmail: { isOpen: false, recipientEmail: '' },
    saveTemplate: { isOpen: false, hasUnsavedChanges: false }
  });

  // Simulate different types of operations and errors
  const simulateOperations = {
    smtpConnectionTest: () => {
      handleAsyncOperation(
        () => new Promise((resolve, reject) => {
          setTimeout(() => {
            if (Math.random() > 0.5) {
              resolve({ success: true, message: 'Connection successful' });
            } else {
              reject(new Error('SMTP connection failed: Authentication error'));
            }
          }, 2000);
        }),
        {
          successMessage: 'SMTP connection test completed successfully',
          errorMessage: 'SMTP connection test failed'
        }
      );
    },

    templateSave: () => {
      handleAsyncOperation(
        () => new Promise((resolve, reject) => {
          setTimeout(() => {
            if (formData.email && formData.smtpHost) {
              resolve({ success: true, templateId: '123' });
            } else {
              reject(new Error('Validation failed: Missing required fields'));
            }
          }, 1500);
        }),
        {
          successMessage: 'Email template saved successfully',
          errorMessage: 'Failed to save email template'
        }
      );
    },

    networkError: () => {
      addError(emailErrors.networkError('Unable to connect to server'));
    },

    permissionError: () => {
      addError(emailErrors.permissionDenied('Admin access required'));
    },

    validationError: () => {
      addError(emailErrors.validationError('Invalid email format', 'email'));
    }
  };

  // Form validation
  const formValidation = [
    {
      name: 'Email',
      validation: {
        isValid: emailValidationRules.email.test(formData.email),
        errors: emailValidationRules.email.test(formData.email) ? [] : ['Invalid email format'],
        warnings: [],
        info: []
      }
    },
    {
      name: 'SMTP Host',
      validation: {
        isValid: emailValidationRules.smtpHost.test(formData.smtpHost),
        errors: emailValidationRules.smtpHost.test(formData.smtpHost) ? [] : ['Invalid hostname format'],
        warnings: [],
        info: []
      }
    },
    {
      name: 'Port',
      validation: {
        isValid: emailValidationRules.port.test(formData.port),
        errors: emailValidationRules.port.test(formData.port) ? [] : ['Invalid port number'],
        warnings: [],
        info: []
      }
    }
  ];

  return (
    <EmailErrorBoundary>
      <div className="space-y-6 p-6 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Email Management Error Handling Demo</h1>
          <p className="text-gray-600">
            This demonstrates comprehensive error handling and user feedback for email management operations.
          </p>
        </div>

        {/* Error Summary */}
        {errors.length > 0 && (
          <EmailErrorSummary 
            errors={errors} 
            onClearErrors={clearErrors}
            onRetryAll={() => {
              clearErrors();
              simulateOperations.smtpConnectionTest();
            }}
          />
        )}

        {/* Loading States */}
        {isLoading && (
          <EmailOperationLoading 
            operation="smtp-test" 
            message="Processing email management operation..."
          />
        )}

        {/* Form with Validation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              Email Configuration Form
              <TooltipHelp content="This form demonstrates real-time validation and error feedback">
                <span className="ml-2">ℹ️</span>
              </TooltipHelp>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ValidatedFormField
              label="Email Address"
              value={formData.email}
              onChange={(value) => setFormData({ ...formData, email: value })}
              type="email"
              validation={[emailValidationRules.email]}
              helpText={fieldHelp.testRecipient}
              required
            />

            <ValidatedFormField
              label="SMTP Host"
              value={formData.smtpHost}
              onChange={(value) => setFormData({ ...formData, smtpHost: value })}
              validation={[emailValidationRules.smtpHost]}
              helpText={fieldHelp.smtpHost}
              required
            />

            <ValidatedFormField
              label="Port"
              value={formData.port}
              onChange={(value) => setFormData({ ...formData, port: value })}
              type="number"
              validation={[emailValidationRules.port, emailValidationRules.commonPorts]}
              helpText={fieldHelp.smtpPort}
              required
            />

            <ValidatedFormField
              label="Password"
              value={formData.password}
              onChange={(value) => setFormData({ ...formData, password: value })}
              type="password"
              validation={[emailValidationRules.strongPassword]}
              required
            />

            <FormValidationSummary fields={formValidation} />
          </CardContent>
        </Card>

        {/* Operation Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Test Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Button 
                onClick={simulateOperations.smtpConnectionTest}
                disabled={isLoading}
              >
                Test SMTP Connection
              </Button>
              
              <Button 
                onClick={simulateOperations.templateSave}
                disabled={isLoading}
              >
                Save Template
              </Button>
              
              <Button 
                onClick={simulateOperations.networkError}
                variant="outline"
              >
                Simulate Network Error
              </Button>
              
              <Button 
                onClick={simulateOperations.permissionError}
                variant="outline"
              >
                Simulate Permission Error
              </Button>
              
              <Button 
                onClick={simulateOperations.validationError}
                variant="outline"
              >
                Simulate Validation Error
              </Button>

              <Button 
                onClick={() => addNotification(emailNotifications.smtpConfigSaved('Gmail'))}
                variant="secondary"
              >
                Show Success Notification
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Dialog Triggers */}
        <Card>
          <CardHeader>
            <CardTitle>Confirmation Dialogs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                onClick={() => setConfirmations({
                  ...confirmations,
                  deleteTemplate: { isOpen: true, templateName: 'Welcome Email' }
                })}
                variant="destructive"
              >
                Delete Template
              </Button>
              
              <Button 
                onClick={() => setConfirmations({
                  ...confirmations,
                  deleteSMTPConfig: { isOpen: true, configName: 'Gmail SMTP' }
                })}
                variant="destructive"
              >
                Delete SMTP Config
              </Button>
              
              <Button 
                onClick={() => setConfirmations({
                  ...confirmations,
                  sendTestEmail: { isOpen: true, recipientEmail: formData.email || 'test@example.com' }
                })}
              >
                Send Test Email
              </Button>
              
              <Button 
                onClick={() => setConfirmations({
                  ...confirmations,
                  saveTemplate: { isOpen: true, hasUnsavedChanges: true }
                })}
              >
                Save with Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contextual Help */}
        <ContextualHelp section="smtp" />

        {/* Confirmation Dialogs */}
        <EmailConfirmationDialogs
          deleteTemplate={{
            ...confirmations.deleteTemplate,
            onConfirm: () => {
              addNotification(emailNotifications.configurationDeleted('Welcome Email Template'));
              setConfirmations({ ...confirmations, deleteTemplate: { isOpen: false, templateName: '' } });
            },
            onClose: () => setConfirmations({ ...confirmations, deleteTemplate: { isOpen: false, templateName: '' } })
          }}
          deleteSMTPConfig={{
            ...confirmations.deleteSMTPConfig,
            onConfirm: () => {
              addNotification(emailNotifications.configurationDeleted('Gmail SMTP Configuration'));
              setConfirmations({ ...confirmations, deleteSMTPConfig: { isOpen: false, configName: '' } });
            },
            onClose: () => setConfirmations({ ...confirmations, deleteSMTPConfig: { isOpen: false, configName: '' } })
          }}
          sendTestEmail={{
            ...confirmations.sendTestEmail,
            onConfirm: () => {
              simulateOperations.smtpConnectionTest();
              setConfirmations({ ...confirmations, sendTestEmail: { isOpen: false, recipientEmail: '' } });
            },
            onClose: () => setConfirmations({ ...confirmations, sendTestEmail: { isOpen: false, recipientEmail: '' } })
          }}
          saveTemplate={{
            ...confirmations.saveTemplate,
            onConfirm: () => {
              simulateOperations.templateSave();
              setConfirmations({ ...confirmations, saveTemplate: { isOpen: false, hasUnsavedChanges: false } });
            },
            onClose: () => setConfirmations({ ...confirmations, saveTemplate: { isOpen: false, hasUnsavedChanges: false } })
          }}
        />

        {/* Notification Container */}
        <NotificationContainer 
          notifications={notifications}
          onDismiss={dismissNotification}
          position="top-right"
        />
      </div>
    </EmailErrorBoundary>
  );
}