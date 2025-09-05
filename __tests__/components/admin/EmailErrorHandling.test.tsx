import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmailErrorBoundary } from '@/components/admin/EmailErrorBoundary';
import { EmailErrorMessage, EmailErrorSummary, emailErrors } from '@/components/admin/EmailErrorMessages';
import { NotificationContainer, emailNotifications } from '@/components/admin/EmailNotifications';
import { ValidatedFormField, emailValidationRules } from '@/components/admin/EmailFormValidation';
import { useEmailErrorHandling } from '@/hooks/useEmailErrorHandling';

// Mock component that throws an error
function ErrorThrowingComponent() {
  throw new Error('Test error');
}

// Mock component that works normally
function WorkingComponent() {
  return <div>Working component</div>;
}

// Test component for error handling hook
function TestErrorHandlingComponent() {
  const { errors, notifications, addError, addNotification, dismissNotification } = useEmailErrorHandling();

  return (
    <div>
      <button 
        onClick={() => addError(emailErrors.smtpConnectionFailed('Test connection failed'))}
        data-testid="add-error"
      >
        Add Error
      </button>
      <button 
        onClick={() => addNotification(emailNotifications.smtpConfigSaved('Gmail'))}
        data-testid="add-notification"
      >
        Add Notification
      </button>
      <div data-testid="error-count">{errors.length}</div>
      <div data-testid="notification-count">{notifications.length}</div>
      <NotificationContainer 
        notifications={notifications}
        onDismiss={dismissNotification}
      />
      {errors.map((error, index) => (
        <EmailErrorMessage key={index} error={error} />
      ))}
    </div>
  );
}

