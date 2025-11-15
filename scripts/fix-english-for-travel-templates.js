require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixEnglishForTravelTemplates() {
  console.log('🔧 Fixing English for Travel Templates...\n');

  try {
    // Step 1: Check for existing "Travel English" templates
    console.log('📋 Step 1: Checking for existing templates...');
    const { data: existingTemplates, error: checkError } = await supabase
      .from('lesson_templates')
      .select('*')
      .or('category.eq.Travel English,category.eq.English for Travel');

    if (checkError) {
      console.error('❌ Error checking templates:', checkError);
      return;
    }

    console.log(`   Found ${existingTemplates.length} existing travel templates\n`);

    // Step 2: Update any "Travel English" to "English for Travel"
    const travelEnglishTemplates = existingTemplates.filter(t => t.category === 'Travel English');
    if (travelEnglishTemplates.length > 0) {
      console.log(`📝 Step 2: Updating ${travelEnglishTemplates.length} templates from "Travel English" to "English for Travel"...`);
      
      for (const template of travelEnglishTemplates) {
        const { error: updateError } = await supabase
          .from('lesson_templates')
          .update({ 
            category: 'English for Travel',
            name: 'English for Travel Lesson'
          })
          .eq('id', template.id);

        if (updateError) {
          console.error(`   ❌ Error updating template ${template.id}:`, updateError);
        } else {
          console.log(`   ✅ Updated ${template.level.toUpperCase()} template`);
        }
      }
      console.log('');
    } else {
      console.log('✅ Step 2: No "Travel English" templates to update\n');
    }

    // Step 3: Check which levels are missing
    console.log('📊 Step 3: Checking for missing levels...');
    const levels = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
    const existingLevels = existingTemplates
      .filter(t => t.category === 'English for Travel' || t.category === 'Travel English')
      .map(t => t.level);
    
    const missingLevels = levels.filter(level => !existingLevels.includes(level));
    
    if (missingLevels.length > 0) {
      console.log(`   Missing levels: ${missingLevels.map(l => l.toUpperCase()).join(', ')}`);
      console.log('   ⚠️  You need to apply the migration files for these levels');
      console.log('   Run: supabase db push\n');
    } else {
      console.log('   ✅ All levels present\n');
    }

    // Step 4: Verify final state
    console.log('🔍 Step 4: Verifying final state...');
    const { data: finalTemplates, error: finalError } = await supabase
      .from('lesson_templates')
      .select('*')
      .eq('category', 'English for Travel')
      .order('level');

    if (finalError) {
      console.error('❌ Error verifying templates:', finalError);
      return;
    }

    console.log(`\n✅ Final Result: ${finalTemplates.length} "English for Travel" templates\n`);
    
    if (finalTemplates.length > 0) {
      console.log('📋 Templates by level:');
      finalTemplates.forEach(t => {
        console.log(`   ✅ ${t.level.toUpperCase()}: ${t.name}`);
      });
    }

    if (finalTemplates.length === 6) {
      console.log('\n🎉 SUCCESS! All English for Travel templates are now properly configured!');
      console.log('   The "Invalid Template Structure" error should be resolved.');
    } else {
      console.log(`\n⚠️  Only ${finalTemplates.length}/6 levels configured.`);
      console.log('   Apply the missing migration files to complete the fix.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixEnglishForTravelTemplates();
