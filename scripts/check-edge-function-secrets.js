/**
 * Script to help diagnose Edge Function secret configuration
 * This creates a simple test function to check if secrets are accessible
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEdgeFunctionSecrets() {
  console.log('🔍 CHECKING EDGE FUNCTION SECRETS');
  console.log('================================\n');

  console.log('📋 Local Environment Check:');
  console.log('   GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('   Value preview:', process.env.GEMINI_API_KEY ? 
    process.env.GEMINI_API_KEY.substring(0, 20) + '...' : 'N/A');
  console.log('');

  console.log('📋 Testing Edge Function Secret Access:');
  console.log('   This will call a simple test to see if the Edge Function');
  console.log('   can access the GEMINI_API_KEY secret.');
  console.log('');

  try {
    // We'll create a minimal test by calling the function with invalid data
    // and checking the error message
    console.log('   Calling generate-lesson-plan with test data...');
    
    const { data, error } = await supabase.functions.invoke('generate-lesson-plan', {
      body: {
        lesson_id: '00000000-0000-0000-0000-000000000000' // Invalid ID to trigger quick error
      }
    });

    if (error) {
      const errorMessage = error.message || JSON.stringify(error);
      
      console.log('   Response received (expected error)');
      console.log('');
      
      // Check for specific error messages that indicate secret issues
      if (errorMessage.includes('GEMINI_API_KEY not configured')) {
        console.log('❌ CRITICAL ISSUE FOUND:');
        console.log('   The Edge Function cannot access GEMINI_API_KEY');
        console.log('');
        console.log('🔧 FIX REQUIRED:');
        console.log('   1. Go to Supabase Dashboard');
        console.log('   2. Navigate to Edge Functions > generate-lesson-plan');
        console.log('   3. Go to Secrets/Environment Variables tab');
        console.log('   4. Add secret:');
        console.log('      Name: GEMINI_API_KEY');
        console.log('      Value: ' + process.env.GEMINI_API_KEY);
        console.log('   5. Save and redeploy the function');
        console.log('');
      } else if (errorMessage.includes('Lesson not found') || 
                 errorMessage.includes('Invalid lesson') ||
                 errorMessage.includes('not found')) {
        console.log('✅ GOOD NEWS:');
        console.log('   The Edge Function is running and can access secrets');
        console.log('   (Error is expected - we used an invalid lesson ID)');
        console.log('');
        console.log('   If you\'re still seeing fallback content, the issue might be:');
        console.log('   - API rate limiting');
        console.log('   - Invalid API key');
        console.log('   - API quota exceeded');
        console.log('');
        console.log('   Run: node scripts/test-gemini-api-direct.js');
        console.log('   to verify the API key works');
      } else {
        console.log('⚠️  Unexpected error:');
        console.log('   ', errorMessage);
        console.log('');
        console.log('   Check Edge Function logs in Supabase Dashboard');
      }
    } else if (data) {
      console.log('✅ Function executed successfully');
      console.log('   This is unexpected with an invalid lesson ID');
      console.log('   Response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error calling Edge Function:', error.message);
  }

  console.log('');
  console.log('================================');
  console.log('📚 Additional Resources:');
  console.log('');
  console.log('   Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/urmuwjcjcyohsrkgyapl');
  console.log('');
  console.log('   Edge Functions Documentation:');
  console.log('   https://supabase.com/docs/guides/functions/secrets');
  console.log('');
  console.log('   Full diagnosis guide:');
  console.log('   See docs/lesson-generation-fallback-diagnosis.md');
  console.log('');
}

checkEdgeFunctionSecrets();
