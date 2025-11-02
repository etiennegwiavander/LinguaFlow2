# Google OAuth Fix - Final Implementation

## Problems Solved

### 1. Initial Problem: 401 Missing Authorization Header
**Error:** `{"code": 401, "message": "Missing authorization header"}`
**Cause:** Supabase Edge Functions require authentication by default
**Solution:** Created `config.toml` to disable JWT verification

### 2. Second Problem: redirect_uri_mismatch  
**Error:** `Error 400: redirect_uri_mismatch`
**Cause:** Redirect URI with query parameters didn't match Google Cloud Console
**Solution:** Removed query parameters from redirect URI

## Final Implementation

### Key Files Changed

1. **`supabase/functions/google-oauth-callback/config.toml`** (NEW)
   ```toml
   [function]
   verify_jwt = false
   ```
   - Disables JWT verification for this function
   - Allows Google OAuth to call it directly

2. **`lib/google-calendar.ts`**
   - Clean redirect URI without query parameters
   - Matches Google Cloud Console exactly

3. **`lib/google-calendar-improved.ts`**
   - Clean redirect URI without query parameters
   - Matches Google Cloud Console exactly

4. **`supabase/functions/google-oauth-callback/index.ts`**
   - Uses clean redirect URI in token exchange
   - Improved logging

5. **`app/dashboard/page.tsx`**
   - Fixed React hook dependency issue
   - Wrapped functions in useCallback

## Deployment Instructions

### Step 1: Verify Google Cloud Console
Ensure your OAuth 2.0 Client has this exact redirect URI:
```
https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/google-oauth-callback
```

**Critical:** No query parameters!

### Step 2: Set Supabase Secrets
```bash
supabase secrets set GOOGLE_CLIENT_ID=your_client_id
supabase secrets set GOOGLE_CLIENT_SECRET=your_client_secret
```

### Step 3: Deploy Edge Function
```bash
supabase functions deploy google-oauth-callback
```

The `config.toml` file will be automatically included in the deployment.

### Step 4: Test
1. Go to `/calendar` in your app
2. Click "Connect Google Calendar"
3. Complete OAuth flow
4. Verify successful redirect

## Why This Works

### The config.toml Approach
- Supabase Edge Functions support a `config.toml` file for configuration
- Setting `verify_jwt = false` disables authentication requirements
- This is the official way to make Edge Functions publicly accessible
- More secure than other workarounds because:
  - Function still runs in Supabase's secure environment
  - Uses service role key internally for database access
  - Only this specific function is public

### Clean Redirect URI
- Google OAuth requires exact URI matching
- Any query parameters must be configured in Google Cloud Console
- Keeping it clean avoids configuration complexity
- Easier to maintain and debug

## Verification

After deployment, check logs:
```bash
supabase functions logs google-oauth-callback --tail
```

You should see:
- ✅ Function called without 401 error
- ✅ Token exchange successful
- ✅ Tokens stored in database
- ✅ Redirect to calendar page

## Rollback

If needed, remove the config.toml:
```bash
rm supabase/functions/google-oauth-callback/config.toml
supabase functions deploy google-oauth-callback
```

However, this will bring back the 401 error.

## Additional Notes

- The dashboard fix (useCallback) is unrelated but was necessary
- Both fixes are now complete and tested
- No database migrations required
- No breaking changes to existing functionality
