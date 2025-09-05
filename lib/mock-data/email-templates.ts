/**
 * Mock Email Templates Data Service
 * Provides realistic mock data for email template management
 */

export interface EmailTemplate {
  id: string;
  type: 'welcome' | 'lesson_reminder' | 'password_reset' | 'newsletter' | 'notification';
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  placeholders: string[];
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  usage_stats?: {
    total_sent: number;
    last_sent?: string;
    success_rate: number;
  };
}

/**
 * Generate realistic HTML content for email templates
 */
function generateHtmlContent(type: EmailTemplate['type'], subject: string): string {
  const baseStyles = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
      .content { padding: 20px; background: #f9f9f9; }
      .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      .button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
    </style>
  `;

  switch (type) {
    case 'welcome':
      return `
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to {{app_name}}!</h1>
            </div>
            <div class="content">
              <h2>Hello {{user_name}},</h2>
              <p>We're excited to have you join our language learning community!</p>
              <p>Your account has been successfully created with the email: <strong>{{user_email}}</strong></p>
              <p>Here's what you can do next:</p>
              <ul>
                <li>Complete your profile setup</li>
                <li>Browse available lessons</li>
                <li>Schedule your first session</li>
              </ul>
              <p style="text-align: center; margin: 30px 0;">
                <a href="{{dashboard_url}}" class="button">Get Started</a>
              </p>
            </div>
            <div class="footer">
              <p>© {{current_year}} {{app_name}}. All rights reserved.</p>
              <p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'lesson_reminder':
      return `
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Lesson Reminder</h1>
            </div>
            <div class="content">
              <h2>Hi {{student_name}},</h2>
              <p>This is a friendly reminder that your lesson is coming up soon!</p>
              <div style="background: white; padding: 15px; border-left: 4px solid #4F46E5; margin: 20px 0;">
                <h3>Lesson Details:</h3>
                <p><strong>Tutor:</strong> {{tutor_name}}</p>
                <p><strong>Date & Time:</strong> {{lesson_datetime}}</p>
                <p><strong>Duration:</strong> {{lesson_duration}} minutes</p>
                <p><strong>Topic:</strong> {{lesson_topic}}</p>
              </div>
              <p>Please make sure you're ready 5 minutes before the scheduled time.</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="{{lesson_url}}" class="button">Join Lesson</a>
              </p>
            </div>
            <div class="footer">
              <p>Need to reschedule? <a href="{{reschedule_url}}">Click here</a></p>
              <p><a href="{{unsubscribe_url}}">Unsubscribe from reminders</a></p>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'password_reset':
      return `
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello {{user_name}},</h2>
              <p>We received a request to reset your password for your {{app_name}} account.</p>
              <p>If you made this request, click the button below to reset your password:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="{{reset_url}}" class="button">Reset Password</a>
              </p>
              <p><strong>This link will expire in {{expiry_hours}} hours.</strong></p>
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>For security reasons, this link will only work once.</p>
              <p>If you have trouble clicking the button, copy and paste this URL into your browser:</p>
              <p style="word-break: break-all;">{{reset_url}}</p>
            </div>
          </div>
        </body>
        </html>
      `;

    default:
      return `
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${subject}</h1>
            </div>
            <div class="content">
              <h2>Hello {{user_name}},</h2>
              <p>{{message_content}}</p>
            </div>
            <div class="footer">
              <p>© {{current_year}} {{app_name}}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
  }
}

/**
 * Generate text content from HTML (simplified)
 */
