import { serve } from "jsr:@std/http@0.224.0/server"
import { createClient } from 'npm:@supabase/supabase-js@2'

serve(async (req) => {
  console.log('🚀 Google OAuth Callback called');
  console.log('📡 Request method:', req.method);
  console.log('📡 Request URL:', req.url);

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const state = url.searchParams.get('state') // This should contain the user ID

  console.log('📋 OAuth parameters:');
  console.log('  - Code:', code ? `${code.substring(0, 20)}...` : 'MISSING');
  console.log('  - Error:', error || 'NONE');
  console.log('  - State (User ID):', state || 'NONE');

  // Get the site URL for postMessage origin validation (important for security)
  const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:3000';

  let responseData = {};
  let status = 'error';
  let message = '';

  try {
    // If there's an OAuth error from Google
    if (error) {
      console.error('❌ OAuth error from Google:', error);
      message = error;
      throw new Error(error); // Throw to catch block for consistent error handling
    }

    // If no code is provided
    if (!code) {
      console.error('❌ No authorization code provided');
      message = 'No authorization code provided';
      throw new Error('No authorization code provided');
    }

    // If no state (user ID) is provided
    if (!state) {
      console.error('❌ No user ID in state parameter');
      message = 'Invalid authentication state';
      throw new Error('Invalid authentication state');
    }

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
      message = `Token exchange failed: ${errorData}`;
      throw new Error(message);
    }

    const tokenData = await tokenResponse.json()
    console.log('✅ Google token exchange successful');
    
    const { access_token, refresh_token, expires_in, scope } = tokenData

    if (!access_token || !refresh_token) {
      console.error('❌ Invalid token response from Google - missing tokens');
      message = 'Invalid token response from Google - missing tokens';
      throw new Error(message);
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

    // Store the tokens in the database using Supabase service role
    console.log('💾 Storing tokens in database for user:', state);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Store tokens using the user ID from the state parameter
    const { error: insertError } = await supabaseClient
      .from('google_tokens')
      .upsert({
        tutor_id: state, // Use the user ID from state
        access_token,
        refresh_token,
        expires_at: expiresAt.toISOString(),
        scope: scope || 'https://www.googleapis.com/auth/calendar.readonly',
        email: userEmail || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'tutor_id'
      });

    if (insertError) {
      console.error('❌ Failed to store tokens:', insertError);
      message = `Failed to store tokens: ${insertError.message}`;
      throw new Error(message);
    }

    console.log('✅ Tokens stored successfully in database');
    status = 'success';
    responseData = {
      access_token,
      refresh_token,
      expires_at: expiresAt.toISOString(),
      scope: scope || 'https://www.googleapis.com/auth/calendar.readonly',
      email: userEmail || null,
    };

  } catch (err) {
    console.error('❌ OAuth callback error:', err);
    status = 'error';
    message = err.message || 'Unknown error during OAuth callback';
  }

  // Send message to opener and close popup
  const htmlResponse = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Google OAuth Callback</title>
      <script>
        window.onload = function() {
          if (window.opener) {
            window.opener.postMessage(
              {
                type: 'google-oauth-callback',
                status: '${status}',
                data: ${JSON.stringify(responseData)},
                message: '${message}'
              },
              '${siteUrl}' // Specify the origin for security
            );
            window.close();
          } else {
            // Fallback for cases where window.opener is not available (e.g., direct navigation)
            window.location.href = '${siteUrl}/calendar?google_auth_status=${status}&message=${encodeURIComponent(message)}';
          }
        };
      </script>
    </head>
    <body>
      <p>Processing Google Calendar connection...</p>
      <p>Please wait or close this window.</p>
    </body>
    </html>
  `;

  return new Response(htmlResponse, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  });
})
