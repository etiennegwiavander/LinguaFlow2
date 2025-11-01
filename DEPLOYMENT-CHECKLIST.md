# 📋 Deployment Checklist

## Pre-Deployment

- [x] ✅ Resend API key added to `.env.local`
- [x] ✅ Email encryption key added to `.env.local`
- [x] ✅ Edge Function updated with Resend integration
- [x] ✅ Test script created
- [x] ✅ Deployment script created
- [x] ✅ Documentation complete

## Deployment Steps

### Step 1: Deploy to Supabase

- [ ] Run deployment script: `.\scripts\deploy-resend-integration.ps1`
  - [ ] Supabase CLI installed
  - [ ] Project linked successfully
  - [ ] RESEND_API_KEY secret set
  - [ ] Edge Function deployed

**OR** Manual deployment:

- [ ] Login: `npx supabase login`
- [ ] Link: `npx supabase link --project-ref urmuwjcjcyohsrkgyapl`
- [ ] Set secret: `npx supabase secrets set RESEND_API_KEY=your_key`
- [ ] Deploy: `npx supabase functions deploy send-integrated-email`

### Step 2: Test Integration

- [ ] Run test script: `node scripts/test-resend-integration.js`
- [ ] Test shows "Email sent successfully"
- [ ] No errors in console

### Step 3: Verify Delivery

- [ ] Check inbox (`linguaflowservices@gmail.com`)
- [ ] Email arrived (check spam if not in inbox)
- [ ] Email looks correct (HTML formatted)
- [ ] Check [Resend Dashboard](https://resend.com/emails)
- [ ] Delivery status shows "delivered"

### Step 4: Check Logs

- [ ] Supabase logs: `npx supabase functions logs send-integrated-email`
- [ ] No errors in logs
- [ ] Database logs: `SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 5;`
- [ ] Status shows "sent"
- [ ] Resend ID is stored

## Post-Deployment Testing

### Test 1: Welcome Email

- [ ] Sign up a new user
- [ ] Welcome email arrives
- [ ] Email content is correct
- [ ] Unsubscribe link works (if applicable)

### Test 2: Password Reset

- [ ] Request password reset
- [ ] Reset email arrives
- [ ] Reset link works
- [ ] Email is from correct sender

### Test 3: Custom Email (Optional)

- [ ] Send test email from admin portal
- [ ] Email arrives
- [ ] Template renders correctly
- [ ] Tracking works

## Verification Checklist

### Environment

- [ ] `.env.local` has `RESEND_API_KEY`
- [ ] `.env.local` has `EMAIL_ENCRYPTION_KEY`
- [ ] Supabase secrets include `RESEND_API_KEY`

### Deployment

- [ ] Edge Function deployed successfully
- [ ] Function appears in Supabase dashboard
- [ ] Function logs are accessible
- [ ] No deployment errors

### Functionality

- [ ] Test email sends successfully
- [ ] Email arrives in inbox
- [ ] Email logs show "sent" status
- [ ] Resend dashboard shows delivery
- [ ] Error handling works (test with invalid email)

### Documentation

- [ ] Read `IMPLEMENTATION-COMPLETE.md`
- [ ] Read `RESEND-INTEGRATION-READY.md`
- [ ] Bookmark `docs/resend-integration-complete.md`
- [ ] Know where to find troubleshooting steps

## Troubleshooting Checklist

If something doesn't work:

### Issue: Deployment fails

- [ ] Check Supabase CLI is installed: `npx supabase --version`
- [ ] Check you're logged in: `npx supabase login`
- [ ] Check project is linked: `npx supabase projects list`
- [ ] Check for error messages in console

### Issue: Test email doesn't send

- [ ] Check RESEND_API_KEY is set: `npx supabase secrets list`
- [ ] Check Edge Function is deployed: `npx supabase functions list`
- [ ] Check Supabase logs: `npx supabase functions logs send-integrated-email`
- [ ] Check Resend API key is valid (try in Resend dashboard)

### Issue: Email doesn't arrive

- [ ] Check spam folder
- [ ] Check Resend dashboard for delivery status
- [ ] Check email address is correct
- [ ] Check domain is verified in Resend
- [ ] Check sender email is verified

### Issue: Database errors

- [ ] Check `email_smtp_configs` table exists
- [ ] Check `email_logs` table exists
- [ ] Check `email_templates` table exists
- [ ] Run migrations if needed

## Success Criteria

All of these should be true:

- [x] ✅ Code changes complete
- [ ] ✅ Deployed to Supabase
- [ ] ✅ Test email sent successfully
- [ ] ✅ Email arrived in inbox
- [ ] ✅ Resend dashboard shows delivery
- [ ] ✅ Database logs show "sent"
- [ ] ✅ No errors in Supabase logs
- [ ] ✅ Welcome emails work
- [ ] ✅ Documentation reviewed

## Next Steps After Success

### Immediate

- [ ] Test with real users
- [ ] Monitor email delivery rates
- [ ] Check for any errors in logs
- [ ] Verify all email types work

### Short Term (1-2 weeks)

- [ ] Update admin UI to show "Resend" provider
- [ ] Add email analytics to dashboard
- [ ] Set up monitoring/alerts
- [ ] Document any issues found

### Long Term (1-3 months)

- [ ] Add second email provider (SendGrid)
- [ ] Implement automatic failover
- [ ] Add delivery webhooks
- [ ] Optimize email templates

## Quick Commands Reference

```bash
# Deploy
.\scripts\deploy-resend-integration.ps1

# Test
node scripts/test-resend-integration.js

# Check logs
npx supabase functions logs send-integrated-email

# Check secrets
npx supabase secrets list

# Redeploy
npx supabase functions deploy send-integrated-email

# Check database
# Run in Supabase SQL Editor:
SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 10;
```

## Support

If you need help:

1. Check `docs/resend-integration-complete.md`
2. Check Supabase logs
3. Check Resend dashboard
4. Check database logs
5. Review error messages carefully

## Ready?

Start with:

```powershell
.\scripts\deploy-resend-integration.ps1
```

Then:

```bash
node scripts/test-resend-integration.js
```

Good luck! 🚀
