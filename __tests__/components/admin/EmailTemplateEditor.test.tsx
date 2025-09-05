import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmailTemplateEditor } from '../../../components/admin/EmailTemplateEditor';

// Mock fetch
global.fetch = jest.fn();

// Mock toast notifications
jest.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock rich text editor
jest.mock('@tiptap/react', () => ({
  useEditor: jest.fn(() => ({
    getHTML: jest.fn(() => '<p>Mock HTML content</p>'),
    commands: {
      setContent: jest.fn(),
      insertContent: jest.fn()
    },
    on: jest.fn(),
    off: jest.fn(),
    destroy: jest.fn()
  })),
  EditorContent: ({ editor }: any) => (
    <div data-testid="editor-content">
      <textarea 
        data-testid="editor-textarea"
        onChange={(e) => editor?.commands?.setContent?.(e.target.value)}
      />
    </div>
  )
}));

// Mock UI components
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

jest.mock('../../../components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />
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

jest.mock('../../../components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue, onValueChange }: any) => (
    <div data-testid="tabs" data-default-value={defaultValue}>
      {children}
    </div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value, onClick }: any) => (
    <button data-testid={`tab-${value}`} onClick={onClick}>
      {children}
    </button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  )
}));

const mockTemplate = {
  id: 'template-1',
  type: 'welcome',
  name: 'Welcome Email Template',
  subject: 'Welcome {{user_name}}!',
  html_content: '<h1>Welcome {{user_name}}</h1><p>Thank you for joining us!</p>',
  text_content: 'Welcome {{user_name}}! Thank you for joining us!',
  placeholders: ['{{user_name}}'],
  is_active: true,
  version: 1,
  created_at: '2023-01-01T10:00:00Z',
  updated_at: '2023-01-01T10:00:00Z'
};

const mockTemplateHistory = [
  {
    id: 'history-1',
    template_id: 'template-1',
    version: 1,
    subject: 'Welcome {{user_name}}!',
    html_content: '<h1>Welcome {{user_name}}</h1>',
    created_at: '2023-01-01T10:00:00Z'
  }
];

