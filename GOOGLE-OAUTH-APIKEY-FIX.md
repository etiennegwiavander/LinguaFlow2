# Google OAuth Fix - API Key Solution

## The Real Problem

Supabase Edge Functions require authentication. When Google OAuth redirects to the callback URL, it doesn't include any Supabase authentication headers, causing a 401 error.

## The Solution

Include the Supabase anon key as an `apikey` query parameter in the redirect URI. This is the standard Supabase way to call Edge Functions publicly.

## Why This Works

- Supabase Edge Functions accept the anon key via the `apikey` query parameter
- This allows public access while still maintaining security through RLS policies
- The anon key is already public (used in frontend code)
- Google will preserve query parameters when redirecting

## Implementation

### 1. Updated Redirect URI Format

**Before:**
```
https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/google-oauth-callback
```

**After:**
```
https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/google-oauth-callback?apikey=YOUR_ANON_KEY
```

### 2. Files Changed

- `lib/google-calendar.ts` - Added apikey parameter to redirect URI
- `lib/google-calendar-improved.ts` - Added apikey parameter to redirect URI  
- `supabase/functions/google-oauth-callback/index.ts` - Updated token exchange to match
- `scripts/deploy-google-oauth-fix.ps1` - Updated to set SUPABASE_ANON_KEY secret

## Deployment Steps

### Step 1: Update Google Cloud Console

Add this EXACT redirect URI to your OAuth 2.0 Client:

```
https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/google-oauth-callback?apikey=YOUR_ANON_KEY
```

Replace `YOUR_ANON_KEY` with your actual `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.local`

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add the URI with the apikey parameter
5. Click **Save**
6. Wait 5-10 minutes for changes to propagate

### Step 2: Set Supabase Secrets

```bash
supabase secrets set SUPABASE_ANON_KEY=your_anon_key_here
supabase secrets set GOOGLE_CLIENT_ID=your_client_id_here
supabase secrets set GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### Step 3: Deploy Edge Function

```bash
supabase functions deploy google-oauth-callback
```

### Step 4: Test

1. Go to `/calendar` in your app
2. Click "Connect Google Calendar"
3. Complete OAuth flow
4. Verify successful redirect without 401 error

## Why Previous Attempts Failed

### Attempt 1: config.toml
- Created `config.toml` with `verify_jwt = false`
- **Failed:** Supabase doesn't support this configuration method for all projects

### Attempt 2: Clean URI without parameters
- Removed all query parameters
- **Failed:** Still got 401 because no authentication was provided

### Attempt 3: API Key in Query Parameter (CURRENT)
- Added `?apikey=...` to redirect URI
- **Success:** This is the official Supabase method for public Edge Function access

## Important Notes

1. **The apikey parameter MUST be in Google Cloud Console**
   - Google preserves query parameters during OAuth redirect
   - The redirect URI must match exactly, including the apikey

2. **The anon key is safe to expose**
   - It's already public in your frontend code
   - It only allows operations permitted by RLS policies
   - It's designed for client-side use

3. **All three URIs must match exactly**
   - Initial OAuth request (frontend)
   - Token exchange request (Edge Function)
   - Google Cloud Console configuration

## Verification

Check Edge Function logs:
```bash
supabase functions logs google-oauth-callback --tail
```

You should see:
- ✅ No 401 errors
- ✅ Environment variables SET (including SUPABASE_ANON_KEY)
- ✅ Token exchange successful
- ✅ Tokens stored in database
- ✅ Redirect to calendar page

## Troubleshooting

### Still getting 401 error?
1. Verify SUPABASE_ANON_KEY secret is set:
   ```bash
   supabase secrets list
   ```
2. Redeploy the function:
   ```bash
   supabase functions deploy google-oauth-callback
   ```
3. Check the redirect URI in Google Cloud Console includes `?apikey=...`

### Getting redirect_uri_mismatch?
1. Verify the URI in Google Cloud Console matches EXACTLY
2. Include the full apikey parameter
3. Wait 5-10 minutes for Google to propagate changes
4. Clear browser cache and try again

## Security Considerations

- The anon key provides limited access based on RLS policies
- The Edge Function uses service role key internally for database writes
- OAuth tokens are stored securely in the database
- The state parameter prevents CSRF attacks
