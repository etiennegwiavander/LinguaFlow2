require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Original student-tutor relationships from git commit 768a25044d279569b12f43c43cf6a8b94575da89
const originalStudentTutorMappings = [
  { student_id: '6a8dbafa-b09c-433d-9bac-242943a9b0d9', tutor_id: 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', student_name: 'Loisel' },
  { student_id: 'c6564274-1307-4cba-95ca-929759cf7117', tutor_id: '45619a2b-5490-4fb4-87db-96c8dd4b1d9b', student_name: 'test' },
  { student_id: '2a28b7dc-8ab1-4bda-91c4-4371cd52a00b', tutor_id: 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', student_name: 'Rafal' },
  { student_id: '6bf315b9-4eee-4346-88b9-c8584f54f650', tutor_id: 'f1697f1b-756a-446c-a285-b317ee0195eb', student_name: 'Ebua' },
  { student_id: 'aa3f4b94-b50f-422d-ab8f-849ec08bc3a0', tutor_id: '0dc0e0d9-6b52-4605-a63f-5dd920150b64', student_name: 'Alexandra' },
  { student_id: '0424db41-45c5-4b6e-a111-81ebfa32576d', tutor_id: 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', student_name: 'Fausta' },
  { student_id: '5dd0d10c-b984-47bf-bcfa-f2f8245f60a5', tutor_id: 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', student_name: 'Etienne' },
  { student_id: 'cf038b11-791b-4306-b5e3-1870371a60f3', tutor_id: 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', student_name: 'Pawel' },
  { student_id: 'e43466be-2cab-4286-afb9-ad48afc3373a', tutor_id: 'f1697f1b-756a-446c-a285-b317ee0195eb', student_name: 'Agnieska' },
  { student_id: '8dfb62f6-39aa-4cf9-8b7c-4affda686121', tutor_id: 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', student_name: 'Krzysztof' },
  { student_id: '3ea17d1d-d785-4d99-97c0-d7f74ece9db7', tutor_id: 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', student_name: 'Julia' },
  { student_id: '2caa2254-0d37-4840-b4b4-a72db6f39a2d', tutor_id: '6f8173dc-a917-48a3-a7c4-65f232a4d4c6', student_name: 'Fritz' },
  { student_id: '924c7c33-1869-4216-9bd1-aa8ce58e5073', tutor_id: 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', student_name: 'test' },
  { student_id: 'eb64a36e-2d00-4a7a-81a6-a7324f8535bf', tutor_id: 'cda1fc60-06b9-4482-a897-7483906a9ca7', student_name: 'max' },
  { student_id: '2473f935-c707-416e-bdbd-9fc50db155c6', tutor_id: 'ce495018-2be1-4661-a438-a48d2417ec43', student_name: 'Lloyd Farrel' },
  { student_id: '15a10d57-0663-400c-8582-d02f4a257f01', tutor_id: '71b68f1e-159b-4940-8c4a-a928b5f3b60f', student_name: 'testing' },
  { student_id: '2ddbe16f-ba10-4995-bc0f-1d647f3d105d', tutor_id: 'd7b5eb68-e28f-4041-a7cd-86119250b737', student_name: 'Petit' },
  { student_id: '8259ea61-c7c2-415d-ab4d-0d6bfb317758', tutor_id: '71f6b53d-5f13-45ac-a183-a5ada55a0b4d', student_name: 'Cihad' },
  { student_id: '3c7063c3-9a5c-4ac7-ac5f-40744fbf4b03', tutor_id: '92162225-bbfd-454d-bc08-a105df5b6fc4', student_name: 'John Stones' },
  { student_id: 'df15a574-4c6e-4c56-ae81-64a5b8f32cdd', tutor_id: '5f8ce6ae-c01a-499d-b20d-062b02a974ed', student_name: 'Tony' },
  { student_id: 'efd9f910-db8a-4b13-8a6d-215b2609d19b', tutor_id: 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', student_name: 'Ewa' },
  { student_id: '494618d1-0e8e-4060-b194-07f49d620ec2', tutor_id: 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', student_name: 'Ula' },
  { student_id: '3e9a5fe6-8024-44b8-937e-a93a0369c121', tutor_id: 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', student_name: 'Ula' },
  { student_id: 'ea2cc6c3-5681-4f74-a30c-270b0d4180ac', tutor_id: 'f1697f1b-756a-446c-a285-b317ee0195eb', student_name: 'YIGIT' },
  { student_id: '0e7a34cf-aa63-4cf0-adee-7a80deb36360', tutor_id: '508d03b0-2a05-445e-84f0-a76ebb72be4b', student_name: 'Eva Mossol' },
  { student_id: '231d5e2b-8b56-408d-b396-5bde7ef05ea2', tutor_id: 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', student_name: 'test 2' }
];

async function restoreOriginalStudentTutorRelationships() {
  console.log('🔄 RESTORING ORIGINAL STUDENT-TUTOR RELATIONSHIPS...\n');
  console.log('⚠️  This will undo the changes made during the lesson sharing fix');
  console.log('✅ Each student will be returned to their original tutor\n');

  try {
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    console.log(`📊 Processing ${originalStudentTutorMappings.length} student-tutor relationships...\n`);

    for (const mapping of originalStudentTutorMappings) {
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
          console.log(`⚠️  Student ${mapping.student_name} (${mapping.student_id}) not found - may have been deleted`);
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
    console.log(`✅ Successfully restored: ${successCount} students`);
    console.log(`❌ Errors encountered: ${errorCount} students`);

    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach(error => {
        console.log(`  - ${error.student}: ${error.error}`);
      });
    }

    // Verify the restoration
    console.log('\n🔍 VERIFICATION - Students by tutor after restoration:');
    const { data: verificationStudents, error: verifyError } = await supabase
      .from('students')
      .select(`
        tutor_id,
        name,
        tutors!inner(email)
      `);

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
        .slice(0, 10)
        .forEach(([email, students]) => {
          console.log(`  ${email}: ${students.length} students (${students.slice(0, 3).join(', ')}${students.length > 3 ? '...' : ''})`);
        });
    }

    console.log('\n🎉 RESTORATION COMPLETE!');
    console.log('Each student is now back with their original tutor.');
    console.log('The lesson sharing functionality should still work correctly.');

  } catch (error) {
    console.error('❌ Unexpected error during restoration:', error);
  }
}

// Clean up temp file
const fs = require('fs');
if (fs.existsSync('temp_original.sql')) {
  fs.unlinkSync('temp_original.sql');
  console.log('🧹 Cleaned up temporary file');
}

restoreOriginalStudentTutorRelationships();