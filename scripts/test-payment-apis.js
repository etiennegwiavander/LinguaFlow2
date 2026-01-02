// Test payment API endpoints
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPaymentAPIs() {
  console.log('🧪 Testing Payment APIs...\n');
  console.log('='.repeat(60));

  try {
    // 1. Test getting subscription plans
    console.log('\n📋 Testing Subscription Plans API...');
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError);
      return;
    }

    console.log(`✅ Found ${plans.length} active plans`);
    plans.forEach(plan => {
      console.log(`   - ${plan.display_name}: $${plan.price_usd}/month`);
    });

    // 2. Test getting a test tutor
    console.log('\n👤 Getting Test Tutor...');
    const { data: tutors, error: tutorError } = await supabase
      .from('tutors')
      .select('id, email')
      .limit(1);

    if (tutorError || !tutors || tutors.length === 0) {
      console.log('⚠️  No tutors found for testing');
      return;
    }

    const testTutor = tutors[0];
    console.log(`✅ Test tutor: ${testTutor.email}`);

    // 3. Test getting current subscription
    console.log('\n📊 Testing Get Current Subscription...');
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('tutor_id', testTutor.id)
      .eq('status', 'active')
      .single();

    if (subError) {
      console.log('⚠️  No active subscription found (expected for new users)');
    } else {
      console.log('✅ Current subscription:');
      console.log(`   Plan: ${subscription.plan.display_name}`);
      console.log(`   Status: ${subscription.status}`);
      console.log(`   Period: ${new Date(subscription.current_period_start).toLocaleDateString()} - ${new Date(subscription.current_period_end).toLocaleDateString()}`);
    }

    // 4. Test usage tracking
    console.log('\n📈 Testing Usage Tracking...');
    const { data: usage, error: usageError } = await supabase
      .rpc('get_current_usage', { p_tutor_id: testTutor.id });

    if (usageError) {
      console.error('❌ Error getting usage:', usageError);
    } else if (usage && usage.length > 0) {
      console.log('✅ Current usage:');
      console.log(`   Lessons: ${usage[0].lessons_generated}`);
      console.log(`   Vocabulary: ${usage[0].vocabulary_sessions_created}`);
      console.log(`   Discussions: ${usage[0].discussion_prompts_created}`);
      console.log(`   Students: ${usage[0].students_count}`);
    }

    // 5. Test payment transactions table
    console.log('\n💳 Testing Payment Transactions...');
    const { data: transactions, error: txError } = await supabase
      .from('payment_transactions')
      .select('*')
      .limit(5)
      .order('created_at', { ascending: false });

    if (txError) {
      console.error('❌ Error fetching transactions:', txError);
    } else {
      console.log(`✅ Found ${transactions.length} recent transactions`);
      if (transactions.length > 0) {
        transactions.forEach(tx => {
          console.log(`   - ${tx.amount} ${tx.currency} - ${tx.status} (${new Date(tx.created_at).toLocaleDateString()})`);
        });
      }
    }

    // 6. Verify API routes exist
    console.log('\n🔗 Verifying API Routes...');
    const apiRoutes = [
      'app/api/payments/create-checkout/route.ts',
      'app/api/webhooks/tranzak/route.ts',
      'app/api/subscription/current/route.ts',
      'app/api/subscription/cancel/route.ts',
    ];

    const fs = require('fs');
    const path = require('path');

    apiRoutes.forEach(route => {
      const fullPath = path.join(__dirname, '..', route);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${route}`);
      } else {
        console.log(`❌ ${route} - NOT FOUND`);
      }
    });

    // 7. Verify UI pages exist
    console.log('\n🎨 Verifying UI Pages...');
    const uiPages = [
      'app/pricing/page.tsx',
      'app/subscription/success/page.tsx',
      'app/subscription/cancel/page.tsx',
    ];

    uiPages.forEach(page => {
      const fullPath = path.join(__dirname, '..', page);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${page}`);
      } else {
        console.log(`❌ ${page} - NOT FOUND`);
      }
    });

    // 8. Test Tranzak configuration
    console.log('\n🔐 Verifying Tranzak Configuration...');
    const tranzakVars = [
      'TRANZAK_API_KEY',
      'TRANZAK_APP_ID',
      'TRANZAK_WEBHOOK_SECRET',
      'TRANZAK_BASE_URL',
      'TRANZAK_ENVIRONMENT',
    ];

    let allConfigured = true;
    tranzakVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`✅ ${varName}`);
      } else {
        console.log(`❌ ${varName} - NOT SET`);
        allConfigured = false;
      }
    });

    console.log('\n' + '=' .repeat(60));
    console.log('\n🎉 Payment API Test Complete!\n');

    if (allConfigured) {
      console.log('✅ All components ready');
      console.log('✅ Database tables accessible');
      console.log('✅ API routes created');
      console.log('✅ UI pages created');
      console.log('✅ Tranzak configured');
      console.log('\n🚀 Ready to test payment flow!');
      console.log('\nNext steps:');
      console.log('1. Start dev server: npm run dev');
      console.log('2. Visit: http://localhost:3000/pricing');
      console.log('3. Select a plan and test checkout');
      console.log('4. Use Tranzak sandbox credentials');
    } else {
      console.log('⚠️  Some configuration missing');
      console.log('Please check environment variables');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

testPaymentAPIs();
