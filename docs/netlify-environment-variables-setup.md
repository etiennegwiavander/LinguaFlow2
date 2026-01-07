# Netlify Environment Variables Setup Guide

**Issue**: Getting "Tranzak API credentials not configured" error in production  
**Cause**: Environment variables from `.env.local` are not automatically deployed to Netlify  
**Solution**: Manually add environment variables in Netlify dashboard

---

## Quick Fix

### Step 1: Go to Netlify Dashboard

1. Visit https://app.netlify.com
2. Log in to your account
3. Select your **LinguaFlow** site

### Step 2: Add Environment Variables

1. Click **Site settings** (in the top navigation)
2. Click **Environment variables** (in the left sidebar under "Build & deploy")
3. Click **Add a variable** or **Add environment variables**

### Step 3: Add Tranzak Variables

Add each of these variables one by one:

```
Key: TRANZAK_API_KEY
Value: SAND_DAD99DEC07124C36939663D56E35DC5C
Scopes: ✅ All scopes (or select Production, Deploy previews, Branch deploys)
```

```
Key: TRANZAK_APP_ID
Value: ap6n2xfl5md3lu
Scopes: ✅ All scopes
```

```
Key: TRANZAK_BASE_URL
Value: https://sandbox.dsapi.tranzak.me
Scopes: ✅ All scopes
```

```
Key: TRANZAK_ENVIRONMENT
Value: sandbox
Scopes: ✅ All scopes
```

```
Key: TRANZAK_WEBHOOK_SECRET
Value: KP[QqH1FRcpWbF92E9zg3_mZ79PH9mHbW*f
Scopes: ✅ All scopes
```

### Step 4: Redeploy

After adding all variables:

**Option A: Trigger Redeploy**
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**

**Option B: Push New Commit**
```bash
git commit --allow-empty -m "Trigger redeploy for env vars"
git push
```

---

## Why This Happens

### Local Development vs Production

**Local (.env.local)**:
- Environment variables are loaded from `.env.local` file
- Works automatically with `npm run dev`
- File is in `.gitignore` (not pushed to GitHub)

**Production (Netlify)**:
- `.env.local` file is NOT deployed (for security)
- Environment variables must be set in Netlify dashboard
- Netlify injects them at build/runtime

### The Error

```
Tranzak API credentials not configured. 
Please set TRANZAK_API_KEY and TRANZAK_APP_ID in your environment variables.
```

This means:
- ✅ Code is correct
- ✅ Logic is working
- ❌ Environment variables are missing in Netlify

---

## Verification

### Check if Variables Are Set

1. **In Netlify Dashboard**:
   - Go to Site settings → Environment variables
   - You should see all 5 Tranzak variables listed

2. **In Deploy Logs**:
   - Go to Deploys → Click latest deploy → View deploy logs
   - Look for any environment variable warnings

3. **Test in Production**:
   - Visit https://linguaflow.online/pricing
   - Select a paid plan
   - Click "Get Started"
   - Should redirect to Tranzak payment page (not show error)

### Check Function Logs

If still having issues:

1. Go to **Functions** tab in Netlify
2. Find `create-checkout` function
3. Click to view logs
4. Look for console.log output showing:
   ```
   Tranzak config loaded: {
     hasApiKey: true,
     hasAppId: true,
     baseUrl: 'https://sandbox.dsapi.tranzak.me',
     ...
   }
   ```

---

## Common Issues

### Issue 1: Variables Not Taking Effect

**Symptom**: Added variables but still getting error

