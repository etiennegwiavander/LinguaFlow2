#!/usr/bin/env node

/**
 * Diagnostic script to check template structure differences between old and new lessons
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseTemplateStructure() {
  console.log('🔍 Diagnosing template structure differences...\n');

  try {
    // Get recent lessons with interactive content
    console.log('📚 Checking recent lessons with interactive content:');
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, student_id, lesson_template_id, interactive_lesson_content, created_at')
      .not('interactive_lesson_content', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (lessonsError) {
      console.error('❌ Error fetching lessons:', lessonsError.message);
      return;
    }

    console.log(`✅ Found ${lessons.length} lessons with interactive content\n`);

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      console.log(`📖 Lesson ${i + 1}: ${lesson.id.substring(0, 8)}... (Created: ${lesson.created_at})`);
      console.log(`   Template ID: ${lesson.lesson_template_id || 'None'}`);
      
      if (lesson.interactive_lesson_content) {
        const content = lesson.interactive_lesson_content;
        console.log(`   Interactive content keys: ${Object.keys(content).join(', ')}`);
        
        // Check if it has the expected template structure
        const hasSections = !!content.sections;
        const hasTemplateJson = !!content.template_json;
        const sectionsCount = content.sections ? content.sections.length : 0;
        
        console.log(`   Has sections: ${hasSections} (${sectionsCount} sections)`);
        console.log(`   Has template_json: ${hasTemplateJson}`);
        
        if (hasSections) {
          console.log(`   ✅ This lesson should work fine`);
        } else {
          console.log(`   ❌ This lesson will cause "Invalid Template Structure" error`);
          
          // Show what keys are available instead
          if (typeof content === 'object') {
            const availableKeys = Object.keys(content);
            console.log(`   Available keys: ${availableKeys.join(', ')}`);
            
            // Check if it's nested under another key
            for (const key of availableKeys) {
              if (typeof content[key] === 'object' && content[key]?.sections) {
                console.log(`   🔍 Found sections under key "${key}"`);
              }
            }
          }
        }
      } else {
        console.log(`   ❌ No interactive content`);
      }
      console.log('');
    }

    // Check lesson sessions from the new database system
    console.log('🆕 Checking lesson sessions from new database system:');
    const { data: sessions, error: sessionsError } = await supabase
      .from('lesson_sessions')
      .select('id, sub_topic_id, interactive_content, created_at')
      .not('interactive_content', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3);

    if (sessionsError) {
      console.error('❌ Error fetching lesson sessions:', sessionsError.message);
    } else {
      console.log(`✅ Found ${sessions.length} lesson sessions with interactive content\n`);

      for (let i = 0; i < sessions.length; i++) {
        const session = sessions[i];
        console.log(`📝 Session ${i + 1}: ${session.id.substring(0, 8)}... (Created: ${session.created_at})`);
        console.log(`   Sub-topic: ${session.sub_topic_id}`);
        
        if (session.interactive_content) {
          const content = session.interactive_content;
          console.log(`   Interactive content keys: ${Object.keys(content).join(', ')}`);
          
          const hasSections = !!content.sections;
          const sectionsCount = content.sections ? content.sections.length : 0;
          
          console.log(`   Has sections: ${hasSections} (${sectionsCount} sections)`);
          
          if (hasSections) {
            console.log(`   ✅ This session data should work fine`);
          } else {
            console.log(`   ❌ This session data will cause "Invalid Template Structure" error`);
          }
        }
        console.log('');
      }
    }

    // Check a working lesson template for comparison
    console.log('🔧 Checking lesson template structure for comparison:');
    const { data: templates, error: templatesError } = await supabase
      .from('lesson_templates')
      .select('id, name, template_json')
      .limit(1);

    if (templatesError) {
      console.error('❌ Error fetching templates:', templatesError.message);
    } else if (templates && templates.length > 0) {
      const template = templates[0];
      console.log(`📋 Template: ${template.name} (${template.id})`);
      
      if (template.template_json) {
        console.log(`   Template JSON keys: ${Object.keys(template.template_json).join(', ')}`);
        const hasSections = !!template.template_json.sections;
        const sectionsCount = template.template_json.sections ? template.template_json.sections.length : 0;
        console.log(`   Has sections: ${hasSections} (${sectionsCount} sections)`);
        
        if (hasSections && template.template_json.sections.length > 0) {
          const firstSection = template.template_json.sections[0];
          console.log(`   First section keys: ${Object.keys(firstSection).join(', ')}`);
        }
      }
    }

    console.log('\n📋 Summary:');
    console.log('The "Invalid Template Structure" error occurs when:');
    console.log('1. template.template_json is missing');
    console.log('2. template.template_json.sections is missing');
    console.log('3. The interactive_lesson_content structure doesn\'t match expected template format');

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }
}

// Run the diagnostic
diagnoseTemplateStructure().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});