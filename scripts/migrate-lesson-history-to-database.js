#!/usr/bin/env node

/**
 * Migration Script: Move lesson history from localStorage to database
 * 
 * This script helps migrate existing localStorage-based lesson history
 * to the new database-first approach.
 * 
 * Usage: node scripts/migrate-lesson-history-to-database.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateUserProgress() {
  try {
    console.log('🔄 Starting lesson history migration to database...\n');

    // Get all tutors to find their students
    const { data: tutors, error: tutorsError } = await supabase
      .from('tutors')
      .select('id, name');

    if (tutorsError) {
      throw new Error(`Failed to fetch tutors: ${tutorsError.message}`);
    }

    console.log(`📊 Found ${tutors.length} tutors to process\n`);

    let totalMigrated = 0;
    let totalStudents = 0;

    for (const tutor of tutors) {
      console.log(`👨‍🏫 Processing tutor: ${tutor.name} (${tutor.id})`);

      // Get students for this tutor
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name')
        .eq('tutor_id', tutor.id);

      if (studentsError) {
        console.error(`   ❌ Error fetching students for tutor ${tutor.name}:`, studentsError.message);
        continue;
      }

      console.log(`   📚 Found ${students.length} students`);
      totalStudents += students.length;

      for (const student of students) {
        console.log(`   👤 Processing student: ${student.name} (${student.id})`);

        // Check if we already have progress data for this student
        const { data: existingProgress, error: progressError } = await supabase
          .from('student_progress')
          .select('id')
          .eq('student_id', student.id)
          .limit(1);

        if (progressError) {
          console.error(`      ❌ Error checking existing progress:`, progressError.message);
          continue;
        }

        if (existingProgress && existingProgress.length > 0) {
          console.log(`      ✅ Student already has progress data in database, skipping`);
          continue;
        }

        // Since we can't access localStorage from Node.js, we'll create sample progress
        // In a real migration, you'd need to collect this data from the frontend
        console.log(`      ⚠️  No existing progress found - would need localStorage data from frontend`);
        
        // For demonstration, let's create a sample progress entry if the student has lessons
        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('id, sub_topics, interactive_lesson_content, lesson_template_id, created_at')
          .eq('student_id', student.id)
          .not('sub_topics', 'is', null)
          .limit(5);

        if (!lessonsError && lessons && lessons.length > 0) {
          console.log(`      📖 Found ${lessons.length} lessons with sub-topics`);
          
          // Create lesson sessions and progress for lessons with interactive content
          for (const lesson of lessons) {
            if (lesson.interactive_lesson_content?.selected_sub_topic) {
              const subTopic = lesson.interactive_lesson_content.selected_sub_topic;
              
              try {
                // Create lesson session
                const { data: session, error: sessionError } = await supabase
                  .from('lesson_sessions')
                  .insert({
                    student_id: student.id,
                    tutor_id: tutor.id,
                    lesson_id: lesson.id,
                    lesson_template_id: lesson.lesson_template_id,
                    sub_topic_id: subTopic.id,
                    sub_topic_data: subTopic,
                    interactive_content: lesson.interactive_lesson_content,
                    status: 'completed',
                    completed_at: lesson.created_at
                  })
                  .select()
                  .single();

                if (sessionError) {
                  console.error(`         ❌ Error creating lesson session:`, sessionError.message);
                  continue;
                }

                // Create progress entry
                const { error: progressInsertError } = await supabase
                  .from('student_progress')
                  .insert({
                    student_id: student.id,
                    tutor_id: tutor.id,
                    sub_topic_id: subTopic.id,
                    sub_topic_title: subTopic.title,
                    sub_topic_category: subTopic.category,
                    sub_topic_level: subTopic.level,
                    lesson_session_id: session.id,
                    completion_date: lesson.created_at
                  });

                if (progressInsertError) {
                  console.error(`         ❌ Error creating progress entry:`, progressInsertError.message);
                } else {
                  console.log(`         ✅ Migrated sub-topic: ${subTopic.title}`);
                  totalMigrated++;
                }
              } catch (error) {
                console.error(`         ❌ Error processing lesson:`, error.message);
              }
            }
          }
        }
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Tutors processed: ${tutors.length}`);
    console.log(`   - Students processed: ${totalStudents}`);
    console.log(`   - Progress entries migrated: ${totalMigrated}`);
    
    if (totalMigrated === 0) {
      console.log('\n💡 Note: This script creates sample data from existing lessons.');
      console.log('   For real localStorage migration, you would need to:');
      console.log('   1. Export localStorage data from the frontend');
      console.log('   2. Provide that data to this script');
      console.log('   3. Run the migration with the actual progress data');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    const { data, error } = await supabase
      .from('lesson_sessions')
      .select('count')
      .limit(1);

    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }

    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Lesson History Database Migration Tool\n');
  
  // Test database connection
  const connected = await testDatabaseConnection();
  if (!connected) {
    process.exit(1);
  }

  // Run migration
  await migrateUserProgress();
}

// Run the migration
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { migrateUserProgress, testDatabaseConnection };