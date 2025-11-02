# Google OAuth Callback Fix

## Problem
The Google Calendar OAuth callback was failing with error:
```
{
  "code": 401,
  "message": "Missing authorization header"
}
```

## Root Cause
Supabase Edge Functions require authentication by default. When Google redirects back to the callback URL after OAuth authorization, it doesn't include any Supabase authentication headers, causing the 401 error.

## Solution
Include the Supabase anon key as an `apikey` query parameter in the OAuth redirect URI. This allows the Edge Function to be called without requiring a JWT token in the Authorization header.

## Changes Made

### 1. Updated OAuth Redirect URI
**Files:** `lib/google-calendar.ts`, `lib/google-calendar-improved.ts`

Changed from:
```typescript
const redirectUri = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/google-oauth-callback`;
```

To:
```typescript
const redirectUri = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/google-oauth-callback?apikey=${anonKey}`;
```

### 2. Updated Edge Function Token Exchange
**File:** `supabase/functions/google-oauth-callback/index.ts`

Updated the redirect_uri parameter in the token exchange request to match the new format with the apikey parameter.

### 3. Added Environment Variable Check
Added check for `SUPABASE_ANON_KEY` in the Edge Function to ensure it's properly configured.

## Required Configuration Updates

### Google Cloud Console
You need to update the authorized redirect URI in your Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, update the URI to:
   ```
   https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/google-oauth-callback?apikey=YOUR_ANON_KEY
   ```
   
   Replace `YOUR_ANON_KEY` with your actual Supabase anon key from `.env.local`

6. Click **Save**

### Supabase Edge Function Secrets
Ensure the following secrets are set in your Supabase project:

```bash
supabase secrets set SUPABASE_ANON_KEY=your_anon_key_here
supabase secrets set GOOGLE_CLIENT_ID=your_client_id_here
supabase secrets set GOOGLE_CLIENT_SECRET=your_client_secret_here
```

## Testing

After making these changes:

1. Deploy the updated Edge Function:
   ```bash
   supabase functions deploy google-oauth-callback
   ```

2. Test the OAuth flow:
   - Navigate to the Calendar page
   - Click "Connect Google Calendar"
   - Complete the Google OAuth flow
   - You should be redirected back successfully without the 401 error

## Alternative Approach (Not Recommended)

An alternative would be to make the Edge Function completely public by not verifying JWT at all, but this is less secure. The apikey parameter approach is better because:
- It still requires a valid Supabase project key
- It's the standard way Supabase handles public Edge Function calls
- It maintains security while allowing OAuth callbacks

## Notes

- The anon key is safe to include in the redirect URI as it's already public (used in the frontend)
- The redirect URI with the apikey parameter must match exactly between:
  - The initial OAuth request to Google
  - The token exchange request from the Edge Function
  - The authorized redirect URI in Google Cloud Console
