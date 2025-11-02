# Google OAuth - Ready to Test! 🎉

## ✅ What's Been Done

1. ✅ Created Next.js API route proxy (`/api/oauth/google-callback`)
2. ✅ Updated OAuth redirect URIs in code
3. ✅ Deployed Edge Function to Supabase
4. ✅ Committed and pushed to GitHub

## 🚀 Final Step: Update Google Cloud Console

### The New Redirect URI

```
https://linguaflow.online/api/oauth/google-callback
```

### Steps to Update

1. **Go to Google Cloud Console**
   - https://console.cloud.google.com/

2. **Navigate to Credentials**
   - Click menu (☰) → APIs & Services → Credentials

3. **Edit Your OAuth 2.0 Client**
   - Click on your OAuth 2.0 Client ID

4. **Update Authorized Redirect URIs**
   
   **REMOVE these old URIs:**
   - ❌ `https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/google-oauth-callback`
   - ❌ `https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/google-oauth-callback?apikey=...`
   
   **ADD this new URI:**
   - ✅ `https://linguaflow.online/api/oauth/google-callback`

5. **Click SAVE**

6. **Wait 5-10 minutes** for Google to propagate the changes

## 🧪 Test the OAuth Flow

After waiting 5-10 minutes:

1. Go to https://linguaflow.online/calendar
2. Click "Connect Google Calendar"
3. Sign in with Google
4. Grant calendar permissions
5. You should be redirected back successfully!

## 🔍 Troubleshooting

### If you get redirect_uri_mismatch:
- Double-check the URI in Google Cloud Console matches exactly
- Make sure there are no trailing slashes
- Wait the full 10 minutes for propagation
- Try in an incognito window

### If you get 401 error:
- Check that the Edge Function is deployed: `supabase functions list`
- Verify environment variables are set in `.env.local`
- Check browser console for errors

### If nothing happens:
- Check browser console for JavaScript errors
- Verify you're logged into your app
- Try refreshing the page

## 📊 How It Works Now

```
User clicks "Connect" 
  ↓
Google OAuth (user grants permission)
  ↓
Redirects to: https://linguaflow.online/api/oauth/google-callback
  ↓
Next.js API route (adds authentication headers)
  ↓
Calls Supabase Edge Function
  ↓
Stores tokens in database
  ↓
Redirects back to /calendar with success message
```

## 🎯 Expected Result

You should see:
- ✅ No 401 "Missing authorization header" error
- ✅ No redirect_uri_mismatch error
- ✅ Success message on calendar page
- ✅ Calendar events syncing

## 📝 Quick Reference

**Helper script to show URI:**
```powershell
.\scripts\show-redirect-uri.ps1
```

**Check Edge Function logs:**
```bash
supabase functions logs google-oauth-callback --tail
```

**Redeploy if needed:**
```bash
supabase functions deploy google-oauth-callback
```

## 🎉 You're Almost There!

Just update Google Cloud Console and test. The OAuth flow should work perfectly now!
