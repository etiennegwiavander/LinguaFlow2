# Resend Inbound Email Setup Guide

## Overview

This guide explains how to set up inbound email receiving with Resend for LinguaFlow's support and feedback system.

## Current Setup Status

✅ **Completed:**
1. Domain verified: `linguaflow.online`
2. Inbound DNS records added
3. Inbound feature enabled in Resend dashboard
4. Webhook endpoint created: `/api/webhooks/resend-inbound`

⏳ **Remaining:**
1. Configure webhook URL in Resend dashboard
2. Test inbound email flow

## How It Works

```
User sends email to support@linguaflow.online
         ↓
Resend receives the email (catch-all for linguaflow.online)
         ↓
Resend forwards email data to your webhook
         ↓
Your webhook processes the email
         ↓
Email stored in database (support_tickets or feedback table)
         ↓
Admin notified (optional)
```

## Step-by-Step Configuration

### Step 1: Get Your Webhook URL

Your webhook endpoint is:
```
https://linguaflow.online/api/webhooks/resend-inbound
```

**For local testing:**
```
Use ngrok or similar tool to expose localhost
ngrok http 3000
Then use: https://your-ngrok-url.ngrok.io/api/webhooks/resend-inbound
```

### Step 2: Configure Webhook in Resend Dashboard

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click on your domain: `linguaflow.online`
3. Go to the **Inbound** tab
4. Click **Add Webhook** or **Configure Webhook**
5. Enter your webhook URL:
   ```
   https://linguaflow.online/api/webhooks/resend-inbound
   ```
6. Save the configuration

### Step 3: Test the Integration

#### Test 1: Send Email to Support
```
To: support@linguaflow.online
Subject: Test Support Ticket
Body: This is a test support ticket from email.
```

Expected result:
- Email received by Resend
- Webhook called with email data
- New record created in `support_tickets` table
- Status: "open"
- Source: "email_reply"

#### Test 2: Send Email to Feedback
```
To: feedback@linguaflow.online
Subject: Test Feedback
Body: This is test feedback from email.
```

Expected result:
- Email received by Resend
- Webhook called with email data
- New record created in `feedback` table
- Status: "new"
- Source: "email"

### Step 4: Verify in Database

Check Supabase database:

```sql
-- Check support tickets
SELECT * FROM support_tickets 
WHERE source = 'email_reply' 
ORDER BY created_at DESC 
LIMIT 5;

-- Check feedback
SELECT * FROM feedback 
WHERE source = 'email' 
ORDER BY created_at DESC 
LIMIT 5;
```

## Email Addresses Available

Once configured, these addresses will automatically work:

- ✅ `support@linguaflow.online` - Support tickets
- ✅ `feedback@linguaflow.online` - User feedback
- ✅ `noreply@linguaflow.online` - Already used for sending
- ✅ Any other address `@linguaflow.online` - Will be received (add handling in webhook)

## Webhook Payload Structure

Resend sends this data to your webhook:

```json
{
  "from": "user@example.com",
  "to": "support@linguaflow.online",
  "subject": "Need help with my account",
  "html": "<p>Email body in HTML</p>",
  "text": "Email body in plain text",
  "reply_to": "user@example.com",
  "headers": {
    "message-id": "<unique-id@resend.com>",
    "date": "Mon, 31 Jan 2026 10:00:00 +0000"
  },
  "attachments": []
}
```

## Security Considerations

### 1. Webhook Verification (Recommended)
Add webhook signature verification to ensure requests are from Resend:

```typescript
// Add to webhook route
const signature = req.headers.get('resend-signature');
// Verify signature matches expected value
```

### 2. Rate Limiting
Consider adding rate limiting to prevent abuse:

```typescript
// Limit to 100 emails per hour per sender
```

### 3. Spam Filtering
Add basic spam detection:

```typescript
// Check for spam indicators
// Block known spam domains
// Validate email format
```

## Troubleshooting

### Webhook Not Being Called

1. **Check webhook URL is correct**
   - Must be publicly accessible
   - Must use HTTPS (not HTTP)
   - Must return 200 status code

2. **Check Resend logs**
   - Go to Resend Dashboard → Logs
   - Look for webhook delivery attempts
   - Check for errors

3. **Check your server logs**
   ```bash
   # Check if webhook is receiving requests
   tail -f /var/log/nginx/access.log
   ```

### Emails Not Being Stored

1. **Check database permissions**
   - Ensure service role key has insert permissions
   - Check RLS policies on tables

2. **Check webhook logs**
   ```typescript
   console.log('Email data:', emailData);
   ```

3. **Verify table structure**
   ```sql
   -- Check support_tickets table exists
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'support_tickets';
   ```

## Next Steps

### 1. Add Email Notifications
When support ticket is created via email, notify admin:

```typescript
// In handleSupportEmail function
await sendAdminNotification({
  type: 'new_support_ticket',
  from: data.from,
  subject: data.subject,
});
```

### 2. Add Auto-Reply
Send confirmation email to user:

```typescript
// Send confirmation
await resend.emails.send({
  from: 'support@linguaflow.online',
  to: data.from,
  subject: `Re: ${data.subject}`,
  html: 'Thank you for contacting support...',
});
```

### 3. Add Thread Tracking
Track email conversations:

```typescript
// Extract thread ID from subject or headers
const threadId = extractThreadId(data.subject);
// Link replies to original ticket
```

### 4. Add Attachment Handling
Process email attachments:

```typescript
if (emailData.attachments && emailData.attachments.length > 0) {
  // Store attachments in Supabase Storage
  // Link to support ticket
}
```

## Testing Checklist

- [ ] Webhook URL configured in Resend
- [ ] Send test email to support@linguaflow.online
- [ ] Verify webhook receives email data
- [ ] Verify support ticket created in database
- [ ] Send test email to feedback@linguaflow.online
- [ ] Verify feedback created in database
- [ ] Check webhook logs for errors
- [ ] Test with different email clients (Gmail, Outlook, etc.)
- [ ] Test with attachments
- [ ] Test with HTML and plain text emails

## Resources

- [Resend Inbound Email Docs](https://resend.com/docs/dashboard/receiving/introduction)
- [Resend Webhook Docs](https://resend.com/docs/dashboard/webhooks/introduction)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**Status**: ⏳ Webhook endpoint created, awaiting Resend configuration
**Last Updated**: January 31, 2026
