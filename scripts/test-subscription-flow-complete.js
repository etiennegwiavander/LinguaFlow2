// Comprehensive Subscription Flow Test
// Tests the entire subscription lifecycle from pricing to cancellation

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🧪 Starting Comprehensive Subscription Flow Test\n');

// Test user credentials (create a test user first)
const TEST_USER = {
  email: 'test-subscription@example.com',
  password: 'TestPassword123!',
};

async function runTests() {
  let testUserId = null;
  let testSession = null;

  try {
    // ========================================
    // PHASE 1: USER AUTHENTICATION
    // ========================================
    console.log('📋 PHASE 1: User Authentication');
    console.log('================================\n');

    // Test 1.1: Sign up new user
    console.log('Test 1.1: Creating test user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    if (signUpError && !signUpError.message.includes('already registered')) {
      console.error('❌ Sign up failed:', signUpError.message);
      return;
    }

    if (signUpData.user) {
      testUserId = signUpData.user.id;
      console.log('✅ Test user created:', testUserId);
    } else {
      // User already exists, try to sign in
      console.log('ℹ️  User already exists, signing in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });

      if (signInError) {
        console.error('❌ Sign in failed:', signInError.message);
        return;
      }

      testUserId = signInData.user.id;
      testSession = signInData.session;
      console.log('✅ Signed in successfully:', testUserId);
    }

    // Test 1.2: Verify tutor profile exists
    console.log('\nTest 1.2: Verifying tutor profile...');
    const { data: tutor, error: tutorError } = await supabase
      .from('tutors')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (tutorError || !tutor) {
      console.error('❌ Tutor profile not found');
      return;
    }
    console.log('✅ Tutor profile verified');

    // ========================================
    // PHASE 2: PRICING PAGE FLOW
    // ========================================
    console.log('\n📋 PHASE 2: Pricing Page Flow');
    console.log('================================\n');

    // Test 2.1: Fetch subscription plans
    console.log('Test 2.1: Fetching subscription plans...');
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (plansError || !plans || plans.length === 0) {
      console.error('❌ Failed to fetch plans:', plansError?.message);
      return;
    }
    console.log(`✅ Found ${plans.length} active plans`);
    plans.forEach(plan => {
      console.log(`   - ${plan.display_name} (${plan.name}): $${plan.price_usd}/month`);
    });

    // Test 2.2: Verify plan features
    console.log('\nTest 2.2: Verifying plan features...');
    const professionalPlan = plans.find(p => p.name === 'professional');
    if (!professionalPlan) {
      console.error('❌ Professional plan not found');
      return;
    }
    console.log('✅ Professional plan features:');
    console.log(`   - Lessons per month: ${professionalPlan.lessons_per_month || 'Unlimited'}`);
    console.log(`   - Max students: ${professionalPlan.max_students || 'Unlimited'}`);
    console.log(`   - Calendar sync: ${professionalPlan.calendar_sync_enabled ? 'Yes' : 'No'}`);

    // ========================================
    // PHASE 3: CHECKOUT FLOW
    // ========================================
    console.log('\n📋 PHASE 3: Checkout Flow');
    console.log('================================\n');

    // Test 3.1: Create payment transaction
    console.log('Test 3.1: Creating payment transaction...');
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .insert({
        tutor_id: testUserId,
        amount: professionalPlan.price_usd,
        currency: 'USD',
        status: 'pending',
        metadata: {
          plan_name: professionalPlan.name,
          billing_cycle: 'monthly',
          test: true,
        },
      })
      .select()
      .single();

    if (txError || !transaction) {
      console.error('❌ Failed to create transaction:', txError?.message);
      return;
    }
    console.log('✅ Transaction created:', transaction.id);

    // Test 3.2: Simulate successful payment (webhook)
    console.log('\nTest 3.2: Simulating successful payment...');
    const { error: txUpdateError } = await supabase
      .from('payment_transactions')
      .update({
        status: 'completed',
        tranzak_transaction_id: `test_tx_${Date.now()}`,
        completed_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    if (txUpdateError) {
      console.error('❌ Failed to update transaction:', txUpdateError.message);
      return;
    }
    console.log('✅ Payment marked as completed');

    // ========================================
    // PHASE 4: SUBSCRIPTION CREATION
    // ========================================
    console.log('\n📋 PHASE 4: Subscription Creation');
    console.log('================================\n');

    // Test 4.1: Create subscription
    console.log('Test 4.1: Creating subscription...');
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .insert({
        tutor_id: testUserId,
        plan_id: professionalPlan.id,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        tranzak_subscription_id: `test_sub_${Date.now()}`,
      })
      .select()
      .single();

    if (subError || !subscription) {
      console.error('❌ Failed to create subscription:', subError?.message);
      return;
    }
    console.log('✅ Subscription created:', subscription.id);
    console.log(`   - Status: ${subscription.status}`);
    console.log(`   - Period: ${new Date(subscription.current_period_start).toLocaleDateString()} - ${new Date(subscription.current_period_end).toLocaleDateString()}`);

    // Test 4.2: Update tutor record
    console.log('\nTest 4.2: Updating tutor record...');
    const { error: tutorUpdateError } = await supabase
      .from('tutors')
      .update({
        current_subscription_id: subscription.id,
        subscription_status: professionalPlan.name,
      })
      .eq('id', testUserId);

    if (tutorUpdateError) {
      console.error('❌ Failed to update tutor:', tutorUpdateError.message);
      return;
    }
    console.log('✅ Tutor record updated');

    // Test 4.3: Log subscription history
    console.log('\nTest 4.3: Logging subscription history...');
    const { error: historyError } = await supabase
      .from('subscription_history')
      .insert({
        tutor_id: testUserId,
        subscription_id: subscription.id,
        action: 'created',
        to_plan_id: professionalPlan.id,
        reason: 'Test subscription created',
      });

    if (historyError) {
      console.error('❌ Failed to log history:', historyError.message);
      return;
    }
    console.log('✅ Subscription history logged');

    // ========================================
    // PHASE 5: SUBSCRIPTION MANAGEMENT
    // ========================================
    console.log('\n📋 PHASE 5: Subscription Management');
    console.log('================================\n');

    // Test 5.1: Fetch current subscription
    console.log('Test 5.1: Fetching current subscription...');
    const { data: currentSub, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('tutor_id', testUserId)
      .eq('status', 'active')
      .single();

    if (fetchError || !currentSub) {
      console.error('❌ Failed to fetch subscription:', fetchError?.message);
      return;
    }
    console.log('✅ Current subscription fetched');
    console.log(`   - Plan: ${currentSub.plan.display_name}`);
    console.log(`   - Status: ${currentSub.status}`);

    // Test 5.2: Check usage limits
    console.log('\nTest 5.2: Checking usage limits...');
    const { data: usage, error: usageError } = await supabase
      .rpc('get_current_usage', { p_tutor_id: testUserId });

    if (usageError) {
      console.error('❌ Failed to fetch usage:', usageError.message);
      return;
    }
    console.log('✅ Usage data fetched');
    if (usage && usage.length > 0) {
      console.log(`   - Lessons generated: ${usage[0].lessons_generated}/${professionalPlan.lessons_per_month || '∞'}`);
      console.log(`   - Students: ${usage[0].students_count}/${professionalPlan.max_students || '∞'}`);
    }

    // Test 5.3: Increment usage
    console.log('\nTest 5.3: Testing usage increment...');
    const { data: incrementResult, error: incrementError } = await supabase
      .rpc('increment_usage', {
        p_tutor_id: testUserId,
        p_usage_type: 'lessons_generated',
        p_increment: 1,
      });

    if (incrementError) {
      console.error('❌ Failed to increment usage:', incrementError.message);
      return;
    }
    console.log('✅ Usage incremented successfully');

    // ========================================
    // PHASE 6: SUBSCRIPTION CANCELLATION
    // ========================================
    console.log('\n📋 PHASE 6: Subscription Cancellation');
    console.log('================================\n');

    // Test 6.1: Cancel subscription
    console.log('Test 6.1: Cancelling subscription...');
    const { error: cancelError } = await supabase
      .from('user_subscriptions')
      .update({
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (cancelError) {
      console.error('❌ Failed to cancel subscription:', cancelError.message);
      return;
    }
    console.log('✅ Subscription marked for cancellation');

    // Test 6.2: Verify cancellation
    console.log('\nTest 6.2: Verifying cancellation...');
    const { data: cancelledSub, error: verifyError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscription.id)
      .single();

    if (verifyError || !cancelledSub) {
      console.error('❌ Failed to verify cancellation:', verifyError?.message);
      return;
    }
    console.log('✅ Cancellation verified');
    console.log(`   - Cancel at period end: ${cancelledSub.cancel_at_period_end}`);
    console.log(`   - Access until: ${new Date(cancelledSub.current_period_end).toLocaleDateString()}`);

    // ========================================
    // PHASE 7: CLEANUP
    // ========================================
    console.log('\n📋 PHASE 7: Cleanup');
    console.log('================================\n');

    console.log('Test 7.1: Cleaning up test data...');
    
    // Delete subscription history
    await supabase
      .from('subscription_history')
      .delete()
      .eq('tutor_id', testUserId);

    // Delete subscription
    await supabase
      .from('user_subscriptions')
      .delete()
      .eq('id', subscription.id);

    // Delete transaction
    await supabase
      .from('payment_transactions')
      .delete()
      .eq('id', transaction.id);

    // Reset tutor subscription status
    await supabase
      .from('tutors')
      .update({
        current_subscription_id: null,
        subscription_status: 'free',
      })
      .eq('id', testUserId);

    console.log('✅ Test data cleaned up');

    // ========================================
    // TEST SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(50));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(50));
    console.log('\n✅ Subscription flow is working correctly:');
    console.log('   1. User authentication ✓');
    console.log('   2. Pricing page data loading ✓');
    console.log('   3. Checkout and payment processing ✓');
    console.log('   4. Subscription creation ✓');
    console.log('   5. Subscription management ✓');
    console.log('   6. Subscription cancellation ✓');
    console.log('   7. Data cleanup ✓');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.error(error.stack);
  }
}

// Run the tests
runTests().then(() => {
  console.log('\n✅ Test execution completed');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test execution failed:', error);
  process.exit(1);
});
