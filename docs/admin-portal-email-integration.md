# Admin Portal Email Management Integration

This document explains how to use the SMTP configuration management feature integrated into the LinguaFlow admin portal.

## Overview

The SMTP configuration management has been integrated into the existing admin portal at `http://localhost:3000/admin-portal`. The email management functionality is accessible through the Settings page under the "Email" tab.

## Accessing Email Management

### 1. Login to Admin Portal
1. Navigate to `http://localhost:3000/admin-portal/login`
2. Enter your admin credentials
3. You'll be redirected to the admin dashboard

### 2. Navigate to Email Settings
1. Click on "Settings" in the left sidebar
2. Select the "Email" tab
3. You'll see the SMTP Configuration Manager interface

## Features Available

### SMTP Configuration Management
- **Add New Configurations**: Support for Gmail, SendGrid, AWS SES, and Custom SMTP providers
- **Edit Existing Configurations**: Update settings while preserving passwords
- **Test Connections**: Verify SMTP settings work correctly
- **Delete Configurations**: Remove unused configurations (cannot delete active ones)
- **Provider-Specific Validation**: Automatic validation based on email provider

### Supported Email Providers

#### Gmail
- **Host**: `smtp.gmail.com`
- **Port**: `587`
- **Encryption**: `TLS`
- **Requirements**: App Password (not regular password)
- **Setup Guide**: Generate App Password in Google Account settings

#### SendGrid
- **Host**: `smtp.sendgrid.net`
- **Port**: `587`
- **Encryption**: `TLS`
- **Username**: `apikey`
- **Requirements**: SendGrid API key as password

#### AWS SES
- **Host**: `email-smtp.[region].amazonaws.com`
- **Ports**: `25, 465, 587, 2465, 2587`
- **Encryption**: `TLS`
- **Requirements**: SMTP credentials (not regular AWS keys)

#### Custom SMTP
- **Flexible Configuration**: Any SMTP provider
- **Validation**: Basic validation with helpful warnings
- **Port Recommendations**: Automatic suggestions based on common configurations

## User Interface Guide

### Configuration List
- **Active Badge**: Shows which configuration is currently active
- **Status Indicators**: 
  - 🟢 Working: Last test was successful
  - 🔴 Failed: Last test failed
  - ⚪ Not Tested: No tests performed yet
- **Actions**: Test, Edit, Delete buttons for each configuration

### Adding a Configuration
1. Click "Add Configuration" button
2. Select your email provider from the dropdown
3. Form fields auto-populate with provider defaults
4. Fill in your credentials:
   - **Host**: SMTP server address
   - **Port**: SMTP port number
   - **Username**: Your email or API username
   - **Password**: Your password or API key
   - **Encryption**: TLS/SSL/None
5. Toggle "Set as active" to make this the default configuration
6. Click "Create" to save

### Testing Configurations
1. Click the "Test" button next to any configuration
2. The system will attempt to connect and authenticate
3. Results are displayed as toast notifications
4. Test status is updated and saved

### Editing Configurations
1. Click the "Edit" button (pencil icon)
2. Modify any settings as needed
3. Password field shows "***HIDDEN***" - leave unchanged to keep current password
4. Click "Update" to save changes

### Security Features
- **Password Encryption**: All passwords are encrypted before storage
- **Admin-Only Access**: Only admin users can access email settings
- **Audit Logging**: All configuration changes and tests are logged
- **Active Configuration Protection**: Cannot delete the active configuration

## API Integration

The admin portal uses the following API endpoints:

- `GET /api/admin/email/smtp-config` - List configurations
- `POST /api/admin/email/smtp-config` - Create configuration
- `PUT /api/admin/email/smtp-config/{id}` - Update configuration
- `DELETE /api/admin/email/smtp-config/{id}` - Delete configuration
- `POST /api/admin/email/smtp-config/{id}/test` - Test configuration

## Troubleshooting

### Common Issues

#### Authentication Errors
- **Gmail**: Ensure you're using an App Password, not your regular password
- **SendGrid**: Username must be "apikey", password must be your API key
- **AWS SES**: Use SMTP credentials, not regular AWS access keys

#### Connection Errors
- **Firewall**: Ensure SMTP ports are not blocked
- **Host**: Verify the SMTP server address is correct
- **Port**: Check if the port is correct for your provider

#### SSL/TLS Errors
- **Port 465**: Usually requires SSL encryption
- **Port 587**: Usually requires TLS encryption
- **Custom Providers**: Check with your provider for correct encryption settings

### Error Messages
The system provides detailed error messages for common issues:
- Invalid credentials
- Connection timeouts
- Host not found
- SSL/TLS configuration errors

## Database Schema

The email management system uses these database tables:
- `email_smtp_configs`: Stores SMTP configurations with encrypted passwords
- `email_logs`: Logs all email activity including tests
- `email_settings`: System-wide email configuration settings

## Environment Variables

Ensure these environment variables are set:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email Encryption
EMAIL_ENCRYPTION_KEY=your-32-character-encryption-key
```

## Next Steps

After setting up SMTP configurations, you can:
1. Configure email templates (Task 4-5 in the implementation plan)
2. Set up email testing interface (Task 6-7)
3. Monitor email analytics (Task 8-9)
4. Integrate with existing application features (Task 12)

## Support

For issues or questions:
1. Check the browser console for detailed error messages
2. Review the API documentation in `docs/smtp-configuration-api.md`
3. Test configurations using the built-in test functionality
4. Check system logs for detailed error information