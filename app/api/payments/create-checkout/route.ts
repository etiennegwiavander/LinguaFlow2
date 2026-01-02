// Create Tranzak payment checkout session
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { tranzakClient } from '@/lib/tranzak-client';
import type { SubscriptionPlanName } from '@/types/subscription';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { planName, billingCycle, currency } = await request.json();

    // Validate input
    if (!planName || !billingCycle || !currency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Get tutor profile
    const { data: tutor, error: tutorError } = await supabase
      .from('tutors')
      .select('id, email, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (tutorError || !tutor) {
      return NextResponse.json(
        { error: 'Tutor profile not found' },
        { status: 404 }
      );
    }

    // Get subscription plan
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', planName)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      );
    }

    // Calculate amount based on billing cycle and currency
    let amount: number;
    if (billingCycle === 'annual') {
      amount = currency === 'XAF' ? plan.annual_price_xaf : plan.annual_price_usd;
    } else {
      amount = currency === 'XAF' ? plan.price_xaf : plan.price_usd;
    }

    // Free plan doesn't require payment
    if (amount === 0) {
      return NextResponse.json(
        { error: 'Free plan does not require payment' },
        { status: 400 }
      );
    }

    // Create payment transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        tutor_id: tutor.id,
        amount,
        currency,
        status: 'pending',
        metadata: {
          plan_name: planName,
          billing_cycle: billingCycle,
        },
      })
      .select()
      .single();

    if (transactionError || !transaction) {
      console.error('Failed to create transaction:', transactionError);
      return NextResponse.json(
        { error: 'Failed to create payment transaction' },
        { status: 500 }
      );
    }

    // Create Tranzak payment request
    const paymentRequest = {
      amount,
      currency: currency as 'XAF' | 'USD',
      description: `LinguaFlow ${plan.display_name} - ${billingCycle === 'annual' ? 'Annual' : 'Monthly'} Subscription`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://linguaflow.online'}/subscription/success?transaction_id=${transaction.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://linguaflow.online'}/subscription/cancel?transaction_id=${transaction.id}`,
      customer_email: tutor.email,
      customer_name: `${tutor.first_name || ''} ${tutor.last_name || ''}`.trim() || tutor.email,
      metadata: {
        tutor_id: tutor.id,
        transaction_id: transaction.id,
        plan_name: planName,
        billing_cycle: billingCycle,
      },
    };

    const paymentResponse = await tranzakClient.createPayment(paymentRequest);

    if (!paymentResponse.success || !paymentResponse.data) {
      // Update transaction with error
      await supabase
        .from('payment_transactions')
        .update({
          status: 'failed',
          error_message: paymentResponse.error?.message || 'Payment creation failed',
        })
        .eq('id', transaction.id);

      return NextResponse.json(
        { error: paymentResponse.error?.message || 'Failed to create payment' },
        { status: 500 }
      );
    }

    // Update transaction with Tranzak details
    await supabase
      .from('payment_transactions')
      .update({
        tranzak_request_id: paymentResponse.data.request_id,
      })
      .eq('id', transaction.id);

    return NextResponse.json({
      success: true,
      payment_url: paymentResponse.data.payment_url,
      transaction_id: transaction.id,
      request_id: paymentResponse.data.request_id,
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
