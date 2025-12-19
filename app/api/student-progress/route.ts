import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');

    if (!studentId) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 }
      );
    }

    // Get student progress
    const { data: progress, error } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId)
      .order('completion_date', { ascending: false });

    if (error) {
      console.error('Error fetching student progress:', error);
      return NextResponse.json(
        { error: 'Failed to fetch student progress' },
        { status: 500 }
      );
    }

    // Transform to match existing format
    const completedSubTopics = progress?.map(p => p.sub_topic_id) || [];
    const completedSubTopicsWithTimestamps = progress?.map(p => ({
      id: p.sub_topic_id,
      completedAt: p.completion_date
    })) || [];

    return NextResponse.json({
      completedSubTopics,
      completedSubTopicsWithTimestamps,
      progress: progress || []
    });

  } catch (error) {
    console.error('Unexpected error in student progress API:', error);
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
      sub_topic_id,
      sub_topic_title,
      sub_topic_category,
      sub_topic_level,
      lesson_session_id,
      score,
      notes
    } = body;

    // Validate required fields
    if (!student_id || !tutor_id || !sub_topic_id) {
      return NextResponse.json(
        { error: 'Missing required fields: student_id, tutor_id, sub_topic_id' },
        { status: 400 }
      );
    }

    // Upsert progress entry
    const { data, error } = await supabase
      .from('student_progress')
      .upsert({
        student_id,
        tutor_id,
        sub_topic_id,
        sub_topic_title,
        sub_topic_category,
        sub_topic_level,
        lesson_session_id,
        score,
        notes,
        completion_date: new Date().toISOString()
      }, {
        onConflict: 'student_id,sub_topic_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating/updating progress:', error);
      return NextResponse.json(
        { error: 'Failed to update progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      progress: data,
      message: 'Progress updated successfully'
    });

  } catch (error) {
    console.error('Unexpected error updating progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}