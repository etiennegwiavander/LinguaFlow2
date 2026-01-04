# Checkout Error Troubleshooting

## Error: "Failed to start checkout. Please try again."

This error occurs when the pricing page tries to create a checkout session but fails. Here's how to diagnose and fix it.

---

## Quick Diagnosis

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages starting with "Checkout error:"
4. Note the specific error message

### Step 2: Run Diagnostic Script
```bash
node scripts/diagnose-checkout-error.js
```

This will check:
- ✅ Subscription plans exist in database
- ✅ Environment variables are set
- ✅ Tranzak configuration
- ✅ Database connection
- ✅ Recent transaction errors

---

## Common Causes & Solutions

### 1. Tranzak API Credentials Not Set

**Symptoms:**
- Error mentions "API credentials not configured"
- Checkout fails immediately

**Solution:**
```bash
# Check if credentials are set
echo $TRANZAK_API_KEY
echo $TRANZAK_APP_ID

# If missing, add to .env.local:
TRANZAK_API_KEY=your_api_key_here
TRANZAK_APP_ID=your_app_id_here
TRANZAK_BASE_URL=https://api.tranzak.net/v1
TRANZAK_ENVIRONMENT=sandbox
```

Then restart your dev server.

### 2. User Session Expired

**Symptoms:**
- Error mentions "Invalid authentication" or "Unauthorized"
- Happens after being idle for a while

**Solution:**
- User needs to log out and log back in
- Session will be refreshed automatically

**Prevention:**
The code now handles this automatically by redirecting to login if session is expired.

### 3. No Subscription Plans in Database

**Symptoms:**
- Error mentions "Plan not found"
- Happens for all plans

**Solution:**
```bash
# Run the subscription system setup
node scripts/test-subscription-system.js
```

This will create the default plans if they don't exist.

### 4. Plan Name Mismatch

**Symptoms:**
- Works for some plans but not others
- Error mentions specific plan name

**Solution:**
Check that plan names in the pricing page match the database:
```sql
SELECT name, display_name FROM subscription_plans WHERE is_active = true;
```

Common plan names:
- `free`
- `starter`
- `professional`
- `enterprise`

### 5. Network/CORS Issues

**Symptoms:**
- Error mentions "Network error" or "Failed to fetch"
- Happens intermittently

**Solution:**
- Check internet connection
- Verify API endpoint is accessible
- Check browser network tab for failed requests

---

## Improved Error Handling

The code has been updated with better error handling:

### Before:
```typescript
catch (error) {
  console.error('Checkout error:', error);
  alert('Failed to start checkout. Please try again.');
}
```

### After:
```typescript
catch (error) {
  console.error('Checkout error:', error);
  const errorMessage = error instanceof Error 
    ? error.message 
    : 'Failed to start checkout. Please try again.';
  alert(errorMessage);
  setProcessingPlan(null);
  
  // Clear pending plan to prevent retry loops
  sessionStorage.removeItem('pending_plan');
}
```

Now users will see the actual error message instead of a generic one.

---

## Testing the Fix

### Test 1: Fresh Signup Flow
1. Clear browser data (Ctrl+Shift+Delete)
2. Visit `/pricing`
3. Select a plan
4. Complete signup
5. Should auto-resume checkout
6. If error occurs, check console for specific message

### Test 2: Existing User Flow
1. Log in with existing account
2. Visit `/pricing`
3. Select a plan
4. Should create checkout immediately
5. If error occurs, check console for specific message

### Test 3: Session Expiration
1. Log in
2. Wait for session to expire (or manually delete auth token)
3. Try to select a plan
4. Should redirect to login
5. After login, should resume checkout

---

## Debug Mode

To enable detailed logging, add this to your browser console:

```javascript
// Enable debug mode
localStorage.setItem('debug_checkout', 'true');

// Then try checkout again and check console for detailed logs
```

---

## API Endpoint Check

The checkout flow calls this endpoint:
```
POST /api/payments/create-checkout
```

### Expected Request:
```json
{
  "planName": "professional",
  "billingCycle": "monthly",
  "currency": "USD"
}
```

### Expected Response (Success):
```json
{
  "success": true,
  "payment_url": "https://pay.tranzak.net/...",
  "transaction_id": "uuid",
  "request_id": "tranzak_request_id"
}
```

### Expected Response (Error):
```json
{
  "error": "Specific error message"
}
```

---

## Prevention Measures

### 1. Auto-Clear Pending Plans on Error
The code now automatically clears `pending_plan` from sessionStorage when an error occurs, preventing infinite retry loops.

### 2. Better Logging
Added console.log for auto-resume:
```typescript
console.log('Auto-resuming checkout for plan:', planName);
```

### 3. Session Validation
The code now checks for valid session before attempting checkout:
```typescript
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // Redirect to login
}
```

---

## Still Having Issues?

### 1. Check Supabase Dashboard
- Go to Supabase Dashboard
- Check Authentication → Users (is user created?)
- Check Database → tutors table (is tutor profile created?)
- Check Database → subscription_plans (are plans active?)

### 2. Check Network Tab
- Open DevTools → Network tab
- Try checkout again
- Look for failed requests (red)
- Click on failed request to see details

### 3. Check Server Logs
If running locally:
- Check terminal where `npm run dev` is running
- Look for error messages
- Check for API route errors

### 4. Test with Different Plan
- Try selecting the FREE plan (should redirect to dashboard)
- Try a different paid plan
- This helps identify if it's plan-specific

---

## Contact Support

If none of the above solutions work, provide this information:

1. **Error Message**: (from browser console)
2. **User Email**: (for account lookup)
3. **Plan Selected**: (which plan caused the error)
4. **Browser**: (Chrome, Firefox, etc.)
5. **Steps to Reproduce**: (what you did before the error)
6. **Diagnostic Output**: (from `node scripts/diagnose-checkout-error.js`)

---

## Summary

The "Failed to start checkout" error has been improved with:

✅ Better error messages (shows actual error instead of generic message)
✅ Auto-clear pending plans on error (prevents retry loops)
✅ Better logging (console.log for debugging)
✅ Diagnostic script (quick health check)
✅ This troubleshooting guide

Most common cause is missing Tranzak API credentials. Run the diagnostic script to identify the specific issue.
