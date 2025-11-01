# Quick Start: Admin Email Dashboard

## 🚀 Get Started in 3 Steps

### Step 1: Test the APIs
```bash
node scripts/test-admin-dashboard-apis.js
```

**Expected Output:**
```
=== TESTING ADMIN DASHBOARD APIs ===

Testing Dashboard Overview...
✅ Dashboard Overview - SUCCESS
   Total Emails: 0
   Active Configs: 1
   Active Templates: 3

Testing Email Templates...
✅ Email Templates - SUCCESS
   Templates Found: 3

Testing SMTP Configurations...
✅ SMTP Configurations - SUCCESS
   SMTP Configs: 1

Testing Email Logs...
✅ Email Logs - SUCCESS
   Email Logs: 0

Testing Email Analytics...
✅ Email Analytics - SUCCESS
   Delivery Rate: 100%

=== TEST COMPLETE ===
```

### Step 2: View the Dashboard
1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to:
   ```
   http://localhost:3000/admin-portal/email
   ```

3. You should see:
   - ✅ Real SMTP configuration (Resend)
   - ✅ 3 email templates
   - ✅ Email logs (empty until emails are sent)
   - ✅ Analytics dashboard

### Step 3: Generate Test Data
Send a password reset email to see the system in action:

1. Go to: http://localhost:3000/auth/forgot-password
2. Enter your email
3. Submit the form
4. Go back to admin dashboard
5. See the email log appear!

## 📊 Dashboard Sections

### 1. Overview
- Total emails sent
- Emails sent today
- Success rate
- Active configurations
- Active templates

### 2. Templates
- View all email templates
- Search by name or subject
- Filter by type (welcome, password_reset, etc.)
- Filter by status (active/inactive)
- Create new templates
- Edit existing templates

### 3. SMTP Configurations
- View all SMTP providers
- Current: Resend (Active)
- Add new providers
- Test connections
- Set priorities

### 4. Email Logs
- View all sent emails
- Filter by:
  - Status (delivered, failed, pending, bounced)
  - Type (welcome, password_reset, etc.)
  - Recipient email
  - Date range
- Export logs
- View details

### 5. Analytics
- Delivery rate over time
- Email type breakdown
- Daily statistics chart
- Time period filters:
  - Last 24 hours
  - Last 7 days
  - Last 30 days
  - Last 90 days

## 🔧 API Endpoints

### Dashboard Overview
```bash
GET /api/admin/email/dashboard
```

### Email Templates
```bash
# List templates
GET /api/admin/email/templates?search=password&type=password_reset&status=active&page=1&limit=10

# Create template
POST /api/admin/email/templates
{
  "name": "New Template",
  "type": "custom",
  "subject": "Subject",
  "html_content": "<html>...</html>",
  "is_active": true
}
```

### SMTP Configurations
```bash
# List configs
GET /api/admin/email/smtp-config?provider=resend&status=active&page=1&limit=10

# Create config
POST /api/admin/email/smtp-config
{
  "name": "SendGrid",
  "provider": "sendgrid",
  "host": "smtp.sendgrid.net",
  "port": 587,
  "username": "apikey",
  "password": "your-api-key",
  "from_email": "noreply@example.com",
  "from_name": "LinguaFlow",
  "encryption": "tls",
  "is_active": true
}
```

### Email Logs
```bash
GET /api/admin/email/logs?status=delivered&type=password_reset&recipient=user@example.com&dateFrom=2025-01-01&dateTo=2025-12-31&page=1&limit=20
```

### Analytics
```bash
GET /api/admin/email/analytics?period=7d&type=password_reset&provider=resend
```

## 🎯 Common Tasks

### View Recent Emails
1. Go to admin dashboard
2. Click "Email Logs" tab
3. See all recent emails
4. Filter by status or type

### Check Delivery Rate
1. Go to admin dashboard
2. Click "Analytics" tab
3. View delivery rate chart
4. Change time period if needed

### Add New Email Template
1. Go to admin dashboard
2. Click "Templates" tab
3. Click "Create Template"
4. Fill in details
5. Save

### Add New SMTP Provider
1. Go to admin dashboard
2. Click "SMTP Config" tab
3. Click "Add Provider"
4. Enter provider details
5. Test connection
6. Save

## 🐛 Troubleshooting

### No Data Showing
**Problem:** Dashboard shows empty data

**Solution:**
1. Check database connection
2. Verify environment variables:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-url
   SUPABASE_SERVICE_ROLE_KEY=your-key
   ```
3. Run test script to verify APIs work

### Templates Not Loading
**Problem:** Templates section is empty

**Solution:**
1. Check if templates exist in database:
   ```bash
   node scripts/check-existing-templates.js
   ```
2. If empty, run setup script:
   ```bash
   node scripts/setup-default-email-templates.js
   ```

### SMTP Config Not Showing
**Problem:** SMTP configuration is empty

**Solution:**
1. Check if config exists in database
2. If empty, run setup script:
   ```bash
   node scripts/setup-default-smtp-config.js
   ```

### API Errors
**Problem:** API returns 500 errors

**Solution:**
1. Check server logs
2. Verify database tables exist
3. Check environment variables
4. Restart dev server

## 📚 Additional Resources

- **Full Documentation:** `ADMIN-DASHBOARD-COMPLETE.md`
- **Migration Details:** `ADMIN-DASHBOARD-MIGRATION-SUMMARY.md`
- **Email System Guide:** `FINAL-EMAIL-SYSTEM-STATUS.md`

## ✅ Checklist

Before going to production:

- [ ] Test all API endpoints
- [ ] Verify dashboard loads correctly
- [ ] Send test emails
- [ ] Check logs appear
- [ ] Verify analytics work
- [ ] Test filters and pagination
- [ ] Set production environment variables
- [ ] Enable admin authentication
- [ ] Set up monitoring

## 🎉 You're Ready!

Your admin email dashboard is now fully functional with real database data. You can:

- ✅ Monitor all email activity
- ✅ Manage templates and providers
- ✅ View detailed analytics
- ✅ Track delivery rates
- ✅ Debug email issues

Happy emailing! 📧
