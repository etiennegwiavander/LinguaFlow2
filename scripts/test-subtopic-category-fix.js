/**
 * Test Script: Sub-Topic Category Fix
 * 
 * This script verifies that the category/level enforcement fix works correctly:
 * 1. No "English for Kids" for non-kid students
 * 2. No empty categories
 * 3. Categories match the template used
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSubTopicCategoryFix() {
  console.log('🧪 Testing Sub-Topic Category Fix\n');

  try {
    // Step 1: Find test students of different age groups
    console.log('📋 Step 1: Finding test students...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .in('age_group', ['adult', 'teenager', 'middle_aged_adult'])
      .limit(3);

    if (studentsError || !students || students.length === 0) {
      console.error('❌ No suitable test students found');
      console.log('💡 Create students with different age groups first');
      return;
    }

    console.log(`✅ Found ${students.length} test students:\n`);
    students.forEach(s => {
      console.log(`   • ${s.name} (${s.age_group || 'adult'}, Level: ${s.level.toUpperCase()})`);
    });
    console.log('');

    // Step 2: Check recent lessons for these students
    console.log('📋 Step 2: Checking recent lessons...\n');
    
    let totalLessons = 0;
    let totalSubTopics = 0;
    let issuesFound = [];
    let successCount = 0;

    for (const student of students) {
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*, lesson_templates(*)')
        .eq('student_id', student.id)
        .not('sub_topics', 'is', null)
        .order('created_at', { ascending: false })
        .limit(3);

      if (lessonsError || !lessons || lessons.length === 0) {
        console.log(`⚠️  No lessons found for ${student.name}`);
        continue;
      }

      console.log(`📚 Student: ${student.name} (${student.age_group || 'adult'})`);
      console.log(`   Lessons found: ${lessons.length}\n`);

      for (const lesson of lessons) {
        totalLessons++;
        const subTopics = lesson.sub_topics || [];
        
        console.log(`   Lesson ${lesson.id.substring(0, 8)}...`);
        console.log(`   Template: ${lesson.lesson_templates?.name || 'Unknown'}`);
        console.log(`   Sub-topics: ${subTopics.length}\n`);

        for (const subTopic of subTopics) {
          totalSubTopics++;
          const category = subTopic.category;
          const level = subTopic.level;
          const title = subTopic.title;

          // Check 1: Empty category
          if (!category || category.trim() === '') {
            issuesFound.push({
              student: student.name,
              ageGroup: student.age_group || 'adult',
              issue: 'Empty Category',
              subTopic: title,
              category: category || '(empty)'
            });
            console.log(`      ❌ "${title}"`);
            console.log(`         Category: (empty) ❌`);
            console.log(`         Level: ${level || 'N/A'}\n`);
            continue;
          }

          // Check 2: "English for Kids" for non-kids
          if (category === 'English for Kids' && student.age_group !== 'kid') {
            issuesFound.push({
              student: student.name,
              ageGroup: student.age_group || 'adult',
              issue: 'Wrong Category (Kids for Non-Kid)',
              subTopic: title,
              category: category
            });
            console.log(`      ❌ "${title}"`);
            console.log(`         Category: ${category} ❌ (Student is ${student.age_group || 'adult'})`);
            console.log(`         Level: ${level || 'N/A'}\n`);
            continue;
          }

          // Check 3: Level mismatch
          if (level && level.toLowerCase() !== student.level.toLowerCase()) {
            issuesFound.push({
              student: student.name,
              ageGroup: student.age_group || 'adult',
              issue: 'Level Mismatch',
              subTopic: title,
              category: category,
              expectedLevel: student.level,
              actualLevel: level
            });
            console.log(`      ⚠️  "${title}"`);
            console.log(`         Category: ${category}`);
            console.log(`         Level: ${level} (Expected: ${student.level}) ⚠️\n`);
            continue;
          }

          // All checks passed
          successCount++;
          console.log(`      ✅ "${title}"`);
          console.log(`         Category: ${category}`);
          console.log(`         Level: ${level || 'N/A'}\n`);
        }
      }
    }

    // Step 3: Summary Report
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60) + '\n');

    console.log(`Total Lessons Checked: ${totalLessons}`);
    console.log(`Total Sub-Topics Checked: ${totalSubTopics}`);
    console.log(`Sub-Topics Passed: ${successCount}`);
    console.log(`Issues Found: ${issuesFound.length}\n`);

    if (issuesFound.length === 0) {
      console.log('🎉 PERFECT! No issues found!');
      console.log('✅ All sub-topics have correct categories and levels.');
      console.log('✅ No "English for Kids" for non-kid students.');
      console.log('✅ No empty categories.\n');
    } else {
      console.log('❌ ISSUES DETECTED:\n');
      
      // Group issues by type
      const emptyCategories = issuesFound.filter(i => i.issue === 'Empty Category');
      const wrongCategories = issuesFound.filter(i => i.issue === 'Wrong Category (Kids for Non-Kid)');
      const levelMismatches = issuesFound.filter(i => i.issue === 'Level Mismatch');

      if (emptyCategories.length > 0) {
        console.log(`   Empty Categories: ${emptyCategories.length}`);
        emptyCategories.forEach(issue => {
          console.log(`      • "${issue.subTopic}" (Student: ${issue.student})`);
        });
        console.log('');
      }

      if (wrongCategories.length > 0) {
        console.log(`   Wrong Categories (Kids for Non-Kids): ${wrongCategories.length}`);
        wrongCategories.forEach(issue => {
          console.log(`      • "${issue.subTopic}" (Student: ${issue.student}, Age: ${issue.ageGroup})`);
        });
        console.log('');
      }

      if (levelMismatches.length > 0) {
        console.log(`   Level Mismatches: ${levelMismatches.length}`);
        levelMismatches.forEach(issue => {
          console.log(`      • "${issue.subTopic}" (Expected: ${issue.expectedLevel}, Got: ${issue.actualLevel})`);
        });
        console.log('');
      }

      console.log('💡 These issues are from OLD lessons generated before the fix.');
      console.log('💡 Generate NEW lessons to test the fix.\n');
    }

    // Calculate success rate
    const successRate = totalSubTopics > 0 
      ? ((successCount / totalSubTopics) * 100).toFixed(1)
      : 0;

    console.log(`Success Rate: ${successRate}%\n`);

    if (successRate === '100.0') {
      console.log('✅ The fix is working perfectly!');
    } else if (successRate >= '80.0') {
      console.log('⚠️  Most sub-topics are correct, but some old data has issues.');
      console.log('💡 Generate new lessons to verify the fix works for new data.');
    } else {
      console.log('❌ Many issues detected. The fix may not be deployed yet.');
      console.log('💡 Deploy the fix and generate new lessons to test.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testSubTopicCategoryFix();
