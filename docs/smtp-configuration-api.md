# SMTP Configuration Management API

This document describes the SMTP Configuration Management API endpoints that have been implemented as part of the Admin Email Management System.

## Overview

The SMTP Configuration API provides administrators with the ability to:
- Configure multiple SMTP providers (Gmail, SendGrid, AWS SES, Custom)
- Validate SMTP settings with provider-specific rules
- Test SMTP connections and email delivery
- Securely store encrypted credentials
- Manage active/inactive configurations

## Authentication

All endpoints require admin authentication. The API uses Supabase Row Level Security (RLS) policies to ensure only admin users can access these endpoints.

## Endpoints

### GET /api/admin/email/smtp-config

Retrieves all SMTP configurations (excluding encrypted passwords).

**Response:**
```json
{
  "configs": [
    {
      "id": "uuid",
      "provider": "gmail|sendgrid|aws-ses|custom",
      "host": "smtp.gmail.com",
      "port": 587,
      "username": "user@gmail.com",
      "encryption": "tls|ssl|none",
      "is_active": true,
      "last_tested": "2024-01-01T12:00:00Z",
      "test_status": "success|failed|pending",
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### POST /api/admin/email/smtp-config

Creates a new SMTP configuration.

**Request Body:**
```json
{
  "provider": "gmail",
  "host": "smtp.gmail.com",
  "port": 587,
  "username": "user@gmail.com",
  "password": "app-password",
  "encryption": "tls",
  "is_active": true
}
```

**Response (201):**
```json
{
  "config": {
    "id": "new-uuid",
    "provider": "gmail",
    "host": "smtp.gmail.com",
    "port": 587,
    "username": "user@gmail.com",
    "encryption": "tls",
    "is_active": true,
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  },
  "warnings": [
    "Gmail requires an App Password, not your regular password"
  ]
}
```

**Validation Errors (400):**
```json
{
  "error": "Invalid SMTP configuration",
  "details": [
    "Gmail host must be smtp.gmail.com",
    "Gmail port must be 587"
  ],
  "warnings": [
    "Gmail requires an App Password, not your regular password"
  ]
}
```

### PUT /api/admin/email/smtp-config/{id}

Updates an existing SMTP configuration.

**Request Body:**
```json
{
  "provider": "gmail",
  "host": "smtp.gmail.com",
  "port": 587,
  "username": "user@gmail.com",
  "password": "***HIDDEN***",  // Use this to keep existing password
  "encryption": "tls",
  "is_active": true
}
```

**Response (200):**
```json
{
  "config": {
    "id": "uuid",
    "provider": "gmail",
    "host": "smtp.gmail.com",
    "port": 587,
    "username": "user@gmail.com",
    "encryption": "tls",
    "is_active": true,
    "test_status": null,  // Reset when configuration changes
    "last_tested": null,
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

### DELETE /api/admin/email/smtp-config/{id}

Deletes an SMTP configuration. Cannot delete active configurations.

**Response (200):**
```json
{
  "message": "SMTP configuration deleted successfully"
}
```

**Error (400):**
```json
{
  "error": "Cannot delete active SMTP configuration. Please activate another configuration first."
}
```

### POST /api/admin/email/smtp-config/{id}/test

Tests an SMTP configuration.

**Connection Test Request:**
```json
{
  "testType": "connection"
}
```

**Email Test Request:**
```json
{
  "testType": "email",
  "testEmail": {
    "to": "test@example.com",
    "subject": "Test Email Subject",
    "html": "<p>HTML content</p>",
    "text": "Plain text content"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "SMTP connection successful (150ms)",
  "details": {
    "connectionTime": 100,
    "authenticationTime": 50
  },
  "testType": "connection"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Authentication failed. Please check your username and password.",
  "details": {
    "connectionTime": 200,
    "error": "Invalid login: 535-5.7.8 Username and Password not accepted",
    "errorCode": "535"
  },
  "testType": "connection"
}
```

## Provider-Specific Validation

### Gmail
- **Host:** Must be `smtp.gmail.com`
- **Port:** Must be `587`
- **Encryption:** Must be `tls`
- **Username:** Must be a valid Gmail address
- **Password:** Requires App Password (not regular password)

### SendGrid
- **Host:** Must be `smtp.sendgrid.net`
- **Port:** Must be `587`
- **Encryption:** Must be `tls`
- **Username:** Must be `apikey`
- **Password:** Should be SendGrid API key (starts with `SG.`)

### AWS SES
- **Host:** Must match pattern `email-smtp.[region].amazonaws.com`
- **Port:** Must be one of `25, 465, 587, 2465, 2587`
- **Encryption:** Must be `tls`
- **Username:** Must be 20-character SMTP access key ID
- **Password:** Must be SMTP secret access key

### Custom
- Basic validation only
- Warnings for common misconfigurations
- Port-specific encryption recommendations

## Security Features

### Password Encryption
- Passwords are encrypted using AES-256-CBC before storage
- Each password uses a unique initialization vector (IV)
- Encryption key is derived from environment variable `EMAIL_ENCRYPTION_KEY`

### Access Control
- Row Level Security (RLS) policies restrict access to admin users
- Admin status determined by user role or email whitelist
- Service role key used for server-side operations

### Audit Logging
- All test attempts logged to `email_logs` table
- Configuration changes tracked with timestamps
- Test results stored for troubleshooting

## Error Handling

### Common Error Codes
- **401:** Unauthorized (not admin user)
- **400:** Validation error or bad request
- **404:** Configuration not found
- **500:** Internal server error

### SMTP Test Error Messages
- **Authentication Failed:** Invalid credentials
- **Connection Refused:** Wrong host/port or firewall issues
- **Connection Timeout:** Network connectivity problems
- **Host Not Found:** Invalid SMTP server address
- **SSL/TLS Error:** Encryption configuration issues

## Environment Variables

Required environment variables:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email Encryption
EMAIL_ENCRYPTION_KEY=your-32-character-encryption-key
```

## Usage Examples

### Creating a Gmail Configuration
```javascript
const response = await fetch('/api/admin/email/smtp-config', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    username: 'your-email@gmail.com',
    password: 'your-app-password',
    encryption: 'tls',
    is_active: true
  })
});
```

### Testing a Configuration
```javascript
const response = await fetch(`/api/admin/email/smtp-config/${configId}/test`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    testType: 'email',
    testEmail: {
      to: 'test@example.com',
      subject: 'Test Email',
      text: 'This is a test email from the SMTP configuration.'
    }
  })
});
```

## Database Schema

The API uses the following database tables:
- `email_smtp_configs`: Stores SMTP configurations with encrypted passwords
- `email_logs`: Logs all email activity including tests
- `email_settings`: System-wide email configuration settings

See the database migration file for complete schema details.