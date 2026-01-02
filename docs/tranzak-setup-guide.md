# Tranzak Integration Setup Guide
## Complete Configuration Instructions

**Date**: January 2, 2026  
**Purpose**: Step-by-step guide to set up Tranzak payment integration

---

## Understanding the Requirements

### 1. Callback URL (Webhook URL)

**What is it?**
A callback URL is an endpoint on YOUR server that Tranzak will call to notify you about payment status changes.

**Your Callback URL will be:**
```
https://linguaflow.online/api/webhooks/tranzak
```

**How it works:**
1. User makes payment on Tranzak's page
2. Tranzak processes the payment
3. Tranzak sends a POST request to your callback URL
4. Your server receives the notification and updates subscription status

**You need to CREATE this endpoint** - it doesn't exist yet. This is part of the implementation.

---

### 2. SSL Certificate

**Good News**: ✅ **YOU ALREADY HAVE IT!**

**Why?**
Your site is already running on `https://linguaflow.online` - that "https" means you already have an SSL certificate.

**Where did it come from?**
Since you're deployed on Netlify (based on your `netlify.toml` file), Netlify automatically provides FREE SSL certificates via Let's Encrypt for all custom domains.

**How to verify:**
1. Visit https://linguaflow.online in your browser
2. Click the padlock icon in the address bar
3. Click "Certificate" or "Connection is secure"
4. You'll see your SSL certificate details

**For Tranzak:**
You don't need to "provide" an SSL certificate to Tranzak. They just need to know that your webhook URL uses HTTPS (which it does).

---

## Step-by-Step Tranzak Setup

### Step 1: Create Tranzak Account

1. Go to https://tranzak.net
2. Click "Sign Up" or "Create Account"
3. Choose "Business Account" or "Merchant Account"
4. Fill in your business details:
   - Business Name: LinguaFlow
   - Business Type: SaaS / Software
   - Country: [Your country]
   - Email: [Your business email]
   - Phone: [Your business phone]

### Step 2: Complete KYC (Know Your Customer)

Tranzak will require:
- Business registration documents (if applicable)
- ID verification
- Bank account details for payouts
- Business address

**Note**: This process may take 1-3 business days for approval.

### Step 3: Get API Credentials

Once approved, log into Tranzak dashboard:

1. Navigate to **Settings** or **API Settings**
2. You'll find:
   - **API Key** (also called Secret Key)
   - **App ID** (also called Merchant ID or Public Key)
   - **Webhook Secret** (for verifying webhook signatures)

3. Copy these values - you'll need them for your `.env` file

### Step 4: Configure Webhook URL

In Tranzak dashboard:

1. Go to **Webhooks** or **Notifications** section
2. Click **Add Webhook** or **Configure Webhook**
3. Enter your callback URL:
   ```
   https://linguaflow.online/api/webhooks/tranzak
   ```
4. Select events to receive:
   - ✅ Payment Successful
   - ✅ Payment Failed
   - ✅ Payment Pending
   - ✅ Refund Processed
   - ✅ Subscription Created
   - ✅ Subscription Cancelled

5. Save the webhook configuration

**Important**: The webhook URL won't work until you implement the endpoint (Step 5).

### Step 5: Implement Webhook Endpoint

