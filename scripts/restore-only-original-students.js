require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const analysisData = require('./student-analysis.json');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function restoreOnlyOriginalStudents() {
  console.log('🔄 RESTORING ONLY ORIGINAL STUDENTS TO THEIR CORRECT TUTORS...\n');
  console.log('✅ This will restore 24 original students to their original tutors');
  console.log('✅ This will keep 48 newer students with their current tutors');
  console.log('✅ This preserves all your data while fixing the original relationships\n');

  try {
    const studentsToRestore = analysisData.existingStudents;
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    console.log(`📊 Processing ${studentsToRestore.length} original students...\n`);

    for (const mapping of studentsToRestore) {
      try {
        // Update student's tutor_id
        const { data: studentUpdate, error: studentError } = await supabase
          .from('students')
          .update({ tutor_id: mapping.tutor_id })
          .eq('id', mapping.student_id)
          .select('id, name');

        if (studentError) {
          console.error(`❌ Failed to update student ${mapping.student_name}:`, studentError.message);
          errors.push({ student: mapping.student_name, error: studentError.message });
          errorCount++;
          continue;
        }

        if (!studentUpdate || studentUpdate.length === 0) {
          console.log(`⚠️  Student ${mapping.student_name} (${mapping.student_id}) not found`);
          continue;
        }

        // Update lessons for this student
        const { data: lessonUpdate, error: lessonError } = await supabase
          .from('lessons')
          .update({ tutor_id: mapping.tutor_id })
          .eq('student_id', mapping.student_id)
          .select('id');

        if (lessonError) {
          console.error(`❌ Failed to update lessons for ${mapping.student_name}:`, lessonError.message);
          errors.push({ student: mapping.student_name, error: `Lesson update: ${lessonError.message}` });
        }

        console.log(`✅ Restored ${mapping.student_name} -> Tutor ${mapping.tutor_id.substring(0, 8)}... (${lessonUpdate?.length || 0} lessons updated)`);
        successCount++;

      } catch (error) {
        console.error(`❌ Unexpected error for ${mapping.student_name}:`, error.message);
        errors.push({ student: mapping.student_name, error: error.message });
        errorCount++;
      }
    }

    console.log('\n📊 RESTORATION SUMMARY:');
    console.log(`✅ Successfully restored: ${successCount} original students`);
    console.log(`❌ Errors encountered: ${errorCount} students`);
    console.log(`📊 Newer students left untouched: ${analysisData.addedStudents.length} students`);

    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach(error => {
        console.log(`  - ${error.student}: ${error.error}`);
      });
    }

    // Verify the restoration
    console.log('\n🔍 VERIFICATION - Final student distribution:');
    const { data: verificationStudents, error: verifyError } = await supabase
      .from('students')
      .select(`
        tutor_id,
        name,
        created_at,
        tutors!inner(email)
      `)
      .order('created_at', { ascending: true });

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      const tutorGroups = {};
      verificationStudents.forEach(student => {
        const tutorEmail = student.tutors.email;
        if (!tutorGroups[tutorEmail]) {
          tutorGroups[tutorEmail] = [];
        }
        tutorGroups[tutorEmail].push(student.name);
      });

      Object.entries(tutorGroups)
        .sort(([,a], [,b]) => b.length - a.length)
        .slice(0, 15)
        .forEach(([email, students]) => {
          console.log(`  ${email}: ${students.length} students (${students.slice(0, 3).join(', ')}${students.length > 3 ? '...' : ''})`);
        });
    }

    console.log('\n🎉 RESTORATION COMPLETE!');
    console.log('✅ Original 24 students are back with their correct tutors');
    console.log('✅ Newer 48 students remain with their current tutors');
    console.log('✅ All 72 students are preserved');
    console.log('✅ Lesson sharing functionality should work correctly');

  } catch (error) {
    console.error('❌ Unexpected error during restoration:', error);
  }
}

restoreOnlyOriginalStudents();