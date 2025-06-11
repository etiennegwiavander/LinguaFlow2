import { serve } from "jsr:@std/http@0.224.0/server"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ScheduleDeletionRequest {
  reason?: string;
  user_agent?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid token')
    }

    const { reason, user_agent }: ScheduleDeletionRequest = await req.json()

    // Get client IP address
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown'

    // Check if account is already scheduled for deletion
    const { data: existingDeletion, error: checkError } = await supabaseClient
      .from('account_deletions')
      .select('id, deletion_timestamp, recovered_at')
      .eq('tutor_id', user.id)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Failed to check existing deletion: ${checkError.message}`)
    }

    if (existingDeletion && !existingDeletion.recovered_at) {
      throw new Error('Account is already scheduled for deletion. Check your email for recovery options.')
    }

    // Call the database function to schedule deletion
    const { data: functionResult, error: functionError } = await supabaseClient
      .rpc('schedule_account_deletion', {
        p_tutor_id: user.id,
        p_reason: reason || null,
        p_ip_address: clientIP,
        p_user_agent: user_agent || null
      })

    if (functionError) {
      throw new Error(`Failed to schedule deletion: ${functionError.message}`)
    }

    const recoveryToken = functionResult

    // Send deletion notification email
    try {
      const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-deletion-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tutor_id: user.id,
          recovery_token: recoveryToken,
          email: user.email,
          reason: reason
        }),
      })

      if (!emailResponse.ok) {
        console.error('Failed to send deletion email:', await emailResponse.text())
        // Don't fail the deletion process if email fails
      }
    } catch (emailError) {
      console.error('Error sending deletion email:', emailError)
      // Don't fail the deletion process if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account scheduled for deletion successfully',
        deletion_timestamp: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        recovery_token: recoveryToken
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Account deletion scheduling error:', error)
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