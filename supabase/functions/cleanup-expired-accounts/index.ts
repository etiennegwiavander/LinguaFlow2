import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    // Verify this is an authorized request (you might want to add API key validation)
    const authHeader = req.headers.get('Authorization')
    const expectedToken = Deno.env.get('CLEANUP_API_KEY')
    
    if (!authHeader || !expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      throw new Error('Unauthorized')
    }

    console.log('Starting cleanup of expired accounts...')

    // Call the database function to cleanup expired accounts
    const { data: deletedCount, error: functionError } = await supabaseClient
      .rpc('cleanup_expired_accounts')

    if (functionError) {
      throw new Error(`Failed to cleanup accounts: ${functionError.message}`)
    }

    console.log(`Cleanup completed. Deleted ${deletedCount} expired accounts.`)

    // Send notification email to admin if accounts were deleted
    if (deletedCount > 0) {
      try {
        const adminEmail = Deno.env.get('ADMIN_EMAIL')
        if (adminEmail) {
          const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-admin-notification`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'account_cleanup',
              data: {
                deleted_count: deletedCount,
                cleanup_date: new Date().toISOString()
              }
            }),
          })

          if (!emailResponse.ok) {
            console.error('Failed to send admin notification:', await emailResponse.text())
          }
        }
      } catch (emailError) {
        console.error('Error sending admin notification:', emailError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cleanup completed successfully`,
        deleted_accounts: deletedCount,
        cleanup_date: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Cleanup error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' ? 401 : 500,
      },
    )
  }
})

// This function can be called by a cron job or scheduled task
// Example cron job (daily at 2 AM):
// 0 2 * * * curl -X POST -H "Authorization: Bearer YOUR_CLEANUP_API_KEY" https://your-project.supabase.co/functions/v1/cleanup-expired-accounts