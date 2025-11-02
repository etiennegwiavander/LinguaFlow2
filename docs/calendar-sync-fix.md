# Calendar Sync Fix

## Problem
Google Calendar connects successfully but fails to sync with error: "Failed to sync calendar"

## Root Cause
The `sync-calendar` Edge Function requires Google OAuth credentials (`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`) to be set as Supabase secrets, but they were only in the local `.env.local` file.

## Solution

### Step 1: Set Supabase Secrets
Run the setup script to configure the required secrets:

```powershell
.\scripts\setup-calendar-sync-secrets.ps1
```

This script will:
1. Read Google credentials from `.env.local`
2. Set them as Supabase secrets
3. Deploy the `sync-calendar` Edge Function

### Step 2: Manual Setup (Alternative)
If you prefer to set secrets manually:

```bash
# Set Google OAuth credentials
supabase secrets set GOOGLE_CLIENT_ID=your_client_id
supabase secrets set GOOGLE_CLIENT_SECRET=your_client_secret

# Deploy the function
supabase functions deploy sync-calendar
```

### Step 3: Verify
After setting the secrets and deploying:

1. Go to the Calendar page in your app
2. Click "Connect Calendar" (if not already connected)
3. Complete the OAuth flow
4. Click "Sync Now"
5. You should see: "Successfully synced X calendar events"

## Technical Details

### Required Environment Variables
The `sync-calendar` Edge Function needs:
- `GOOGLE_CLIENT_ID` - For OAuth token refresh
- `GOOGLE_CLIENT_SECRET` - For OAuth token refresh
- `SUPABASE_URL` - Auto-provided by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-provided by Supabase

### What the Function Does
1. Validates the user's authentication token
2. Retrieves stored Google OAuth tokens from the database
3. Refreshes the access token if expired
4. Fetches calendar events from Google Calendar API
5. Stores/updates events in the `calendar_events` table
6. Sets up webhook for real-time sync (optional)

### Troubleshooting

#### Check if secrets are set:
```bash
supabase secrets list
```

#### View function logs:
```bash
supabase functions logs sync-calendar --limit 20
```

#### Test the function directly:
```bash
node scripts/test-calendar-sync.js
```

## Files Modified
- Created: `scripts/setup-calendar-sync-secrets.ps1`
- Created: `scripts/verify-calendar-sync-env.ps1`
- Created: `scripts/check-calendar-sync-logs.ps1`
- Created: `scripts/test-calendar-sync.js`

## Next Steps
After fixing the sync issue, the calendar integration should work fully:
- ✅ OAuth connection
- ✅ Calendar sync
- ✅ Event display
- ✅ Real-time webhook updates (optional)
