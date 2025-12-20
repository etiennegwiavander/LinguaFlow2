import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!studentId) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 }
      );
    }

    // Get lesson sessions with related data
    const { data: sessions, error } = await supabase
      .from('lesson_sessions')
      .select(`
        *,
        students!inner(id, name, level),
        tutors!inner(id, name),
        lessons(id, date, status)
      `)
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching lesson history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lesson history' },
        { status: 500 }
      );
    }

    // Transform data to match existing lesson history format
    const transformedSessions = sessions?.map(session => ({
      id: session.id,
      lesson_id: session.lesson_id,  // ✅ Add actual lesson ID for sharing
      tutor_id: session.tutor_id,    // ✅ Add tutor ID for RLS validation
      student_id: session.student_id, // ✅ Add student ID for context
      completedAt: session.completed_at,
      completedSubTopic: session.sub_topic_data,
      interactive_lesson_content: session.interactive_content,
      lesson_template_id: session.lesson_template_id,
      student: session.students,
      tutor: session.tutors,
      lesson: session.lessons,
      duration_minutes: session.duration_minutes,
      status: session.status
    })) || [];

    return NextResponse.json({
      sessions: transformedSessions,
      total: sessions?.length || 0,
      hasMore: sessions?.length === limit
    });

  } catch (error) {
    console.error('Unexpected error in lesson history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      student_id,
      tutor_id,
      lesson_id,
      lesson_template_id,
      sub_topic_id,
      sub_topic_data,
      interactive_content,
      lesson_materials,
      duration_minutes
    } = body;

    // Validate required fields
    if (!student_id || !tutor_id || !sub_topic_id || !sub_topic_data) {
      return NextResponse.json(
        { error: 'Missing required fields: student_id, tutor_id, sub_topic_id, sub_topic_data' },
        { status: 400 }
      );
    }

    // Create lesson session
    const { data: session, error: sessionError } = await supabase
      .from('lesson_sessions')
      .insert({
        student_id,
        tutor_id,
        lesson_id,
        lesson_template_id,
        sub_topic_id,
        sub_topic_data,
        interactive_content: interactive_content || {},
        lesson_materials: lesson_materials || {},
        duration_minutes,
        status: 'completed'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating lesson session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create lesson session' },
        { status: 500 }
      );
    }

    // Create progress entry
    const { error: progressError } = await supabase
      .from('student_progress')
      .upsert({
        student_id,
        tutor_id,
        sub_topic_id,
        sub_topic_title: sub_topic_data.title,
        sub_topic_category: sub_topic_data.category,
        sub_topic_level: sub_topic_data.level,
        lesson_session_id: session.id,
        completion_date: new Date().toISOString()
      }, {
        onConflict: 'student_id,sub_topic_id'
      });

    if (progressError) {
      console.error('Error creating progress entry:', progressError);
      // Don't fail the request if progress creation fails
    }

    return NextResponse.json({
      success: true,
      session_id: session.id,
      message: 'Lesson session created successfully'
    });

  } catch (error) {
    console.error('Unexpected error creating lesson session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}