**Solution**:
1. Verify variables are saved (refresh the page)
2. Trigger a new deploy (don't just clear cache)
3. Wait for deploy to complete
4. Test again

### Issue 2: Wrong Scope Selected

**Symptom**: Works in some deploys but not others

**Solution**:
1. Edit each variable
2. Ensure **All scopes** is selected, or at minimum:
   - ✅ Production
   - ✅ Deploy previews
   - ✅ Branch deploys
3. Save and redeploy

### Issue 3: Typo in Variable Name

**Symptom**: One specific variable not working

**Solution**:
1. Double-check variable names (case-sensitive):
   - `TRANZAK_API_KEY` (not `TRANZAK_APIKEY`)
   - `TRANZAK_APP_ID` (not `TRANZAK_APPID`)
2. Delete and re-add if needed

### Issue 4: Special Characters in Value

**Symptom**: Webhook secret not working

**Solution**:
- Netlify handles special characters automatically
- No need to escape or quote values
- Just paste the exact value: `KP[QqH1FRcpWbF92E9zg3_mZ79PH9mHbW*f`

---

## All Required Environment Variables

For complete LinguaFlow deployment, you need these variables in Netlify:

### Supabase (Required)
```
NEXT_PUBLIC_SUPABASE_URL=https://urmuwjcjcyohsrkgyapl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Tranzak Payment (Required for subscriptions)
```
TRANZAK_API_KEY=SAND_DAD99DEC07124C36939663D56E35DC5C
TRANZAK_APP_ID=ap6n2xfl5md3lu
TRANZAK_BASE_URL=https://sandbox.dsapi.tranzak.me
TRANZAK_ENVIRONMENT=sandbox
TRANZAK_WEBHOOK_SECRET=KP[QqH1FRcpWbF92E9zg3_mZ79PH9mHbW*f
```

### Google OAuth (Required for calendar)
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=630010123392-tpf2fk7je8828j8qnqdtfq9hc31srpp0.apps.googleusercontent.com
GOOGLE_CLIENT_ID=630010123392-tpf2fk7je8828j8qnqdtfq9hc31srpp0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### AI Services (Required for lesson generation)
```
GEMINI_API_KEY=AIzaSyCOK7Uim0JUd3Gzg0dfmhFwTSjL7NyTDJ8
OPENROUTER_API_KEY=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
```

### Email (Required for notifications)
```
RESEND_API_KEY=re_RawFdpa1_7BZwHsiuD65DocJd3Zjoziks
EMAIL_ENCRYPTION_KEY=linguaflow-email-encryption-key-2025-secure-random-string
```

### App Configuration
```
NEXT_PUBLIC_APP_URL=https://linguaflow.online
```

---

## Security Best Practices

### Do NOT Commit Secrets

✅ **Correct**:
- Keep `.env.local` in `.gitignore`
- Add variables in Netlify dashboard
- Use different values for production

❌ **Wrong**:
- Commit `.env.local` to GitHub
- Hardcode secrets in code
- Use same credentials for dev and prod

### Rotate Credentials

When moving to production:
1. Get production credentials from Tranzak
2. Update Netlify environment variables
3. Change `TRANZAK_ENVIRONMENT` to `production`
4. Update `TRANZAK_BASE_URL` to production endpoint

---

## Testing After Setup

### Test Checklist

1. **Environment Variables**
   ```bash
   # Run locally to verify your .env.local
   node scripts/verify-netlify-env.js
   ```

2. **Production Deployment**
   - Push code to GitHub
   - Wait for Netlify deploy to complete
   - Check deploy logs for errors

3. **Payment Flow**
   - Visit https://linguaflow.online/pricing
   - Select a plan
   - Click "Get Started"
   - Should redirect to Tranzak (not show error)

4. **Function Logs**
   - Go to Netlify → Functions → create-checkout
   - Check logs show config loaded successfully

---

## Quick Reference

### Netlify Dashboard Path
```
Netlify Dashboard → Your Site → Site settings → Environment variables
```

### After Adding Variables
```
Deploys → Trigger deploy → Deploy site
```

### Check Logs
```
Deploys → Latest deploy → View deploy logs
Functions → create-checkout → View logs
```

---

## Summary

**Problem**: Environment variables work locally but not in production  
**Root Cause**: `.env.local` is not deployed to Netlify  
**Solution**: Add variables manually in Netlify dashboard  
**Time to Fix**: 5 minutes  
**Result**: Payment system works in production

---

**Need Help?**

If you're still having issues after following this guide:
1. Check Netlify function logs for specific error messages
2. Verify all variable names are spelled correctly
3. Ensure you triggered a new deploy after adding variables
4. Contact Netlify support if variables still not loading
