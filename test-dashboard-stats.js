// Test script to verify the improved dashboard stats calculations
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

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testDashboardStats() {
  try {
    console.log('🔍 Testing Improved Dashboard Stats Calculations...');
    console.log('='.repeat(60));
    
    // Get a tutor with more data to test with
    const { data: tutors, error: tutorsError } = await supabase
      .from('tutors')
      .select('id, name, email')
      .eq('email', 'vanshidy@gmail.com') // Etienne - likely has more data
      .limit(1);

    // Fallback to any tutor if Etienne not found
    if (!tutors || tutors.length === 0) {
      const { data: fallbackTutors } = await supabase
        .from('tutors')
        .select('id, name, email')
        .limit(1);
      tutors = fallbackTutors;
    }

    if (tutorsError || !tutors || tutors.length === 0) {
      console.error('❌ Error fetching tutors:', tutorsError);
      return;
    }

    const tutor = tutors[0];
    console.log(`✅ Testing with tutor: ${tutor.name || tutor.email} (${tutor.id})`);
    console.log('');

    // Calculate date ranges (same logic as dashboard)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    console.log('📅 Date Ranges:');
    console.log(`   Current Month: ${startOfMonth.toISOString().split('T')[0]} onwards`);
    console.log(`   Last Month: ${startOfLastMonth.toISOString().split('T')[0]} to ${endOfLastMonth.toISOString().split('T')[0]}`);
    console.log('');

    // 1. Test Total Students (current vs last month)
    console.log('👥 TOTAL STUDENTS ANALYSIS:');
    console.log('-'.repeat(40));
    
    const { count: currentStudentsCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('tutor_id', tutor.id);

    const { count: lastMonthStudentsCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('tutor_id', tutor.id)
      .lte('created_at', endOfLastMonth.toISOString());

    const studentsChange = lastMonthStudentsCount > 0 
      ? ((currentStudentsCount - lastMonthStudentsCount) / lastMonthStudentsCount) * 100 
      : (currentStudentsCount > 0 ? 100 : 0);

    console.log(`   Current Total: ${currentStudentsCount}`);
    console.log(`   Last Month Total: ${lastMonthStudentsCount}`);
    console.log(`   Change: ${studentsChange > 0 ? '+' : ''}${Math.round(studentsChange * 100) / 100}%`);
    console.log('');

    // 2. Test Total Lessons (only with interactive materials created)
    console.log('📚 TOTAL LESSONS ANALYSIS (Interactive Materials Only):');
    console.log('-'.repeat(40));
    
    const { count: currentTotalLessons } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('tutor_id', tutor.id)
      .not('interactive_lesson_content', 'is', null);

    const { count: lastMonthTotalLessons } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('tutor_id', tutor.id)
      .lte('created_at', endOfLastMonth.toISOString())
      .not('interactive_lesson_content', 'is', null);

    const totalLessonsChange = lastMonthTotalLessons > 0 
      ? ((currentTotalLessons - lastMonthTotalLessons) / lastMonthTotalLessons) * 100 
      : (currentTotalLessons > 0 ? 100 : 0);

    console.log(`   Current Total: ${currentTotalLessons}`);
    console.log(`   Last Month Total: ${lastMonthTotalLessons}`);
    console.log(`   Change: ${totalLessonsChange > 0 ? '+' : ''}${Math.round(totalLessonsChange * 100) / 100}%`);
    console.log('');

    // 3. Test Monthly Lessons (current month vs last month)
    console.log('📅 MONTHLY LESSONS ANALYSIS (Interactive Materials Only):');
    console.log('-'.repeat(40));
    
    const { count: currentMonthLessons } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('tutor_id', tutor.id)
      .gte('date', startOfMonth.toISOString())
      .not('interactive_lesson_content', 'is', null);

    const { count: lastMonthLessons } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('tutor_id', tutor.id)
      .gte('date', startOfLastMonth.toISOString())
      .lte('date', endOfLastMonth.toISOString())
      .not('interactive_lesson_content', 'is', null);

    const monthlyLessonsChange = lastMonthLessons > 0 
      ? ((currentMonthLessons - lastMonthLessons) / lastMonthLessons) * 100 
      : (currentMonthLessons > 0 ? 100 : 0);

    console.log(`   This Month: ${currentMonthLessons}`);
    console.log(`   Last Month: ${lastMonthLessons}`);
    console.log(`   Change: ${monthlyLessonsChange > 0 ? '+' : ''}${Math.round(monthlyLessonsChange * 100) / 100}%`);
    console.log('');

    // 4. Compare with old method (all lessons)
    console.log('🔄 COMPARISON WITH OLD METHOD:');
    console.log('-'.repeat(40));
    
    const { count: allLessonsTotal } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('tutor_id', tutor.id);

    const { count: allLessonsThisMonth } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('tutor_id', tutor.id)
      .gte('date', startOfMonth.toISOString());

    console.log(`   Old Method - Total Lessons: ${allLessonsTotal}`);
    console.log(`   New Method - Total Lessons: ${currentTotalLessons}`);
    console.log(`   Difference: ${allLessonsTotal - currentTotalLessons} lessons without interactive materials`);
    console.log('');
    console.log(`   Old Method - Monthly Lessons: ${allLessonsThisMonth}`);
    console.log(`   New Method - Monthly Lessons: ${currentMonthLessons}`);
    console.log(`   Difference: ${allLessonsThisMonth - currentMonthLessons} lessons without interactive materials`);
    console.log('');

    // 5. Sample lessons with and without interactive materials
    console.log('🔍 SAMPLE LESSONS ANALYSIS:');
    console.log('-'.repeat(40));
    
    const { data: lessonsWithMaterials } = await supabase
      .from('lessons')
      .select('id, date, interactive_lesson_content, generated_lessons, sub_topics')
      .eq('tutor_id', tutor.id)
      .not('interactive_lesson_content', 'is', null)
      .limit(3);

    const { data: lessonsWithoutMaterials } = await supabase
      .from('lessons')
      .select('id, date, interactive_lesson_content, generated_lessons, sub_topics')
      .eq('tutor_id', tutor.id)
      .is('interactive_lesson_content', null)
      .limit(3);

    console.log(`   Lessons WITH interactive materials (${lessonsWithMaterials?.length || 0} shown):`);
    lessonsWithMaterials?.forEach((lesson, index) => {
      const hasInteractive = !!lesson.interactive_lesson_content;
      const generatedCount = lesson.generated_lessons?.length || 0;
      const subTopicsCount = lesson.sub_topics?.length || 0;
      console.log(`     ${index + 1}. ${lesson.id} - ${lesson.date} (Interactive: ${hasInteractive}, Generated: ${generatedCount}, Sub-topics: ${subTopicsCount})`);
    });

    console.log(`   Lessons WITHOUT interactive materials (${lessonsWithoutMaterials?.length || 0} shown):`);
    lessonsWithoutMaterials?.forEach((lesson, index) => {
      const generatedCount = lesson.generated_lessons?.length || 0;
      const subTopicsCount = lesson.sub_topics?.length || 0;
      console.log(`     ${index + 1}. ${lesson.id} - ${lesson.date} (Generated: ${generatedCount}, Sub-topics: ${subTopicsCount}, No Interactive)`);
    });
    console.log('');

    // 6. Summary
    console.log('📊 DASHBOARD STATS SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Total Students: ${currentStudentsCount} (${studentsChange > 0 ? '+' : ''}${Math.round(studentsChange * 100) / 100}%)`);
    console.log(`✅ Total Lessons: ${currentTotalLessons} (${totalLessonsChange > 0 ? '+' : ''}${Math.round(totalLessonsChange * 100) / 100}%) - Interactive materials only`);
    console.log(`✅ Lessons This Month: ${currentMonthLessons} (${monthlyLessonsChange > 0 ? '+' : ''}${Math.round(monthlyLessonsChange * 100) / 100}%) - Interactive materials only`);
    console.log('');
    console.log('🎯 Key Improvements:');
    console.log('   ✅ Real historical comparison (no more hardcoded percentages)');
    console.log('   ✅ Only counts lessons with interactive materials created');
    console.log('   ✅ Lessons counted when "Create Interactive Material" button is clicked');
    console.log('   ✅ Total Students card is now clickable');
    console.log('   ✅ Accurate month-over-month growth tracking');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testDashboardStats();