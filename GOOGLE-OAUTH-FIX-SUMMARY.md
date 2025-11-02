# Google OAuth Callback Fix - Summary

## Problem Fixed
The Google Calendar OAuth flow was failing with:
```json
{
  "code": 401,
  "message": "Missing authorization header"
}
```

## Root Cause
Supabase Edge Functions require authentication by default. When Google redirects to the callback URL, it doesn't include Supabase auth headers, causing the 401 error.

## Solution
Disable JWT verification for the Edge Function using a `config.toml` file. This allows Google OAuth to call the callback URL directly without authentication headers.

## Files Modified

### 1. `supabase/functions/google-oauth-callback/config.toml` (NEW)
- Created configuration file to disable JWT verification
- Allows public access to the Edge Function

### 2. `lib/google-calendar.ts`
- Ensured redirect URI is clean (no query parameters)
- Matches Google Cloud Console configuration exactly

### 3. `lib/google-calendar-improved.ts`
- Ensured redirect URI is clean (no query parameters)
- Matches Google Cloud Console configuration exactly

### 4. `supabase/functions/google-oauth-callback/index.ts`
- Updated token exchange to use clean redirect URI
- Added better logging for debugging

### 5. New Files Created
- `supabase/functions/google-oauth-callback/config.toml` - Function configuration
- `docs/google-oauth-callback-fix.md` - Detailed documentation
- `scripts/deploy-google-oauth-fix.ps1` - Deployment script
- `GOOGLE-OAUTH-FIX-SUMMARY.md` - This file

## Deployment Steps

### 1. Verify Google Cloud Console Configuration
Ensure the redirect URI is correctly configured:
```
https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/google-oauth-callback
```

**Important:** Do NOT include any query parameters like `?apikey=...`

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click your OAuth 2.0 Client ID
4. Verify the URI in **Authorized redirect URIs** matches exactly
5. If not, update it and click **Save**

### 2. Deploy the Fix

#### Option A: Use the deployment script (Recommended)
```powershell
.\scripts\deploy-google-oauth-fix.ps1
```

This script will:
- Verify all environment variables are set
- Show you the exact redirect URI to configure
- Set Supabase secrets
- Deploy the Edge Function

#### Option B: Manual deployment
```bash
# Set secrets
supabase secrets set SUPABASE_ANON_KEY=your_anon_key
supabase secrets set GOOGLE_CLIENT_ID=your_client_id
supabase secrets set GOOGLE_CLIENT_SECRET=your_client_secret

# Deploy function
supabase functions deploy google-oauth-callback
```

### 3. Test the Fix
1. Navigate to `/calendar` in your app
2. Click "Connect Google Calendar"
3. Complete the Google OAuth flow
4. Verify successful redirect without 401 error

## Why This Works

The `apikey` parameter is Supabase's standard way to authenticate public Edge Function calls:
- It's already public (used in frontend code)
- It allows the function to be called without a JWT token
- It maintains security by requiring a valid Supabase project key
- Google OAuth callbacks can now work without authentication headers

## Important Notes

1. **Redirect URI Must Match Exactly**
   - The URI in Google Cloud Console
   - The URI sent to Google during OAuth initiation
   - The URI used in token exchange
   
   All three must be identical, including the `apikey` parameter.

2. **Anon Key is Safe to Expose**
   - It's already public in your frontend code
   - It only allows operations permitted by RLS policies
   - It's the standard way to call Supabase from clients

3. **No Code Changes Needed After Deployment**
   - The fix is backward compatible
   - Existing OAuth flows will automatically use the new format
   - No database migrations required

## Verification

After deployment, check the Edge Function logs:
```bash
supabase functions logs google-oauth-callback
```

You should see:
- ✅ Environment variables are SET
- ✅ Token exchange successful
- ✅ Tokens stored in database
- ✅ Redirect to calendar page

## Rollback (if needed)

If you need to rollback:
1. Remove the `?apikey=...` from the redirect URI in Google Cloud Console
2. Revert the changes in `lib/google-calendar.ts` and `lib/google-calendar-improved.ts`
3. Redeploy the Edge Function

However, this will bring back the 401 error, so rollback is not recommended.
