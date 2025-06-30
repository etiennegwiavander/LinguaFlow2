import { Resend } from 'npm:resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

serve();

async function serve() {
  Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    try {
      // Only allow POST requests
      if (req.method !== 'POST') {
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Parse the request body
      let formData: ContactFormData;
      try {
        formData = await req.json();
      } catch (parseError) {
        console.error('Failed to parse request body:', parseError);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Validate required fields
      const { name, email, subject, message } = formData;
      if (!name || !email || !subject || !message) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: name, email, subject, message' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Log the form submission (for debugging)
      console.log('Contact form submission received:', {
        name,
        email,
        subject,
        message,
        timestamp: new Date().toISOString()
      });

      // Initialize Resend with API key from environment variable
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (!resendApiKey) {
        console.error('RESEND_API_KEY environment variable is not set');
        return new Response(
          JSON.stringify({ error: 'Email service configuration error' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const resend = new Resend(resendApiKey);

      // Format the email content
      const emailHtml = `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <h3>Message:</h3>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><small>This email was sent from the LinguaFlow contact form.</small></p>
      `;

      // Send the email using Resend
      try {
        const { data, error } = await resend.emails.send({
          from: 'LinguaFlow Contact <contact@linguaflow.com>', // Use a verified domain in Resend
          to: ['linguaflowservices@gmail.com'], // Destination email
          subject: `Contact Form: ${subject}`,
          html: emailHtml,
          reply_to: email,
        });

        if (error) {
          console.error('Resend API error:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to send email', details: error }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        console.log('Email sent successfully:', data);

        // Return success response
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Contact form submitted successfully',
            emailId: data?.id
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to send email', 
            details: emailError instanceof Error ? emailError.message : 'Unknown error'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

    } catch (error) {
      console.error('Unexpected error in send-contact-email function:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  });
}