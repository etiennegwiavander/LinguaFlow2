# Tranzak Credentials Error Fix

## Problem
Getting "fetch failed" error when trying to upgrade plan, with 500 Internal Server Error.

## Root Cause
The Tranzak client was throwing an error in its constructor when credentials were missing:

```typescript
constructor() {
  // ... config setup
  
  if (!this.config.apiKey || !this.config.appId) {
    throw new Error('Tranzak API credentials not configured');
  }
}
```

This error was thrown when the module was imported (before any request was made), causing the entire API route to fail with a 500 error before it could return a proper error message.

## Solution
Moved the credentials check from the constructor to the actual method calls:

```typescript
class TranzakClient {
  constructor() {
    // Just set config, don't throw errors
    this.config = {
      apiKey: process.env.TRANZAK_API_KEY || '',
      appId: process.env.TRANZAK_APP_ID || '',
      // ...
    };
  }

  private checkCredentials(): void {
    if (!this.config.apiKey || !this.config.appId) {
      throw new Error('Tranzak API credentials not configured. Please set TRANZAK_API_KEY and TRANZAK_APP_ID in your environment variables.');
    }
  }

  async createPayment(request: TranzakPaymentRequest) {
    try {
      // Check credentials before making request
      this.checkCredentials();
      // ... rest of method
    } catch (error) {
      // Error is properly caught and returned
    }
  }
}
```

## Result
Now when Tranzak credentials are missing, you'll see a clear error message:
```
"Tranzak API credentials not configured. Please set TRANZAK_API_KEY and TRANZAK_APP_ID in your environment variables."
```

Instead of generic "fetch failed".

## How to Fix

### Step 1: Add Tranzak Credentials
Create or update your `.env.local` file:

```bash
# Tranzak Payment Gateway Credentials
TRANZAK_API_KEY=your_api_key_here
TRANZAK_APP_ID=your_app_id_here
TRANZAK_BASE_URL=https://api.tranzak.net/v1
TRANZAK_ENVIRONMENT=sandbox
TRANZAK_WEBHOOK_SECRET=your_webhook_secret_here
```

### Step 2: Get Credentials from Tranzak
1. Go to [Tranzak Dashboard](https://dashboard.tranzak.net)
2. Sign up or log in
3. Navigate to API Settings
4. Copy your API Key and App ID
5. Paste them into `.env.local`

### Step 3: Restart Dev Server
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### Step 4: Test Again
1. Visit `/pricing`
2. Try to upgrade plan
3. You should now see a clear error message if credentials are still missing
4. Or proceed to Tranzak payment page if credentials are correct

## Testing Without Tranzak

If you want to test the subscription flow without Tranzak credentials, you have two options:

### Option 1: Mock Tranzak Client (Development Only)
Create a mock version for testing:

```typescript
// lib/tranzak-client-mock.ts
export const tranzakClient = {
  async createPayment(request: any) {
    return {
      success: true,
      data: {
        request_id: 'mock_request_id',
        payment_url: 'http://localhost:3000/subscription/success?mock=true',
        amount: request.amount,
        currency: request.currency,
        status: 'pending',
      },
    };
  },
  // ... other methods
};
```

Then in `app/api/payments/create-checkout/route.ts`:
```typescript
// Use mock in development
const tranzakClient = process.env.NODE_ENV === 'development' 
  ? require('@/lib/tranzak-client-mock').tranzakClient
  : require('@/lib/tranzak-client').tranzakClient;
```

### Option 2: Use Tranzak Sandbox
Tranzak provides a sandbox environment for testing:
1. Sign up for Tranzak sandbox account
2. Get sandbox credentials (free)
3. Use sandbox credentials in `.env.local`
4. Test with sandbox payment methods

## Error Messages You'll See

### Before Fix:
```
fetch failed
```

### After Fix (No Credentials):
```
Tranzak API credentials not configured. Please set TRANZAK_API_KEY and TRANZAK_APP_ID in your environment variables.
```

### After Fix (Invalid Credentials):
```
Failed to create payment: Invalid API credentials
```

### After Fix (Network Error):
```
Network error: Failed to connect to Tranzak API
```

## Summary

✅ **Fixed**: Tranzak client no longer throws errors on import
✅ **Improved**: Clear error messages when credentials are missing
✅ **Better UX**: Users see helpful error messages instead of "fetch failed"

The subscription system will now show you exactly what's wrong instead of a generic error!

## Next Steps

1. **Add Tranzak credentials** to `.env.local`
2. **Restart dev server**
3. **Test upgrade flow** - should now work or show clear error
4. **Check terminal logs** - will show detailed error information

If you don't have Tranzak credentials yet, you can:
- Sign up at https://tranzak.net
- Use sandbox mode for testing
- Or implement a mock client for development
