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
Include the Supabase anon key as an `apikey` query parameter in the OAuth redirect URI. This is the standard way to call Supabase Edge Functions publicly.

## Files Modified

### 1. `lib/google-calendar.ts`
- Updated redirect URI to include `?apikey=${anonKey}`
- Added anon key validation

### 2. `lib/google-calendar-improved.ts`
- Updated redirect URI to include `?apikey=${anonKey}`
- Added anon key validation

### 3. `supabase/functions/google-oauth-callback/index.ts`
- Updated token exchange to use the same redirect URI format
- Added SUPABASE_ANON_KEY environment check
- Added better logging for debugging

### 4. New Files Created
- `docs/google-oauth-callback-fix.md` - Detailed documentation
- `scripts/deploy-google-oauth-fix.ps1` - Deployment script
- `GOOGLE-OAUTH-FIX-SUMMARY.md` - This file

## Deployment Steps

### 1. Update Google Cloud Console
Add the new redirect URI to your OAuth 2.0 Client:
```
https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/google-oauth-callback?apikey=YOUR_ANON_KEY
```

Replace `YOUR_ANON_KEY` with your actual `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.local`

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click your OAuth 2.0 Client ID
4. Add the URI to **Authorized redirect URIs**
5. Click **Save**

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
