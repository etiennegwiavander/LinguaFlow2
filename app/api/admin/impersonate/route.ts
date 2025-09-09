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

export async function POST(request: NextRequest) {
  try {
    const { tutorId } = await request.json();

    if (!tutorId) {
      return NextResponse.json(
        { error: 'Tutor ID is required' },
        { status: 400 }
      );
    }

    // Verify the tutor exists
    const { data: tutor, error: tutorError } = await supabaseAdmin
      .from('tutors')
      .select('id, email, first_name, last_name')
      .eq('id', tutorId)
      .single();

    if (tutorError || !tutor) {
      return NextResponse.json(
        { error: 'Tutor not found' },
        { status: 404 }
      );
    }

    // Generate an admin impersonation token
    // This creates a temporary session for the admin to login as the user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: tutor.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?impersonated=true`
      }
    });

    if (authError) {
      console.error('Error generating impersonation link:', authError);
      return NextResponse.json(
        { error: 'Failed to generate impersonation link' },
        { status: 500 }
      );
    }

    // Return the magic link URL for admin to use
    return NextResponse.json({
      success: true,
      impersonationUrl: authData.properties?.action_link,
      tutorInfo: {
        id: tutor.id,
        email: tutor.email,
        name: `${tutor.first_name || ''} ${tutor.last_name || ''}`.trim() || 'Unnamed User'
      }
    });

  } catch (error) {
    console.error('Admin impersonation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}