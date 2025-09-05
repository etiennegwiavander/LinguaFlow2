/**
 * Validates template placeholders against content
 */
export function validatePlaceholders(content: string, placeholders: string[]): { isValid: boolean; errors: string[] } {
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

/**
 * Basic HTML sanitization for email templates
 * Note: In production, consider using a proper HTML sanitization library
 */
export function sanitizeHtml(html: string): string {
  // Basic sanitization - remove script tags and dangerous attributes
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
  
  return sanitized;
}

/**
 * Replaces placeholders in content with provided data
 */
export function replacePlaceholders(content: string, data: Record<string, any>): string {
  let result = content;
  
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  result = result.replace(placeholderRegex, (match, placeholder) => {
    const key = placeholder.trim();
    return data[key] !== undefined && data[key] !== null ? String(data[key]) : match;
  });
  
  return result;
}

/**
 * Generates sample data for different template types
 */
export function getSampleData(templateType: string): Record<string, any> {
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

/**
 * Validates template type
 */
export function isValidTemplateType(type: string): boolean {
  const validTypes = ['welcome', 'lesson_reminder', 'password_reset', 'custom'];
  return validTypes.includes(type);
}

/**
 * Gets valid template types
 */
export function getValidTemplateTypes(): string[] {
  return ['welcome', 'lesson_reminder', 'password_reset', 'custom'];
}

/**
 * Finds unresolved placeholders in content
 */
export function findUnresolvedPlaceholders(content: string): string[] {
  const unresolvedPlaceholders: string[] = [];
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  
  let match;
  while ((match = placeholderRegex.exec(content)) !== null) {
    const placeholder = match[1].trim();
    if (!unresolvedPlaceholders.includes(placeholder)) {
      unresolvedPlaceholders.push(placeholder);
    }
  }
  
  return unresolvedPlaceholders;
}