# Email Analytics and Monitoring API Implementation

## Overview

This document describes the implementation of the email analytics and monitoring API system for the admin email management system. The implementation provides comprehensive monitoring, reporting, and alerting capabilities for email delivery performance.

## Implemented Features

### 1. Email Analytics Endpoint (`GET /api/admin/email/analytics`)

**Purpose**: Provides comprehensive delivery statistics and performance metrics.

**Features**:
- Total sent, delivered, failed, and bounced email counts
- Bounce rate and delivery rate calculations
- Email type breakdown statistics
- Daily statistics for trend analysis
- Real-time alert generation
- Configurable date range filtering
- Email type and status filtering

**Query Parameters**:
- `start_date`: Filter emails from this date (ISO string)
- `end_date`: Filter emails until this date (ISO string)
- `email_type`: Filter by template type (welcome, lesson_reminder, etc.)
- `status`: Filter by delivery status (sent, delivered, failed, bounced)

**Response Structure**:
```json
{
  "totalSent": 1250,
  "totalDelivered": 1180,
  "totalFailed": 45,
  "totalBounced": 25,
  "bounceRate": 0.02,
  "deliveryRate": 0.944,
  "timeRange": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  },
  "emailTypeBreakdown": {
    "welcome": { "sent": 500, "delivered": 485, "failed": 10, "bounced": 5 },
    "lesson_reminder": { "sent": 750, "delivered": 695, "failed": 35, "bounced": 20 }
  },
  "dailyStats": [
    {
      "date": "2024-01-01",
      "sent": 45,
      "delivered": 42,
      "failed": 2,
      "bounced": 1
    }
  ],
  "alerts": [
    {
      "type": "bounce_rate",
      "message": "Bounce rate (3.2%) exceeds threshold (2.5%)",
      "severity": "medium",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 2. Email Logs Endpoint (`GET /api/admin/email/logs`)

**Purpose**: Provides paginated access to detailed email activity logs with comprehensive filtering.

**Features**:
- Paginated email log retrieval
- Advanced filtering capabilities
- Sorting by multiple fields
- Summary statistics for filtered results
- Search by recipient email
- Test email filtering

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)
- `start_date`: Filter from date
- `end_date`: Filter until date
- `email_type`: Filter by template type
- `status`: Filter by delivery status
- `recipient_email`: Search by recipient email (partial match)
- `is_test`: Filter test emails (true/false)
- `sort_by`: Sort field (sent_at, delivered_at, status, template_type)
- `sort_order`: Sort direction (asc/desc)

**Response Structure**:
```json
{
  "logs": [
    {
      "id": "uuid",
      "templateId": "template-uuid",
      "templateType": "welcome",
      "recipientEmail": "user@example.com",
      "subject": "Welcome to our platform!",
      "status": "delivered",
      "sentAt": "2024-01-15T10:00:00Z",
      "deliveredAt": "2024-01-15T10:01:30Z",
      "errorCode": null,
      "errorMessage": null,
      "isTest": false,
      "metadata": {}
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250,
    "totalPages": 25
  },
  "summary": {
    "totalSent": 1250,
    "totalDelivered": 1180,
    "totalFailed": 45,
    "totalBounced": 25,
    "totalPending": 0
  }
}
```

### 3. Email Export Endpoint (`POST /api/admin/email/logs/export`)

**Purpose**: Exports email logs in CSV or JSON format for reporting and analysis.

**Features**:
- CSV and JSON export formats
- Same filtering capabilities as logs endpoint
- Optional metadata inclusion
- Automatic filename generation with timestamps
- Proper content-type headers for downloads
- Export limit of 10,000 records for performance

**Request Body**:
```json
{
  "format": "csv",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "emailType": "welcome",
  "status": "delivered",
  "recipientEmail": "user@example.com",
  "isTest": false,
  "includeMetadata": true
}
```

**CSV Export Features**:
- Proper CSV formatting with quoted fields
- Escaped quotes in content
- Template name inclusion from joined data
- Headers for easy spreadsheet import

**JSON Export Features**:
- Structured export with metadata
- Export information (timestamp, filters, user)
- Nested object structure for easy parsing

### 4. Email Alerts Endpoint (`GET /api/admin/email/alerts`)

**Purpose**: Provides real-time alerts for email system issues and performance problems.

**Features**:
- Bounce rate monitoring with configurable thresholds
- Delivery failure rate alerts
- High volume warnings
- SMTP configuration failure alerts
- Severity-based alert prioritization
- Alert metadata for troubleshooting

**Response Structure**:
```json
{
  "alerts": [
    {
      "id": "bounce-rate-1642248600",
      "type": "bounce_rate",
      "message": "Bounce rate (3.2%) exceeds threshold (2.5%) - 32/1000 emails bounced",
      "severity": "medium",
      "timestamp": "2024-01-15T10:30:00Z",
      "metadata": {
        "bounceRate": 0.032,
        "threshold": 0.025,
        "totalSent": 1000,
        "totalBounced": 32,
        "windowHours": 24
      }
    }
  ],
  "generatedAt": "2024-01-15T10:30:00Z",
  "totalAlerts": 3,
  "alertsBySeverity": {
    "high": 1,
    "medium": 2,
    "low": 0
  }
}
```

## EmailAnalyticsService Class

### Core Functionality

The `EmailAnalyticsService` class provides the business logic for email analytics and monitoring:

#### Configuration Management
- `getMonitoringConfig()`: Retrieves monitoring thresholds from database settings
- Configurable bounce rate, failure rate, and volume thresholds
- Default values with database override capability

#### Statistical Calculations
- `calculateBounceRate()`: Calculates bounce rate for time periods
- `calculateFailureRate()`: Calculates delivery failure rate
- `getEmailStatistics()`: Comprehensive statistics calculation
- Support for email type filtering

#### Alert Generation
- `checkVolumeAlerts()`: Monitors email volume against daily limits
- `checkBounceRateAlerts()`: Monitors bounce rates with thresholds
- `checkDeliveryFailureAlerts()`: Monitors delivery failure rates
- `checkSMTPAlerts()`: Monitors SMTP configuration health
- `generateAlerts()`: Comprehensive alert generation

### Alert Types and Thresholds

#### Bounce Rate Alerts
- **Threshold**: Configurable (default 5%)
- **Severity**: Medium if > threshold, High if > 2x threshold
- **Minimum Volume**: 10 emails (prevents false alerts on low volume)

#### Delivery Failure Alerts
- **Threshold**: Configurable (default 10%)
- **Severity**: Medium if > threshold, High if > 2x threshold
- **Minimum Volume**: 10 emails

#### Volume Alerts
- **80% Threshold**: Medium severity warning
- **90% Threshold**: High severity critical alert
- **Monitoring Window**: Configurable (default 24 hours)

#### SMTP Alerts
- **Trigger**: Failed SMTP connection tests in last hour
- **Severity**: High (critical system issue)
- **Provider-Specific**: Identifies which SMTP provider is failing

## Database Integration

### Tables Used
- `email_logs`: Primary source for all analytics data
- `email_settings`: Configuration and threshold storage
- `email_smtp_configs`: SMTP health monitoring
- `email_templates`: Template information for exports

### Performance Optimizations
- Indexed queries on common filter fields
- Pagination to prevent large data transfers
- Query optimization for date range filtering
- Efficient aggregation queries for statistics

### Security Features
- Admin-only access control via RLS policies
- Authentication verification on all endpoints
- Input validation and sanitization
- SQL injection prevention through parameterized queries

## Error Handling

### Graceful Degradation
- Database connection failures handled gracefully
- Partial data scenarios supported
- Fallback to default configurations when settings unavailable

### User-Friendly Error Messages
- Clear error messages for troubleshooting
- Specific guidance for common issues
- Proper HTTP status codes

### Logging and Monitoring
- Comprehensive error logging
- Performance monitoring capabilities
- Alert generation for system issues

## Testing and Validation

### Test Coverage
- Unit tests for analytics calculations
- Integration tests for API endpoints
- Error scenario testing
- Performance testing for large datasets

### Validation Scripts
- API endpoint validation
- Data format verification
- Export functionality testing
- Alert generation testing

## Configuration Settings

### Database Settings Table
The system uses the `email_settings` table for configuration:

```sql
-- Bounce rate threshold (5% default)
INSERT INTO email_settings (setting_key, setting_value, description) 
VALUES ('bounce_rate_threshold', '0.05', 'Bounce rate threshold for alerts');

-- Failure rate threshold (10% default)
INSERT INTO email_settings (setting_key, setting_value, description) 
VALUES ('failure_rate_threshold', '0.10', 'Failure rate threshold for alerts');

-- Daily email limit (1000 default)
INSERT INTO email_settings (setting_key, setting_value, description) 
VALUES ('daily_email_limit', '1000', 'Maximum emails per day');

-- Monitoring window (24 hours default)
INSERT INTO email_settings (setting_key, setting_value, description) 
VALUES ('monitoring_window_hours', '24', 'Alert monitoring window in hours');
```

## Usage Examples

### Getting Analytics Data
```javascript
// Get last 30 days analytics
const response = await fetch('/api/admin/email/analytics?start_date=2024-01-01&end_date=2024-01-31');
const analytics = await response.json();

// Get welcome email analytics only
const welcomeAnalytics = await fetch('/api/admin/email/analytics?email_type=welcome');
```

### Exporting Email Logs
```javascript
// Export as CSV
const exportResponse = await fetch('/api/admin/email/logs/export', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    format: 'csv',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    includeMetadata: true
  })
});

// Download the file
const blob = await exportResponse.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'email-logs.csv';
a.click();
```

### Monitoring Alerts
```javascript
// Get current alerts
const alertsResponse = await fetch('/api/admin/email/alerts');
const { alerts, alertsBySeverity } = await alertsResponse.json();

// Check for high severity alerts
const criticalAlerts = alerts.filter(alert => alert.severity === 'high');
if (criticalAlerts.length > 0) {
  // Handle critical alerts
  console.log('Critical email system issues detected:', criticalAlerts);
}
```

## Implementation Status

✅ **Completed Features**:
- Email analytics API endpoint with comprehensive statistics
- Email logs API with pagination and filtering
- Email export functionality (CSV/JSON)
- Real-time alerts API
- EmailAnalyticsService with bounce rate monitoring
- Alert system for delivery failures and high bounce rates
- Filtering by date range, email type, and status
- Admin authentication and access control
- Comprehensive error handling
- Performance optimizations
- Test coverage and validation

This implementation fully satisfies the requirements specified in task 8 of the admin email management system, providing administrators with powerful tools to monitor email delivery performance, identify issues, and export data for analysis.