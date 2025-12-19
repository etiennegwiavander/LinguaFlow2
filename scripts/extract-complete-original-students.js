const fs = require('fs');

function extractCompleteStudentData() {
  console.log('🔍 Extracting complete student data from original git commit...\n');

  try {
    // Read the complete original file
    const fileContent = fs.readFileSync('temp_complete_original.sql', 'utf8');
    
    // Find the students INSERT statement
    const studentsInsertMatch = fileContent.match(/INSERT INTO "public"\."students"[^;]+;/s);
    
    if (!studentsInsertMatch) {
      console.error('❌ Could not find students INSERT statement');
      return;
    }

    const studentsInsert = studentsInsertMatch[0];
    
    // Extract all student records (lines that start with parentheses and contain student data)
    const studentLines = studentsInsert
      .split('\n')
      .filter(line => line.trim().startsWith('(') && line.includes("', '"))
      .map(line => line.trim().replace(/,$/, ''));

    console.log(`📊 Found ${studentLines.length} student records in original commit\n`);

    // Parse each student record to extract ID, tutor_id, and name
    const originalStudents = [];
    
    studentLines.forEach((line, index) => {
      try {
        // Remove the outer parentheses and split by comma, but be careful with quoted strings
        const cleanLine = line.substring(1, line.length - 1); // Remove ( and )
        
        // Split by comma but respect quoted strings
        const parts = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';
        
        for (let i = 0; i < cleanLine.length; i++) {
          const char = cleanLine[i];
          
          if ((char === '"' || char === "'") && !inQuotes) {
            inQuotes = true;
            quoteChar = char;
            current += char;
          } else if (char === quoteChar && inQuotes) {
            inQuotes = false;
            quoteChar = '';
            current += char;
          } else if (char === ',' && !inQuotes) {
            parts.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        if (current.trim()) {
          parts.push(current.trim());
        }

        if (parts.length >= 3) {
          const student_id = parts[0].replace(/'/g, '');
          const tutor_id = parts[1].replace(/'/g, '');
          const student_name = parts[2].replace(/'/g, '');
          
          originalStudents.push({
            student_id,
            tutor_id,
            student_name
          });
          
          console.log(`${index + 1}. ${student_name} -> Tutor: ${tutor_id.substring(0, 8)}...`);
        }
      } catch (error) {
        console.error(`❌ Error parsing line ${index + 1}:`, error.message);
      }
    });

    console.log(`\n✅ Successfully extracted ${originalStudents.length} student-tutor relationships`);

    // Write the complete mapping to a file for the restoration script
    const mappingCode = `// Complete original student-tutor relationships from git commit 768a25044d279569b12f43c43cf6a8b94575da89
const originalStudentTutorMappings = ${JSON.stringify(originalStudents, null, 2)};

module.exports = originalStudentTutorMappings;`;

    fs.writeFileSync('scripts/complete-original-student-mappings.js', mappingCode);
    console.log('📝 Saved complete mappings to scripts/complete-original-student-mappings.js');

    // Group by tutor to show distribution
    console.log('\n📊 Original distribution by tutor:');
    const tutorGroups = {};
    originalStudents.forEach(student => {
      if (!tutorGroups[student.tutor_id]) {
        tutorGroups[student.tutor_id] = [];
      }
      tutorGroups[student.tutor_id].push(student.student_name);
    });

    Object.entries(tutorGroups)
      .sort(([,a], [,b]) => b.length - a.length)
      .forEach(([tutorId, students]) => {
        console.log(`  ${tutorId.substring(0, 8)}...: ${students.length} students (${students.slice(0, 3).join(', ')}${students.length > 3 ? '...' : ''})`);
      });

    return originalStudents;

  } catch (error) {
    console.error('❌ Error extracting student data:', error);
  }
}

extractCompleteStudentData();