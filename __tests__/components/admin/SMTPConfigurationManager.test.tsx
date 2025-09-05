import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SMTPConfigurationManager } from '../../../components/admin/SMTPConfigurationManager';

// Mock fetch
global.fetch = jest.fn();

// Mock toast notifications
jest.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock components
jest.mock('../../../components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogTrigger: ({ children }: any) => <div data-testid="dialog-trigger">{children}</div>
}));

jest.mock('../../../components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  )
}));

jest.mock('../../../components/ui/input', () => ({
  Input: (props: any) => <input {...props} />
}));

jest.mock('../../../components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <select 
      onChange={(e) => onValueChange?.(e.target.value)} 
      value={value}
      data-testid="select"
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>
}));

jest.mock('../../../components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>
}));

const mockSMTPConfigs = [
  {
    id: 'smtp-1',
    provider: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    username: 'test@gmail.com',
    encryption: 'tls',
    is_active: true,
    last_tested: '2023-01-01T10:00:00Z',
    test_status: 'success'
  },
  {
    id: 'smtp-2',
    provider: 'sendgrid',
    host: 'smtp.sendgrid.net',
    port: 587,
    username: 'apikey',
    encryption: 'tls',
    is_active: false,
    last_tested: '2023-01-01T09:00:00Z',
    test_status: 'failed'
  }
];