Create the file `app/api/webhooks/tranzak/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Get webhook signature from headers
    const signature = req.headers.get('x-tranzak-signature');
    const webhookSecret = process.env.TRANZAK_WEBHOOK_SECRET;

    // Get request body
    const body = await req.json();

    // Verify webhook signature (security)
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Log webhook for debugging
    console.log('Tranzak webhook received:', body);

    // Process based on event type
    switch (body.event) {
      case 'payment.successful':
        await handlePaymentSuccess(body.data);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(body.data);
        break;
      
      case 'subscription.created':
        await handleSubscriptionCreated(body.data);
        break;
      
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(body.data);
        break;
      
      default:
        console.log('Unhandled event type:', body.event);
    }

    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    // Still return 200 to prevent Tranzak from retrying
    return NextResponse.json({ error: 'Internal error' }, { status: 200 });
  }
}

// Verify webhook signature
function verifyWebhookSignature(
  payload: any,
  signature: string | null,
  secret: string | undefined
): boolean {
  if (!signature || !secret) return false;
  
  // Tranzak typically uses HMAC SHA256
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === expectedSignature;
}

// Handle successful payment
async function handlePaymentSuccess(data: any) {
  const { transaction_id, tutor_id, subscription_id, amount } = data;

  // Update payment transaction
  await supabase
    .from('payment_transactions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      metadata: data
    })
    .eq('tranzak_transaction_id', transaction_id);

  // Activate subscription
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('id', subscription_id);

  // Send confirmation email
  // await sendPaymentConfirmationEmail(tutor_id, amount);
}

// Handle failed payment
async function handlePaymentFailed(data: any) {
  const { transaction_id, subscription_id } = data;

  // Update payment transaction
  await supabase
    .from('payment_transactions')
    .update({
      status: 'failed',
      error_message: data.error_message,
      updated_at: new Date().toISOString()
    })
    .eq('tranzak_transaction_id', transaction_id);

  // Mark subscription as past_due
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('id', subscription_id);
}

// Handle subscription created
async function handleSubscriptionCreated(data: any) {
  // Log subscription creation
  console.log('Subscription created:', data);
}

// Handle subscription cancelled
async function handleSubscriptionCancelled(data: any) {
  const { subscription_id } = data;

  await supabase
    .from('user_subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('tranzak_subscription_id', subscription_id);
}
```

### Step 6: Update Environment Variables

Add to your `.env.local` file:

```env
# Tranzak Configuration
TRANZAK_API_KEY=your_api_key_here
TRANZAK_APP_ID=your_app_id_here
TRANZAK_WEBHOOK_SECRET=your_webhook_secret_here
TRANZAK_BASE_URL=https://api.tranzak.net/v1
TRANZAK_ENVIRONMENT=sandbox  # Change to 'production' when ready
```

**For production (Netlify):**
1. Go to Netlify dashboard
2. Select your LinguaFlow site
3. Go to **Site settings** → **Environment variables**
4. Add each variable above

### Step 7: Test Webhook Locally

**Problem**: Tranzak can't reach `localhost` for testing.

**Solution**: Use a tunneling service like ngrok:

1. Install ngrok:
   ```bash
   # Download from https://ngrok.com/download
   # Or use chocolatey on Windows:
   choco install ngrok
   ```

2. Start your local server:
   ```bash
   npm run dev
   ```

3. In another terminal, start ngrok:
   ```bash
   ngrok http 3000
   ```

4. ngrok will give you a public URL like:
   ```
   https://abc123.ngrok.io
   ```

5. Use this for testing in Tranzak dashboard:
   ```
   https://abc123.ngrok.io/api/webhooks/tranzak
   ```

6. Make a test payment in Tranzak sandbox
7. Check your terminal for webhook logs

### Step 8: Deploy to Production

1. Commit your webhook endpoint code:
   ```bash
   git add app/api/webhooks/tranzak/route.ts
   git commit -m "Add Tranzak webhook endpoint"
   git push
   ```

2. Netlify will auto-deploy

3. Update Tranzak webhook URL to production:
   ```
   https://linguaflow.online/api/webhooks/tranzak
   ```

4. Change environment to production:
   ```env
   TRANZAK_ENVIRONMENT=production
   ```

---

## Testing Checklist

### Sandbox Testing

- [ ] Tranzak account created and approved
- [ ] API credentials obtained
- [ ] Webhook URL configured in Tranzak
- [ ] Webhook endpoint implemented
- [ ] Environment variables set
- [ ] Test payment successful
- [ ] Webhook received and processed
- [ ] Subscription activated correctly
- [ ] Test payment failure scenario
- [ ] Test subscription cancellation

