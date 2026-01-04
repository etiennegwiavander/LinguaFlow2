// Diagnostic script for checkout errors
// Run this to check the checkout flow

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseCheckout() {
  console.log('🔍 Diagnosing Checkout Error\n');

  try {
    // 1. Check if subscription plans exist
    console.log('1. Checking subscription plans...');
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true);

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError.message);
      return;
    }

    if (!plans || plans.length === 0) {
      console.error('❌ No active subscription plans found!');
      console.log('   Run: node scripts/test-subscription-system.js to create plans');
      return;
    }

    console.log(`✅ Found ${plans.length} active plans:`);
    plans.forEach(plan => {
      console.log(`   - ${plan.display_name} (${plan.name}): $${plan.price_usd}/month`);
    });

    // 2. Check environment variables
    console.log('\n2. Checking environment variables...');
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'TRANZAK_API_KEY',
      'TRANZAK_APP_ID',
      'TRANZAK_BASE_URL',
    ];

    let missingVars = [];
    requiredEnvVars.forEach(varName => {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    });

    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:');
      missingVars.forEach(v => console.error(`   - ${v}`));
      return;
    }

    console.log('✅ All required environment variables are set');

    // 3. Check Tranzak configuration
    console.log('\n3. Checking Tranzak configuration...');
    console.log(`   API Key: ${process.env.TRANZAK_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   App ID: ${process.env.TRANZAK_APP_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Base URL: ${process.env.TRANZAK_BASE_URL || 'https://api.tranzak.net/v1'}`);
    console.log(`   Environment: ${process.env.TRANZAK_ENVIRONMENT || 'sandbox'}`);

    // 4. Test database connection
    console.log('\n4. Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('tutors')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection error:', testError.message);
      return;
    }

    console.log('✅ Database connection successful');

    // 5. Check for recent errors in payment_transactions
    console.log('\n5. Checking recent payment transactions...');
    const { data: transactions, error: txError } = await supabase
      .from('payment_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (txError) {
      console.log('⚠️  Could not fetch transactions:', txError.message);
    } else if (transactions && transactions.length > 0) {
      console.log(`Found ${transactions.length} recent transactions:`);
      transactions.forEach(tx => {
        console.log(`   - ${tx.status} | ${tx.amount} ${tx.currency} | ${new Date(tx.created_at).toLocaleString()}`);
        if (tx.error_message) {
          console.log(`     Error: ${tx.error_message}`);
        }
      });
    } else {
      console.log('No transactions found yet');
    }

    console.log('\n✅ Diagnostic complete!');
    console.log('\n📋 Common Issues:');
    console.log('1. Tranzak API credentials not set or invalid');
    console.log('2. User not authenticated (session expired)');
    console.log('3. Plan name mismatch between frontend and database');
    console.log('4. Network connectivity issues');
    console.log('\n💡 Next Steps:');
    console.log('1. Check browser console for detailed error messages');
    console.log('2. Verify Tranzak credentials in .env.local');
    console.log('3. Test with a different plan');
    console.log('4. Check if user session is valid');

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
}

diagnoseCheckout().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
