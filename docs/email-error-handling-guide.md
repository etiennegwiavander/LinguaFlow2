# Email Management Error Handling & User Feedback Guide

This guide explains how to implement comprehensive error handling and user feedback in the email management system.

## Overview

The email management system includes a complete error handling and user feedback framework that provides:

- **Error Boundaries**: Catch and handle React component errors gracefully
- **Loading States**: Show progress indicators for all operations
- **Error Messages**: User-friendly error messages with troubleshooting guidance
- **Success Notifications**: Confirmation messages for successful operations
- **Form Validation**: Real-time validation with helpful feedback
- **Help System**: Contextual help and tooltips for complex features

## Components

### 1. EmailErrorBoundary

Wraps components to catch and handle errors gracefully.

```tsx
import { EmailErrorBoundary } from '@/components/admin/EmailErrorBoundary';

function MyEmailComponent() {
  return (
    <EmailErrorBoundary>
      <YourEmailManagementComponent />
    </EmailErrorBoundary>
  );
}
```

**Features:**
- Catches JavaScript errors in child components
- Shows user-friendly error messages
- Provides retry functionality
- Shows technical details in development mode
- Includes troubleshooting guidance

### 2. Loading States

Show progress indicators for different operations.

```tsx
import { 
  EmailOperationLoading, 
  SMTPConfigLoading, 
  EmailTemplateLoading 
} from '@/components/admin/EmailLoadingStates';

// For specific operations
<EmailOperationLoading 
  operation="smtp-test" 
  message="Testing SMTP connection..."
  progress={75}
/>

// For loading SMTP configurations
<SMTPConfigLoading />

// For loading email templates
<EmailTemplateLoading />
```

**Available Operations:**
- `smtp-test`: SMTP connection testing
- `template-save`: Email template saving
- `email-send`: Test email sending
- `analytics-load`: Analytics data loading

### 3. Error Messages

Display user-friendly error messages with troubleshooting guidance.

```tsx
import { 
  EmailErrorMessage, 
  EmailErrorSummary, 
  emailErrors 
} from '@/components/admin/EmailErrorMessages';

// Single error message
<EmailErrorMessage 
  error={emailErrors.smtpConnectionFailed('Connection timeout')}
  onRetry={() => retryConnection()}
/>

// Multiple errors summary
<EmailErrorSummary 
  errors={errors}
  onRetryAll={() => retryAllOperations()}
  onClearErrors={() => clearAllErrors()}
/>
```

**Pre-defined Error Types:**
- `SMTP_CONNECTION_FAILED`: SMTP server connection issues
- `SMTP_AUTH_FAILED`: Authentication problems
- `SMTP_TIMEOUT`: Connection timeout
- `SMTP_TLS_ERROR`: TLS/SSL certificate issues
- `TEMPLATE_VALIDATION_FAILED`: Template validation errors
- `EMAIL_SEND_FAILED`: Email delivery failures
- `NETWORK_ERROR`: Network connectivity issues
- `PERMISSION_DENIED`: Access control violations

### 4. Notifications

Show success messages and confirmations.

```tsx
import { 
  NotificationContainer, 
  EmailConfirmationDialogs,
  emailNotifications 
} from '@/components/admin/EmailNotifications';

// Notification container (place at app level)
<NotificationContainer 
  notifications={notifications}
  onDismiss={dismissNotification}
  position="top-right"
/>

// Confirmation dialogs
<EmailConfirmationDialogs
  deleteTemplate={{
    isOpen: showDeleteDialog,
    templateName: "Welcome Email",
    onConfirm: handleDelete,
    onClose: closeDialog
  }}
  // ... other confirmations
/>
```

**Pre-defined Notifications:**
- `smtpConfigSaved`: SMTP configuration saved
- `templateSaved`: Email template saved
- `testEmailSent`: Test email sent successfully
- `configurationDeleted`: Configuration deleted
- `smtpTestSuccess`: SMTP test successful

### 5. Form Validation

Real-time form validation with helpful feedback.

```tsx
import { 
  ValidatedFormField, 
  emailValidationRules,
  FormValidationSummary 
} from '@/components/admin/EmailFormValidation';

<ValidatedFormField
  label="Email Address"
  value={email}
  onChange={setEmail}
  type="email"
  validation={[emailValidationRules.email]}
  helpText="Enter the recipient's email address"
  required
/>

<FormValidationSummary fields={validationResults} />
```

**Available Validation Rules:**
- `email`: Valid email format
- `smtpHost`: Valid hostname format
- `port`: Valid port number (1-65535)
- `commonPorts`: Common SMTP ports (25, 465, 587, 2525)
- `strongPassword`: Password strength
- `templateSubject`: Subject line length
- `templatePlaceholders`: Placeholder syntax
- `htmlContent`: HTML syntax validation

### 6. Help System

Contextual help and tooltips.

```tsx
import { 
  TooltipHelp, 
  ContextualHelp, 
  fieldHelp 
} from '@/components/admin/EmailHelpSystem';

// Tooltip help
<TooltipHelp content="This field requires a valid SMTP hostname">
  <Label>SMTP Host</Label>
</TooltipHelp>

// Contextual help sections
<ContextualHelp section="smtp" />

// Field-specific help
<Input 
  placeholder="smtp.gmail.com"
  aria-describedby="smtp-help"
/>
<p id="smtp-help">{fieldHelp.smtpHost}</p>
```

**Available Help Sections:**
- `smtp`: SMTP configuration help
- `templates`: Email template help
- `testing`: Email testing help
- `analytics`: Analytics help

## Hooks

### useEmailErrorHandling

Main hook for managing errors and notifications.

```tsx
import { useEmailErrorHandling } from '@/hooks/useEmailErrorHandling';

function MyComponent() {
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

  const saveConfiguration = async () => {
    await handleAsyncOperation(
      () => fetch('/api/smtp-config', { method: 'POST', ... }),
      {
        successMessage: 'Configuration saved successfully',
        errorMessage: 'Failed to save configuration'
      }
    );
  };

  return (
    <div>
      {/* Your component JSX */}
    </div>
  );
}
```

### Specialized Hooks

```tsx
import { 
  useSMTPConfigHandling,
  useEmailTemplateHandling,
  useEmailTestHandling 
} from '@/hooks/useEmailErrorHandling';

// SMTP-specific operations
const { testSMTPConnection, saveSMTPConfig } = useSMTPConfigHandling();

// Template-specific operations
const { saveTemplate, previewTemplate } = useEmailTemplateHandling();

// Testing-specific operations
const { sendTestEmail } = useEmailTestHandling();
```

## Implementation Patterns

### 1. Component Structure

```tsx
function EmailManagementComponent() {
  const {
    errors,
    notifications,
    isLoading,
    dismissNotification,
    clearErrors
  } = useEmailErrorHandling();

  return (
    <EmailErrorBoundary>
      <div className="space-y-6">
        {/* Error Summary */}
        {errors.length > 0 && (
          <EmailErrorSummary 
            errors={errors} 
            onClearErrors={clearErrors}
          />
        )}

        {/* Loading State */}
        {isLoading && (
          <EmailOperationLoading operation="smtp-test" />
        )}

        {/* Main Content */}
        <YourMainContent />

        {/* Contextual Help */}
        <ContextualHelp section="smtp" />

        {/* Notifications */}
        <NotificationContainer 
          notifications={notifications}
          onDismiss={dismissNotification}
        />
      </div>
    </EmailErrorBoundary>
  );
}
```

### 2. Error Handling Pattern

```tsx
const handleOperation = async () => {
  try {
    setLoading(true);
    clearErrors();

    const result = await performOperation();
    
    addNotification(emailNotifications.operationSuccess());
    return result;
  } catch (error) {
    if (error.message.includes('SMTP')) {
      addError(emailErrors.smtpConnectionFailed(error.message));
    } else if (error.message.includes('auth')) {
      addError(emailErrors.smtpAuthFailed(error.message));
    } else {
      addError(emailErrors.networkError(error.message));
    }
  } finally {
    setLoading(false);
  }
};
```

### 3. Form Validation Pattern

```tsx
const [formData, setFormData] = useState({
  email: '',
  host: '',
  port: ''
});

const validationResults = useMemo(() => [
  {
    name: 'Email',
    validation: validateField(formData.email, [emailValidationRules.email])
  },
  {
    name: 'Host',
    validation: validateField(formData.host, [emailValidationRules.smtpHost])
  },
  {
    name: 'Port',
    validation: validateField(formData.port, [emailValidationRules.port])
  }
], [formData]);

const isFormValid = validationResults.every(field => field.validation.isValid);
```

## Best Practices

### 1. Error Messages
- Use specific, actionable error messages
- Include troubleshooting steps
- Provide context about what went wrong
- Offer retry options when appropriate

### 2. Loading States
- Show loading indicators for operations > 500ms
- Use specific loading messages
- Include progress bars for long operations
- Disable interactive elements during loading

### 3. Notifications
- Use appropriate notification types (success, info, warning, error)
- Set reasonable auto-dismiss timers
- Allow manual dismissal
- Don't overwhelm users with too many notifications

### 4. Form Validation
- Validate on blur, not on every keystroke
- Show positive feedback for valid inputs
- Group related validation errors
- Provide helpful suggestions for fixing errors

### 5. Help System
- Use tooltips for brief explanations
- Provide contextual help for complex features
- Include links to external documentation
- Use progressive disclosure for detailed help

## Testing

The error handling system includes comprehensive tests:

```bash
# Run error handling tests
npm test __tests__/components/admin/EmailErrorHandling.test.tsx

# Run integration tests
npm test __tests__/integration/email-error-handling.test.tsx
```

## Accessibility

The error handling system follows accessibility best practices:

- **Screen Reader Support**: All error messages and notifications are announced
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Color Independence**: Errors are indicated with icons, not just color
- **Focus Management**: Focus is managed appropriately during error states
- **ARIA Labels**: Proper ARIA labels and descriptions are provided

## Performance

The system is optimized for performance:

- **Lazy Loading**: Components are loaded only when needed
- **Memoization**: Expensive calculations are memoized
- **Debouncing**: Form validation is debounced to prevent excessive re-renders
- **Efficient Updates**: State updates are batched where possible

## Customization

You can customize the error handling system:

```tsx
// Custom error types
const customErrors = {
  myCustomError: (details: string) => ({
    code: 'MY_CUSTOM_ERROR',
    message: 'Custom error occurred',
    details
  })
};

// Custom notification types
const customNotifications = {
  myCustomSuccess: (message: string) => ({
    id: `custom-${Date.now()}`,
    type: 'success' as const,
    title: 'Custom Success',
    message,
    duration: 5000
  })
};

// Custom validation rules
const customValidationRules = {
  myCustomRule: {
    test: (value: string) => value.length > 10,
    message: 'Value must be longer than 10 characters',
    type: 'error' as const
  }
};
```

This comprehensive error handling system ensures a smooth, user-friendly experience for all email management operations while providing developers with powerful tools for handling edge cases and providing helpful feedback to users.