describe('Email Error Handling System', () => {
  describe('EmailErrorBoundary', () => {
    it('should catch and display errors', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <EmailErrorBoundary>
          <ErrorThrowingComponent />
        </EmailErrorBoundary>
      );

      expect(screen.getByText('Email Management Error')).toBeInTheDocument();
      expect(screen.getByText(/Something went wrong while loading/)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should render children when no error occurs', () => {
      render(
        <EmailErrorBoundary>
          <WorkingComponent />
        </EmailErrorBoundary>
      );

      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    it('should allow retry after error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { rerender } = render(
        <EmailErrorBoundary>
          <ErrorThrowingComponent />
        </EmailErrorBoundary>
      );

      expect(screen.getByText('Email Management Error')).toBeInTheDocument();

      // Click retry button
      fireEvent.click(screen.getByText('Try Again'));

      // Rerender with working component
      rerender(
        <EmailErrorBoundary>
          <WorkingComponent />
        </EmailErrorBoundary>
      );

      expect(screen.getByText('Working component')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('EmailErrorMessage', () => {
    it('should display SMTP connection error with troubleshooting', () => {
      const error = emailErrors.smtpConnectionFailed('Connection timeout');

      render(<EmailErrorMessage error={error} />);

      expect(screen.getByText('Connection Failed')).toBeInTheDocument();
      expect(screen.getByText(/Connection timeout/)).toBeInTheDocument();
      expect(screen.getByText(/Verify the SMTP server hostname/)).toBeInTheDocument();
    });

    it('should display authentication error with specific guidance', () => {
      const error = emailErrors.smtpAuthFailed('Invalid credentials');

      render(<EmailErrorMessage error={error} />);

      expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
      expect(screen.getByText(/Double-check your username and password/)).toBeInTheDocument();
    });

    it('should show retry button when onRetry is provided', () => {
      const error = emailErrors.networkError('Network unavailable');
      const onRetry = jest.fn();

      render(<EmailErrorMessage error={error} onRetry={onRetry} />);

      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('EmailErrorSummary', () => {
    it('should display multiple errors', () => {
      const errors = [
        emailErrors.smtpConnectionFailed('Connection failed'),
        emailErrors.templateValidationFailed('Invalid template')
      ];

      render(<EmailErrorSummary errors={errors} />);

      expect(screen.getByText('2 Errors Found')).toBeInTheDocument();
      expect(screen.getByText(/Connection failed/)).toBeInTheDocument();
      expect(screen.getByText(/Invalid template/)).toBeInTheDocument();
    });

    it('should not render when no errors', () => {
      const { container } = render(<EmailErrorSummary errors={[]} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('NotificationContainer', () => {
    it('should display success notifications', () => {
      const notifications = [emailNotifications.smtpConfigSaved('Gmail')];
      const onDismiss = jest.fn();

      render(
        <NotificationContainer 
          notifications={notifications}
          onDismiss={onDismiss}
        />
      );

      expect(screen.getByText('SMTP Configuration Saved')).toBeInTheDocument();
      expect(screen.getByText(/Gmail SMTP settings have been successfully saved/)).toBeInTheDocument();
    });

    it('should allow dismissing notifications', () => {
      const notifications = [emailNotifications.testEmailSent('test@example.com')];
      const onDismiss = jest.fn();

      render(
        <NotificationContainer 
          notifications={notifications}
          onDismiss={onDismiss}
        />
      );

      const dismissButton = screen.getByRole('button');
      fireEvent.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledWith(notifications[0].id);
    });
  });

  describe('ValidatedFormField', () => {
    it('should validate email addresses', () => {
      const onChange = jest.fn();

      render(
        <ValidatedFormField
          label="Email"
          value="invalid-email"
          onChange={onChange}
          type="email"
          validation={[emailValidationRules.email]}
        />
      );

      const input = screen.getByLabelText('Email');
      fireEvent.blur(input);

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('should show success state for valid input', () => {
      const onChange = jest.fn();

      render(
        <ValidatedFormField
          label="Email"
          value="test@example.com"
          onChange={onChange}
          type="email"
          validation={[emailValidationRules.email]}
        />
      );

      const input = screen.getByLabelText('Email');
      fireEvent.blur(input);

      // Should show success icon (CheckCircle)
      expect(document.querySelector('.text-green-500')).toBeInTheDocument();
    });

    it('should validate SMTP host format', () => {
      const onChange = jest.fn();

      render(
        <ValidatedFormField
          label="SMTP Host"
          value="invalid-host"
          onChange={onChange}
          validation={[emailValidationRules.smtpHost]}
        />
      );

      const input = screen.getByLabelText('SMTP Host');
      fireEvent.blur(input);

      expect(screen.getByText(/Please enter a valid hostname/)).toBeInTheDocument();
    });

    it('should validate port numbers', () => {
      const onChange = jest.fn();

      render(
        <ValidatedFormField
          label="Port"
          value="99999"
          onChange={onChange}
          type="number"
          validation={[emailValidationRules.port]}
        />
      );

      const input = screen.getByLabelText('Port');
      fireEvent.blur(input);

      expect(screen.getByText(/Port must be a number between 1 and 65535/)).toBeInTheDocument();
    });

    it('should show password visibility toggle', () => {
      const onChange = jest.fn();

      render(
        <ValidatedFormField
          label="Password"
          value="secret123"
          onChange={onChange}
          type="password"
        />
      );

      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toBeInTheDocument();

      fireEvent.click(toggleButton);
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('type', 'text');
    });
  });

  describe('useEmailErrorHandling hook', () => {
    it('should manage errors and notifications', () => {
      render(<TestErrorHandlingComponent />);

      expect(screen.getByTestId('error-count')).toHaveTextContent('0');
      expect(screen.getByTestId('notification-count')).toHaveTextContent('0');

      // Add an error
      fireEvent.click(screen.getByTestId('add-error'));
      expect(screen.getByTestId('error-count')).toHaveTextContent('1');

      // Add a notification
      fireEvent.click(screen.getByTestId('add-notification'));
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
    });

    it('should handle async operations with error handling', async () => {
      const TestAsyncComponent = () => {
        const { handleAsyncOperation, errors } = useEmailErrorHandling();

        const handleSuccess = () => {
          handleAsyncOperation(
            () => Promise.resolve('success'),
            { successMessage: 'Operation completed' }
          );
        };

        const handleError = () => {
          handleAsyncOperation(
            () => Promise.reject(new Error('Operation failed')),
            { errorMessage: 'Operation failed' }
          );
        };

        return (
          <div>
            <button onClick={handleSuccess} data-testid="success-op">Success</button>
            <button onClick={handleError} data-testid="error-op">Error</button>
            <div data-testid="error-count">{errors.length}</div>
          </div>
        );
      };

      render(<TestAsyncComponent />);

      // Test successful operation
      fireEvent.click(screen.getByTestId('success-op'));
      await waitFor(() => {
        expect(screen.getByTestId('error-count')).toHaveTextContent('0');
      });

      // Test failed operation
      fireEvent.click(screen.getByTestId('error-op'));
      await waitFor(() => {
        expect(screen.getByTestId('error-count')).toHaveTextContent('1');
      });
    });
  });
});