describe('EmailTemplateEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockTemplate })
    });
  });

  it('should render template editor form', async () => {
    render(<EmailTemplateEditor />);

    expect(screen.getByText('Email Template Editor')).toBeInTheDocument();
    expect(screen.getByLabelText('Template Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Template Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject Line')).toBeInTheDocument();
  });

  it('should load existing template for editing', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockTemplate })
    });

    render(<EmailTemplateEditor templateId="template-1" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Welcome Email Template')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Welcome {{user_name}}!')).toBeInTheDocument();
    });
  });

  it('should show template type selection', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateEditor />);

    const typeSelect = screen.getByTestId('select');
    expect(typeSelect).toBeInTheDocument();

    await user.selectOptions(typeSelect, 'welcome');
    expect(typeSelect).toHaveValue('welcome');
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateEditor />);

    // Try to save without filling required fields
    const saveButton = screen.getByText('Save Template');
    await user.click(saveButton);

    expect(screen.getByText('Template name is required')).toBeInTheDocument();
    expect(screen.getByText('Subject is required')).toBeInTheDocument();
    expect(screen.getByText('HTML content is required')).toBeInTheDocument();
  });

  it('should create new template successfully', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        success: true, 
        data: { id: 'new-template-id', ...mockTemplate }
      })
    });

    render(<EmailTemplateEditor />);

    // Fill form
    const nameInput = screen.getByLabelText('Template Name');
    await user.type(nameInput, 'New Welcome Template');

    const typeSelect = screen.getByTestId('select');
    await user.selectOptions(typeSelect, 'welcome');

    const subjectInput = screen.getByLabelText('Subject Line');
    await user.type(subjectInput, 'Welcome {{user_name}}!');

    const editorTextarea = screen.getByTestId('editor-textarea');
    await user.type(editorTextarea, '<h1>Welcome {{user_name}}</h1>');

    // Save template
    const saveButton = screen.getByText('Save Template');
    await user.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/email/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Welcome Template',
          type: 'welcome',
          subject: 'Welcome {{user_name}}!',
          html_content: '<p>Mock HTML content</p>',
          text_content: expect.any(String)
        })
      });
    });
  });

  it('should update existing template', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockTemplate })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: { ...mockTemplate, subject: 'Updated Welcome {{user_name}}!' }
        })
      });

    render(<EmailTemplateEditor templateId="template-1" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Welcome {{user_name}}!')).toBeInTheDocument();
    });

    // Update subject
    const subjectInput = screen.getByDisplayValue('Welcome {{user_name}}!');
    await user.clear(subjectInput);
    await user.type(subjectInput, 'Updated Welcome {{user_name}}!');

    // Save changes
    const saveButton = screen.getByText('Save Template');
    await user.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/email/templates/template-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Welcome Email Template',
          type: 'welcome',
          subject: 'Updated Welcome {{user_name}}!',
          html_content: '<p>Mock HTML content</p>',
          text_content: expect.any(String)
        })
      });
    });
  });

  it('should show placeholder insertion helper', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateEditor />);

    expect(screen.getByText('Available Placeholders')).toBeInTheDocument();
    expect(screen.getByText('{{user_name}}')).toBeInTheDocument();
    expect(screen.getByText('{{user_email}}')).toBeInTheDocument();
    expect(screen.getByText('{{lesson_title}}')).toBeInTheDocument();

    // Click placeholder to insert
    const placeholderButton = screen.getByText('{{user_name}}');
    await user.click(placeholderButton);

    // Should insert placeholder into editor
    const { useEditor } = require('@tiptap/react');
    const mockEditor = useEditor();
    expect(mockEditor.commands.insertContent).toHaveBeenCalledWith('{{user_name}}');
  });

  it('should generate preview with sample data', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockTemplate })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          preview: '<h1>Welcome John Doe!</h1><p>Thank you for joining us!</p>'
        })
      });

    render(<EmailTemplateEditor templateId="template-1" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Welcome Email Template')).toBeInTheDocument();
    });

    // Click preview tab
    const previewTab = screen.getByTestId('tab-preview');
    await user.click(previewTab);

    // Generate preview
    const generatePreviewButton = screen.getByText('Generate Preview');
    await user.click(generatePreviewButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/email/templates/template-1/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: 'John Doe',
          user_email: 'john@example.com',
          lesson_title: 'Sample Lesson'
        })
      });
    });

    expect(screen.getByText('Welcome John Doe!')).toBeInTheDocument();
  });

  it('should show template version history', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockTemplate })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockTemplateHistory })
      });

    render(<EmailTemplateEditor templateId="template-1" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Welcome Email Template')).toBeInTheDocument();
    });

    // Click history tab
    const historyTab = screen.getByTestId('tab-history');
    await user.click(historyTab);

    await waitFor(() => {
      expect(screen.getByText('Version 1')).toBeInTheDocument();
      expect(screen.getByText('Welcome {{user_name}}!')).toBeInTheDocument();
    });
  });

  it('should rollback to previous version', async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => true);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockTemplate })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockTemplateHistory })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockTemplate })
      });

    render(<EmailTemplateEditor templateId="template-1" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Welcome Email Template')).toBeInTheDocument();
    });

    // Click history tab
    const historyTab = screen.getByTestId('tab-history');
    await user.click(historyTab);

    await waitFor(() => {
      expect(screen.getByText('Version 1')).toBeInTheDocument();
    });

    // Click rollback button
    const rollbackButton = screen.getByText('Rollback');
    await user.click(rollbackButton);

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to rollback to version 1? This will create a new version.'
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/email/templates/template-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Welcome {{user_name}}!',
          html_content: '<h1>Welcome {{user_name}}</h1>',
          rollback_from_version: 1
        })
      });
    });
  });

  it('should validate placeholder syntax', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateEditor />);

    // Enter invalid placeholder syntax
    const subjectInput = screen.getByLabelText('Subject Line');
    await user.type(subjectInput, 'Welcome {user_name}!'); // Missing double braces

    // Trigger validation
    await user.tab();

    expect(screen.getByText('Invalid placeholder syntax. Use {{placeholder_name}}')).toBeInTheDocument();
  });

  it('should show HTML validation errors', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateEditor />);

    // Fill form with invalid HTML
    const nameInput = screen.getByLabelText('Template Name');
    await user.type(nameInput, 'Test Template');

    const subjectInput = screen.getByLabelText('Subject Line');
    await user.type(subjectInput, 'Test Subject');

    // Mock editor to return invalid HTML
    const { useEditor } = require('@tiptap/react');
    const mockEditor = useEditor();
    mockEditor.getHTML.mockReturnValue('<h1>Unclosed tag');

    // Try to save
    const saveButton = screen.getByText('Save Template');
    await user.click(saveButton);

    expect(screen.getByText('Invalid HTML structure')).toBeInTheDocument();
  });

  it('should toggle template active status', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockTemplate })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: { ...mockTemplate, is_active: false }
        })
      });

    render(<EmailTemplateEditor templateId="template-1" />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    // Click toggle button
    const toggleButton = screen.getByRole('switch');
    await user.click(toggleButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/email/templates/template-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false })
      });
    });
  });

  it('should handle rich text editor formatting', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateEditor />);

    // Should show formatting toolbar
    expect(screen.getByTitle('Bold')).toBeInTheDocument();
    expect(screen.getByTitle('Italic')).toBeInTheDocument();
    expect(screen.getByTitle('Heading 1')).toBeInTheDocument();
    expect(screen.getByTitle('Heading 2')).toBeInTheDocument();

    // Click bold button
    const boldButton = screen.getByTitle('Bold');
    await user.click(boldButton);

    const { useEditor } = require('@tiptap/react');
    const mockEditor = useEditor();
    expect(mockEditor.commands.toggleBold).toHaveBeenCalled();
  });

  it('should show character count for subject line', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateEditor />);

    const subjectInput = screen.getByLabelText('Subject Line');
    await user.type(subjectInput, 'Test Subject');

    expect(screen.getByText('12/100 characters')).toBeInTheDocument();
  });

  it('should warn about long subject lines', async () => {
    const user = userEvent.setup();
    render(<EmailTemplateEditor />);

    const subjectInput = screen.getByLabelText('Subject Line');
    const longSubject = 'A'.repeat(80);
    await user.type(subjectInput, longSubject);

    expect(screen.getByText('Subject line may be truncated in some email clients')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<EmailTemplateEditor />);

    // Fill form
    const nameInput = screen.getByLabelText('Template Name');
    await user.type(nameInput, 'Test Template');

    const subjectInput = screen.getByLabelText('Subject Line');
    await user.type(subjectInput, 'Test Subject');

    // Try to save
    const saveButton = screen.getByText('Save Template');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to save template. Please try again.')).toBeInTheDocument();
    });
  });

  it('should auto-save draft periodically', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup();
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    render(<EmailTemplateEditor />);

    // Type in template name
    const nameInput = screen.getByLabelText('Template Name');
    await user.type(nameInput, 'Draft Template');

    // Fast-forward time to trigger auto-save
    jest.advanceTimersByTime(30000); // 30 seconds

    await waitFor(() => {
      expect(screen.getByText('Draft saved')).toBeInTheDocument();
    });

    jest.useRealTimers();
  });
});