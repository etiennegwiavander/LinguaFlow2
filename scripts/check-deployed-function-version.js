const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDeployedFunctionVersion() {
  console.log('🔍 CHECKING DEPLOYED EDGE FUNCTION VERSION\n');
  console.log('=' .repeat(80));

  // Try to invoke the function with a test payload to see what version is deployed
  console.log('\n📡 Attempting to check function logs for version info...\n');

  // Find a recent lesson that was generated on January 26, 2026
  const { data: recentLessons, error } = await supabase
    .from('lessons')
    .select(`
      id,
      created_at,
      interactive_lesson_content,
      student:students(name, level)
    `)
    .not('interactive_lesson_content', 'is', null)
    .gte('created_at', '2026-01-26T00:00:00')
    .lte('created_at', '2026-01-27T00:00:00')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error fetching lessons:', error);
    return;
  }

  console.log(`📊 Found ${recentLessons.length} lessons generated on January 26, 2026\n`);

  for (const lesson of recentLessons) {
    const content = lesson.interactive_lesson_content;
    const sections = content.sections || [];
    
    console.log(`\n📝 Lesson ID: ${lesson.id}`);
    console.log(`   Created: ${new Date(lesson.created_at).toLocaleString()}`);
    console.log(`   Student: ${lesson.student?.name} (Level: ${lesson.student?.level})`);
    console.log(`   Sub-topic: ${content.selected_sub_topic?.title || 'Unknown'}`);

    // Check for vocabulary sections with suspicious patterns
    for (const section of sections) {
      const vocabItems = section.vocabulary_items || [];
      
      for (const item of vocabItems) {
        const examples = item.examples || [];
        
        const hasSuspiciousPattern = examples.some(ex => 
          ex.includes('requires mutual respect and understanding') ||
          ex.includes('ed successfully after years of practice') ||
          ex.includes('is an important concept in family relationships') ||
          ex.includes('helps with communication')
        );

        if (hasSuspiciousPattern) {
          console.log(`\n   ⚠️  FOUND FALLBACK PATTERN in word: "${item.word}"`);
          console.log(`       Part of Speech: ${item.part_of_speech}`);
          console.log(`       Examples:`);
          examples.forEach((ex, idx) => {
            const isFallback = 
              ex.includes('requires mutual respect and understanding') ||
              ex.includes('ed successfully after years of practice') ||
              ex.includes('is an important concept in family relationships') ||
              ex.includes('helps with communication');
            
            const marker = isFallback ? '🚨 FALLBACK' : '✅ OK';
            console.log(`          ${idx + 1}. [${marker}] ${ex}`);
          });
        }
      }
    }
  }

  console.log('\n\n' + '=' .repeat(80));
  console.log('\n🔍 ANALYSIS:\n');
  console.log('If you see fallback patterns above, it means:');
  console.log('1. The Edge Function deployed to Supabase has OLD CODE');
  console.log('2. The local file was updated but NOT redeployed');
  console.log('3. You need to redeploy the function to Supabase\n');
  console.log('To redeploy:');
  console.log('  supabase functions deploy generate-interactive-material\n');
  console.log('=' .repeat(80));
}

checkDeployedFunctionVersion().catch(console.error);
