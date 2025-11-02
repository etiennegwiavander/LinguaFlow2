# Google OAuth Proxy Fix - Final Solution

## The Problem

Supabase Edge Functions require authentication, but Google OAuth redirects directly to the callback URL without any authentication headers. The `apikey` query parameter approach doesn't work with Supabase.

## The Solution

Use a **Next.js API route as a proxy** between Google OAuth and the Supabase Edge Function.

### Architecture

```
Google OAuth → Next.js API Route → Supabase Edge Function
              (adds auth headers)
```

## Implementation

### 1. Created API Route Proxy
**File:** `app/api/oauth/google-callback/route.ts`

This route:
- Receives the OAuth callback from Google
- Extracts the code and state parameters
- Calls the Supabase Edge Function with proper authentication headers
- Redirects back to the calendar page with success/error status

### 2. Updated OAuth Initiation
**Files:** `lib/google-calendar.ts`, `lib/google-calendar-improved.ts`

Changed redirect URI from:
```typescript
// OLD - Direct to Edge Function (doesn't work)
const redirectUri = `${supabaseUrl}/functions/v1/google-oauth-callback?apikey=${anonKey}`;
```

To:
```typescript
// NEW - Via Next.js API route
const redirectUri = `${baseUrl}/api/oauth/google-callback`;
```

### 3. Updated Edge Function
**File:** `supabase/functions/google-oauth-callback/index.ts`

Updated the redirect_uri used in token exchange to match the new API route.

## Google Cloud Console Configuration

### New Redirect URI (CORRECT)

```
https://linguaflow.online/api/oauth/google-callback
```

OR for local development:
```
http://localhost:3000/api/oauth/google-callback
```

### Steps to Update

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click on your OAuth 2.0 Client ID
4. **Remove the old URI:**
   ```
   https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/google-oauth-callback?apikey=...
   ```
5. **Add the new URI:**
   ```
   https://linguaflow.online/api/oauth/google-callback
   ```
6. Click **Save**
7. Wait 5-10 minutes for changes to propagate

## Why This Works

1. **Google OAuth** redirects to your Next.js app (no auth needed)
2. **Next.js API route** receives the callback and adds authentication headers
3. **Supabase Edge Function** receives authenticated request and processes it
4. **User** gets redirected back to calendar page with success status

## Benefits

- ✅ No exposed API keys in URLs
- ✅ Proper authentication for Edge Functions
- ✅ Works with Supabase's security model
- ✅ Cleaner, more maintainable architecture
- ✅ Can add additional logic in the proxy if needed

## Deployment

### 1. Deploy the changes
```bash
npm run build
git add -A
git commit -m "fix: Use API route proxy for Google OAuth callback"
git push origin main
```

### 2. Update Google Cloud Console
Add the new redirect URI as shown above.

### 3. Deploy Edge Function
```bash
supabase functions deploy google-oauth-callback
```

### 4. Test
1. Go to `/calendar`
2. Click "Connect Google Calendar"
3. Complete OAuth flow
4. Verify successful connection

## Environment Variables

Make sure these are set in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_SITE_URL=https://linguaflow.online
```

## Troubleshooting

### Still getting 401 error?
- Check that the API route is deployed
- Verify environment variables are set
- Check browser console for errors

### redirect_uri_mismatch?
- Verify the URI in Google Cloud Console matches exactly
- No trailing slashes
- Correct protocol (https:// for production)
- Wait 5-10 minutes after updating Google Cloud Console

### Edge Function not receiving request?
- Check API route logs
- Verify Supabase URL and anon key are correct
- Check Edge Function logs: `supabase functions logs google-oauth-callback`