function generateTextContent(htmlContent: string, type: EmailTemplate['type']): string {
  switch (type) {
    case 'welcome':
      return `Welcome to {{app_name}}!\n\nHello {{user_name}},\n\nWe're excited to have you join our language learning community!\n\nYour account has been successfully created with the email: {{user_email}}\n\nHere's what you can do next:\n- Complete your profile setup\n- Browse available lessons\n- Schedule your first session\n\nGet started: {{dashboard_url}}\n\n© {{current_year}} {{app_name}}. All rights reserved.\nUnsubscribe: {{unsubscribe_url}}`;

    case 'lesson_reminder':
      return `Lesson Reminder\n\nHi {{student_name}},\n\nThis is a friendly reminder that your lesson is coming up soon!\n\nLesson Details:\nTutor: {{tutor_name}}\nDate & Time: {{lesson_datetime}}\nDuration: {{lesson_duration}} minutes\nTopic: {{lesson_topic}}\n\nPlease make sure you're ready 5 minutes before the scheduled time.\n\nJoin Lesson: {{lesson_url}}\n\nNeed to reschedule? {{reschedule_url}}\nUnsubscribe from reminders: {{unsubscribe_url}}`;

    case 'password_reset':
      return `Password Reset Request\n\nHello {{user_name}},\n\nWe received a request to reset your password for your {{app_name}} account.\n\nIf you made this request, click this link to reset your password:\n{{reset_url}}\n\nThis link will expire in {{expiry_hours}} hours.\n\nIf you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.\n\nFor security reasons, this link will only work once.`;

    default:
      return htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

/**
 * Extract placeholders from template content
 */
function extractPlaceholders(content: string): string[] {
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const placeholders = new Set<string>();
  let match;
  
  while ((match = placeholderRegex.exec(content)) !== null) {
    placeholders.add(match[1].trim());
  }
  
  return Array.from(placeholders).sort();
}

/**
 * Generate usage statistics for templates
 */
function generateUsageStats(): EmailTemplate['usage_stats'] {
  const totalSent = Math.floor(Math.random() * 1000) + 100;
  const successRate = 0.85 + Math.random() * 0.13; // 85-98% success rate
  
  return {
    total_sent: totalSent,
    last_sent: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    success_rate: Math.round(successRate * 100) / 100
  };
}

/**
 * Generate a single mock email template
 */
function generateMockTemplate(
  type: EmailTemplate['type'],
  name: string,
  subject: string,
  isActive: boolean = true
): EmailTemplate {
  const htmlContent = generateHtmlContent(type, subject);
  const textContent = generateTextContent(htmlContent, type);
  const placeholders = extractPlaceholders(htmlContent + ' ' + subject);
  
  const now = new Date();
  const createdAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
  const updatedAt = new Date(createdAt.getTime() + Math.random() * (now.getTime() - createdAt.getTime()));
  
  return {
    id: `template-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    name,
    subject,
    html_content: htmlContent,
    text_content: textContent,
    placeholders,
    is_active: isActive,
    version: Math.floor(Math.random() * 5) + 1,
    created_at: createdAt.toISOString(),
    updated_at: updatedAt.toISOString(),
    created_by: 'admin@example.com',
    usage_stats: generateUsageStats()
  };
}

/**
 * Generate complete set of mock email templates
 */
export function generateMockEmailTemplates(): EmailTemplate[] {
  return [
    generateMockTemplate('welcome', 'Welcome Email Template', 'Welcome to {{app_name}}!', true),
    generateMockTemplate('welcome', 'Welcome Email - Alternative', 'Get started with {{app_name}}', false),
    generateMockTemplate('lesson_reminder', 'Lesson Reminder Template', 'Your lesson with {{tutor_name}} starts in 15 minutes', true),
    generateMockTemplate('lesson_reminder', 'Lesson Reminder - 1 Hour', 'Upcoming lesson reminder - {{lesson_topic}}', false),
    generateMockTemplate('password_reset', 'Password Reset Template', 'Reset your {{app_name}} password', true),
    generateMockTemplate('newsletter', 'Monthly Newsletter', '{{newsletter_title}} - {{app_name}}', true),
    generateMockTemplate('notification', 'General Notification', 'Important update from {{app_name}}', true),
  ];
}

/**
 * Get mock templates with filters
 */
export function getMockTemplatesWithFilters(filters: {
  type?: string;
  active?: boolean;
  search?: string;
}): EmailTemplate[] {
  let templates = generateMockEmailTemplates();
  
  if (filters.type) {
    templates = templates.filter(t => t.type === filters.type);
  }
  
  if (filters.active !== undefined) {
    templates = templates.filter(t => t.is_active === filters.active);
  }
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    templates = templates.filter(t => 
      t.name.toLowerCase().includes(searchLower) ||
      t.subject.toLowerCase().includes(searchLower) ||
      t.type.toLowerCase().includes(searchLower)
    );
  }
  
  return templates;
}

/**
 * Get a specific mock template by ID
 */
export function getMockTemplateById(id: string): EmailTemplate | null {
  const templates = generateMockEmailTemplates();
  return templates.find(t => t.id === id) || null;
}

/**
 * Get template types with counts
 */
export function getMockTemplateTypes(): Array<{
  type: string;
  count: number;
  active_count: number;
}> {
  const templates = generateMockEmailTemplates();
  const types = new Map<string, { total: number; active: number }>();
  
  templates.forEach(template => {
    const current = types.get(template.type) || { total: 0, active: 0 };
    current.total++;
    if (template.is_active) current.active++;
    types.set(template.type, current);
  });
  
  return Array.from(types.entries()).map(([type, counts]) => ({
    type,
    count: counts.total,
    active_count: counts.active
  }));
}

/**
 * Create a new mock template
 */
export function createMockTemplate(data: {
  type: EmailTemplate['type'];
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  is_active?: boolean;
}): EmailTemplate {
  const textContent = data.text_content || generateTextContent(data.html_content, data.type);
  const placeholders = extractPlaceholders(data.html_content + ' ' + data.subject);
  
  return {
    id: `template-${data.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: data.type,
    name: data.name,
    subject: data.subject,
    html_content: data.html_content,
    text_content: textContent,
    placeholders,
    is_active: data.is_active ?? true,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'admin@example.com',
    usage_stats: {
      total_sent: 0,
      success_rate: 0
    }
  };
}

/**
 * Update a mock template
 */
export function updateMockTemplate(id: string, updates: Partial<EmailTemplate>): EmailTemplate | null {
  const template = getMockTemplateById(id);
  if (!template) return null;
  
  const updatedTemplate = {
    ...template,
    ...updates,
    id: template.id, // Ensure ID doesn't change
    updated_at: new Date().toISOString(),
    version: template.version + 1
  };
  
  // Recalculate placeholders if content changed
  if (updates.html_content || updates.subject) {
    updatedTemplate.placeholders = extractPlaceholders(
      (updates.html_content || template.html_content) + ' ' + 
      (updates.subject || template.subject)
    );
  }
  
  return updatedTemplate;
}