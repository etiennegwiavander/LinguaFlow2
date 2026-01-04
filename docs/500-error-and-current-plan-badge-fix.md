# 500 Error & Current Plan Badge Fix

## Issues Fixed

### Issue 1: 500 Internal Server Error ✅
**Error**: `POST http://localhost:3000/api/payments/create-checkout/ 500 (Internal Server Error)`

**Root Cause**: The Tranzak client was throwing an error, but the error details weren't being logged or returned to the client.

**Solution**: Improved error logging and error message return in the API route.

**Changes Made**:
```typescript
// app/api/payments/create-checkout/route.ts
catch (error) {
  console.error('Checkout error:', error);
  // Log more details for debugging
  console.error('Error details:', {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  });
  
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Internal server error' },
    { status: 500 }
  );
}
```

**Result**: Now you'll see the actual error message instead of generic "fetch failed".

### Issue 2: Missing "Current Plan" Badge ✅
**Problem**: No indicator on pricing page showing which plan the user is currently on.

**Solution**: Added "Current Plan" badge and disabled button for current plan.

**Changes Made**:

1. **Added state to track current plan**:
```typescript
const [currentPlanName, setCurrentPlanName] = useState<string>('free');
```

2. **Fetch current plan on page load**:
```typescript
const fetchCurrentPlan = useCallback(async () => {
  if (!user) return;
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const response = await fetch('/api/subscription/current', {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    setCurrentPlanName(data.plan.name);
  }
}, [user]);
```

3. **Added "Current Plan" badge**:
```typescript
const isCurrentPlan = user && plan.name === currentPlanName;

{isCurrentPlan && (
  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
    <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-medium">
      Current Plan
    </span>
  </div>
)}
```

4. **Updated button for current plan**:
```typescript
<button
  disabled={isProcessing || Boolean(isCurrentPlan)}
  className={`${
    isCurrentPlan
      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
      : // ... other styles
  }`}
>
  {isCurrentPlan ? 'Current Plan' : 'Get Started'}
</button>
```

5. **Added emerald ring to current plan card**:
```typescript
className={`relative bg-white rounded-2xl shadow-lg p-8 ${
  isPopular ? 'ring-2 ring-ocean-500 scale-105' : ''
} ${isCurrentPlan ? 'ring-2 ring-emerald-500' : ''}`}
```

## Visual Changes

### Before:
- No indication of current plan
- All plans show "Get Started" button
- User could click on their current plan

### After:
- ✅ "Current Plan" badge (emerald green) on active plan
- ✅ Emerald ring around current plan card
- ✅ Button shows "Current Plan" and is disabled
- ✅ "Most Popular" badge only shows if not current plan

## Testing

### Test 1: Check Error Message
1. Try to upgrade plan
2. If error occurs, check browser console
3. You should now see the specific error message
4. Check terminal logs for detailed error stack

### Test 2: Current Plan Badge
1. Log in with existing account
2. Visit `/pricing`
3. Your current plan should have:
   - ✅ "Current Plan" badge at top
   - ✅ Emerald ring around card
   - ✅ Disabled button showing "Current Plan"
4. Other plans should show "Get Started"

### Test 3: Free Plan User
1. Log in with free plan account
2. Visit `/pricing`
3. Free plan card should show "Current Plan"
4. Paid plans should show "Get Started"

## Debugging the 500 Error

The 500 error is most likely caused by one of these:

### 1. Missing Tranzak Credentials
Check your `.env.local`:
```bash
TRANZAK_API_KEY=your_key
TRANZAK_APP_ID=your_app_id
TRANZAK_BASE_URL=https://api.tranzak.net/v1
TRANZAK_ENVIRONMENT=sandbox
```

### 2. Tranzak API Error
The error message will now show the specific Tranzak error. Common errors:
- Invalid API credentials
- Invalid currency
- Invalid amount
- Network connectivity issues

### 3. Database Error
Check if:
- `payment_transactions` table exists
- User has permission to insert
- All required fields are provided

## Next Steps

1. **Check Terminal Logs**: Look for the detailed error message
2. **Check Browser Console**: See the specific error returned
3. **Verify Tranzak Setup**: Ensure credentials are correct
4. **Test with Different Plan**: Try starter, professional, enterprise

## Files Modified

1. ✅ `app/api/payments/create-checkout/route.ts`
   - Better error logging
   - Return actual error message

2. ✅ `app/pricing/page.tsx`
   - Added current plan state
   - Fetch current plan on load
   - Show "Current Plan" badge
   - Disable button for current plan
   - Add emerald ring to current plan card

## Summary

✅ **500 Error**: Now shows actual error message for easier debugging
✅ **Current Plan Badge**: Clear visual indicator of user's active plan
✅ **Better UX**: Users can't accidentally click on their current plan
✅ **Visual Hierarchy**: Current plan stands out with emerald color

The pricing page now provides clear feedback about the user's current subscription status!
