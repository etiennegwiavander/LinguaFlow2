# Admin Portal Email Template Management Guide

## Overview

The Email Template Management system in the LinguaFlow Admin Portal allows administrators to create, edit, and manage email templates used throughout the platform. This system provides a user-friendly interface for managing all email communications.

## Accessing Email Management

### Navigation
1. Log in to the Admin Portal at `http://localhost:3000/admin-portal`
2. Navigate to **Email Management** in the sidebar
3. Choose between **Email Templates** and **SMTP Configuration** tabs

### Alternative Access
Email template management is also available under **Settings > Email** tab for integrated configuration.

## Email Template Management Features

### 1. Template Types

The system supports four template types:

- **Welcome Email**: Sent to new users upon registration
- **Lesson Reminder**: Notifications about upcoming lessons
- **Password Reset**: Security emails for password recovery
- **Custom Template**: User-defined templates for specific needs

### 2. Template Components

Each template consists of:

- **Name**: Descriptive identifier for the template
- **Type**: Category of the template
- **Subject Line**: Email subject with placeholder support
- **HTML Content**: Rich HTML email body
- **Plain Text Content**: Optional fallback text version
- **Placeholders**: Dynamic content variables
- **Status**: Active/Inactive state

### 3. Placeholder System

Placeholders allow dynamic content insertion:

- Format: `{{placeholder_name}}`
- Common placeholders:
  - `{{user_name}}`: Recipient's name
  - `{{app_name}}`: Application name
  - `{{user_email}}`: Recipient's email
  - `{{current_date}}`: Current date
  - `{{support_email}}`: Support contact

#### Type-Specific Placeholders

**Welcome Templates:**
- `{{login_url}}`: Login page URL
- `{{getting_started_url}}`: Onboarding URL

**Lesson Reminder Templates:**
- `{{lesson_title}}`: Lesson name
- `{{lesson_date}}`: Scheduled date
- `{{lesson_time}}`: Scheduled time
- `{{tutor_name}}`: Instructor name
- `{{lesson_url}}`: Lesson access URL

**Password Reset Templates:**
- `{{reset_url}}`: Password reset link
- `{{reset_expiry}}`: Link expiration time
- `{{ip_address}}`: Request origin IP
- `{{browser}}`: User's browser info

## Using the Interface

### Creating a New Template

1. Click **Create Template** button
2. Fill in template details:
   - Select template type
   - Enter descriptive name
   - Write subject line with placeholders
   - Create HTML content
   - Add plain text version (optional)
   - Define placeholders
   - Set active status
3. Click **Create Template** to save

### Editing Templates

1. Find template in the list
2. Click the **Edit** (pencil) icon
3. Modify any template properties
4. Click **Save Changes**
5. Version automatically increments

### Template Preview

1. Click the **Preview** (eye) icon
2. View rendered template with sample data
3. Check for unresolved placeholders
4. Review both HTML and text versions

### Version History

1. Click the **History** (clock) icon
2. View all template versions
3. See modification details and authors
4. Rollback to previous versions if needed

### Template Management

- **Activate/Deactivate**: Only one template per type can be active
- **Delete**: Remove unused templates (prevents deletion of only active template)
- **Duplicate**: Create copies for testing variations

## Best Practices

### Template Design

1. **Keep it Simple**: Use clean, readable HTML
2. **Mobile-Friendly**: Ensure responsive design
3. **Brand Consistency**: Use consistent colors and fonts
4. **Clear CTAs**: Make action buttons prominent

### Placeholder Usage

1. **Validate Content**: Ensure all placeholders are defined
2. **Fallback Values**: Consider what happens with missing data
3. **User-Friendly**: Use descriptive placeholder names
4. **Test Thoroughly**: Preview with various data scenarios

### Content Guidelines

1. **Subject Lines**: Keep under 50 characters for mobile
2. **Personalization**: Use recipient's name when available
3. **Clear Purpose**: Make email intent immediately clear
4. **Professional Tone**: Maintain consistent brand voice

### Security Considerations

1. **HTML Sanitization**: System automatically sanitizes HTML
2. **Placeholder Validation**: Prevents injection attacks
3. **Access Control**: Admin-only template management
4. **Version Control**: Track all changes with history

## Template Examples

### Welcome Email Template

```html
<!DOCTYPE html>
<html>
<head>
    <title>Welcome to {{app_name}}</title>
</head>
<body>
    <h1>Welcome {{user_name}}!</h1>
    <p>Thank you for joining {{app_name}}. We're excited to help you on your language learning journey.</p>
    <p>
        <a href="{{login_url}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Get Started
        </a>
    </p>
    <p>If you have any questions, contact us at {{support_email}}.</p>
    <p>Best regards,<br>The {{app_name}} Team</p>
</body>
</html>
```

### Lesson Reminder Template

```html
<!DOCTYPE html>
<html>
<head>
    <title>Lesson Reminder</title>
</head>
<body>
    <h1>Lesson Reminder</h1>
    <p>Hi {{user_name}},</p>
    <p>This is a reminder that your lesson "{{lesson_title}}" with {{tutor_name}} is scheduled for:</p>
    <ul>
        <li><strong>Date:</strong> {{lesson_date}}</li>
        <li><strong>Time:</strong> {{lesson_time}}</li>
        <li><strong>Duration:</strong> {{lesson_duration}}</li>
    </ul>
    <p>
        <a href="{{lesson_url}}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Join Lesson
        </a>
    </p>
    <p>See you soon!</p>
</body>
</html>
```

## API Integration

The template management system uses RESTful APIs:

- `GET /api/admin/email/templates` - List templates
- `POST /api/admin/email/templates` - Create template
- `PUT /api/admin/email/templates/[id]` - Update template
- `DELETE /api/admin/email/templates/[id]` - Delete template
- `GET /api/admin/email/templates/[id]/preview` - Generate preview
- `GET /api/admin/email/templates/[id]/history` - View history

## Troubleshooting

### Common Issues

1. **Template Not Saving**
   - Check all required fields are filled
   - Verify placeholder syntax is correct
   - Ensure HTML is valid

2. **Preview Not Working**
   - Check for unresolved placeholders
   - Verify template exists and is accessible
   - Review browser console for errors

3. **Placeholders Not Resolving**
   - Ensure placeholder names match exactly
   - Check placeholder is defined in template
   - Verify sample data includes the placeholder

### Error Messages

- **"Unknown placeholder"**: Placeholder used but not defined
- **"Template not found"**: Invalid template ID
- **"Cannot delete only active template"**: Must activate another template first
- **"Unauthorized"**: Admin access required

## Support

For technical support or questions about email template management:

1. Check this documentation first
2. Review the template validation errors
3. Test with the preview functionality
4. Contact the development team with specific error messages

## Updates and Maintenance

- Templates are automatically versioned on changes
- System maintains complete audit trail
- Regular backups include template data
- Updates preserve existing template functionality