describe('SMTPConfigurationManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockSMTPConfigs })
    });
  });

  it('should render SMTP configuration list', async () => {
    render(<SMTPConfigurationManager />);

    await waitFor(() => {
      expect(screen.getByText('SMTP Configuration')).toBeInTheDocument();
    });

    expect(screen.getByText('Gmail')).toBeInTheDocument();
    expect(screen.getByText('SendGrid')).toBeInTheDocument();
    expect(screen.getByText('test@gmail.com')).toBeInTheDocument();
  });

  it('should show configuration status indicators', async () => {
    render(<SMTPConfigurationManager />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  it('should open create configuration dialog', async () => {
    const user = userEvent.setup();
    render(<SMTPConfigurationManager />);

    const addButton = screen.getByText('Add SMTP Configuration');
    await user.click(addButton);

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByText('Add SMTP Configuration')).toBeInTheDocument();
  });

  it('should show provider-specific fields when provider is selected', async () => {
    const user = userEvent.setup();
    render(<SMTPConfigurationManager />);

    // Open create dialog
    const addButton = screen.getByText('Add SMTP Configuration');
    await user.click(addButton);

    // Select Gmail provider
    const providerSelect = screen.getByTestId('select');
    await user.selectOptions(providerSelect, 'gmail');

    expect(screen.getByDisplayValue('smtp.gmail.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('587')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<SMTPConfigurationManager />);

    // Open create dialog
    const addButton = screen.getByText('Add SMTP Configuration');
    await user.click(addButton);

    // Try to save without filling required fields
    const saveButton = screen.getByText('Save Configuration');
    await user.click(saveButton);

    expect(screen.getByText('Host is required')).toBeInTheDocument();
    expect(screen.getByText('Username is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('should create SMTP configuration successfully', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockSMTPConfigs })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: { id: 'new-smtp-id', provider: 'gmail' }
        })
      });

    render(<SMTPConfigurationManager />);

    // Open create dialog
    const addButton = screen.getByText('Add SMTP Configuration');
    await user.click(addButton);

    // Fill form
    const providerSelect = screen.getByTestId('select');
    await user.selectOptions(providerSelect, 'gmail');

    const usernameInput = screen.getByLabelText('Username');
    await user.type(usernameInput, 'test@gmail.com');

    const passwordInput = screen.getByLabelText('Password');
    await user.type(passwordInput, 'password123');

    // Save configuration
    const saveButton = screen.getByText('Save Configuration');
    await user.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/email/smtp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'gmail',
          host: 'smtp.gmail.com',
          port: 587,
          username: 'test@gmail.com',
          password: 'password123',
          encryption: 'tls'
        })
      });
    });
  });

  it('should test SMTP connection', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockSMTPConfigs })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          testResult: { success: true, message: 'Connection successful' }
        })
      });

    render(<SMTPConfigurationManager />);

    await waitFor(() => {
      expect(screen.getByText('Gmail')).toBeInTheDocument();
    });

    // Click test connection button
    const testButtons = screen.getAllByText('Test Connection');
    await user.click(testButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/email/smtp-config/smtp-1/test', {
        method: 'POST'
      });
    });

    expect(screen.getByText('Connection successful')).toBeInTheDocument();
  });

  it('should handle test connection failure', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockSMTPConfigs })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          testResult: { success: false, message: 'Authentication failed' }
        })
      });

    render(<SMTPConfigurationManager />);

    await waitFor(() => {
      expect(screen.getByText('Gmail')).toBeInTheDocument();
    });

    // Click test connection button
    const testButtons = screen.getAllByText('Test Connection');
    await user.click(testButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
    });
  });

  it('should edit existing configuration', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockSMTPConfigs })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: { ...mockSMTPConfigs[0], port: 465 }
        })
      });

    render(<SMTPConfigurationManager />);

    await waitFor(() => {
      expect(screen.getByText('Gmail')).toBeInTheDocument();
    });

    // Click edit button
    const editButtons = screen.getAllByText('Edit');
    await user.click(editButtons[0]);

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByDisplayValue('587')).toBeInTheDocument();

    // Change port
    const portInput = screen.getByDisplayValue('587');
    await user.clear(portInput);
    await user.type(portInput, '465');

    // Save changes
    const saveButton = screen.getByText('Save Configuration');
    await user.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/email/smtp-config/smtp-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'gmail',
          host: 'smtp.gmail.com',
          port: 465,
          username: 'test@gmail.com',
          encryption: 'tls'
        })
      });
    });
  });

  it('should delete configuration with confirmation', async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => true);
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockSMTPConfigs })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

    render(<SMTPConfigurationManager />);

    await waitFor(() => {
      expect(screen.getByText('Gmail')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this SMTP configuration?'
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/email/smtp-config/smtp-1', {
        method: 'DELETE'
      });
    });
  });

  it('should toggle configuration active status', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockSMTPConfigs })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: { ...mockSMTPConfigs[0], is_active: false }
        })
      });

    render(<SMTPConfigurationManager />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    // Click toggle button
    const toggleButtons = screen.getAllByRole('switch');
    await user.click(toggleButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/email/smtp-config/smtp-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false })
      });
    });
  });

  it('should show loading states during operations', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockSMTPConfigs })
      })
      .mockReturnValueOnce(pendingPromise);

    render(<SMTPConfigurationManager />);

    await waitFor(() => {
      expect(screen.getByText('Gmail')).toBeInTheDocument();
    });

    // Click test connection button
    const testButtons = screen.getAllByText('Test Connection');
    await user.click(testButtons[0]);

    // Should show loading state
    expect(screen.getByText('Testing...')).toBeInTheDocument();

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: () => Promise.resolve({ 
        success: true, 
        testResult: { success: true, message: 'Connection successful' }
      })
    });

    await waitFor(() => {
      expect(screen.queryByText('Testing...')).not.toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<SMTPConfigurationManager />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load SMTP configurations')).toBeInTheDocument();
    });
  });

  it('should show provider-specific help text', async () => {
    const user = userEvent.setup();
    render(<SMTPConfigurationManager />);

    // Open create dialog
    const addButton = screen.getByText('Add SMTP Configuration');
    await user.click(addButton);

    // Select Gmail provider
    const providerSelect = screen.getByTestId('select');
    await user.selectOptions(providerSelect, 'gmail');

    expect(screen.getByText(/Use your Gmail app password/)).toBeInTheDocument();

    // Select SendGrid provider
    await user.selectOptions(providerSelect, 'sendgrid');

    expect(screen.getByText(/Use your SendGrid API key/)).toBeInTheDocument();
  });

  it('should validate email format for username', async () => {
    const user = userEvent.setup();
    render(<SMTPConfigurationManager />);

    // Open create dialog
    const addButton = screen.getByText('Add SMTP Configuration');
    await user.click(addButton);

    // Enter invalid email
    const usernameInput = screen.getByLabelText('Username');
    await user.type(usernameInput, 'invalid-email');

    // Trigger validation
    await user.tab();

    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
  });

  it('should show connection status history', async () => {
    render(<SMTPConfigurationManager />);

    await waitFor(() => {
      expect(screen.getByText('Last tested:')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
  });
});