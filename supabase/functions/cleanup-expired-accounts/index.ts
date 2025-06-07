// No explicit import for 'serve' needed; using Deno.serve directly.
// Import the 'createClient' function from the Supabase JavaScript library to interact with Supabase services.
// Changed import to use the jsr.io CDN for better compatibility in Deno environments.
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Define CORS headers to allow cross-origin requests, which is necessary for web functions.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allows requests from any origin.
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', // Specifies allowed request headers.
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Specifies allowed HTTP methods.
}

// Start the Deno HTTP server using Deno.serve and define the asynchronous request handler.
// Deno.serve is a global API available in Deno runtimes for handling HTTP requests.
Deno.serve(async (req) => {
  // Handle pre-flight OPTIONS requests, which are sent by browsers before the actual request.
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders }) // Respond with CORS headers for pre-flight.
  }

  try {
    // Initialize the Supabase client using environment variables for URL and service role key.
    // The service role key is used for privileged operations that require elevated permissions.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', // Get Supabase URL from environment, default to empty string if not found.
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Get Supabase service role key from environment.
    )

    // Verify if the request is authorized using a custom API key.
    // This adds a layer of security to ensure only trusted sources can trigger the cleanup.
    const authHeader = req.headers.get('Authorization') // Get the Authorization header from the request.
    const expectedToken = Deno.env.get('CLEANUP_API_KEY') // Get the expected API key from environment variables.
    
    // If authorization header or expected token is missing, or they don't match, throw an unauthorized error.
    if (!authHeader || !expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      throw new Error('Unauthorized')
    }

    console.log('Starting cleanup of expired accounts...')

    // Call a PostgreSQL function named 'cleanup_expired_accounts' in your Supabase database.
    // This RPC (Remote Procedure Call) is expected to handle the actual database logic for cleanup.
    const { data: deletedCount, error: functionError } = await supabaseClient
      .rpc('cleanup_expired_accounts')

    // If there's an error from the database function, throw an error.
    if (functionError) {
      throw new Error(`Failed to cleanup accounts: ${functionError.message}`)
    }

    console.log(`Cleanup completed. Deleted ${deletedCount} expired accounts.`)

    // Send a notification email to the admin if any accounts were deleted.
    if (deletedCount > 0) {
      try {
        const adminEmail = Deno.env.get('ADMIN_EMAIL') // Get the admin email from environment variables.
        if (adminEmail) {
          // Make a POST request to another Supabase Edge Function to send the notification email.
          const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-admin-notification`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`, // Authorize with service role key.
              'Content-Type': 'application/json', // Specify content type as JSON.
            },
            body: JSON.stringify({ // Send a JSON payload with cleanup details.
              type: 'account_cleanup',
              data: {
                deleted_count: deletedCount,
                cleanup_date: new Date().toISOString() // Include current date/time of cleanup.
              }
            }),
          })

          // Log an error if the email notification failed to send.
          if (!emailResponse.ok) {
            console.error('Failed to send admin notification:', await emailResponse.text())
          }
        }
      } catch (emailError) {
        // Catch and log any errors that occur during the email sending process.
        console.error('Error sending admin notification:', emailError)
      }
    }

    // Return a success response with cleanup details.
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cleanup completed successfully`,
        deleted_accounts: deletedCount,
        cleanup_date: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // Include CORS and content type headers.
        status: 200, // HTTP status code for success.
      },
    )

  } catch (error) {
    // Catch and handle any errors that occur during the function execution.
    console.error('Cleanup error:', error)
    // Return an error response with a descriptive message.
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' // Use error message or a generic internal server error.
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // Include CORS and content type headers.
        status: error.message === 'Unauthorized' ? 401 : 500, // Return 401 for unauthorized, else 500 for other errors.
      },
    )
  }
})

// This function can be called by a cron job or scheduled task
// Example cron job (daily at 2 AM):
// 0 2 * * * curl -X POST -H "Authorization: Bearer YOUR_CLEANUP_API_KEY" https://your-project.supabase.co/functions/v1/cleanup-expired-accounts
