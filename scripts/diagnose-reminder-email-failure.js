require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseReminderEmailFailure() {
  console.log('🔍 DIAGNOSING LESSON REMINDER EMAIL FAILURE\n');
  console.log('='.repeat(80));

  try {
    // Step 1: Check if cron job is configured
    console.log('\n📋 STEP 1: Checking Cron Job Configuration');
    console.log('-'.repeat(80));
    
    const { data: cronJobs, error: cronError } = await supabase
      .from('cron.job')
      .select('*')
      .eq('jobname', 'schedule-lesson-reminders');

    if (cronError) {
      console.log('❌ Cannot query cron jobs (table may not exist or no permissions)');
      console.log('   This is expected if using external cron-job.org');
    } else if (cronJobs && cronJobs.length > 0) {
      console.log('✅ Cron job found in database:');
      cronJobs.forEach(job => {
        console.log(`   Name: ${job.jobname}`);
        console.log(`   Schedule: ${job.schedule}`);
        console.log(`   Active: ${job.active}`);
      });
    } else {
      console.log('⚠️  No cron job found in database');
      console.log('   Using external cron-job.org (this is fine)');
    }

    // Step 2: Check calendar events
    console.log('\n📅 STEP 2: Checking Calendar Events');
    console.log('-'.repeat(80));

    const now = new Date();
    const reminderMinutes = 30; // Default reminder time
    const windowStart = new Date(now.getTime() + reminderMinutes * 60 * 1000);
    const windowEnd = new Date(now.getTime() + (reminderMinutes + 5) * 60 * 1000);

    console.log(`Current time: ${now.toISOString()}`);
    console.log(`Reminder window: ${windowStart.toISOString()} to ${windowEnd.toISOString()}`);

    const { data: upcomingEvents, error: eventsError } = await supabase
      .from('calendar_events')
      .select(`
        id,
        google_event_id,
        summary,
        start_time,
        end_time,
        tutor_id,
        tutors!inner(id, email, first_name, last_name)
      `)
      .gte('start_time', windowStart.toISOString())
      .lte('start_time', windowEnd.toISOString());

    if (eventsError) {
      console.log('❌ Error fetching calendar events:', eventsError.message);
    } else {
      console.log(`\n📊 Found ${upcomingEvents?.length || 0} events in reminder window`);
      
      if (upcomingEvents && upcomingEvents.length > 0) {
        upcomingEvents.forEach((event, idx) => {
          console.log(`\n   ${idx + 1}. Event: ${event.summary}`);
          console.log(`      Start: ${event.start_time}`);
          console.log(`      Tutor: ${event.tutors.email}`);
          console.log(`      Google Event ID: ${event.google_event_id}`);
        });
      } else {
        console.log('   ⚠️  No events in the next 30-35 minutes');
        
        // Check for events in the next 24 hours
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const { data: futureEvents } = await supabase
          .from('calendar_events')
          .select('id, summary, start_time')
          .gte('start_time', now.toISOString())
          .lte('start_time', next24Hours.toISOString())
          .order('start_time', { ascending: true })
          .limit(5);

        if (futureEvents && futureEvents.length > 0) {
          console.log('\n   📅 Upcoming events in next 24 hours:');
          futureEvents.forEach((event, idx) => {
            const minutesUntil = Math.round((new Date(event.start_time) - now) / 60000);
            console.log(`      ${idx + 1}. ${event.summary} - in ${minutesUntil} minutes (${event.start_time})`);
          });
        } else {
          console.log('\n   ⚠️  No events found in the next 24 hours');
        }
      }
    }

    // Step 3: Check email templates
    console.log('\n📧 STEP 3: Checking Email Templates');
    console.log('-'.repeat(80));

    const { data: templates, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('type', 'lesson_reminder');

    if (templateError) {
      console.log('❌ Error fetching email templates:', templateError.message);
    } else if (!templates || templates.length === 0) {
      console.log('❌ NO LESSON REMINDER TEMPLATE FOUND');
      console.log('   This is a critical issue - reminders cannot be sent without a template');
    } else {
      console.log(`✅ Found ${templates.length} lesson reminder template(s):`);
      templates.forEach((template, idx) => {
        console.log(`\n   ${idx + 1}. Template: ${template.name}`);
        console.log(`      ID: ${template.id}`);
        console.log(`      Active: ${template.is_active ? 'YES' : 'NO'}`);
        console.log(`      Subject: ${template.subject}`);
        console.log(`      Created: ${template.created_at}`);
        
        if (!template.is_active) {
          console.log('      ⚠️  WARNING: Template is not active!');
        }
      });

      const activeTemplate = templates.find(t => t.is_active);
      if (!activeTemplate) {
        console.log('\n   ❌ NO ACTIVE TEMPLATE FOUND');
        console.log('      Reminders will fail because no active template exists');
      }
    }

    // Step 4: Check SMTP configuration
    console.log('\n📮 STEP 4: Checking SMTP Configuration');
    console.log('-'.repeat(80));

    const { data: smtpConfigs, error: smtpError } = await supabase
      .from('email_smtp_configs')
      .select('*');

    if (smtpError) {
      console.log('❌ Error fetching SMTP configs:', smtpError.message);
    } else if (!smtpConfigs || smtpConfigs.length === 0) {
      console.log('❌ NO SMTP CONFIGURATION FOUND');
      console.log('   This is a critical issue - emails cannot be sent without SMTP config');
    } else {
      console.log(`✅ Found ${smtpConfigs.length} SMTP configuration(s):`);
      smtpConfigs.forEach((config, idx) => {
        console.log(`\n   ${idx + 1}. Config: ${config.name}`);
        console.log(`      ID: ${config.id}`);
        console.log(`      Active: ${config.is_active ? 'YES' : 'NO'}`);
        console.log(`      Host: ${config.host}`);
        console.log(`      Port: ${config.port}`);
        console.log(`      From: ${config.from_email}`);
        console.log(`      Last Tested: ${config.last_tested_at || 'Never'}`);
        console.log(`      Test Status: ${config.test_status || 'Unknown'}`);
        
        if (!config.is_active) {
          console.log('      ⚠️  WARNING: Config is not active!');
        }
      });

      const activeConfig = smtpConfigs.find(c => c.is_active);
      if (!activeConfig) {
        console.log('\n   ❌ NO ACTIVE SMTP CONFIG FOUND');
        console.log('      Reminders will fail because no active SMTP config exists');
      }
    }

    // Step 5: Check email logs for recent reminder attempts
    console.log('\n📝 STEP 5: Checking Recent Email Logs');
    console.log('-'.repeat(80));

    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const { data: recentLogs, error: logsError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('template_type', 'lesson_reminder')
      .gte('created_at', last24Hours.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (logsError) {
      console.log('❌ Error fetching email logs:', logsError.message);
    } else if (!recentLogs || recentLogs.length === 0) {
      console.log('⚠️  No lesson reminder emails sent in the last 24 hours');
      console.log('   This could indicate:');
      console.log('   1. No lessons were in the reminder window');
      console.log('   2. The cron job is not running');
      console.log('   3. The Edge Function is failing silently');
    } else {
      console.log(`✅ Found ${recentLogs.length} reminder email(s) in last 24 hours:`);
      recentLogs.forEach((log, idx) => {
        console.log(`\n   ${idx + 1}. Email to: ${log.recipient_email}`);
        console.log(`      Status: ${log.status}`);
        console.log(`      Subject: ${log.subject}`);
        console.log(`      Created: ${log.created_at}`);
        console.log(`      Sent: ${log.sent_at || 'Not sent'}`);
        
        if (log.status === 'failed') {
          console.log(`      ❌ Error: ${log.error_message}`);
          console.log(`      Error Code: ${log.error_code}`);
        }
        
        if (log.metadata) {
          console.log(`      Metadata:`, JSON.stringify(log.metadata, null, 2));
        }
      });
    }

    // Step 6: Check user notification preferences
    console.log('\n⚙️  STEP 6: Checking User Notification Preferences');
    console.log('-'.repeat(80));

    const { data: preferences, error: prefsError } = await supabase
      .from('user_notification_preferences')
      .select('*');

    if (prefsError) {
      console.log('⚠️  Cannot query notification preferences:', prefsError.message);
      console.log('   Table may not exist - this is okay, defaults will be used');
    } else if (!preferences || preferences.length === 0) {
      console.log('ℹ️  No user preferences found');
      console.log('   All users will receive reminders (default behavior)');
    } else {
      console.log(`✅ Found ${preferences.length} user preference(s):`);
      const disabledCount = preferences.filter(p => p.lesson_reminders === false).length;
      console.log(`   Users with reminders enabled: ${preferences.length - disabledCount}`);
      console.log(`   Users with reminders disabled: ${disabledCount}`);
      
      if (disabledCount > 0) {
        console.log('\n   Users who disabled reminders:');
        preferences
          .filter(p => p.lesson_reminders === false)
          .forEach((pref, idx) => {
            console.log(`      ${idx + 1}. User ID: ${pref.user_id}`);
          });
      }
    }

    // Step 7: Check email settings
    console.log('\n⚙️  STEP 7: Checking Email Settings');
    console.log('-'.repeat(80));

    const { data: settings, error: settingsError } = await supabase
      .from('email_settings')
      .select('*')
      .eq('setting_key', 'lesson_reminder_timing');

    if (settingsError) {
      console.log('⚠️  Cannot query email settings:', settingsError.message);
      console.log('   Table may not exist - using default 30 minutes');
    } else if (!settings || settings.length === 0) {
      console.log('ℹ️  No reminder timing setting found');
      console.log('   Using default: 30 minutes before lesson');
    } else {
      const timing = settings[0].setting_value;
      console.log(`✅ Reminder timing configured: ${timing.minutes || 30} minutes before lesson`);
    }

    // Step 8: Test Edge Function accessibility
    console.log('\n🔧 STEP 8: Testing Edge Function Accessibility');
    console.log('-'.repeat(80));

    try {
      console.log('Attempting to invoke schedule-lesson-reminders function...');
      
      const { data: functionResult, error: functionError } = await supabase.functions.invoke(
        'schedule-lesson-reminders',
        { body: {} }
      );

      if (functionError) {
        console.log('❌ Edge Function invocation failed:', functionError.message);
        console.log('   This could indicate:');
        console.log('   1. Function is not deployed');
        console.log('   2. Function has errors');
        console.log('   3. Permissions issue');
      } else {
        console.log('✅ Edge Function invoked successfully!');
        console.log('   Response:', JSON.stringify(functionResult, null, 2));
      }
    } catch (error) {
      console.log('❌ Exception invoking Edge Function:', error.message);
    }

    // Step 9: Check Resend API key
    console.log('\n🔑 STEP 9: Checking Environment Variables');
    console.log('-'.repeat(80));

    const hasResendKey = !!process.env.RESEND_API_KEY;
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log(`RESEND_API_KEY: ${hasResendKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`NEXT_PUBLIC_SUPABASE_URL: ${hasSupabaseUrl ? '✅ Set' : '❌ Missing'}`);
    console.log(`SUPABASE_SERVICE_ROLE_KEY: ${hasServiceKey ? '✅ Set' : '❌ Missing'}`);

    if (!hasResendKey) {
      console.log('\n❌ CRITICAL: RESEND_API_KEY is not set!');
      console.log('   Emails cannot be sent without this key');
      console.log('   Set it in your Supabase Edge Function secrets');
    }

    // Final Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 DIAGNOSIS SUMMARY');
    console.log('='.repeat(80));

    const issues = [];
    const warnings = [];

    if (!templates || templates.length === 0) {
      issues.push('No lesson reminder email template exists');
    } else if (!templates.find(t => t.is_active)) {
      issues.push('No active lesson reminder email template');
    }

    if (!smtpConfigs || smtpConfigs.length === 0) {
      issues.push('No SMTP configuration exists');
    } else if (!smtpConfigs.find(c => c.is_active)) {
      issues.push('No active SMTP configuration');
    }

    if (!hasResendKey) {
      issues.push('RESEND_API_KEY environment variable not set');
    }

    if (!upcomingEvents || upcomingEvents.length === 0) {
      warnings.push('No calendar events in the reminder window (30-35 min from now)');
    }

    if (!recentLogs || recentLogs.length === 0) {
      warnings.push('No reminder emails sent in the last 24 hours');
    }

    if (issues.length > 0) {
      console.log('\n❌ CRITICAL ISSUES FOUND:');
      issues.forEach((issue, idx) => {
        console.log(`   ${idx + 1}. ${issue}`);
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      warnings.forEach((warning, idx) => {
        console.log(`   ${idx + 1}. ${warning}`);
      });
    }

    if (issues.length === 0 && warnings.length === 0) {
      console.log('\n✅ No critical issues found!');
      console.log('   System appears to be configured correctly.');
      console.log('   If reminders still aren\'t working, check:');
      console.log('   1. External cron-job.org is hitting the correct URL');
      console.log('   2. Edge Function logs in Supabase dashboard');
      console.log('   3. Resend API dashboard for delivery status');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Diagnosis complete!\n');

  } catch (error) {
    console.error('\n❌ Fatal error during diagnosis:', error);
    console.error(error.stack);
  }
}

diagnoseReminderEmailFailure().catch(console.error);
