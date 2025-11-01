import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log('🔍 Validating reset token...');
  
  // Support both environment variable names (dev vs production)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.error('❌ No service role key found in environment');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }
  
  // Create admin client with service role key to bypass RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  try {
    const { token } = await request.json();

    if (!token) {
      console.log('❌ No token provided');
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Hash the token to match what's stored in database
    const tokenHash = createHash('sha256').update(token).digest('hex');
    console.log('🔐 Token hash generated');

    // Look up the token in database
    const { data: resetToken, error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('used', false)
      .maybeSingle();

    if (tokenError) {
      console.error('❌ Database error:', tokenError);
      return NextResponse.json(
        { valid: false, error: 'Database error' },
        { status: 500 }
      );
    }

    if (!resetToken) {
      console.log('❌ Token not found or already used');
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    const expiresAt = new Date(resetToken.expires_at);
    const now = new Date();
    
    if (now > expiresAt) {
      console.log('❌ Token expired');
      return NextResponse.json(
        { valid: false, error: 'Token has expired' },
        { status: 400 }
      );
    }

    // Get user info
    const { data: user, error: userError } = await supabaseAdmin
      .from('tutors')
      .select('id, email, first_name')
      .eq('id', resetToken.user_id)
      .single();

    if (userError || !user) {
      console.error('❌ User not found');
      return NextResponse.json(
        { valid: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ Token is valid');
    return NextResponse.json({
      valid: true,
      userId: user.id,
      email: user.email,
      firstName: user.first_name
    });

  } catch (error: any) {
    console.error('❌ Validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
