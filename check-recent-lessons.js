// Check recent lessons with interactive materials
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables from .env.local
let supabaseUrl, serviceRoleKey;

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('SERVICE_ROLE_KEY=')) {
      serviceRoleKey = line.split('=')[1].trim();
    }
  });
} catch (error) {
  console.error('Error reading .env.local file:', error.message);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkRecentLessons() {
  try {
    console.log('🔍 Checking Recent Interactive Lessons...');
    console.log('='.repeat(50));
    
    // Get Etienne's tutor ID
    const { data: tutors } = await supabase
      .from('tutors')
      .select('id, name, email')
      .eq('email', 'vanshidy@gmail.com')
      .limit(1);

    if (!tutors || tutors.length === 0) {
      console.error('❌ Etienne not found');
      return;
    }

    const tutor = tutors[0];
    console.log(`✅ Checking lessons for: ${tutor.name} (${tutor.id})`);
    console.log('');

    // Get all lessons (with and without interactive content), ordered by most recent
    const { data: allLessons } = await supabase
      .from('lessons')
      .select('id, date, created_at, interactive_lesson_content, generated_lessons, sub_topics')
      .eq('tutor_id', tutor.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get only lessons with interactive content
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, date, created_at, interactive_lesson_content, generated_lessons, sub_topics')
      .eq('tutor_id', tutor.id)
      .not('interactive_lesson_content', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    console.log(`📚 ALL RECENT LESSONS (${allLessons?.length || 0} total):`);
    console.log('='.repeat(50));

    allLessons?.forEach((lesson, index) => {
      const createdAt = new Date(lesson.created_at);
      const lessonDate = new Date(lesson.date);
      const hasInteractive = !!lesson.interactive_lesson_content;
      const generatedCount = lesson.generated_lessons?.length || 0;
      const subTopicsCount = lesson.sub_topics?.length || 0;
      
      // Check if interactive content has creation timestamp
      const interactiveCreatedAt = lesson.interactive_lesson_content?.created_at;
      const interactiveTime = interactiveCreatedAt ? new Date(interactiveCreatedAt) : null;
      
      console.log(`${index + 1}. Lesson ID: ${lesson.id}`);
      console.log(`   Lesson Date: ${lessonDate.toISOString()}`);
      console.log(`   Created At: ${createdAt.toISOString()}`);
      console.log(`   Interactive Created: ${interactiveTime ? interactiveTime.toISOString() : 'No Interactive Materials'}`);
      console.log(`   Has Interactive: ${hasInteractive ? '✅ YES' : '❌ NO'}`);
      console.log(`   Generated Plans: ${generatedCount}`);
      console.log(`   Sub-topics: ${subTopicsCount}`);
      
      // Check if this was created in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const isRecent = createdAt > oneHourAgo;
      const isInteractiveRecent = interactiveTime && interactiveTime > oneHourAgo;
      
      if (isRecent) {
        console.log(`   🆕 LESSON CREATED: In the last hour!`);
      }
      if (isInteractiveRecent) {
        console.log(`   🎯 INTERACTIVE CREATED: In the last hour!`);
      }
      console.log('');
    });

    console.log(`📚 LESSONS WITH INTERACTIVE MATERIALS (${lessons?.length || 0} total):`);
    console.log('='.repeat(50));

    lessons?.forEach((lesson, index) => {
      const createdAt = new Date(lesson.created_at);
      const lessonDate = new Date(lesson.date);
      const hasInteractive = !!lesson.interactive_lesson_content;
      const generatedCount = lesson.generated_lessons?.length || 0;
      const subTopicsCount = lesson.sub_topics?.length || 0;
      
      // Check if interactive content has creation timestamp
      const interactiveCreatedAt = lesson.interactive_lesson_content?.created_at;
      const interactiveTime = interactiveCreatedAt ? new Date(interactiveCreatedAt) : null;
      
      console.log(`${index + 1}. Lesson ID: ${lesson.id}`);
      console.log(`   Lesson Date: ${lessonDate.toISOString()}`);
      console.log(`   Created At: ${createdAt.toISOString()}`);
      console.log(`   Interactive Created: ${interactiveTime ? interactiveTime.toISOString() : 'Unknown'}`);
      console.log(`   Has Interactive: ${hasInteractive}`);
      console.log(`   Generated Plans: ${generatedCount}`);
      console.log(`   Sub-topics: ${subTopicsCount}`);
      
      // Check if this was created in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const isRecent = interactiveTime && interactiveTime > oneHourAgo;
      if (isRecent) {
        console.log(`   🆕 RECENT: Created in the last hour!`);
      }
      console.log('');
    });

    // Count by current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const { count: currentMonthCount } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('tutor_id', tutor.id)
      .gte('date', startOfMonth.toISOString())
      .not('interactive_lesson_content', 'is', null);

    const { count: totalCount } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('tutor_id', tutor.id)
      .not('interactive_lesson_content', 'is', null);

    console.log('📊 Current Counts:');
    console.log(`   Total Lessons with Interactive Materials: ${totalCount}`);
    console.log(`   This Month: ${currentMonthCount}`);
    console.log(`   Start of Month: ${startOfMonth.toISOString()}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRecentLessons();