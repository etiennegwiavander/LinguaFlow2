# Admin Email System Setup Guide

## Current Status

✅ Password reset emails working with Resend
❌ Admin dashboard showing mock data
❌ Email templates not connected to actual sending

## Setup Steps

### Step 1: Apply Database Migration

You need to add missing columns to the database tables.

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy and paste this SQL:

```sql
-- Add missing columns to email_smtp_configs table
ALTER TABLE email_smtp_configs
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS from_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS from_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;

-- Update provider constraint to include 'resend'
ALTER TABLE email_smtp_configs
DROP CONSTRAINT IF EXISTS email_smtp_configs_provider_check;

ALTER TABLE email_smtp_configs
ADD CONSTRAINT email_smtp_configs_provider_check
CHECK (provider IN ('gmail', 'sendgrid', 'aws-ses', 'resend', 'custom'));

-- Add missing columns to email_templates table
ALTER TABLE email_templates
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_smtp_configs_from_email ON email_smtp_configs(from_email);
CREATE INDEX IF NOT EXISTS idx_email_smtp_configs_default ON email_smtp_configs(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_email_templates_default ON email_templates(is_default) WHERE is_default = true;
```

5. Click "Run"

**Option B: Via Supabase CLI**

```bash
supabase db push
```

### Step 2: Initialize Email System

After applying the migration, run:

```bash
node scripts/initialize-email-system.js
```

This will:

- Create Resend SMTP configuration
- Create email templates (password reset, welcome)
- Set them as active and default

### Step 3: Verify in Admin Dashboard

1. Go to http://localhost:3000/admin-portal/login
2. Login as admin
3. Go to Email Management
4. You should now see:
   - Real SMTP configurations (Resend)
   - Real email templates
   - Real email logs (once emails are sent)

### Step 4: Connect Password Reset to Templates

Update the password reset API to use templates from the database instead of hardcoded HTML.

The system is designed to:

1. Fetch active SMTP config from database
2. Fetch active template for the email type
3. Replace placeholders with actual data
4. Send via the configured provider

## What You'll Be Able to Do

Once setup is complete:

✅ **Manage SMTP Providers via UI**

- Add multiple email providers (Resend, SendGrid, AWS SES, etc.)
- Switch active provider with one click
- Test providers before activating

✅ **Manage Email Templates via UI**

- Edit templates with live preview
- Use placeholders like {{user_name}}, {{reset_url}}
- Version control with rollback capability

✅ **View Real Email Analytics**

- See all sent emails
- Track delivery status
- View error logs
- Export email logs

✅ **Automatic Failover**

- Configure backup providers
- System automatically switches if primary fails
- Priority-based provider selection

## Troubleshooting

### Migration Fails

- Make sure you're using the service role key
- Check that the tables exist (they should from previous migrations)
- Try running each ALTER TABLE statement separately

### Initialization Fails

- Check that RESEND_API_KEY is in .env.local
- Check that SUPABASE_SERVICE_ROLE_KEY is in .env.local
- Verify the migration was applied successfully

### Admin Dashboard Still Shows Mock Data

- Clear browser cache
- Check browser console for errors
- Verify data was inserted into database tables

## Next Steps After Setup

1. **Test the System**

   - Send a test email from admin panel
   - Request a password reset
   - Check that email uses the template from database

2. **Add More Providers** (Optional)

   - Add SendGrid as backup
   - Add AWS SES for production
   - Configure priority and failover

3. **Customize Templates**

   - Edit templates via admin UI
   - Add your branding
   - Test with different placeholders

4. **Monitor Email Delivery**
   - Check email logs regularly
   - Set up alerts for failures
   - Review analytics dashboard
