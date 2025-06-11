import { serve } from "jsr:@std/http@0.224.0/server"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface UpcomingLesson {
  id: string;
  student_id: string;
  tutor_id: string;
  date: string;
  status: string;
  generated_lessons: string[] | null;
  student: {
    name: string;
    target_language: string;
  };
}

serve(async (req) => {
  console.log('🚀 Schedule lesson generation function called:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight');
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔧 Creating Supabase client...');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    // Verify authorization - this should be called by cron or with service role key
    const authHeader = req.headers.get('Authorization')
    const expectedServiceKey = Deno.env.get('SERVICE_ROLE_KEY')
    
    if (!authHeader || !expectedServiceKey) {
      throw new Error('Missing authorization or service key not configured')
    }

    const providedKey = authHeader.replace('Bearer ', '')
    if (providedKey !== expectedServiceKey) {
      throw new Error('Unauthorized - invalid service key')
    }

    console.log('✅ Service role authentication verified');

    // Calculate time window: lessons starting in the next 60 minutes
    const now = new Date()
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

    console.log('🔍 Searching for upcoming lessons between:', now.toISOString(), 'and', oneHourFromNow.toISOString());

    // Query for upcoming lessons that need AI generation
    const { data: upcomingLessons, error: lessonsError } = await supabaseClient
      .from('lessons')
      .select(`
        id,
        student_id,
        tutor_id,
        date,
        status,
        generated_lessons,
        student:students(
          name,
          target_language
        )
      `)
      .eq('status', 'upcoming')
      .gte('date', now.toISOString())
      .lte('date', oneHourFromNow.toISOString())
      .is('generated_lessons', null) // Only lessons without generated content

    if (lessonsError) {
      console.error('❌ Error fetching upcoming lessons:', lessonsError);
      throw new Error(`Failed to fetch upcoming lessons: ${lessonsError.message}`)
    }

    const lessons = upcomingLessons as UpcomingLesson[]
    console.log(`📚 Found ${lessons.length} lessons needing AI generation`);

    if (lessons.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No lessons found that need AI generation',
          lessons_processed: 0,
          timestamp: now.toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Process each lesson
    const results = []
    let successCount = 0
    let errorCount = 0

    for (const lesson of lessons) {
      try {
        console.log(`🎯 Processing lesson ${lesson.id} for student ${lesson.student.name}`);

        // Call the generate-lesson-plan function
        const generateResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-lesson-plan`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${expectedServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lesson_id: lesson.id
          }),
        })

        if (!generateResponse.ok) {
          const errorData = await generateResponse.text()
          throw new Error(`Generation failed: ${errorData}`)
        }

        const generateResult = await generateResponse.json()
        
        if (generateResult.success) {
          console.log(`✅ Successfully generated lessons for ${lesson.student.name}`);
          successCount++
          results.push({
            lesson_id: lesson.id,
            student_name: lesson.student.name,
            status: 'success',
            lessons_count: generateResult.lessons?.length || 0
          })
        } else {
          throw new Error(generateResult.error || 'Unknown generation error')
        }

      } catch (error) {
        console.error(`❌ Failed to generate lessons for lesson ${lesson.id}:`, error);
        errorCount++
        results.push({
          lesson_id: lesson.id,
          student_name: lesson.student.name,
          status: 'error',
          error: error.message
        })
      }

      // Add a small delay between requests to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`📊 Processing complete: ${successCount} successful, ${errorCount} errors`);

    // Log the scheduling activity
    try {
      await supabaseClient
        .from('deletion_logs') // Reusing this table for general system logs
        .insert({
          tutor_id: '00000000-0000-0000-0000-000000000000', // System user
          action: 'automated_lesson_generation',
          details: {
            total_lessons: lessons.length,
            successful: successCount,
            errors: errorCount,
            results: results,
            timestamp: now.toISOString()
          }
        })
    } catch (logError) {
      console.error('⚠️ Failed to log scheduling activity:', logError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${lessons.length} lessons: ${successCount} successful, ${errorCount} errors`,
        lessons_processed: lessons.length,
        successful: successCount,
        errors: errorCount,
        results: results,
        timestamp: now.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Schedule lesson generation error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})