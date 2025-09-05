import DOMPurify from 'isomorphic-dompurify';

// Mock DOMPurify
jest.mock('isomorphic-dompurify', () => ({
  sanitize: jest.fn()
}));

const mockDOMPurify = DOMPurify as jest.Mocked<typeof DOMPurify>;

// Import the functions we want to test (we'll extract them to a utils file)
// For now, we'll test the logic inline

describe('Email Template Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validatePlaceholders', () => {
    function validatePlaceholders(content: string, placeholders: string[]): { isValid: boolean; errors: string[] } {
      const errors: string[] = [];
      const placeholderRegex = /\{\{([^}]+)\}\}/g;
      const foundPlaceholders = new Set<string>();
      
      let match;
      while ((match = placeholderRegex.exec(content)) !== null) {
        const placeholder = match[1].trim();
        foundPlaceholders.add(placeholder);
        
        if (!placeholders.includes(placeholder)) {
          errors.push(`Unknown placeholder: {{${placeholder}}}`);
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    }

    it('should validate content with valid placeholders', () => {
      const content = 'Hello {{user_name}}, welcome to {{app_name}}!';
      const placeholders = ['user_name', 'app_name'];
      
      const result = validatePlaceholders(content, placeholders);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect unknown placeholders', () => {
      const content = 'Hello {{user_name}}, your {{unknown_field}} is ready!';
      const placeholders = ['user_name', 'app_name'];
      
      const result = validatePlaceholders(content, placeholders);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unknown placeholder: {{unknown_field}}');
    });

    it('should handle content without placeholders', () => {
      const content = 'This is plain text without any placeholders.';
      const placeholders = ['user_name'];
      
      const result = validatePlaceholders(content, placeholders);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle malformed placeholders', () => {
      const content = 'Hello {{user_name}}, welcome to {app_name}!';
      const placeholders = ['user_name', 'app_name'];
      
      const result = validatePlaceholders(content, placeholders);
      
      expect(result.isValid).toBe(true); // {app_name} is not recognized as a placeholder
      expect(result.errors).toHaveLength(0);
    });

    it('should handle nested braces', () => {
      const content = 'Hello {{user_name}}, your balance is ${{{{amount}}}}';
      const placeholders = ['user_name', 'amount'];
      
      const result = validatePlaceholders(content, placeholders);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should trim whitespace in placeholder names', () => {
      const content = 'Hello {{ user_name }}, welcome to {{  app_name  }}!';
      const placeholders = ['user_name', 'app_name'];
      
      const result = validatePlaceholders(content, placeholders);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle duplicate placeholders', () => {
      const content = 'Hello {{user_name}}, {{user_name}}! Welcome to {{app_name}}.';
      const placeholders = ['user_name', 'app_name'];
      
      const result = validatePlaceholders(content, placeholders);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('sanitizeHtml', () => {
    function sanitizeHtml(html: string): string {
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'div', 'span', 'table', 'tr', 'td', 'th', 'tbody', 'thead'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'class', 'target'],
        ALLOW_DATA_ATTR: false
      });
    }

    it('should call DOMPurify with correct configuration', () => {
      const html = '<p>Test content</p>';
      mockDOMPurify.sanitize.mockReturnValue('<p>Test content</p>');
      
      const result = sanitizeHtml(html);
      
      expect(mockDOMPurify.sanitize).toHaveBeenCalledWith(html, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'div', 'span', 'table', 'tr', 'td', 'th', 'tbody', 'thead'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'class', 'target'],
        ALLOW_DATA_ATTR: false
      });
      expect(result).toBe('<p>Test content</p>');
    });

    it('should handle empty HTML', () => {
      mockDOMPurify.sanitize.mockReturnValue('');
      
      const result = sanitizeHtml('');
      
      expect(mockDOMPurify.sanitize).toHaveBeenCalledWith('', expect.any(Object));
      expect(result).toBe('');
    });

    it('should preserve allowed tags and attributes', () => {
      const html = '<p class="test"><strong>Bold text</strong> with <a href="https://example.com" target="_blank">link</a></p>';
      mockDOMPurify.sanitize.mockReturnValue(html);
      
      const result = sanitizeHtml(html);
      
      expect(result).toBe(html);
    });
  });

  describe('replacePlaceholders', () => {
    function replacePlaceholders(content: string, data: Record<string, any>): string {
      let result = content;
      
      const placeholderRegex = /\{\{([^}]+)\}\}/g;
      result = result.replace(placeholderRegex, (match, placeholder) => {
        const key = placeholder.trim();
        return data[key] !== undefined && data[key] !== null ? String(data[key]) : match;
      });
      
      return result;
    }

    it('should replace placeholders with provided data', () => {
      const content = 'Hello {{user_name}}, welcome to {{app_name}}!';
      const data = { user_name: 'John Doe', app_name: 'TestApp' };
      
      const result = replacePlaceholders(content, data);
      
      expect(result).toBe('Hello John Doe, welcome to TestApp!');
    });

    it('should leave unmatched placeholders unchanged', () => {
      const content = 'Hello {{user_name}}, your {{missing_field}} is ready!';
      const data = { user_name: 'John Doe' };
      
      const result = replacePlaceholders(content, data);
      
      expect(result).toBe('Hello John Doe, your {{missing_field}} is ready!');
    });

    it('should handle non-string values', () => {
      const content = 'Your balance is {{balance}} and you have {{count}} items.';
      const data = { balance: 123.45, count: 5, active: true };
      
      const result = replacePlaceholders(content, data);
      
      expect(result).toBe('Your balance is 123.45 and you have 5 items.');
    });

    it('should handle null and undefined values', () => {
      const content = 'Value: {{null_value}}, Undefined: {{undefined_value}}';
      const data = { null_value: null, other_value: 'test' };
      
      const result = replacePlaceholders(content, data);
      
      expect(result).toBe('Value: {{null_value}}, Undefined: {{undefined_value}}');
    });

    it('should handle empty string values', () => {
      const content = 'Name: "{{name}}", Title: "{{title}}"';
      const data = { name: '', title: 'Manager' };
      
      const result = replacePlaceholders(content, data);
      
      expect(result).toBe('Name: "", Title: "Manager"');
    });

    it('should handle whitespace in placeholder names', () => {
      const content = 'Hello {{ user_name }}, welcome to {{  app_name  }}!';
      const data = { user_name: 'John Doe', app_name: 'TestApp' };
      
      const result = replacePlaceholders(content, data);
      
      expect(result).toBe('Hello John Doe, welcome to TestApp!');
    });
  });

  describe('getSampleData', () => {
    function getSampleData(templateType: string): Record<string, any> {
      const baseData = {
        app_name: 'LinguaFlow',
        user_name: 'John Doe',
        user_email: 'john.doe@example.com',
        current_date: new Date().toLocaleDateString(),
        current_time: new Date().toLocaleTimeString(),
        support_email: 'support@linguaflow.com',
        company_name: 'LinguaFlow Inc.'
      };
      
      switch (templateType) {
        case 'welcome':
          return {
            ...baseData,
            login_url: 'https://app.linguaflow.com/login',
            getting_started_url: 'https://app.linguaflow.com/getting-started'
          };
          
        case 'lesson_reminder':
          return {
            ...baseData,
            lesson_title: 'Advanced English Conversation',
            lesson_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString(),
            lesson_time: '2:00 PM',
            lesson_url: 'https://app.linguaflow.com/lessons/123',
            tutor_name: 'Sarah Johnson',
            lesson_duration: '60 minutes'
          };
          
        case 'password_reset':
          return {
            ...baseData,
            reset_url: 'https://app.linguaflow.com/reset-password?token=sample-token',
            reset_expiry: '24 hours',
            ip_address: '192.168.1.1',
            browser: 'Chrome on Windows'
          };
          
        case 'custom':
        default:
          return baseData;
      }
    }

    it('should return base data for unknown template type', () => {
      const result = getSampleData('unknown_type');
      
      expect(result).toHaveProperty('app_name', 'LinguaFlow');
      expect(result).toHaveProperty('user_name', 'John Doe');
      expect(result).toHaveProperty('user_email', 'john.doe@example.com');
      expect(result).not.toHaveProperty('login_url');
    });

    it('should return welcome-specific data for welcome template', () => {
      const result = getSampleData('welcome');
      
      expect(result).toHaveProperty('app_name', 'LinguaFlow');
      expect(result).toHaveProperty('login_url', 'https://app.linguaflow.com/login');
      expect(result).toHaveProperty('getting_started_url', 'https://app.linguaflow.com/getting-started');
    });

    it('should return lesson-specific data for lesson_reminder template', () => {
      const result = getSampleData('lesson_reminder');
      
      expect(result).toHaveProperty('lesson_title', 'Advanced English Conversation');
      expect(result).toHaveProperty('tutor_name', 'Sarah Johnson');
      expect(result).toHaveProperty('lesson_url', 'https://app.linguaflow.com/lessons/123');
    });

    it('should return password reset-specific data for password_reset template', () => {
      const result = getSampleData('password_reset');
      
      expect(result).toHaveProperty('reset_url');
      expect(result).toHaveProperty('reset_expiry', '24 hours');
      expect(result).toHaveProperty('ip_address', '192.168.1.1');
    });

    it('should include current date and time', () => {
      const result = getSampleData('welcome');
      
      expect(result).toHaveProperty('current_date');
      expect(result).toHaveProperty('current_time');
      expect(typeof result.current_date).toBe('string');
      expect(typeof result.current_time).toBe('string');
    });
  });
});