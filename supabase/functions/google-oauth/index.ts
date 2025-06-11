import { serve } from "jsr:@std/http@0.224.0/server"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// This function is no longer used in the OAuth flow
// The google-oauth-callback function now handles the complete token exchange process
// This function is kept for backward compatibility but will return a deprecation notice

serve(async (req) => {
  console.log('⚠️ google-oauth function called - this function is deprecated');
  console.log('📡 Request method:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  return new Response(
    JSON.stringify({ 
      error: 'This endpoint is deprecated. OAuth flow is now handled by google-oauth-callback function.',
      deprecated: true
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 410, // Gone
    },
  )
})