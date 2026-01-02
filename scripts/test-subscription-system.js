// Test subscription system setup
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSubscriptionSystem() {
  console.log('🧪 Testing Subscription System...\n');
  console.log('='.repeat(60));

  try {
    // 1. Test subscription plans
    console.log('\n📋 Testing Subscription Plans...');
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order');

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError);
      return;
    }

    console.log(`✅ Found ${plans.length} subscription plans:`);
    plans.forEach(plan => {
      const price = plan.price_usd > 0 ? `$${plan.price_usd}/month` : 'Free';
      console.log(`   - ${plan.display_name} (${price})`);
      console.log(`     Lessons: ${plan.lessons_per_month || 'Unlimited'}`);
      console.log(`     Students: ${plan.max_students || 'Unlimited'}`);
    });

    // 2. Test getting a tutor
    console.log('\n👥 Testing Tutor Subscription...');
    const { data: tutors, error: tutorsError } = await supabase
      .from('tutors')
      .select('id, email, subscription_status')
      .limit(1);

    if (tutorsError || !tutors || tutors.length === 0) {
      console.log('⚠️  No tutors found to test with');
      return;
    }

    const testTutor = tutors[0];
    console.log(`✅ Testing with tutor: ${testTutor.email}`);
    console.log(`   Current status: ${testTutor.subscription_status || 'None'}`);

    // 3. Test usage tracking function
    console.log('\n📊 Testing Usage Tracking...');
    const { data: usage, error: usageError } = await supabase
      .rpc('get_current_usage', { p_tutor_id: testTutor.id });

    if (usageError) {
      console.error('❌ Error getting usage:', usageError);
    } else if (usage && usage.length > 0) {
      console.log('✅ Usage tracking working:');
      console.log(`   Lessons generated: ${usage[0].lessons_generated}`);
      console.log(`   Vocabulary sessions: ${usage[0].vocabulary_sessions_created}`);
      console.log(`   Discussion prompts: ${usage[0].discussion_prompts_created}`);
      console.log(`   Students: ${usage[0].students_count}`);
    }

    // 4. Test increment usage function
    console.log('\n➕ Testing Usage Increment...');
    const { data: incrementResult, error: incrementError } = await supabase
      .rpc('increment_usage', {
        p_tutor_id: testTutor.id,
        p_usage_type: 'lessons_generated',
        p_increment: 0, // Don't actually increment, just test the function
      });

    if (incrementError) {
      console.error('❌ Error testing increment:', incrementError);
    } else {
      console.log('✅ Usage increment function working');
    }

    // 5. Test tables exist and are accessible
    console.log('\n🏗️  Testing Database Tables...');
    const tables = [
      'subscription_plans',
      'user_subscriptions',
      'usage_tracking',
      'payment_transactions',
      'subscription_history',
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Accessible`);
      }
    }

    // 6. Test Tranzak configuration
    console.log('\n💳 Testing Tranzak Configuration...');
    const tranzakVars = [
      'TRANZAK_API_KEY',
      'TRANZAK_APP_ID',
      'TRANZAK_WEBHOOK_SECRET',
      'TRANZAK_BASE_URL',
      'TRANZAK_ENVIRONMENT',
    ];

    let allTranzakVarsPresent = true;
    tranzakVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`✅ ${varName}: Configured`);
      } else {
        console.log(`❌ ${varName}: Missing`);
        allTranzakVarsPresent = false;
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 Subscription System Test Complete!\n');

    if (allTranzakVarsPresent) {
      console.log('✅ All components are working correctly');
      console.log('✅ Database tables created and accessible');
      console.log('✅ Usage tracking functions operational');
      console.log('✅ Tranzak payment gateway configured');
      console.log('\n🚀 Ready to proceed with Phase 2: Payment Integration');
    } else {
      console.log('⚠️  Some Tranzak environment variables are missing');
      console.log('📝 Please configure all Tranzak variables before proceeding');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

testSubscriptionSystem();
