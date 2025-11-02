# Google Cloud Console Verification Guide

## Current Redirect URI (CORRECT)

```
https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/google-oauth-callback?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybXV3amNqY3lvaHNya2d5YXBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMDMxNDAsImV4cCI6MjA2NDY3OTE0MH0.qXvAH9G_9vU7fy07SOYM2nnywS8LgvDYnuJPCa982kQ
```

## Why You're Getting redirect_uri_mismatch

The error means Google Cloud Console has a **different** URI configured. Most likely it has:

### ❌ OLD URI (Without apikey):
```
https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/google-oauth-callback
```

### ✅ NEW URI (With apikey) - What you need:
```
https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/google-oauth-callback?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybXV3amNqY3lvaHNya2d5YXBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMDMxNDAsImV4cCI6MjA2NDY3OTE0MH0.qXvAH9G_9vU7fy07SOYM2nnywS8LgvDYnuJPCa982kQ
```

## Step-by-Step Fix

### 1. Go to Google Cloud Console
https://console.cloud.google.com/

### 2. Navigate to Credentials
- Click on the menu (☰) in the top left
- Go to **APIs & Services**
- Click **Credentials**

### 3. Find Your OAuth 2.0 Client
- Look for your OAuth 2.0 Client ID (probably named something like "LinguaFlow" or "Web client")
- Click on it to edit

### 4. Check Authorized Redirect URIs
You'll see a section called **Authorized redirect URIs**

**Current state (WRONG):**
```
https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/google-oauth-callback
```

### 5. Update the URI
**Option A: Replace the old URI**
1. Delete the old URI (without apikey)
2. Add the new URI (with apikey)

**Option B: Add both (safer during transition)**
1. Keep the old URI
2. Add the new URI as a second entry
3. After testing, remove the old one

### 6. Save Changes
- Click **SAVE** at the bottom
- **IMPORTANT:** Wait 5-10 minutes for Google to propagate the changes

### 7. Clear Browser Cache
- Clear your browser cache
- Or use an incognito/private window

### 8. Test Again
- Go to your app's `/calendar` page
- Click "Connect Google Calendar"
- Complete the OAuth flow

## Common Mistakes

### ❌ Mistake 1: Forgetting the apikey parameter
```
https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/google-oauth-callback
```
This will cause 401 "Missing authorization header"

### ❌ Mistake 2: Wrong apikey value
Make sure you're using YOUR anon key, not an example

### ❌ Mistake 3: Extra spaces or characters
Copy the ENTIRE URI exactly as shown, no extra spaces

### ❌ Mistake 4: Not waiting for propagation
Google takes 5-10 minutes to update. Be patient!

## Verification Checklist

- [ ] Logged into Google Cloud Console
- [ ] Found the correct OAuth 2.0 Client ID
- [ ] Verified the redirect URI includes `?apikey=...`
- [ ] Clicked SAVE
- [ ] Waited 5-10 minutes
- [ ] Cleared browser cache
- [ ] Tested the OAuth flow

## Still Not Working?

### Check 1: Verify the URI is EXACTLY correct
The URI must match character-for-character, including:
- The protocol (`https://`)
- The domain
- The path (`/functions/v1/google-oauth-callback`)
- The query parameter (`?apikey=...`)
- The full apikey value

### Check 2: Check for multiple OAuth clients
You might have multiple OAuth 2.0 Client IDs. Make sure you're editing the correct one that your app is using.

### Check 3: Verify environment variables
Run this to confirm your app is using the correct values:
```powershell
Get-Content .env.local | Select-String "NEXT_PUBLIC_GOOGLE_CLIENT_ID"
```

The Client ID in `.env.local` should match the one in Google Cloud Console.

## Need Help?

If you're still getting the error after following all steps:

1. Take a screenshot of your Google Cloud Console OAuth client configuration
2. Verify the Client ID matches between Google Cloud Console and `.env.local`
3. Try using an incognito window to rule out caching issues
4. Check the browser console for any error messages
