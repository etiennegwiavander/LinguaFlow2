require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateEnglishForKidsTemplates() {
  console.log('🚀 Migrating English for Kids Templates to Supabase...');
  console.log('='.repeat(80));

  try {
    // Read the migration files
    const a2FilePath = path.join(__dirname, '..', 'supabase', 'migrations', '20250613150806_add_english_for_kids_a2_template.sql');
    const b1FilePath = path.join(__dirname, '..', 'supabase', 'migrations', '20250613150807_add_english_for_kids_b1_template.sql');

    console.log('\n📂 Reading migration files...');
    console.log(`   A2 Template: ${a2FilePath}`);
    console.log(`   B1 Template: ${b1FilePath}`);

    // Check if templates already exist
    const { data: existingTemplates, error: checkError } = await supabase
      .from('lesson_templates')
      .select('id, name, category, level')
      .eq('category', 'English for Kids')
      .in('level', ['a2', 'b1']);

    if (checkError) {
      console.error('❌ Error checking existing templates:', checkError.message);
      throw checkError;
    }

    console.log(`\n🔍 Found ${existingTemplates.length} existing English for Kids templates`);
    existingTemplates.forEach(t => {
      console.log(`   - ${t.name} (${t.level.toUpperCase()})`);
    });

    // A2 Template
    const a2Template = {
      name: 'English for Kids Lesson',
      category: 'English for Kids',
      level: 'a2',
      template_json: {
        name: 'English for Kids Lesson',
        category: 'English for Kids',
        level: 'a2',
        colors: {
          primary_bg: 'bg-teal-50',
          secondary_bg: 'bg-lime-50',
          text_color: 'text-gray-800',
          accent_color: 'text-teal-600',
          border_color: 'border-gray-200'
        },
        sections: [
          {
            id: 'header',
            type: 'title',
            title: 'Lesson Title Here',
            subtitle: 'Topic Overview',
            image_url: 'https://images.pexels.com/photos/3660142/pexels-photo-3660142.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
          },
          {
            id: 'introduction_overview',
            type: 'info_card',
            title: 'Introduction/Overview',
            background_color_var: 'primary_bg',
            content_type: 'text',
            ai_placeholder: 'introduction_overview'
          },
          {
            id: 'key_vocabulary',
            type: 'exercise',
            title: 'Key Vocabulary',
            instruction: 'Essential words with simple definitions and example sentences.',
            instruction_bg_color_var: 'secondary_bg',
            content_type: 'vocabulary_matching',
            vocabulary_items: [],
            ai_placeholder: 'vocabulary_items'
          },
          {
            id: 'example_sentences_dialogue',
            type: 'exercise',
            title: 'Example Sentences/Dialogue',
            instruction: 'Short, simple sentences or a dialogue to model the target language.',
            instruction_bg_color_var: 'secondary_bg',
            content_type: 'full_dialogue',
            dialogue_lines: [],
            ai_placeholder: 'example_content'
          },
          {
            id: 'comprehension_check',
            type: 'exercise',
            title: 'Comprehension Check',
            instruction: 'Questions to check understanding (multiple choice, true/false, or short answer).',
            instruction_bg_color_var: 'secondary_bg',
            content_type: 'matching',
            matching_pairs: [],
            ai_placeholder: 'comprehension_questions'
          },
          {
            id: 'image_based_practice_comprehension',
            type: 'exercise',
            title: 'Image-Based Practice/Comprehension',
            instruction: 'Look at the picture and answer the question: What do you need? or What do you want?',
            instruction_bg_color_var: 'secondary_bg',
            content_type: 'image_based_practice',
            items: [],
            ai_placeholder: 'image_based_practice_items'
          },
          {
            id: 'guided_practice_matching_exercise',
            type: 'exercise',
            title: 'Guided Practice/Matching Exercise',
            instruction: 'Match words to pictures or complete fill-in-the-blank activities.',
            instruction_bg_color_var: 'secondary_bg',
            content_type: 'matching',
            matching_pairs: [],
            ai_placeholder: 'guided_practice_content'
          },
          {
            id: 'speaking_practice_role_play',
            type: 'exercise',
            title: 'Speaking Practice/Role-Play',
            instruction: 'Practice asking and answering about wants and needs.',
            instruction_bg_color_var: 'secondary_bg',
            content_type: 'list',
            items: [],
            ai_placeholder: 'speaking_practice_prompts'
          },
          {
            id: 'review_wrap_up',
            type: 'info_card',
            title: 'Review/Wrap-up',
            background_color_var: 'primary_bg',
            content_type: 'text',
            ai_placeholder: 'review_wrap_up'
          }
        ]
      },
      is_active: true
    };

    // B1 Template (with syntax fix)
    const b1Template = {
      name: 'English for Kids Lesson',
      category: 'English for Kids',
      level: 'b1',
      template_json: {
        name: 'English for Kids Lesson',
        category: 'English for Kids',
        level: 'b1',
        colors: {
          primary_bg: 'bg-indigo-50',
          secondary_bg: 'bg-pink-50',
          text_color: 'text-gray-800',
          accent_color: 'text-indigo-600',
          border_color: 'border-gray-200'
        },
        sections: [
          {
            id: 'header',
            type: 'title',
            title: 'Lesson Title Here',
            subtitle: 'Topic Overview',
            image_url: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
          },
          {
            id: 'learning_objectives',
            type: 'info_card',
            title: 'Learning Objectives',
            background_color_var: 'primary_bg',
            content_type: 'list',
            items: [],
            ai_placeholder: 'objectives'
          },
          {
            id: 'warm_up',
            type: 'exercise',
            title: 'Warm-up',
            instruction: 'Match the words with the pictures.',
            instruction_bg_color_var: 'secondary_bg',
            content_type: 'drawing_tool_match',
            items: [],
            ai_placeholder: 'warmup_content'
          },
          {
            id: 'story_reading_section',
            type: 'exercise',
            title: 'Story/Reading Section',
            instruction: 'A short, illustrated story or informational text.',
            instruction_bg_color_var: 'secondary_bg',
            content_type: 'full_dialogue',
            dialogue_lines: [],
            ai_placeholder: 'story_reading_content'
          },
          {
            id: 'comprehension_check',
            type: 'exercise',
            title: 'Comprehension Check',
            instruction: 'Questions to check understanding (multiple choice, true/false, or short answer).',
            instruction_bg_color_var: 'secondary_bg',
            content_type: 'matching',
            matching_pairs: [],
            ai_placeholder: 'comprehension_questions'
          },
          {
            id: 'listen_and_repeat',
            type: 'exercise',
            title: 'Listen and Repeat',
            instruction: 'Listen to your tutor and repeat the sentences.',
            instruction_bg_color_var: 'secondary_bg',
            content_type: 'listen_repeat',
            items: [],
            ai_placeholder: 'listen_repeat_sentences'
          },
          {
            id: 'which_picture',
            type: 'exercise',
            title: 'Which Picture?',
            instruction: 'Listen to the dialogue and choose the correct picture.',
            instruction_bg_color_var: 'secondary_bg',
            content_type: 'audio_picture_choice',
            items: [],
            ai_placeholder: 'audio_picture_choices'
          },
          {
            id: 'say_what_you_see',
            type: 'exercise',
            title: 'Say What You See',
            instruction: 'Your tutor will choose a picture. Describe it using singular and plural nouns.',
            instruction_bg_color_var: 'secondary_bg',
            content_type: 'say_what_you_see',
            items: [],
            ai_placeholder: 'say_what_you_see_items'
          },
          {
            id: 'complete_the_sentence',
            type: 'exercise',
            title: 'Complete the Sentence',
            instruction: 'Choose the correct word to complete the sentence, then read it aloud.',
            instruction_bg_color_var: 'secondary_bg',
            content_type: 'complete_sentence',
            items: [],
            ai_placeholder: 'complete_sentence_items'
          },
          {
            id: 'answer_the_questions',
            type: 'exercise',
            title: 'Answer the Questions',
            instruction: 'Look at the picture and answer the question in a complete sentence.',
            instruction_bg_color_var: 'secondary_bg',
            content_type: 'answer_questions',
            items: [],
            ai_placeholder: 'answer_questions_items'
          },
          {
            id: 'fill_in_the_blanks',
            type: 'exercise',
            title: 'Fill in the Blanks',
            instruction: 'Read the dialogue with your tutor and fill in the missing words.',
            instruction_bg_color_var: 'secondary_bg',
            content_type: 'fill_in_the_blanks_dialogue',
            dialogue_elements: [],
            ai_placeholder: 'fill_in_the_blanks_content'
          },
          {
            id: 'review_wrap_up',
            type: 'info_card',
            title: 'Review/Wrap-up',
            background_color_var: 'primary_bg',
            content_type: 'text',
            ai_placeholder: 'review_wrap_up'
          }
        ]
      },
      is_active: true
    };

    // Migrate A2 Template
    console.log('\n📝 Migrating A2 Template...');
    const existingA2 = existingTemplates.find(t => t.level === 'a2');
    
    if (existingA2) {
      console.log(`   ⚠️  A2 template already exists (ID: ${existingA2.id})`);
      console.log('   🔄 Updating existing template...');
      
      const { data: updatedA2, error: updateA2Error } = await supabase
        .from('lesson_templates')
        .update({
          template_json: a2Template.template_json,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingA2.id)
        .select()
        .single();

      if (updateA2Error) {
        console.error('   ❌ Error updating A2 template:', updateA2Error.message);
        throw updateA2Error;
      }

      console.log('   ✅ A2 template updated successfully');
      console.log(`   📊 Sections: ${updatedA2.template_json.sections.length}`);
    } else {
      console.log('   ➕ Creating new A2 template...');
      
      const { data: newA2, error: insertA2Error } = await supabase
        .from('lesson_templates')
        .insert(a2Template)
        .select()
        .single();

      if (insertA2Error) {
        console.error('   ❌ Error inserting A2 template:', insertA2Error.message);
        throw insertA2Error;
      }

      console.log('   ✅ A2 template created successfully');
      console.log(`   🆔 Template ID: ${newA2.id}`);
      console.log(`   📊 Sections: ${newA2.template_json.sections.length}`);
    }

    // Migrate B1 Template
    console.log('\n📝 Migrating B1 Template...');
    const existingB1 = existingTemplates.find(t => t.level === 'b1');
    
    if (existingB1) {
      console.log(`   ⚠️  B1 template already exists (ID: ${existingB1.id})`);
      console.log('   🔄 Updating existing template...');
      
      const { data: updatedB1, error: updateB1Error } = await supabase
        .from('lesson_templates')
        .update({
          template_json: b1Template.template_json,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingB1.id)
        .select()
        .single();

      if (updateB1Error) {
        console.error('   ❌ Error updating B1 template:', updateB1Error.message);
        throw updateB1Error;
      }

      console.log('   ✅ B1 template updated successfully');
      console.log(`   📊 Sections: ${updatedB1.template_json.sections.length}`);
    } else {
      console.log('   ➕ Creating new B1 template...');
      
      const { data: newB1, error: insertB1Error } = await supabase
        .from('lesson_templates')
        .insert(b1Template)
        .select()
        .single();

      if (insertB1Error) {
        console.error('   ❌ Error inserting B1 template:', insertB1Error.message);
        throw insertB1Error;
      }

      console.log('   ✅ B1 template created successfully');
      console.log(`   🆔 Template ID: ${newB1.id}`);
      console.log(`   📊 Sections: ${newB1.template_json.sections.length}`);
    }

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const { data: verifyTemplates, error: verifyError } = await supabase
      .from('lesson_templates')
      .select('id, name, category, level, template_json')
      .eq('category', 'English for Kids')
      .in('level', ['a2', 'b1'])
      .order('level', { ascending: true });

    if (verifyError) {
      console.error('❌ Error verifying templates:', verifyError.message);
      throw verifyError;
    }

    console.log(`\n✅ Verification complete! Found ${verifyTemplates.length} English for Kids templates:`);
    verifyTemplates.forEach(t => {
      console.log(`\n   📋 ${t.name} (${t.level.toUpperCase()})`);
      console.log(`      ID: ${t.id}`);
      console.log(`      Sections: ${t.template_json.sections.length}`);
      console.log(`      Colors: ${Object.keys(t.template_json.colors).length} defined`);
      console.log(`      Section IDs: ${t.template_json.sections.map(s => s.id).join(', ')}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('🎉 Migration completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

migrateEnglishForKidsTemplates().catch(console.error);
