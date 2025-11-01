# 🚀 Quick Start: Resend Integration

## 3 Commands to Get Your Emails Working

### 1. Deploy to Supabase
```powershell
.\scripts\deploy-resend-integration.ps1
```

### 2. Test Integration
```bash
# First, edit scripts/test-resend-integration.js line 32
# Change 'test@example.com' to your actual email

node scripts/test-resend-integration.js
```

### 3. Verify
- Check your inbox ✅
- Check [Resend Dashboard](https://resend.com/emails) ✅

---

## That's It!

Your custom email system is now sending real emails via Resend.

**Full Documentation:** `RESEND-INTEGRATION-READY.md`

---

## Troubleshooting One-Liners

```bash
# Check if deployed
npx supabase functions list

# View logs
npx supabase functions logs send-integrated-email

# Verify secrets
npx supabase secrets list

# Redeploy
npx supabase functions deploy send-integrated-email
```

---

## What Changed

**Before:** Emails were mocked (logged but not sent)
**After:** Emails are sent via Resend API

**Files Modified:**
- `supabase/functions/send-integrated-email/index.ts` ✅
- `.env.local` ✅

**New Files:**
- `scripts/test-resend-integration.js` ✅
- `scripts/deploy-resend-integration.ps1` ✅
- `docs/resend-integration-complete.md` ✅

---

## Success Criteria

✅ Deployment script runs without errors
✅ Test script shows "Email sent successfully"
✅ Email arrives in inbox
✅ Resend dashboard shows delivery
✅ Database shows "sent" status

---

Ready? Run: `.\scripts\deploy-resend-integration.ps1`
