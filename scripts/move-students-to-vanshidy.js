require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function moveStudentsToVanshidy() {
  console.log('🔄 Moving students from sachinmalusare207@gmail.com to vanshidy@gmail.com...\n');

  try {
    // First, get the tutor IDs for both emails
    const { data: tutors, error: tutorsError } = await supabase
      .from('tutors')
      .select('id, email')
      .in('email', ['sachinmalusare207@gmail.com', 'vanshidy@gmail.com']);

    if (tutorsError) {
      console.error('❌ Error fetching tutors:', tutorsError);
      return;
    }

    const sachinTutor = tutors.find(t => t.email === 'sachinmalusare207@gmail.com');
    const vanshidyTutor = tutors.find(t => t.email === 'vanshidy@gmail.com');

    if (!sachinTutor) {
      console.error('❌ Could not find tutor: sachinmalusare207@gmail.com');
      return;
    }

    if (!vanshidyTutor) {
      console.error('❌ Could not find tutor: vanshidy@gmail.com');
      return;
    }

    console.log(`📋 Source tutor: ${sachinTutor.email} (${sachinTutor.id})`);
    console.log(`📋 Target tutor: ${vanshidyTutor.email} (${vanshidyTutor.id})\n`);

    // Get all students currently under sachinmalusare207@gmail.com
    const { data: studentsToMove, error: studentsError } = await supabase
      .from('students')
      .select('id, name, level, target_language, native_language')
      .eq('tutor_id', sachinTutor.id);

    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError);
      return;
    }

    if (studentsToMove.length === 0) {
      console.log('✅ No students found under sachinmalusare207@gmail.com');
      return;
    }

    console.log(`📊 Found ${studentsToMove.length} students to move:\n`);
    studentsToMove.forEach((student, index) => {
      console.log(`${index + 1}. ${student.name} (${student.level || 'No level'}, ${student.target_language || 'No target lang'})`);
    });

    console.log('\n🔄 Moving students...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const student of studentsToMove) {
      try {
        // Update student's tutor_id
        const { error: studentUpdateError } = await supabase
          .from('students')
          .update({ tutor_id: vanshidyTutor.id })
          .eq('id', student.id);

        if (studentUpdateError) {
          console.error(`❌ Failed to move student ${student.name}:`, studentUpdateError.message);
          errorCount++;
          continue;
        }

        // Update lessons for this student
        const { data: lessonUpdates, error: lessonUpdateError } = await supabase
          .from('lessons')
          .update({ tutor_id: vanshidyTutor.id })
          .eq('student_id', student.id)
          .select('id');

        if (lessonUpdateError) {
          console.error(`❌ Failed to update lessons for ${student.name}:`, lessonUpdateError.message);
        }

        console.log(`✅ Moved ${student.name} -> vanshidy@gmail.com (${lessonUpdates?.length || 0} lessons updated)`);
        successCount++;

      } catch (error) {
        console.error(`❌ Unexpected error moving ${student.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 MOVE SUMMARY:');
    console.log(`✅ Successfully moved: ${successCount} students`);
    console.log(`❌ Errors encountered: ${errorCount} students`);

    // Verify the move
    console.log('\n🔍 VERIFICATION:');
    
    // Check students under sachinmalusare207@gmail.com (should be 0)
    const { data: remainingStudents, error: remainingError } = await supabase
      .from('students')
      .select('name')
      .eq('tutor_id', sachinTutor.id);

    if (!remainingError) {
      console.log(`📊 Students remaining under sachinmalusare207@gmail.com: ${remainingStudents.length}`);
    }

    // Check students under vanshidy@gmail.com
    const { data: vanshidyStudents, error: vanshidyError } = await supabase
      .from('students')
      .select('name')
      .eq('tutor_id', vanshidyTutor.id);

    if (!vanshidyError) {
      console.log(`📊 Students now under vanshidy@gmail.com: ${vanshidyStudents.length}`);
      console.log(`   Names: ${vanshidyStudents.map(s => s.name).join(', ')}`);
    }

    console.log('\n🎉 MOVE COMPLETE!');
    console.log('All students have been moved from sachinmalusare207@gmail.com to vanshidy@gmail.com');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

moveStudentsToVanshidy();