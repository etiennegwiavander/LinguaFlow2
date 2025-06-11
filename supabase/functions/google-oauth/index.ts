import { serve } from "jsr:@std/http@0.224.0/server"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface OAuthRequest {
  code: string;
  email?: string;
  state?: string;
}

serve(async (req) => {
  console.log('🚀 Google OAuth Edge Function called');
  console.log('📡 Request method:', req.method);
  console.log('📡 Request URL:', req.url);
  
  // NEW: Log all headers received
  console.log('📋 All request headers:');
  for (const [key, value] of req.headers.entries()) {
    if (key.toLowerCase() === 'authorization') {
      console.log(`  ${key}: ${value ? value.substring(0, 20) + '...' : 'MISSING'}`);
    } else {
      console.log(`  ${key}: ${value}`);
    }
  }

  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    console.log('🔐 Authorization header check:');
    console.log('  - Header exists:', !!authHeader);
    console.log('  - Header value:', authHeader ? authHeader.substring(0, 30) + '...' : 'NULL');
    console.log('  - Header length:', authHeader?.length || 0);
    
    if (!authHeader) {
      console.error('❌ No authorization header found in request');
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('🎫 Extracted token:');
    console.log('  - Token exists:', !!token);
    console.log('  - Token length:', token?.length || 0);
    console.log('  - Token preview:', token ? token.substring(0, 20) + '...' : 'NULL');
    
    console.log('👤 Verifying user with Supabase...');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      console.error('❌ User verification failed:');
      console.error('  - Auth error:', authError);
      console.error('  - User object:', user);
      throw new Error('Invalid token')
    }

    console.log('✅ User verified successfully:', user.id);

    console.log('📦 Reading request body...');
    const requestBody = await req.json()
    console.log('📦 Request body received:', requestBody);
    
    const { code, email }: OAuthRequest = requestBody

    if (!code) {
      console.error('❌ Authorization code missing from request body');
      throw new Error('Authorization code is required')
    }

    console.log('🔄 Starting token exchange with Google...');
    console.log('  - Code length:', code.length);
    console.log('  - Email provided:', !!email);

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
    console.log('  - Access token received:', !!tokenData.access_token);
    console.log('  - Refresh token received:', !!tokenData.refresh_token);
    console.log('  - Expires in:', tokenData.expires_in);
    
    const { access_token, refresh_token, expires_in, scope } = tokenData

    if (!access_token || !refresh_token) {
      console.error('❌ Invalid token response from Google - missing tokens');
      throw new Error('Invalid token response from Google')
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + (expires_in * 1000))
    console.log('📅 Token expires at:', expiresAt.toISOString());

    console.log('💾 Storing tokens in database...');
    // Store tokens in database
    const { error: insertError } = await supabaseClient
      .from('google_tokens')
      .upsert({
        tutor_id: user.id,
        access_token,
        refresh_token,
        expires_at: expiresAt.toISOString(),
        scope: scope || 'https://www.googleapis.com/auth/calendar.readonly',
        email: email || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'tutor_id'
      })

    if (insertError) {
      console.error('❌ Failed to store tokens in database:', insertError);
      throw new Error(`Failed to store tokens: ${insertError.message}`)
    }

    console.log('✅ Tokens stored successfully in database');

    const successResponse = { 
      success: true, 
      message: 'Google Calendar connected successfully',
      expires_at: expiresAt.toISOString(),
      email: email
    };

    console.log('📤 Sending success response:', successResponse);

    return new Response(
      JSON.stringify(successResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Google OAuth error:', error)
    console.error('❌ Error stack:', error.stack);
    
    const errorResponse = { 
      error: error.message || 'Internal server error' 
    };
    
    console.log('📤 Sending error response:', errorResponse);
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})