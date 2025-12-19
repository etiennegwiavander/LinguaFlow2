require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const originalMappings = require('./complete-original-student-mappings.js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function compareOriginalVsCurrentStudents() {
  console.log('🔍 Comparing original vs current students...\n');

  try {
    // Get all current students
    const { data: currentStudents, error: currentError } = await supabase
      .from('students')
      .select('id, name, tutor_id, created_at')
      .order('created_at', { ascending: true });

    if (currentError) {
      console.error('❌ Error fetching current students:', currentError);
      return;
    }

    console.log(`📊 COMPARISON SUMMARY:`);
    console.log(`   Original (git commit): ${originalMappings.length} students`);
    console.log(`   Current (database): ${currentStudents.length} students`);
    console.log(`   Difference: +${currentStudents.length - originalMappings.length} students\n`);

    // Create sets for comparison
    const originalIds = new Set(originalMappings.map(s => s.student_id));
    const currentIds = new Set(currentStudents.map(s => s.id));

    // Find students that exist in original but not in current (deleted)
    const deletedStudents = originalMappings.filter(s => !currentIds.has(s.student_id));
    
    // Find students that exist in current but not in original (added later)
    const addedStudents = currentStudents.filter(s => !originalIds.has(s.id));

    // Find students that exist in both (should be restored)
    const existingStudents = originalMappings.filter(s => currentIds.has(s.student_id));

    console.log(`🔍 DETAILED ANALYSIS:`);
    console.log(`   ✅ Students to restore: ${existingStudents.length}`);
    console.log(`   ➕ Students added after commit: ${addedStudents.length}`);
    console.log(`   ❌ Students deleted since commit: ${deletedStudents.length}\n`);

    if (deletedStudents.length > 0) {
      console.log(`❌ DELETED STUDENTS (existed in original but not now):`);
      deletedStudents.forEach(student => {
        console.log(`   - ${student.student_name} (${student.student_id})`);
      });
      console.log('');
    }

    if (addedStudents.length > 0) {
      console.log(`➕ STUDENTS ADDED AFTER ORIGINAL COMMIT:`);
      addedStudents.slice(0, 20).forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.name} (created: ${student.created_at.split('T')[0]})`);
      });
      if (addedStudents.length > 20) {
        console.log(`   ... and ${addedStudents.length - 20} more`);
      }
      console.log('');
    }

    console.log(`✅ STUDENTS THAT CAN BE RESTORED TO ORIGINAL TUTORS:`);
    existingStudents.forEach((student, index) => {
      console.log(`   ${index + 1}. ${student.student_name} -> Tutor ${student.tutor_id.substring(0, 8)}...`);
    });

    console.log(`\n🎯 RECOMMENDATION:`);
    console.log(`   1. Restore ${existingStudents.length} original students to their original tutors`);
    console.log(`   2. Keep ${addedStudents.length} newer students with their current tutors`);
    console.log(`   3. This preserves all data while fixing the original relationships`);

    // Save the analysis for the restoration script
    const analysisData = {
      originalMappings,
      existingStudents,
      addedStudents,
      deletedStudents,
      currentStudents
    };

    require('fs').writeFileSync('scripts/student-analysis.json', JSON.stringify(analysisData, null, 2));
    console.log(`\n📝 Saved analysis to scripts/student-analysis.json`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

compareOriginalVsCurrentStudents();