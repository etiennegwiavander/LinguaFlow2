# Google OAuth Fix - Deployment Checklist

## ✅ Pre-Deployment Checklist

- [ ] Verify `.env.local` has all required variables:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
  - [ ] `GOOGLE_CLIENT_SECRET`

## ✅ Google Cloud Console Configuration

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Navigate to **APIs & Services** > **Credentials**
- [ ] Click on your OAuth 2.0 Client ID
- [ ] Verify the redirect URI is exactly:
  ```
  https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/google-oauth-callback
  ```
  **⚠️ IMPORTANT:** Do NOT include any query parameters like `?apikey=...`
- [ ] If not present, add it and click **Save**
- [ ] Wait 5-10 minutes for Google to propagate the changes

## ✅ Supabase Deployment

### Option 1: Automated (Recommended)
- [ ] Run: `.\scripts\deploy-google-oauth-fix.ps1`
- [ ] Follow the prompts
- [ ] Verify deployment success

### Option 2: Manual
- [ ] Set Supabase secrets:
  ```bash
  supabase secrets set GOOGLE_CLIENT_ID=your_client_id
  supabase secrets set GOOGLE_CLIENT_SECRET=your_client_secret
  ```
- [ ] Deploy Edge Function (this will include the config.toml):
  ```bash
  supabase functions deploy google-oauth-callback
  ```
- [ ] Verify deployment success

## ✅ Testing

- [ ] Navigate to `/calendar` in your app
- [ ] Click "Connect Google Calendar"
- [ ] Complete Google OAuth flow
- [ ] Verify successful redirect (no 401 error)
- [ ] Check that calendar events sync properly

## ✅ Verification

- [ ] Check Edge Function logs:
  ```bash
  supabase functions logs google-oauth-callback
  ```
- [ ] Verify no 401 errors in logs
- [ ] Confirm tokens are stored in `google_tokens` table
- [ ] Test calendar sync functionality

## 🚨 Troubleshooting

### If you still get 401 error:
1. Verify the `config.toml` file was deployed with the function
2. Check Edge Function logs for detailed error messages:
   ```bash
   supabase functions logs google-oauth-callback
   ```
3. Redeploy the function to ensure config is applied:
   ```bash
   supabase functions deploy google-oauth-callback
   ```

### If you get redirect_uri_mismatch error:
1. Verify the redirect URI in Google Cloud Console matches exactly (no query parameters)
2. Wait 5-10 minutes for Google changes to propagate
3. Clear your browser cache and try again

### If token exchange fails:
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
2. Check that the redirect URI matches in all three places:
   - Google Cloud Console
   - OAuth initiation (frontend)
   - Token exchange (Edge Function)

### If tokens aren't stored:
1. Check `SUPABASE_SERVICE_ROLE_KEY` is set in Supabase secrets
2. Verify RLS policies on `google_tokens` table allow service role access
3. Check Edge Function logs for database errors

## 📝 Notes

- The anon key in the redirect URI is safe - it's already public in your frontend
- Changes are backward compatible - no database migrations needed
- The fix follows Supabase's standard pattern for public Edge Functions
- All three redirect URI references must match exactly

## ✅ Post-Deployment

- [ ] Document the new redirect URI for team reference
- [ ] Update any deployment documentation
- [ ] Monitor Edge Function logs for any issues
- [ ] Test with multiple users to ensure consistency
