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
Disable JWT verification for the Edge Function by creating a `config.toml` file. This allows Google to call the callback URL directly without any Supabase authentication.

## Changes Made

### 1. Created Edge Function Configuration
**File:** `supabase/functions/google-oauth-callback/config.toml`

Created a configuration file to disable JWT verification:
```toml
[function]
verify_jwt = false
```

This allows the function to be called without authentication headers.

### 2. Kept Redirect URI Clean
**Files:** `lib/google-calendar.ts`, `lib/google-calendar-improved.ts`

Ensured the redirect URI matches exactly what's in Google Cloud Console:
```typescript
const redirectUri = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/google-oauth-callback`;
```

No query parameters are added to avoid redirect_uri_mismatch errors.

## Required Configuration Updates

### Google Cloud Console
You need to ensure the authorized redirect URI in your Google Cloud Console is correct:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, ensure you have:
   ```
   https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/google-oauth-callback
   ```
   
   **Important:** Do NOT include any query parameters like `?apikey=...`

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
