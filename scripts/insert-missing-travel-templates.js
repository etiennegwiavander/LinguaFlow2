require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const templateStructure = {
  name: "English for Travel Lesson",
  category: "English for Travel",
  colors: {
    primary_bg: "bg-sky-50",
    secondary_bg: "bg-blue-50",
    text_color: "text-gray-800",
    accent_color: "text-sky-600",
    border_color: "border-gray-200"
  },
  sections: [
    {
      id: "header",
      type: "title",
      title: "Lesson Title Here",
      subtitle: "Topic Overview",
      image_url: "https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
      id: "introduction_overview",
      type: "info_card",
      title: "Introduction/Overview",
      background_color_var: "primary_bg",
      content_type: "text",
      ai_placeholder: "introduction_overview"
    },
    {
      id: "key_vocabulary",
      type: "exercise",
      title: "Key Travel Vocabulary",
      instruction: "Essential travel terms and phrases with definitions and example sentences.",
      instruction_bg_color_var: "secondary_bg",
      content_type: "vocabulary_matching",
      vocabulary_items: [],
      ai_placeholder: "vocabulary_items"
    },
    {
      id: "example_dialogue_reading",
      type: "exercise",
      title: "Travel Dialogue or Scenario",
      instruction: "A realistic travel dialogue or reading passage.",
      instruction_bg_color_var: "secondary_bg",
      content_type: "full_dialogue",
      dialogue_lines: [],
      ai_placeholder: "dialogue_content"
    },
    {
      id: "comprehension_questions",
      type: "exercise",
      title: "Comprehension Questions",
      instruction: "Answer these questions to check understanding.",
      instruction_bg_color_var: "secondary_bg",
      content_type: "matching",
      matching_pairs: [],
      ai_placeholder: "comprehension_questions"
    },
    {
      id: "role_play",
      type: "exercise",
      title: "Role-Play Scenarios",
      instruction: "Practice real-life travel situations.",
      instruction_bg_color_var: "secondary_bg",
      content_type: "list",
      items: [],
      ai_placeholder: "role_play_scenarios"
    },
    {
      id: "discussion_questions_prompts",
      type: "exercise",
      title: "Discussion Questions",
      instruction: "Discuss your own travel experiences or plans.",
      instruction_bg_color_var: "secondary_bg",
      content_type: "list",
      items: [],
      ai_placeholder: "discussion_prompts"
    },
    {
      id: "useful_expressions",
      type: "exercise",
      title: "Useful Travel Expressions",
      instruction: "Practical phrases for common travel situations.",
      instruction_bg_color_var: "secondary_bg",
      content_type: "list",
      items: [],
      ai_placeholder: "useful_expressions"
    },
    {
      id: "practice_activities",
      type: "exercise",
      title: "Practice Activities",
      instruction: "Interactive activities to reinforce travel language skills.",
      instruction_bg_color_var: "secondary_bg",
      content_type: "list",
      items: [],
      ai_placeholder: "practice_activities"
    },
    {
      id: "wrap_up_reflection",
      type: "info_card",
      title: "Wrap-up & Reflection",
      background_color_var: "primary_bg",
      content_type: "text",
      ai_placeholder: "wrap_up_reflection"
    }
  ]
};

async function insertMissingTemplates() {
  console.log('📝 Inserting missing English for Travel templates...\n');

  try {
    // Check which levels are missing
    const { data: existing, error: checkError } = await supabase
      .from('lesson_templates')
      .select('level')
      .eq('category', 'English for Travel');

    if (checkError) {
      console.error('❌ Error checking existing templates:', checkError);
      return;
    }

    const existingLevels = existing.map(t => t.level);
    const missingLevels = ['a1', 'c2'].filter(level => !existingLevels.includes(level));

    if (missingLevels.length === 0) {
      console.log('✅ All templates already exist!');
      return;
    }

    console.log(`📋 Missing levels: ${missingLevels.map(l => l.toUpperCase()).join(', ')}\n`);

    // Insert missing templates
    for (const level of missingLevels) {
      console.log(`📝 Inserting ${level.toUpperCase()} template...`);
      
      const template = {
        ...templateStructure,
        level: level
      };

      const { error: insertError } = await supabase
        .from('lesson_templates')
        .insert({
          name: 'English for Travel Lesson',
          category: 'English for Travel',
          level: level,
          template_json: template,
          is_active: true
        });

      if (insertError) {
        console.error(`   ❌ Error inserting ${level.toUpperCase()} template:`, insertError);
      } else {
        console.log(`   ✅ Successfully inserted ${level.toUpperCase()} template`);
      }
    }

    // Verify final state
    console.log('\n🔍 Verifying final state...');
    const { data: finalTemplates, error: finalError } = await supabase
      .from('lesson_templates')
      .select('*')
      .eq('category', 'English for Travel')
      .order('level');

    if (finalError) {
      console.error('❌ Error verifying templates:', finalError);
      return;
    }

    console.log(`\n✅ Final Result: ${finalTemplates.length}/6 "English for Travel" templates\n`);
    
    console.log('📋 All templates:');
    finalTemplates.forEach(t => {
      console.log(`   ✅ ${t.level.toUpperCase()}: ${t.name}`);
    });

    if (finalTemplates.length === 6) {
      console.log('\n🎉 SUCCESS! All English for Travel templates are now configured!');
      console.log('   The "Invalid Template Structure" error is now fixed.');
      console.log('\n📝 Next steps:');
      console.log('   1. Try generating a lesson with "English for Travel" category');
      console.log('   2. Generate interactive materials');
      console.log('   3. Verify content displays correctly');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

insertMissingTemplates();
