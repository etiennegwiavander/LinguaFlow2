# Google Cloud Console Setup - URGENT

## Your Exact Redirect URI

Copy this EXACT URI and add it to Google Cloud Console:

```
https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/google-oauth-callback?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybXV3amNqY3lvaHNya2d5YXBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMDMxNDAsImV4cCI6MjA2NDY3OTE0MH0.qXvAH9G_9vU7fy07SOYM2nnywS8LgvDYnuJPCa982kQ
```

## Steps to Add to Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Select Your Project**
   - Make sure you're in the correct project (LinguaFlow)

3. **Navigate to Credentials**
   - Click on the menu (☰) in the top left
   - Go to: **APIs & Services** > **Credentials**

4. **Edit OAuth 2.0 Client**
   - Find your OAuth 2.0 Client ID in the list
   - Click on it to edit

5. **Add the Redirect URI**
   - Scroll down to **Authorized redirect URIs**
   - Click **+ ADD URI**
   - Paste the EXACT URI from above (including the apikey parameter)
   - Click **SAVE**

6. **Wait for Propagation**
   - Google takes 5-10 minutes to propagate changes
   - Wait at least 5 minutes before testing

## Important Notes

- ⚠️ The URI must include the `?apikey=...` parameter
- ⚠️ Copy the ENTIRE URI including the long JWT token
- ⚠️ Do NOT modify or shorten the URI
- ⚠️ Make sure there are no extra spaces or line breaks

## After Adding the URI

1. Wait 5-10 minutes
2. Clear your browser cache
3. Try the calendar sync again
4. It should work without the redirect_uri_mismatch error

## Verification

After adding, you should see this URI in your Google Cloud Console under "Authorized redirect URIs":

```
https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/google-oauth-callback?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybXV3amNqY3lvaHNya2d5YXBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMDMxNDAsImV4cCI6MjA2NDY3OTE0MH0.qXvAH9G_9vU7fy07SOYM2nnywS8LgvDYnuJPCa982kQ
```

## Troubleshooting

If you still get redirect_uri_mismatch after adding:
1. Double-check the URI matches EXACTLY
2. Wait longer (up to 15 minutes)
3. Clear browser cache and cookies
4. Try in an incognito/private window
