// Test script to test the new lesson templates
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables from .env.local
let supabaseUrl, supabaseKey, serviceRoleKey;

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
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

async function testNewTemplates() {
  try {
    console.log('🔍 Testing New Template Structure...');
    console.log('=====================================');
    
    // Get our new templates
    const { data: templates, error: templatesError } = await supabase
      .from('lesson_templates')
      .select('*')
      .eq('is_active', true)
      .not('template_json->lesson_structure', 'is', null)
      .order('created_at', { ascending: false });

    if (templatesError) {
      console.error('❌ Error fetching templates:', templatesError);
      return;
    }

    console.log(`✅ Found ${templates.length} new templates with proper structure:`);
    templates.forEach((template, index) => {
      const sections = template.template_json?.lesson_structure?.length || 0;
      console.log(`   ${index + 1}. ${template.name} (${template.level.toUpperCase()}) - ${sections} sections`);
    });
    console.log('');

    // Get a student to test with
    console.log('🔍 Finding a student to test with...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .limit(1);

    if (studentsError || !students || students.length === 0) {
      console.error('❌ Error fetching students:', studentsError);
      return;
    }

    const student = students[0];
    console.log(`✅ Using student: ${student.name} (Level: ${student.level}, Target: ${student.target_language})`);
    console.log('');

    // Test each new template
    for (const template of templates.slice(0, 3)) { // Test first 3 templates
      console.log(`🚀 Testing Template: ${template.name} (${template.level.toUpperCase()})`);
      console.log('─'.repeat(50));
      
      // Create a test lesson
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          student_id: student.id,
          tutor_id: student.tutor_id,
          date: new Date().toISOString().split('T')[0],
          status: 'scheduled',
          materials: [],
          lesson_template_id: template.id
        })
        .select()
        .single();

      if (lessonError) {
        console.error(`❌ Error creating test lesson:`, lessonError);
        continue;
      }

      console.log(`✅ Created test lesson: ${lesson.id}`);

      // Call the lesson generation function
      try {
        const { data, error } = await supabase.functions.invoke('generate-lesson-plan', {
          body: {
            lesson_id: lesson.id,
            student_id: student.id
          }
        });

        if (error) {
          console.error('❌ Function call error:', error);
        } else {
          console.log('✅ Function response:');
          console.log(`   Success: ${data.success}`);
          console.log(`   Message: ${data.message}`);
          console.log(`   Lessons generated: ${data.lessons?.length || 0}`);
          
          if (data.lessons && data.lessons.length > 0) {
            const generatedLesson = data.lessons[0];
            console.log(`   Generated lesson title: ${generatedLesson.title}`);
            console.log(`   Sub-topics: ${generatedLesson.sub_topics?.length || 0}`);
            
            if (generatedLesson.sub_topics) {
              console.log('   Sub-topic titles:');
              generatedLesson.sub_topics.forEach((st, index) => {
                console.log(`     ${index + 1}. ${st.title}`);
              });
            }

            // Check if the lesson follows the template structure
            const templateStructure = template.template_json.lesson_structure;
            console.log(`   Template sections: ${templateStructure.length}`);
            console.log('   Expected sections:');
            templateStructure.forEach((section, index) => {
              console.log(`     ${index + 1}. ${section.id} (${section.type})`);
            });
          }
        }

        // Clean up - delete the test lesson
        await supabase
          .from('lessons')
          .delete()
          .eq('id', lesson.id);

        console.log('✅ Test lesson cleaned up');
        
      } catch (funcError) {
        console.error('❌ Function invocation failed:', funcError);
      }
      
      console.log('');
    }

    console.log('🎉 Template testing completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testNewTemplates();