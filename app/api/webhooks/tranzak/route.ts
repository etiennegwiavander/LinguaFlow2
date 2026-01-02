// Tranzak webhook handler for payment notifications
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { tranzakClient } from '@/lib/tranzak-client';
import { SubscriptionService } from '@/lib/subscription-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-tranzak-signature') || '';

    // Verify webhook signature
    const isValid = tranzakClient.verifyWebhookSignature(body, signature);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const webhook = tranzakClient.parseWebhook(body);
    if (!webhook) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    console.log('Tranzak webhook received:', webhook.event);

    // Get transaction from database
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('tranzak_request_id', webhook.data.request_id)
      .single();

    if (txError || !transaction) {
      console.error('Transaction not found:', webhook.data.request_id);
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Handle different webhook events
    switch (webhook.event) {
      case 'payment.success':
        await handlePaymentSuccess(transaction, webhook.data);
        break;

      case 'payment.failed':
        await handlePaymentFailed(transaction, webhook.data);
        break;

      case 'payment.pending':
        await handlePaymentPending(transaction, webhook.data);
        break;

      default:
        console.log('Unhandled webhook event:', webhook.event);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(transaction: any, webhookData: any) {
  console.log('Processing successful payment:', transaction.id);

  try {
    // Update transaction status
    await supabase
      .from('payment_transactions')
      .update({
        status: 'completed',
        tranzak_transaction_id: webhookData.transaction_id,
        payment_method: webhookData.payment_method,
        completed_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    // Get plan details from transaction metadata
    const planName = transaction.metadata?.plan_name;
    const billingCycle = transaction.metadata?.billing_cycle || 'monthly';

    if (!planName) {
      console.error('Plan name not found in transaction metadata');
      return;
    }

    // Create or update subscription
    const existingSubscription = await SubscriptionService.getTutorSubscription(transaction.tutor_id);

    if (existingSubscription) {
      // Upgrade/change existing subscription
      await SubscriptionService.changeSubscription(transaction.tutor_id, planName);
    } else {
      // Create new subscription
      await SubscriptionService.createSubscription(
        transaction.tutor_id,
        planName,
        webhookData.transaction_id
      );
    }

    // Update transaction with subscription link
    const newSubscription = await SubscriptionService.getTutorSubscription(transaction.tutor_id);
    if (newSubscription) {
      await supabase
        .from('payment_transactions')
        .update({
          subscription_id: newSubscription.subscription.id,
        })
        .eq('id', transaction.id);
    }

    console.log('Payment processed successfully for tutor:', transaction.tutor_id);

    // TODO: Send confirmation email to tutor

  } catch (error) {
    console.error('Error processing successful payment:', error);
    throw error;
  }
}

async function handlePaymentFailed(transaction: any, webhookData: any) {
  console.log('Processing failed payment:', transaction.id);

  try {
    await supabase
      .from('payment_transactions')
      .update({
        status: 'failed',
        tranzak_transaction_id: webhookData.transaction_id,
        error_message: 'Payment failed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    console.log('Payment failure recorded for tutor:', transaction.tutor_id);

    // TODO: Send failure notification email

  } catch (error) {
    console.error('Error processing failed payment:', error);
    throw error;
  }
}

async function handlePaymentPending(transaction: any, webhookData: any) {
  console.log('Processing pending payment:', transaction.id);

  try {
    await supabase
      .from('payment_transactions')
      .update({
        status: 'pending',
        tranzak_transaction_id: webhookData.transaction_id,
      })
      .eq('id', transaction.id);

    console.log('Payment pending status updated for tutor:', transaction.tutor_id);

  } catch (error) {
    console.error('Error processing pending payment:', error);
    throw error;
  }
}
