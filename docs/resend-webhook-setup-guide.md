# Resend Webhook Setup Guide

## Problem
Emails are being received in Resend's "Receive" page, but they're not being forwarded to linguaflowservices@gmail.com because the webhook isn't configured.

## Solution: Configure Resend Webhook

### Step 1: Get Your Webhook URL

Your webhook URL is:
```
https://linguaflow.online/api/webhooks/resend-inbound
```

### Step 2: Configure Webhook in Resend Dashboard

1. **Go to Resend Webhooks Page:**
   - Visit: https://resend.com/webhooks
   - Or from Resend dashboard: Click "Webhooks" in the left sidebar

2. **Create New Webhook:**
   - Click "Add Webhook" or "Create Webhook" button
   
3. **Configure Webhook Settings:**
   ```
   Name: LinguaFlow Inbound Email Handler
   Endpoint URL: https://linguaflow.online/api/webhooks/resend-inbound
   Events: ✅ email.received (check this box)
   Status: Enabled
   ```

4. **Save the Webhook**
   - Click "Create" or "Save"
   - Resend will test the endpoint

### Step 3: Verify Webhook is Working

After creating the webhook:

1. **Send a Test Email:**
   ```
   To: feedback@linguaflow.online
   Subject: Test Email Forwarding
   Body: This is a test to verify email forwarding works
   ```

2. **Check Multiple Places:**
   - ✅ Resend "Receive" page - Should show the email
   - ✅ Resend "Webhooks" page - Should show webhook was triggered
   - ✅ linguaflowservices@gmail.com - Should receive forwarded email
   - ✅ Database - Run diagnostic script to verify

3. **Run Diagnostic Script:**
   ```powershell
   node scripts/diagnose-email-forwarding.js
   ```

## Troubleshooting

### Webhook Shows "Failed" Status

**Check 1: Is the code deployed?**
```powershell
# Make sure latest code is deployed
git status
git add .
git commit -m "Add email forwarding webhook"
git push
```

**Check 2: Check Netlify deployment**
- Go to: https://app.netlify.com
- Check if latest deployment succeeded
- Look for any build errors

**Check 3: Test webhook endpoint manually**
```powershell
# Test if endpoint is accessible
curl https://linguaflow.online/api/webhooks/resend-inbound
```

### Emails Not Appearing in Database

**Check webhook logs in Resend:**
1. Go to: https://resend.com/webhooks
2. Click on your webhook
3. View "Recent Deliveries" or "Logs"
4. Look for error messages

**Common errors:**
- `404 Not Found` - Code not deployed or wrong URL
- `500 Internal Server Error` - Check Netlify function logs
- `Timeout` - Function taking too long

### Emails Not Being Forwarded

If emails appear in database but not in Gmail:

**Check 1: RESEND_API_KEY in production**
```
Go to Netlify dashboard
→ Site settings
→ Environment variables
→ Verify RESEND_API_KEY is set
```

**Check 2: Check Netlify function logs**
```
Go to Netlify dashboard
→ Functions
→ Click on the webhook function
→ View logs for errors
```

**Check 3: Check spam folder**
- Check spam/junk folder in linguaflowservices@gmail.com
- If found there, mark as "Not Spam"

## Alternative: Manual Webhook Testing

If you want to test the webhook manually:

1. **Get a sample email payload from Resend docs:**
   https://resend.com/docs/webhooks/event-types

2. **Test locally:**
   ```powershell
   # Start local dev server
   npm run dev
   
   # In another terminal, send test payload
   curl -X POST http://localhost:3000/api/webhooks/resend-inbound `
     -H "Content-Type: application/json" `
     -d '{
       "from": "test@example.com",
       "to": "feedback@linguaflow.online",
       "subject": "Test",
       "text": "Test message"
     }'
   ```

## Expected Flow After Setup

```
User sends email to feedback@linguaflow.online
    ↓
Resend receives email (visible in Resend "Receive" page)
    ↓
Resend triggers webhook → https://linguaflow.online/api/webhooks/resend-inbound
    ↓
Webhook processes email:
  1. Stores in database (feedback table)
  2. Forwards to linguaflowservices@gmail.com
    ↓
You receive notification in Gmail with:
  - [FEEDBACK] prefix in subject
  - Green header
  - Full message content
  - Link to admin portal
```

## Quick Checklist

Before testing:
- [ ] Code is deployed to production (git push)
- [ ] Netlify deployment succeeded
- [ ] RESEND_API_KEY is set in Netlify environment variables
- [ ] Webhook is created in Resend dashboard
- [ ] Webhook URL is correct: https://linguaflow.online/api/webhooks/resend-inbound
- [ ] Webhook event "email.received" is selected
- [ ] Webhook status is "Enabled"

After testing:
- [ ] Email appears in Resend "Receive" page
- [ ] Webhook shows "Success" in Resend dashboard
- [ ] Email appears in database (run diagnostic script)
- [ ] Email forwarded to linguaflowservices@gmail.com
- [ ] Can view email in admin portal

## Need Help?

If webhook still not working:
1. Check Resend webhook logs: https://resend.com/webhooks
2. Check Netlify function logs: https://app.netlify.com
3. Run diagnostic: `node scripts/diagnose-email-forwarding.js`
4. Check that emails appear in Resend "Receive" page
