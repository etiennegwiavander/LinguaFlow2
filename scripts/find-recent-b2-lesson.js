const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findRecentB2Lesson() {
  console.log('🔍 Finding recent B2 English for Kids lesson...\n');

  // Get recent lessons
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('id, created_at, interactive_content')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Found ${lessons.length} recent lessons\n`);

  for (const lesson of lessons) {
    let content;
    try {
      content = typeof lesson.interactive_content === 'string'
        ? JSON.parse(lesson.interactive_content)
        : lesson.interactive_content;
    } catch (e) {
      console.log(`Lesson ${lesson.id}: Failed to parse`);
      continue;
    }

    const category = content?.name || content?.category || 'Unknown';
    const level = content?.level || 'Unknown';
    
    console.log(`Lesson ${lesson.id}:`);
    console.log(`  - Name: ${category}`);
    console.log(`  - Level: ${level}`);
    console.log(`  - Created: ${new Date(lesson.created_at).toLocaleString()}`);
    
    if (category.includes('Kids') || category.includes('English for Kids')) {
      console.log(`  ✅ This is a Kids lesson!`);
      
      if (level === 'b2') {
        console.log(`  🎯 FOUND B2 KIDS LESSON!`);
        console.log(`\nLesson ID to inspect: ${lesson.id}\n`);
        return lesson.id;
      }
    }
    console.log('');
  }

  console.log('⚠️ No B2 English for Kids lesson found in recent 10 lessons');
}

findRecentB2Lesson().catch(console.error);