### Production Testing

- [ ] Production API credentials obtained
- [ ] Production webhook URL configured
- [ ] Environment variables updated on Netlify
- [ ] Small test payment ($1-2)
- [ ] Webhook received in production
- [ ] Subscription activated
- [ ] User can access paid features
- [ ] Refund process tested

---

## Common Issues & Solutions

### Issue 1: Webhook Not Receiving Calls

**Symptoms**: Tranzak says webhook sent, but you don't see it

**Solutions**:
1. Check webhook URL is correct (no typos)
2. Ensure endpoint returns 200 status
3. Check Netlify function logs
4. Verify SSL certificate is valid
5. Check firewall/security settings

### Issue 2: Signature Verification Fails

**Symptoms**: Webhook received but signature invalid

**Solutions**:
1. Verify webhook secret is correct
2. Check signature algorithm (HMAC SHA256)
3. Ensure payload is not modified before verification
4. Check Tranzak documentation for signature format

### Issue 3: Payments Succeed but Subscription Not Activated

**Symptoms**: User pays but still on free plan

**Solutions**:
1. Check webhook is being called
2. Verify database updates are working
3. Check for errors in webhook handler
4. Ensure transaction IDs match
5. Check Supabase RLS policies

---

## Security Best Practices

### 1. Always Verify Webhook Signatures
```typescript
// Never trust webhook data without verification
if (!verifyWebhookSignature(body, signature, secret)) {
  return NextResponse.json({ error: 'Invalid' }, { status: 401 });
}
```

### 2. Use HTTPS Only
```typescript
// Reject non-HTTPS requests in production
if (process.env.NODE_ENV === 'production' && !req.url.startsWith('https')) {
  return NextResponse.json({ error: 'HTTPS required' }, { status: 403 });
}
```

### 3. Log Everything
```typescript
// Log all webhook attempts for audit trail
await supabase.from('webhook_logs').insert({
  source: 'tranzak',
  event: body.event,
  payload: body,
  signature: signature,
  verified: isVerified,
  timestamp: new Date().toISOString()
});
```

### 4. Rate Limiting
```typescript
// Prevent webhook spam
const recentWebhooks = await checkRecentWebhooks(transaction_id);
if (recentWebhooks > 5) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

### 5. Idempotency
```typescript
// Handle duplicate webhooks gracefully
const existing = await supabase
  .from('payment_transactions')
  .select('*')
  .eq('tranzak_transaction_id', transaction_id)
  .single();

if (existing && existing.status === 'completed') {
  // Already processed, return success
  return NextResponse.json({ received: true }, { status: 200 });
}
```

---

## Quick Reference

### Your URLs
- **Production Site**: https://linguaflow.online
- **Webhook Endpoint**: https://linguaflow.online/api/webhooks/tranzak
- **SSL Certificate**: ✅ Automatically provided by Netlify

### Tranzak Resources
- **Dashboard**: https://dashboard.tranzak.net (or similar)
- **Documentation**: https://docs.tranzak.net
- **Support**: support@tranzak.net

### Next Steps
1. ✅ Create Tranzak account
2. ✅ Get API credentials
3. ⏳ Implement webhook endpoint
4. ⏳ Test in sandbox
5. ⏳ Deploy to production
6. ⏳ Test with real payment
7. ⏳ Monitor and optimize

---

## Summary

**Callback URL**: You need to CREATE the endpoint at `/api/webhooks/tranzak` - it's part of your implementation, not something you already have.

**SSL Certificate**: You ALREADY HAVE IT - Netlify provides it automatically for your `linguaflow.online` domain. No action needed.

**What to tell Tranzak**:
- Webhook URL: `https://linguaflow.online/api/webhooks/tranzak`
- SSL: Yes, HTTPS enabled
- Events: All payment and subscription events

Ready to proceed with implementation!
