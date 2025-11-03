// Manually trigger the lesson reminder function
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function triggerReminder() {
  console.log('🔔 Manually triggering lesson reminder function...\n');
  
  try {
    const { data, error } = await supabase.functions.invoke('schedule-lesson-reminders', {
      body: {}
    });
    
    if (error) {
      console.error('❌ Error invoking function:', error);
      return;
    }
    
    console.log('✅ Function response:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

triggerReminder().catch(console.error);
