# Support Email Notification Setup

## Overview
This guide explains how to set up email notifications for support tickets so that when users submit tickets, an email is automatically sent to `linguaflowservices@gmail.com`.

## What Was Implemented

### 1. Email Notification System
- **API Route**: `app/api/support/send-email/route.ts`
- **Edge Function**: `supabase/functions/send-support-ticket-email/index.ts`
- **Updated Support Page**: `app/support/page.tsx` now sends email after ticket creation

### 2. Email Content
The email includes:
- Ticket ID
- User name and email (with reply-to functionality)
- Subject
- Impact level (color-coded: Low, Medium, High, Critical)
- Full message
- Attachment count (if any)
- Direct reply capability

## Setup Options

### Option 1: Use Existing Email Integration (Recommended)

If you already have the `send-integrated-email` Edge Function configured:

1. **Verify the function exists**:
   ```bash
   supabase functions list
   ```

2. **Test it works**:
   ```bash
   node scripts/test-support-email.js
   ```

3. **Done!** The system will automatically use your existing email configuration.

### Option 2: Configure SMTP in Supabase

If you don't have email configured yet:

1. **Go to Supabase Dashboard** → Project Settings → Auth → Email Templates

2. **Configure SMTP Settings**:
   - SMTP Host: `smtp.gmail.com`
   - SMTP Port: `587`
   - SMTP User: `linguaflowservices@gmail.com`
   - SMTP Password: [Your Gmail App Password]
   - Sender Email: `linguaflowservices@gmail.com`
   - Sender Name: `LinguaFlow Support`

3. **Create Gmail App Password**:
   - Go to Google Account → Security
   - Enable 2-Step Verification
   - Go to App Passwords
   - Generate password for "Mail"
   - Use this password in SMTP settings

### Option 3: Use Resend (Alternative)

1. **Sign up for Resend**: https://resend.com (Free tier: 100 emails/day)

2. **Get API Key** from Resend Dashboard

3. **Add to environment variables**:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

4. **Update the API route** (`app/api/support/send-email/route.ts`):
   ```typescript
   import { Resend } from 'resend';
   
   const resend = new Resend(process.env.RESEND_API_KEY);
   
   await resend.emails.send({
     from: 'LinguaFlow Support <support@yourdomain.com>',
     to: SUPPORT_EMAIL,
     subject: `[LinguaFlow Support] ${ticketData.subject}`,
     html: emailHtml,
     replyTo: ticketData.userEmail,
   });
   ```

## Testing

### Test Email Functionality:
```bash
node scripts/test-support-email.js
```

### Test Full Flow:
1. Go to `/support` in your app
2. Fill out the support form
3. Submit the ticket
4. Check `linguaflowservices@gmail.com` inbox
5. Verify email was received with correct information

## Email Template Preview

The email will look like this:

```
┌─────────────────────────────────────┐
│ 🎫 New Support Ticket               │
│ LinguaFlow Support System           │
├─────────────────────────────────────┤
│ Ticket ID: abc-123-def              │
│                                     │
│ From: John Doe                      │
│       john@example.com              │
│                                     │
│ Subject: Need help with lessons     │
│                                     │
│ Impact Level: [HIGH]                │
│                                     │
│ Message:                            │
│ I'm having trouble generating...    │
│                                     │
│ Attachments: 📎 2 file(s) attached  │
├─────────────────────────────────────┤
│ Reply to this email to respond      │
│ Ticket submitted: Jan 18, 2026      │
└─────────────────────────────────────┘
```

## Troubleshooting

### Email Not Received?

1. **Check Spam Folder**: Gmail might filter automated emails

2. **Verify SMTP Configuration**:
   ```bash
   # Check if send-integrated-email function exists
   supabase functions list
   ```

3. **Check Function Logs**:
   ```bash
   supabase functions logs send-integrated-email
   ```

4. **Test API Route Directly**:
   ```bash
   curl -X POST http://localhost:3000/api/support/send-email \
     -H "Content-Type: application/json" \
     -d '{"ticketData":{"ticketId":"test","userName":"Test","userEmail":"test@test.com","subject":"Test","message":"Test","impact":"low","attachmentCount":0}}'
   ```

### Common Issues:

**Issue**: "send-integrated-email function not found"
- **Solution**: Deploy the email function or use Option 2/3 above

**Issue**: "SMTP authentication failed"
- **Solution**: Use Gmail App Password, not regular password

**Issue**: "Email sent but not received"
- **Solution**: Check spam folder, verify email address is correct

## Fallback Behavior

If email sending fails:
- ✅ Ticket is still saved in database
- ✅ User sees success message
- ⚠️ Console warning logged
- 📧 Admin can check tickets in Supabase Dashboard

## Viewing Tickets Without Email

You can always view support tickets directly in Supabase:

1. Go to Supabase Dashboard
2. Click "Table Editor"
3. Select "support_tickets" table
4. View all submitted tickets with attachments

## Future Enhancements

- [ ] Email confirmation to user when ticket is submitted
- [ ] Email notification when ticket status changes
- [ ] Email threading for ticket conversations
- [ ] Attachment preview in emails
- [ ] Auto-reply with ticket number

## Support

If you need help setting this up, contact the development team or check:
- Supabase Email Documentation: https://supabase.com/docs/guides/auth/auth-smtp
- Resend Documentation: https://resend.com/docs
