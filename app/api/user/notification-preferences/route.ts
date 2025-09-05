import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user notification preferences
    const { data: preferences, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    // Return default preferences if none found
    const defaultPreferences = {
      user_id: user.id,
      welcome_emails: true,
      lesson_reminders: true,
      password_reset_emails: true,
      custom_emails: true,
      reminder_timing_minutes: 15
    };

    return NextResponse.json({
      success: true,
      preferences: preferences || defaultPreferences
    });

  } catch (error: any) {
    console.error('Get notification preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      welcome_emails,
      lesson_reminders,
      password_reset_emails,
      custom_emails,
      reminder_timing_minutes
    } = body;

    // Validate reminder timing
    if (reminder_timing_minutes && (reminder_timing_minutes < 5 || reminder_timing_minutes > 1440)) {
      return NextResponse.json(
        { error: 'Reminder timing must be between 5 minutes and 24 hours' },
        { status: 400 }
      );
    }

    // Upsert user notification preferences
    const { data: preferences, error } = await supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: user.id,
        welcome_emails: welcome_emails ?? true,
        lesson_reminders: lesson_reminders ?? true,
        password_reset_emails: password_reset_emails ?? true,
        custom_emails: custom_emails ?? true,
        reminder_timing_minutes: reminder_timing_minutes ?? 15,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Update preferences error:', error);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: preferences,
      message: 'Notification preferences updated successfully'
    });

  } catch (error: any) {
    console.error('Update notification preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}