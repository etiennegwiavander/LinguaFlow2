import { NextRequest, NextResponse } from 'next/server';

/**
 * Google OAuth Callback Proxy
 * 
 * This API route acts as a proxy between Google OAuth and the Supabase Edge Function.
 * It's necessary because:
 * 1. Google OAuth redirects directly to this URL (can't add auth headers)
 * 2. Supabase Edge Functions require authentication
 * 3. This proxy adds the required authentication before calling the Edge Function
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('📥 OAuth callback received:', { code: code ? 'present' : 'missing', state, error });

    // If there's an OAuth error from Google
    if (error) {
      console.error('❌ OAuth error from Google:', error);
      return NextResponse.redirect(
        new URL(`/calendar?google_auth_status=error&message=${encodeURIComponent(error)}`, request.url)
      );
    }

    // If no code is provided
    if (!code) {
      console.error('❌ No authorization code provided');
      return NextResponse.redirect(
        new URL('/calendar?google_auth_status=error&message=No authorization code provided', request.url)
      );
    }

    // If no state (user ID) is provided
    if (!state) {
      console.error('❌ No user ID in state parameter');
      return NextResponse.redirect(
        new URL('/calendar?google_auth_status=error&message=Invalid authentication state', request.url)
      );
    }

    // Call the Supabase Edge Function with proper authentication
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      console.error('❌ Missing Supabase configuration');
      return NextResponse.redirect(
        new URL('/calendar?google_auth_status=error&message=Server configuration error', request.url)
      );
    }

    console.log('🔄 Calling Supabase Edge Function...');

    // Call the Edge Function with proper authentication headers
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/google-oauth-callback?code=${code}&state=${state}`;
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Edge Function response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Edge Function error:', errorText);
      return NextResponse.redirect(
        new URL('/calendar?google_auth_status=error&message=Failed to process OAuth callback', request.url)
      );
    }

    // Success - redirect to calendar
    console.log('✅ OAuth callback successful');
    return NextResponse.redirect(
      new URL('/calendar?google_auth_status=success', request.url)
    );

  } catch (error: any) {
    console.error('❌ OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/calendar?google_auth_status=error&message=${encodeURIComponent(error.message || 'Unknown error')}`, request.url)
    );
  }
}
