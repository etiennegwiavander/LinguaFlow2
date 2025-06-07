import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RecoverAccountRequest {
  recovery_token: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { recovery_token }: RecoverAccountRequest = await req.json()

    if (!recovery_token) {
      throw new Error('Recovery token is required')
    }

    // Call the database function to recover the account
    const { data: functionResult, error: functionError } = await supabaseClient
      .rpc('recover_account', {
        p_recovery_token: recovery_token
      })

    if (functionError) {
      throw new Error(`Failed to recover account: ${functionError.message}`)
    }

    if (!functionResult) {
      throw new Error('Recovery token is invalid, expired, or has already been used')
    }

    // Get the tutor information for the success response
    const { data: deletionData, error: deletionError } = await supabaseClient
      .from('account_deletions')
      .select('tutor_id, tutors!inner(email, name)')
      .eq('recovery_token', recovery_token)
      .single()

    if (deletionError) {
      console.error('Failed to fetch tutor data:', deletionError)
    }

    const tutorEmail = deletionData?.tutors?.email
    const tutorName = deletionData?.tutors?.name

    // Send recovery confirmation email (optional)
    try {
      const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-recovery-confirmation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: tutorEmail,
          name: tutorName
        }),
      })

      if (!emailResponse.ok) {
        console.error('Failed to send recovery confirmation email:', await emailResponse.text())
      }
    } catch (emailError) {
      console.error('Error sending recovery confirmation email:', emailError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account recovered successfully',
        email: tutorEmail
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Account recovery error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})