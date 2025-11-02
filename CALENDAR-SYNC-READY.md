# Calendar Sync - Ready to Test

## ✅ Setup Complete

The calendar sync functionality has been configured:

1. **Secrets Set**: Google OAuth credentials are now available to the Edge Function
   - `GOOGLE_CLIENT_ID` ✅
   - `GOOGLE_CLIENT_SECRET` ✅

2. **Function Deployed**: `sync-calendar` Edge Function is deployed to Supabase

## 🧪 Testing Instructions

### Step 1: Test in the App
1. Go to your app's Calendar page: http://localhost:3000/calendar
2. If not already connected, click "Connect Calendar" and complete OAuth
3. Click the "Sync Now" button
4. You should see: "Successfully synced X calendar events"

### Step 2: What to Expect
- **Success**: Toast notification showing number of events synced
- **Events Display**: Your Google Calendar events should appear in the "Upcoming Calendar Events" section
- **Real-time Sync**: A webhook will be set up for automatic updates

### Step 3: If It Still Fails
If you still see "Failed to sync calendar", check:

1. **Browser Console**: Open DevTools (F12) and check for error messages
2. **Network Tab**: Look at the request to `/functions/v1/sync-calendar` and see the response
3. **Token Validity**: Make sure your Google OAuth token hasn't expired (disconnect and reconnect)

## 🔍 Troubleshooting

### Check Supabase Dashboard
Visit: https://supabase.com/dashboard/project/urmuwjcjcyohsrkgyapl/functions

- Click on `sync-calendar` function
- View recent invocations and logs
- Look for any error messages

### Common Issues

**Issue**: "No Google Calendar connection found"
- **Solution**: Disconnect and reconnect your calendar

**Issue**: "Failed to refresh token"
- **Solution**: The refresh token might be invalid. Disconnect and reconnect.

**Issue**: "Missing Authorization header"
- **Solution**: This shouldn't happen anymore, but if it does, try logging out and back in.

## 📊 What the Sync Does

When you click "Sync Now":
1. Validates your authentication
2. Retrieves your stored Google OAuth tokens
3. Refreshes the access token if expired (using the secrets we just set)
4. Fetches events from all your Google Calendars
5. Stores them in the `calendar_events` table
6. Sets up a webhook for real-time updates

## 🎯 Next Steps

After confirming the sync works:
1. Test with different calendar events
2. Verify real-time updates (webhook)
3. Check that events display correctly
4. Test the disconnect functionality

## 📝 Files Changed
- Set Supabase secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Deployed: `supabase/functions/sync-calendar/index.ts`
- Created: `scripts/setup-calendar-sync-secrets.ps1`
- Created: `docs/calendar-sync-fix.md`

---

**Status**: Ready for testing! 🚀
