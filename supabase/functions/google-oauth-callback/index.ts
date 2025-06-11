import { serve } from "jsr:@std/http@0.224.0/server"
import { createClient } from 'npm:@supabase/supabase-js@2'

serve(async (req) => {
  console.log('🚀 Google OAuth Callback called');
  console.log('📡 Request method:', req.method);
  console.log('📡 Request URL:', req.url);

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const state = url.searchParams.get('state')

  console.log('📋 OAuth parameters:');
  console.log('  - Code:', code ? `${code.substring(0, 20)}...` : 'MISSING');
  console.log('  - Error:', error || 'NONE');
  console.log('  - State:', state || 'NONE');

  // Get the site URL for redirects
  const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:3000';

  // If there's an OAuth error from Google
  if (error) {
    console.error('❌ OAuth error from Google:', error);
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${siteUrl}/calendar?google_auth_status=error&message=${encodeURIComponent(error)}`
      }
    });
  }

  // If no code is provided
  if (!code) {
    console.error('❌ No authorization code provided');
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${siteUrl}/calendar?google_auth_status=error&message=${encodeURIComponent('No authorization code provided')}`
      }
    });
  }

  try {
    console.log('🔄 Starting token exchange with Google...');
    
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-oauth-callback`,
      }),
    })

    console.log('📡 Google token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('❌ Google token exchange failed:', errorData);
      throw new Error(`Token exchange failed: ${errorData}`)
    }

    const tokenData = await tokenResponse.json()
    console.log('✅ Google token exchange successful');
    
    const { access_token, refresh_token, expires_in, scope } = tokenData

    if (!access_token || !refresh_token) {
      console.error('❌ Invalid token response from Google - missing tokens');
      throw new Error('Invalid token response from Google')
    }

    // Get user's email from Google using the access token
    console.log('👤 Fetching user info from Google...');
    let userEmail = null;
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        userEmail = userInfo.email;
        console.log('✅ User email retrieved:', userEmail);
      } else {
        console.log('⚠️ Could not retrieve user email from Google');
      }
    } catch (emailError) {
      console.log('⚠️ Error retrieving user email:', emailError);
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + (expires_in * 1000));
    console.log('📅 Token expires at:', expiresAt.toISOString());

    // Now store the tokens in the database using Supabase service role
    console.log('💾 Storing tokens in database...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // We need to get the user ID from the state parameter or session
    // For now, we'll extract it from the state parameter which should contain the user ID
    // In a production app, you might want to store the user session differently
    
    // Since we don't have the user ID in the state, we'll need to handle this differently
    // Let's redirect back with the tokens as query parameters for the client to handle
    console.log('🔄 Redirecting back to calendar page with success status...');

    const redirectUrl = new URL(`${siteUrl}/calendar`);
    redirectUrl.searchParams.set('google_auth_status', 'success');
    redirectUrl.searchParams.set('access_token', access_token);
    redirectUrl.searchParams.set('refresh_token', refresh_token);
    redirectUrl.searchParams.set('expires_at', expiresAt.toISOString());
    redirectUrl.searchParams.set('scope', scope || 'https://www.googleapis.com/auth/calendar.readonly');
    if (userEmail) {
      redirectUrl.searchParams.set('email', userEmail);
    }

    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl.toString()
      }
    });

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${siteUrl}/calendar?google_auth_status=error&message=${encodeURIComponent(error.message || 'Unknown error')}`
      }
    });
  }
})