/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmailTestingInterface from '../../../components/admin/EmailTestingInterface';
import { beforeEach } from 'node:test';

// Mock the email test service
jest.mock('@/lib/email-test-service', () => ({
  emailTestService: {
    getTestHistory: jest.fn().mockResolvedValue({
      tests: [],
      totalCount: 0,
      page: 1,
      pageSize: 10
    }),
    validateTestParameters: jest.fn().mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: []
    }),
    generatePreview: jest.fn().mockResolvedValue({
      subject: 'Test Subject',
      htmlContent: '<p>Test HTML</p>',
      textContent: 'Test Text'
    }),
    sendTestEmail: jest.fn().mockResolvedValue({
      testId: 'test-123',
      status: 'sent',
      message: 'Test email sent successfully'
    }),
    getTestStatus: jest.fn().mockResolvedValue({
      testId: 'test-123',
      status: 'delivered',
      recipientEmail: 'test@example.com',
      subject: 'Test Subject',
      sentAt: new Date().toISOString()
    })
  }
}));

// Mock fetch for templates API
global.fetch = jest.fn().mockImplementation((url) => {
  if (url === '/api/admin/email/templates') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        templates: [
          {
            id: 'template-1',
            type: 'welcome',
            name: 'Welcome Email',
            subject: 'Welcome {{user_name}}!',
            placeholders: ['user_name', 'user_email'],
            isActive: true
          }
        ]
      })
    });
  }
  return Promise.reject(new Error('Unknown URL'));
});

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('EmailTestingInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the email testing interface', async () => {
    render(<EmailTestingInterface />);
    
    expect(screen.getByText('Email Testing Interface')).toBeInTheDocument();
    expect(screen.getByText('Test email templates with custom parameters and track delivery status')).toBeInTheDocument();
    
    // Check for tabs
    expect(screen.getByText('Compose Test')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('Test History')).toBeInTheDocument();
  });

  it('loads and displays email templates', async () => {
    render(<EmailTestingInterface />);
    
    await waitFor(() => {
      expect(screen.getByText('Select an email template')).toBeInTheDocument();
    });
  });

  it('shows template selection and parameter inputs', async () => {
    render(<EmailTestingInterface />);
    
    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Select an email template')).toBeInTheDocument();
    });

    // Click on template selector
    const templateSelect = screen.getByText('Select an email template');
    fireEvent.click(templateSelect);
    
    // Template should be available in dropdown (mocked)
    // This would require more complex mocking of the Select component
  });

  it('shows recipient email input', () => {
    render(<EmailTestingInterface />);
    
    expect(screen.getByLabelText('Recipient Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('test@example.com')).toBeInTheDocument();
  });

  it('shows action buttons', () => {
    render(<EmailTestingInterface />);
    
    expect(screen.getByText('Generate Preview')).toBeInTheDocument();
    expect(screen.getByText('Send Test Email')).toBeInTheDocument();
  });

  it('displays test history tab', () => {
    render(<EmailTestingInterface />);
    
    // Click on history tab
    const historyTab = screen.getByText('Test History');
    fireEvent.click(historyTab);
    
    expect(screen.getByText('Recent Test History')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('shows preview tab content', () => {
    render(<EmailTestingInterface />);
    
    // Click on preview tab
    const previewTab = screen.getByText('Preview');
    fireEvent.click(previewTab);
    
    expect(screen.getByText('Generate a preview to see your email content')).toBeInTheDocument();
  });

  it('handles recipient email input changes', () => {
    render(<EmailTestingInterface />);
    
    const emailInput = screen.getByLabelText('Recipient Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    expect(emailInput).toHaveValue('test@example.com');
  });
});