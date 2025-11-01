# Password Reset Email Troubleshooting

## The Issue

Password reset emails are sent by **Supabase Auth**, not your custom email system.

## How It Works

```
User clicks "Forgot Password"
    ↓
Supabase Auth triggers password reset
    ↓
Supabase sends email via configured SMTP (Resend)
    ↓
User receives email with reset link
```

## Troubleshooting Steps

### 1. Check Resend Dashboard

Go to: https://resend.com/emails

Look for emails sent to the user's email address. Check:
- Was the email sent?
- What's the delivery status?
- Any errors?

### 2. Check Supabase Auth Configuration

Go to: https://supabase.com/dashboard/project/urmuwjcjcyohsrkgyapl/auth/templates

Verify:
- ✅ Email templates are configured
- ✅ SMTP settings are correct
- ✅ "Enable email confirmations" is ON

### 3. Check SMTP Settings in Supabase

Go to: https://supabase.com/dashboard/project/urmuwjcjcyohsrkgyapl/settings/auth

Under "SMTP Settings":
- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: Your Resend API key
- Sender email: `noreply@linguaflow.online`
- Sender name: `Lingua Flow`

### 4. Test Password Reset

Try these steps:
1. Go to forgot password page
2. Enter a valid email address
3. Check Resend dashboard immediately
4. Check spam folder
5. Wait 2-3 minutes (sometimes delayed)

### 5. Common Issues

#### Issue: Email not in Resend dashboard
**Cause:** SMTP settings in Supabase are incorrect
**Solution:** Re-configure SMTP in Supabase dashboard

#### Issue: Email shows "bounced" in Resend
**Cause:** Invalid email address or domain issues
**Solution:** Verify email address is correct

#### Issue: Email in spam
**Cause:** Domain reputation or email content
**Solution:** Check spam folder, add sender to contacts

#### Issue: "Rate limit exceeded"
**Cause:** Too many password reset attempts
**Solution:** Wait 60 seconds between attempts

### 6. Verify Email Template

The password reset email template in Supabase should include:
- Reset link: `{{ .ConfirmationURL }}`
- Expiry time (usually 1 hour)
- Clear instructions

### 7. Check Redirect URL

In Supabase Auth settings, verify:
- Site URL: `http://localhost:3000` (development)
- Redirect URLs: Include your reset password page

For production:
- Site URL: `https://linguaflow.online`
- Redirect URLs: `https://linguaflow.online/auth/reset-password`

## Quick Test

### Test 1: Check if Supabase Auth emails work at all

Try signing up a new user. If welcome email arrives, SMTP is working.

### Test 2: Manual password reset via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/urmuwjcjcyohsrkgyapl/auth/users
2. Find the user
3. Click "Send password recovery email"
4. Check if email arrives

If this works, the issue is with your forgot password page.
If this doesn't work, the issue is with Supabase SMTP configuration.

## Solution: Re-configure SMTP in Supabase

If emails aren't sending:

1. Go to Supabase Dashboard → Project Settings → Auth
2. Scroll to "SMTP Settings"
3. Click "Enable Custom SMTP"
4. Enter:
   ```
   Host: smtp.resend.com
   Port: 465
   Username: resend
   Password: [Your Resend API Key]
   Sender email: noreply@linguaflow.online
   Sender name: Lingua Flow
   ```
5. Click "Save"
6. Test again

## Alternative: Use Supabase's Built-in Email

If Resend isn't working for Auth emails, you can temporarily use Supabase's built-in email service:

1. Go to Supabase Dashboard → Project Settings → Auth
2. Disable "Custom SMTP"
3. Supabase will use their default email service
4. Test password reset again

Note: Supabase's built-in email has limits and may go to spam more often.

## Debugging Commands

### Check Supabase Auth logs

Go to: https://supabase.com/dashboard/project/urmuwjcjcyohsrkgyapl/logs/auth-logs

Look for:
- Password reset requests
- Email sending attempts
- Any errors

### Check your app logs

In your browser console, check for:
- Successful password reset request
- Any error messages
- Network requests to Supabase

## Expected Behavior

When working correctly:

1. User enters email on forgot password page
2. User sees "Check your email" message
3. Email arrives within 1-2 minutes
4. Email contains reset link
5. Link redirects to `/auth/reset-password?token=...`
6. User can set new password

## Still Not Working?

If none of the above works:

1. **Check Resend domain verification**
   - Go to Resend dashboard
   - Verify `linguaflow.online` is verified
   - Check DNS records are correct

2. **Try a different email address**
   - Some email providers block automated emails
   - Try Gmail, Outlook, or another provider

3. **Check Resend API key permissions**
   - Go to Resend dashboard → API Keys
   - Verify the key has "Sending access"
   - Generate a new key if needed

4. **Contact Resend support**
   - If emails show as "sent" but don't arrive
   - They can check delivery logs

## Success Indicators

✅ Email appears in Resend dashboard as "delivered"
✅ Email arrives in inbox (or spam)
✅ Reset link works and redirects correctly
✅ User can set new password successfully

## Next Steps

Once password reset emails work:
- Test with multiple email addresses
- Test the complete flow end-to-end
- Update email templates if needed
- Configure production redirect URLs
