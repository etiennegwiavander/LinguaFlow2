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

  // If no state (user ID) is provided
  if (!state) {
    console.error('❌ No user ID in state parameter');
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${siteUrl}/calendar?google_auth_status=error&message=${encodeURIComponent('Invalid authentication state')}`
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

    // Store the tokens in the database using Supabase service role
    console.log('💾 Storing tokens in database for user:', state);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
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
      throw new Error(`Failed to store tokens: ${insertError.message}`);
    }

    console.log('✅ Tokens stored successfully in database');
    console.log('🔄 Redirecting back to calendar page with success status...');

    // Redirect back to calendar with success status only
    const redirectUrl = new URL(`${siteUrl}/calendar`);
    redirectUrl.searchParams.set('google_auth_status', 'success');
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