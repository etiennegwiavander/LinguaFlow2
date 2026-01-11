/**
 * Diagnose Empty Categories Issue
 * 
 * This script checks for lessons with empty categories and determines
 * if they are old (before fix) or new (after fix).
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function diagnoseEmptyCategories() {
  console.log('🔍 Diagnosing Empty Category Issues\n');

  try {
    // Find all lessons with sub_topics
    console.log('📋 Step 1: Finding all lessons with sub-topics...');
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*, students(*)')
      .not('sub_topics', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (lessonsError) {
      console.error('❌ Error fetching lessons:', lessonsError);
      return;
    }

    console.log(`✅ Found ${lessons.length} lessons with sub-topics\n`);

    // Analyze each lesson for empty categories
    let totalLessons = 0;
    let totalSubTopics = 0;
    let emptyCategories = [];
    let studentIssues = {};

    for (const lesson of lessons) {
      totalLessons++;
      const subTopics = lesson.sub_topics || [];
      const student = lesson.students;
      
      for (const subTopic of subTopics) {
        totalSubTopics++;
        
        if (!subTopic.category || subTopic.category.trim() === '') {
          emptyCategories.push({
            lessonId: lesson.id,
            lessonCreated: lesson.created_at,
            studentName: student?.name || 'Unknown',
            studentId: student?.id || 'Unknown',
            subTopicTitle: subTopic.title,
            subTopicId: subTopic.id
          });

          // Track by student
          const studentKey = student?.id || 'unknown';
          if (!studentIssues[studentKey]) {
            studentIssues[studentKey] = {
              name: student?.name || 'Unknown',
              count: 0,
              lessons: []
            };
          }
          studentIssues[studentKey].count++;
          if (!studentIssues[studentKey].lessons.includes(lesson.id)) {
            studentIssues[studentKey].lessons.push(lesson.id);
          }
        }
      }
    }

    // Report findings
    console.log('='.repeat(60));
    console.log('📊 DIAGNOSIS RESULTS');
    console.log('='.repeat(60) + '\n');

    console.log(`Total Lessons Checked: ${totalLessons}`);
    console.log(`Total Sub-Topics Checked: ${totalSubTopics}`);
    console.log(`Empty Categories Found: ${emptyCategories.length}\n`);

    if (emptyCategories.length === 0) {
      console.log('🎉 No empty categories found!');
      console.log('✅ All sub-topics have valid categories.\n');
      return;
    }

    // Show affected students
    console.log('👥 Affected Students:\n');
    Object.entries(studentIssues).forEach(([studentId, info]) => {
      console.log(`   • ${info.name}`);
      console.log(`     Empty categories: ${info.count}`);
      console.log(`     Affected lessons: ${info.lessons.length}`);
      console.log('');
    });

    // Show recent empty categories
    console.log('📋 Recent Empty Categories (last 10):\n');
    emptyCategories.slice(0, 10).forEach((issue, index) => {
      console.log(`   ${index + 1}. "${issue.subTopicTitle}"`);
      console.log(`      Student: ${issue.studentName}`);
      console.log(`      Lesson Created: ${new Date(issue.lessonCreated).toLocaleString()}`);
      console.log(`      Lesson ID: ${issue.lessonId.substring(0, 8)}...`);
      console.log('');
    });

    // Check if these are old or new lessons
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentEmptyCategories = emptyCategories.filter(issue => 
      new Date(issue.lessonCreated) > oneHourAgo
    );

    console.log('⏰ Timeline Analysis:\n');
    console.log(`   Lessons created in last hour: ${recentEmptyCategories.length}`);
    console.log(`   Older lessons: ${emptyCategories.length - recentEmptyCategories.length}\n`);

    if (recentEmptyCategories.length > 0) {
      console.log('❌ CRITICAL: Empty categories found in RECENT lessons!');
      console.log('   This means the fix may not be deployed or not working.\n');
      console.log('   Recent lessons with empty categories:');
      recentEmptyCategories.forEach(issue => {
        console.log(`      • "${issue.subTopicTitle}" (${new Date(issue.lessonCreated).toLocaleString()})`);
      });
      console.log('');
    } else {
      console.log('✅ GOOD: All empty categories are from OLD lessons.');
      console.log('   The fix is working for new lessons.\n');
      console.log('💡 Recommendation: These are old lessons generated before the fix.');
      console.log('   Options:');
      console.log('   1. Leave them as-is (tutors can manually select category)');
      console.log('   2. Run a database migration to fix old data');
      console.log('   3. Regenerate lessons for affected students\n');
    }

    // Provide specific student info for the user
    console.log('🎯 For the Student in Your Screenshot:\n');
    console.log('   Based on the titles shown:');
    console.log('   • "Building Simple Travel Sentences"');
    console.log('   • "Pronunciation Practice for Polish Speakers"');
    console.log('   • "Understanding Basic Tenses for Travel Conversations"');
    console.log('   • "Essential Travel Vocabulary for Meingel"\n');
    
    // Find the student with these titles
    const targetStudent = Object.entries(studentIssues).find(([_, info]) => 
      info.name.toLowerCase().includes('meingel') || 
      info.name.toLowerCase().includes('mingel')
    );

    if (targetStudent) {
      const [studentId, info] = targetStudent;
      console.log(`   Student Found: ${info.name}`);
      console.log(`   Empty categories: ${info.count}`);
      console.log(`   Affected lessons: ${info.lessons.length}\n`);
      
      console.log('   💡 Solution:');
      console.log('   1. Deploy the fix (if not already deployed)');
      console.log('   2. Generate NEW lessons for this student');
      console.log('   3. The new lessons will have correct categories\n');
    }

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    console.error(error);
  }
}

// Run the diagnosis
diagnoseEmptyCategories();
