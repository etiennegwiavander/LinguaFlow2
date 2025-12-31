const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkB2LessonSections() {
  console.log('🔍 Checking most recent B2 English for Kids lesson...\n');

  // Get the most recent B2 lesson
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error fetching lesson:', error);
    return;
  }

  if (!lessons || lessons.length === 0) {
    console.log('⚠️ No lessons found');
    return;
  }

  // Find the most recent B2 English for Kids lesson
  const b2Lesson = lessons.find(l => {
    const content = typeof l.interactive_content === 'string' 
      ? JSON.parse(l.interactive_content)
      : l.interactive_content;
    return content?.category === 'English for Kids' && content?.level === 'b2';
  });

  if (!b2Lesson) {
    console.log('⚠️ No B2 English for Kids lessons found in recent lessons');
    console.log('Recent lessons:', lessons.map(l => {
      const content = typeof l.interactive_content === 'string' 
        ? JSON.parse(l.interactive_content)
        : l.interactive_content;
      return `${content?.category} - ${content?.level}`;
    }));
    return;
  }

  const lesson = b2Lesson;
  console.log('📚 Lesson Details:');
  console.log('- ID:', lesson.id);
  console.log('- Created:', new Date(lesson.created_at).toLocaleString());
  console.log('\n' + '='.repeat(80) + '\n');

  // Parse the interactive content
  let interactiveContent;
  try {
    interactiveContent = typeof lesson.interactive_content === 'string' 
      ? JSON.parse(lesson.interactive_content)
      : lesson.interactive_content;
  } catch (e) {
    console.error('❌ Failed to parse interactive content:', e);
    return;
  }

  if (!interactiveContent || !interactiveContent.sections) {
    console.log('⚠️ No sections found in interactive content');
    return;
  }

  // Find the two sections we're interested in
  const warmUpSection = interactiveContent.sections.find(s => s.id === 'warm_up_engagement');
  const pronunciationSection = interactiveContent.sections.find(s => s.id === 'pronunciation_listening_practice');

  console.log('🎯 WARM-UP/ENGAGEMENT SECTION:');
  console.log('='.repeat(80));
  if (warmUpSection) {
    console.log('Content Type:', warmUpSection.content_type);
    console.log('AI Placeholder:', warmUpSection.ai_placeholder);
    console.log('\nCurrent Content:');
    
    // Check what fields exist
    const fields = Object.keys(warmUpSection);
    console.log('Available fields:', fields.join(', '));
    
    // Check for items array
    if (warmUpSection.items) {
      console.log('\n📋 Items array:', JSON.stringify(warmUpSection.items, null, 2));
    }
    
    // Check for AI-generated field
    if (warmUpSection.warm_up_questions) {
      console.log('\n🤖 AI Generated (warm_up_questions):', JSON.stringify(warmUpSection.warm_up_questions, null, 2));
    }
    
    // Check for old field
    if (warmUpSection.warm_up_engagement) {
      console.log('\n📝 Old field (warm_up_engagement):', warmUpSection.warm_up_engagement);
    }
  } else {
    console.log('❌ Section not found!');
  }

  console.log('\n' + '='.repeat(80) + '\n');

  console.log('🎤 PRONUNCIATION/LISTENING PRACTICE SECTION:');
  console.log('='.repeat(80));
  if (pronunciationSection) {
    console.log('Content Type:', pronunciationSection.content_type);
    console.log('AI Placeholder:', pronunciationSection.ai_placeholder);
    console.log('\nCurrent Content:');
    
    // Check what fields exist
    const fields = Object.keys(pronunciationSection);
    console.log('Available fields:', fields.join(', '));
    
    // Check for items array
    if (pronunciationSection.items) {
      console.log('\n📋 Items array:', JSON.stringify(pronunciationSection.items, null, 2));
    }
    
    // Check for AI-generated field
    if (pronunciationSection.moral_story_content) {
      console.log('\n🤖 AI Generated (moral_story_content):', JSON.stringify(pronunciationSection.moral_story_content, null, 2));
    }
    
    // Check for old field
    if (pronunciationSection.pronunciation_listening_content) {
      console.log('\n📝 Old field (pronunciation_listening_content):', 
        typeof pronunciationSection.pronunciation_listening_content === 'string' 
          ? pronunciationSection.pronunciation_listening_content.substring(0, 200) + '...'
          : JSON.stringify(pronunciationSection.pronunciation_listening_content, null, 2));
    }
  } else {
    console.log('❌ Section not found!');
  }

  console.log('\n' + '='.repeat(80) + '\n');
  console.log('💡 ANALYSIS COMPLETE');
}

checkB2LessonSections().catch(console.error);
