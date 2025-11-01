import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from 'npm:resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Simple test email function called')

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY environment variable is not set')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'RESEND_API_KEY environment variable is not set' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    console.log('Resend API key found, initializing Resend...')
    const resend = new Resend(resendApiKey)

    // Send a simple test email
    console.log('Sending test email...')
    const { data, error } = await resend.emails.send({
      from: 'noreply@linguaflow.online',
      to: 'linguaflowservices@gmail.com',
      subject: 'Simple Test from LinguaFlow',
      html: '<h1>✅ Success!</h1><p>Your Resend integration is working!</p><p>This email was sent from a simple Edge Function that bypasses all database dependencies.</p>',
    })

    if (error) {
      console.error('Resend API error:', error)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: error.message,
          details: error
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    console.log('Email sent successfully!', data)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email sent successfully!',
        resendId: data?.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
        }
    )

  } catch (error: any) {
    console.error('Unexpected error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
