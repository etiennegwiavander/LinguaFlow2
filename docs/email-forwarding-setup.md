# Email Forwarding Setup Complete

## Overview
All inbound emails to LinguaFlow are now automatically forwarded to `linguaflowservices@gmail.com` with clear visual indicators showing which address received the email.

## How It Works

### Email Flow
```
User sends email
    ↓
support@linguaflow.online OR feedback@linguaflow.online
    ↓
Resend receives email
    ↓
Webhook processes email
    ↓
1. Stores in database (support_tickets or feedback table)
2. Forwards notification to linguaflowservices@gmail.com
```

## Email Notifications

### Support Emails
**Received at:** `support@linguaflow.online`

**Forwarded to:** `linguaflowservices@gmail.com`

**Subject format:** `[SUPPORT TICKET] Original Subject`

**Visual indicator:**
- 🎫 Red header with "New Support Ticket"
- Clear label: "Received at: support@linguaflow.online"
- Link to admin portal: https://linguaflow.online/admin-portal/support-tickets

### Feedback Emails
**Received at:** `feedback@linguaflow.online`

**Forwarded to:** `linguaflowservices@gmail.com`

**Subject format:** `[FEEDBACK] Original Subject`

**Visual indicator:**
- 💬 Green header with "New Feedback"
- Clear label: "Received at: feedback@linguaflow.online"
- Link to admin portal: https://linguaflow.online/admin-portal/feedback-messages

## Email Format

Each forwarded email includes:

1. **Header Section** (Color-coded)
   - Support: Red (#dc2626)
   - Feedback: Green (#059669)

2. **Metadata Section**
   - From: Sender's email address
   - Subject: Original subject line
   - Received at: Which LinguaFlow address received it
   - Time: When the email was received

3. **Message Content**
   - Full email body (text or HTML)
   - Formatted for easy reading

4. **Footer Section**
   - Confirmation of which address received the email
   - Direct link to admin portal dashboard

## Testing

To test the email forwarding:

1. **Send a test support email:**
   ```
   To: support@linguaflow.online
   Subject: Test Support Ticket
   Body: This is a test message
   ```

2. **Send a test feedback email:**
   ```
   To: feedback@linguaflow.online
   Subject: Test Feedback
   Body: This is a test feedback message
   ```

3. **Check linguaflowservices@gmail.com:**
   - You should receive two emails
   - Support email will have red header with [SUPPORT TICKET] prefix
   - Feedback email will have green header with [FEEDBACK] prefix

## Error Handling

- If email forwarding fails, the original email is still stored in the database
- Forwarding errors are logged but don't affect the main webhook processing
- You can always view emails in the admin portal even if forwarding fails

## Admin Portal Access

View all emails in the admin portal:
- Support tickets: https://linguaflow.online/admin-portal/support-tickets
- Feedback: https://linguaflow.online/admin-portal/feedback-messages

Note: These are admin-only pages. Regular users can submit tickets/feedback at:
- Submit support ticket: https://linguaflow.online/support
- Submit feedback: https://linguaflow.online/feedback

## Database Storage

Emails are stored separately:
- **Support emails:** `support_tickets` table
- **Feedback emails:** `feedback` table

Both tables include:
- `email` - Sender's email address
- `subject` - Email subject
- `message` - Email content
- `status` - Current status (open/new)
- `source` - How it was received (email_reply/email)
- `created_at` - Timestamp

## Next Steps (Optional Enhancements)

1. **Auto-reply emails** - Send confirmation to users when their email is received
2. **Email threading** - Track conversation threads for support tickets
3. **Priority flagging** - Automatically flag urgent emails
4. **Spam filtering** - Add spam detection before storing
5. **Attachment handling** - Process and store email attachments

## Troubleshooting

**Not receiving forwarded emails?**
1. Check spam folder in linguaflowservices@gmail.com
2. Verify RESEND_API_KEY is set in environment variables
3. Check webhook logs in Resend dashboard
4. Verify emails are being stored in database (they should be even if forwarding fails)

**Emails look wrong?**
- The HTML formatting should work in all major email clients
- If styling is broken, the content is still readable

**Need to change forwarding address?**
- Update the `to:` field in both `handleSupportEmail` and `handleFeedbackEmail` functions
- Redeploy the application
