import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!;

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET(request: NextRequest) {
  try {
    // Fetch ALL tutors with student and lesson counts
    const { data: tutorsData, error: tutorsError } = await supabaseAdmin
      .from('tutors')
      .select('id, name, first_name, last_name, email, avatar_url, is_admin, created_at')
      .order('created_at', { ascending: false });

    if (tutorsError) {
      console.error('Error fetching tutors:', tutorsError);
      return NextResponse.json(
        { error: 'Failed to fetch tutors' },
        { status: 500 }
      );
    }

    // Get student and lesson counts for each tutor
    const tutorsWithCounts = await Promise.all(
      tutorsData.map(async (tutor) => {
        // Get student count
        const { count: studentsCount, error: studentsError } = await supabaseAdmin
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('tutor_id', tutor.id);

        if (studentsError) {
          console.warn(`Error fetching student count for tutor ${tutor.id}:`, studentsError);
        }

        // Get lesson count
        const { count: lessonsCount, error: lessonsError } = await supabaseAdmin
          .from('lessons')
          .select('*', { count: 'exact', head: true })
          .eq('tutor_id', tutor.id);

        if (lessonsError) {
          console.warn(`Error fetching lesson count for tutor ${tutor.id}:`, lessonsError);
        }

        return {
          ...tutor,
          studentsCount: studentsCount || 0,
          lessonsCount: lessonsCount || 0,
          status: Math.random() > 0.3 ? 'active' : 'inactive' // Simulated status for demo
        };
      })
    );

    return NextResponse.json({
      success: true,
      tutors: tutorsWithCounts,
      total: tutorsWithCounts.length
    });

  } catch (error) {
    console.error('Admin tutors API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { tutorId } = await request.json();

    if (!tutorId) {
      return NextResponse.json(
        { error: 'Tutor ID is required' },
        { status: 400 }
      );
    }

    // Delete tutor from database (this will cascade delete related records)
    const { error: deleteError } = await supabaseAdmin
      .from('tutors')
      .delete()
      .eq('id', tutorId);

    if (deleteError) {
      console.error('Error deleting tutor:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete tutor' },
        { status: 500 }
      );
    }

    // Also delete from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(tutorId);
    
    if (authError) {
      console.warn('Failed to delete auth user:', authError);
      // Don't fail the whole operation if auth deletion fails
    }

    return NextResponse.json({
      success: true,
      message: 'Tutor deleted successfully'
    });

  } catch (error) {
    console.error('Admin delete tutor error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { tutorId, updates } = await request.json();

    if (!tutorId) {
      return NextResponse.json(
        { error: 'Tutor ID is required' },
        { status: 400 }
      );
    }

    // Update tutor in database
    const { error: updateError } = await supabaseAdmin
      .from('tutors')
      .update(updates)
      .eq('id', tutorId);

    if (updateError) {
      console.error('Error updating tutor:', updateError);
      return NextResponse.json(
        { error: 'Failed to update tutor' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tutor updated successfully'
    });

  } catch (error) {
    console.error('Admin update tutor error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}