import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔔 Starting lesson reminder scheduling...')

    // Get lesson reminder timing from settings
    const { data: settingsData } = await supabaseClient
      .from('email_settings')
      .select('setting_value')
      .eq('setting_key', 'lesson_reminder_timing')
      .maybeSingle()

    const reminderMinutes = settingsData?.setting_value?.minutes || 15

    // Calculate time window for upcoming lessons
    const now = new Date()
    const windowStart = new Date(now.getTime() + reminderMinutes * 60 * 1000) // Now + reminder time
    const windowEnd = new Date(now.getTime() + (reminderMinutes + 5) * 60 * 1000) // 5-minute window

    console.log(`📅 Looking for lessons between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`)

    // Get upcoming lessons that need reminders
    const { data: upcomingLessons, error: lessonsError } = await supabaseClient
      .from('calendar_events')
      .select(`
        id,
        title,
        start_time,
        end_time,
        student_id,
        tutor_id,
        status,
        students!inner(id, email, first_name, last_name),
        tutors!inner(id, email, first_name, last_name)
      `)
      .gte('start_time', windowStart.toISOString())
      .lte('start_time', windowEnd.toISOString())
      .eq('status', 'confirmed')

    if (lessonsError) {
      throw new Error(`Failed to fetch lessons: ${lessonsError.message}`)
    }

    if (!upcomingLessons || upcomingLessons.length === 0) {
      console.log('📭 No lessons found in reminder window')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No lessons found in reminder window',
          scheduled: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📚 Found ${upcomingLessons.length} lessons to process`)

    let scheduledCount = 0
    const errors: string[] = []

    for (const lesson of upcomingLessons) {
      try {
        // Check if reminder already sent or scheduled
        const { data: existingReminder } = await supabaseClient
          .from('email_logs')
          .select('id')
          .eq('template_type', 'lesson_reminder')
          .eq('recipient_email', lesson.students.email)
          .eq('metadata->lesson_id', lesson.id)
          .in('status', ['sent', 'delivered', 'pending', 'scheduled'])
          .maybeSingle()

        if (existingReminder) {
          console.log(`⏭️ Reminder already exists for lesson ${lesson.id}`)
          continue
        }

        // Check user notification preferences
        const { data: preferences } = await supabaseClient
          .from('user_notification_preferences')
          .select('lesson_reminders')
          .eq('user_id', lesson.student_id)
          .maybeSingle()

        if (preferences && preferences.lesson_reminders === false) {
          console.log(`🔕 User ${lesson.student_id} has disabled lesson reminders`)
          continue
        }

        // Get active email template
        const { data: template, error: templateError } = await supabaseClient
          .from('email_templates')
          .select('*')
          .eq('type', 'lesson_reminder')
          .eq('is_active', true)
          .maybeSingle()

        if (templateError || !template) {
          errors.push(`No active lesson reminder template found`)
          continue
        }

        // Get active SMTP config
        const { data: smtpConfig, error: smtpError } = await supabaseClient
          .from('email_smtp_configs')
          .select('*')
          .eq('is_active', true)
          .maybeSingle()

        if (smtpError || !smtpConfig) {
          errors.push(`No active SMTP configuration found`)
          continue
        }

        // Prepare template data
        const templateData = {
          user_name: `${lesson.students.first_name} ${lesson.students.last_name}`.trim() || 'Student',
          lesson_title: lesson.title || 'Upcoming Lesson',
          lesson_date: new Date(lesson.start_time).toLocaleDateString(),
          lesson_time: new Date(lesson.start_time).toLocaleTimeString(),
          tutor_name: `${lesson.tutors.first_name} ${lesson.tutors.last_name}`.trim() || 'Your Tutor',
          lesson_url: `${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'}/dashboard`,
          calendar_url: `${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'}/calendar`,
          lesson_id: lesson.id
        }

        // Render template
        const replacePlaceholders = (text: string, data: Record<string, any>): string => {
          return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] || match
          })
        }

        const subject = replacePlaceholders(template.subject, templateData)
        const htmlContent = replacePlaceholders(template.html_content, templateData)
        const textContent = replacePlaceholders(template.text_content || '', templateData)

        // Send email via integrated email function
        const { data: emailResult, error: emailError } = await supabaseClient.functions.invoke('send-integrated-email', {
          body: {
            smtpConfigId: smtpConfig.id,
            templateId: template.id,
            recipientEmail: lesson.students.email,
            subject: subject,
            htmlContent: htmlContent,
            textContent: textContent,
            templateData: {
              ...templateData,
              templateType: 'lesson_reminder'
            },
            priority: 'normal',
            userId: lesson.student_id
          }
        })

        if (emailError) {
          errors.push(`Failed to send reminder for lesson ${lesson.id}: ${emailError.message}`)
          continue
        }

        scheduledCount++
        console.log(`✅ Scheduled reminder for lesson ${lesson.id} to ${lesson.students.email}`)

      } catch (lessonError: any) {
        errors.push(`Error processing lesson ${lesson.id}: ${lessonError.message}`)
        console.error(`❌ Error processing lesson ${lesson.id}:`, lessonError)
      }
    }

    console.log(`🎉 Lesson reminder scheduling complete: ${scheduledCount} scheduled, ${errors.length} errors`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        scheduled: scheduledCount,
        errors: errors,
        message: `Scheduled ${scheduledCount} lesson reminders`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Lesson reminder scheduling error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        scheduled: 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})