require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkInteractiveContentField() {
  console.log('🔍 CHECKING interactive_content FIELD\n');
  console.log('='.repeat(80));

  const { data: tutor } = await supabase
    .from('tutors')
    .select('*')
    .eq('email', 'vanshidy@gmail.com')
    .single();

  const { data: allSessions } = await supabase
    .from('lesson_sessions')
    .select('*')
    .eq('tutor_id', tutor.id)
    .order('created_at', { ascending: false });

  console.log(`\n📝 ANALYZING ${allSessions?.length || 0} LESSON_SESSIONS\n`);
  console.log('='.repeat(80));

  const withInteractiveContent = [];
  const withoutInteractiveContent = [];

  allSessions?.forEach((session, idx) => {
    console.log(`\n${idx + 1}. Session ${session.id.substring(0, 8)}...`);
    console.log(`   Lesson ID: ${session.lesson_id?.substring(0, 8)}...`);
    console.log(`   Created: ${session.created_at}`);
    
    if (session.interactive_content) {
      console.log(`   ✅ interactive_content: YES`);
      console.log(`   Type: ${typeof session.interactive_content}`);
      if (typeof session.interactive_content === 'object') {
        console.log(`   Keys: ${Object.keys(session.interactive_content).join(', ')}`);
      }
      withInteractiveContent.push(session);
    } else {
      console.log(`   ❌ interactive_content: NO (${session.interactive_content})`);
      withoutInteractiveContent.push(session);
    }
    
    // Check lesson_materials field too
    if (session.lesson_materials) {
      console.log(`   ✅ lesson_materials: YES`);
      console.log(`   Type: ${typeof session.lesson_materials}`);
    } else {
      console.log(`   ❌ lesson_materials: NO`);
    }
    
    // Check status field
    console.log(`   Status: ${session.status || 'NULL'}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 SUMMARY:`);
  console.log(`   Sessions WITH interactive_content: ${withInteractiveContent.length}`);
  console.log(`   Sessions WITHOUT interactive_content: ${withoutInteractiveContent.length}`);

  console.log('\n' + '='.repeat(80));
  console.log(`\n💡 FINAL RECOMMENDATION:`);
  console.log('-'.repeat(80));

  if (withInteractiveContent.length > 0) {
    console.log(`\n✅ USE: interactive_content IS NOT NULL`);
    console.log(`   This will count ${withInteractiveContent.length} fully generated lessons`);
  } else {
    console.log(`\n⚠️  interactive_content field is always NULL`);
    console.log(`   Content is stored in the lessons table, not lesson_sessions`);
    console.log(`\n   BEST APPROACH:`);
    console.log(`   Count lesson_sessions WHERE lesson_id IN (`);
    console.log(`     SELECT id FROM lessons WHERE interactive_lesson_content IS NOT NULL`);
    console.log(`   )`);
    console.log(`\n   This will count: ${allSessions?.filter(s => s.lesson_id).length} sessions`);
    console.log(`   That reference lessons with content`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Analysis complete!\n');
}

checkInteractiveContentField().catch(console.error);
