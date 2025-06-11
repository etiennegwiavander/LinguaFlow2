import { serve } from "jsr:@std/http@0.224.0/server"

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

  // Get the target origin for postMessage (for security)
  const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:3000';
  const targetOrigin = new URL(siteUrl).origin;

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
              window.opener.postMessage({
                type: 'GOOGLE_OAUTH_CALLBACK',
                success: false,
                error: '${error.replace(/'/g, "\\'")}',
                state: '${state || ''}'
              }, '${targetOrigin}');
              window.close();
            } else {
              window.location.href = '${siteUrl}/calendar?google_auth_status=error&error=${encodeURIComponent(error)}';
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
              window.opener.postMessage({
                type: 'GOOGLE_OAUTH_CALLBACK',
                success: false,
                error: 'No authorization code provided',
                state: '${state || ''}'
              }, '${targetOrigin}');
              window.close();
            } else {
              window.location.href = '${siteUrl}/calendar?google_auth_status=error&error=no_code';
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

    console.log('✅ Token exchange completed successfully');

    // Send success message with token data via postMessage
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Calendar Authorization</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_OAUTH_CALLBACK',
                success: true,
                data: {
                  access_token: '${access_token}',
                  refresh_token: '${refresh_token}',
                  expires_at: '${expiresAt.toISOString()}',
                  scope: '${scope || 'https://www.googleapis.com/auth/calendar.readonly'}',
                  email: ${userEmail ? `'${userEmail}'` : 'null'}
                },
                state: '${state || ''}'
              }, '${targetOrigin}');
              window.close();
            } else {
              // Fallback for direct navigation (shouldn't happen in normal flow)
              const params = new URLSearchParams({
                google_auth_status: 'success',
                access_token: '${access_token}',
                refresh_token: '${refresh_token}',
                expires_at: '${expiresAt.toISOString()}',
                scope: '${scope || 'https://www.googleapis.com/auth/calendar.readonly'}'
              });
              ${userEmail ? `params.set('email', '${userEmail}');` : ''}
              window.location.href = '${siteUrl}/calendar?' + params.toString();
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
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Calendar Authorization</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_OAUTH_CALLBACK',
                success: false,
                error: '${(error.message || 'Unknown error').replace(/'/g, "\\'")}',
                state: '${state || ''}'
              }, '${targetOrigin}');
              window.close();
            } else {
              window.location.href = '${siteUrl}/calendar?google_auth_status=error&error=${encodeURIComponent(error.message || 'Unknown error')}';
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