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

  // If there's an OAuth error from Google
  if (error) {
    console.error('❌ OAuth error from Google:', error);
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Calendar Authorization</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.location.href = window.opener.location.origin + '/calendar?google_auth_status=error&error=${encodeURIComponent(error)}';
              window.close();
            } else {
              window.location.href = '/calendar?google_auth_status=error&error=${encodeURIComponent(error)}';
            }
          </script>
        </body>
      </html>
    `;
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // If no code is provided
  if (!code) {
    console.error('❌ No authorization code provided');
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Calendar Authorization</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.location.href = window.opener.location.origin + '/calendar?google_auth_status=error&error=no_code';
              window.close();
            } else {
              window.location.href = '/calendar?google_auth_status=error&error=no_code';
            }
          </script>
        </body>
      </html>
    `;
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
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
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    let userEmail = null;
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      userEmail = userInfo.email;
      console.log('✅ User email retrieved:', userEmail);
    } else {
      console.log('⚠️ Could not retrieve user email from Google');
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + (expires_in * 1000))
    console.log('📅 Token expires at:', expiresAt.toISOString());

    // Extract tutor_id from state parameter (we'll need to modify the client to include this)
    // For now, we'll need to get it from the session or find another way
    // Since we can't get the user session in this context, we'll store the tokens temporarily
    // and let the client-side code handle the final storage after authentication

    console.log('💾 Creating Supabase client with service role...');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // We need to get the tutor_id somehow. Let's use the state parameter to pass it
    // For now, we'll store the tokens in a temporary way and let the client handle it
    // Actually, let's modify the approach - we'll pass the tokens back to the client
    // and let the client store them using their authenticated session

    console.log('✅ Token exchange completed successfully');

    // Redirect back to the calendar page with success status and token data
    const successUrl = new URL('/calendar', Deno.env.get('SITE_URL') || 'http://localhost:3000');
    successUrl.searchParams.set('google_auth_status', 'success');
    successUrl.searchParams.set('access_token', access_token);
    successUrl.searchParams.set('refresh_token', refresh_token);
    successUrl.searchParams.set('expires_at', expiresAt.toISOString());
    successUrl.searchParams.set('scope', scope || 'https://www.googleapis.com/auth/calendar.readonly');
    if (userEmail) {
      successUrl.searchParams.set('email', userEmail);
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Calendar Authorization</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.location.href = '${successUrl.toString()}';
              window.close();
            } else {
              window.location.href = '${successUrl.toString()}';
            }
          </script>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    
    const errorUrl = new URL('/calendar', Deno.env.get('SITE_URL') || 'http://localhost:3000');
    errorUrl.searchParams.set('google_auth_status', 'error');
    errorUrl.searchParams.set('error', error.message || 'Unknown error');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Calendar Authorization</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.location.href = '${errorUrl.toString()}';
              window.close();
            } else {
              window.location.href = '${errorUrl.toString()}';
            }
          </script>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
})