import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { EmailIntegrationService } from '@/lib/email-integration-service';

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: tutor, error: tutorError } = await supabase
      .from('tutors')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (tutorError || !tutor?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Schedule lesson reminders using the integration service
    const result = await EmailIntegrationService.scheduleLessonReminders();

    return NextResponse.json({
      success: true,
      scheduled: result.scheduled,
      errors: result.errors,
      message: `Scheduled ${result.scheduled} lesson reminders`
    });

  } catch (error: any) {
    console.error('Schedule reminders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Allow GET requests to trigger scheduling (for cron jobs)
export async function GET(request: NextRequest) {
  try {
    // For automated scheduling, we can bypass auth checks
    // In production, you might want to use a secret key or IP whitelist
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Schedule lesson reminders
    const result = await EmailIntegrationService.scheduleLessonReminders();

    return NextResponse.json({
      success: true,
      scheduled: result.scheduled,
      errors: result.errors,
      message: `Scheduled ${result.scheduled} lesson reminders`
    });

  } catch (error: any) {
    console.error('Schedule reminders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}