import { serve } from "jsr:@std/http@0.224.0/server"

serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const state = url.searchParams.get('state')

  // Minimal HTML response with security fixes
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Google Calendar Authorization</title>
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none';">
      </head>
      <body>
        ${error ? 
          `<h2>Authorization Failed</h2><p>Error: ${error}</p>` :
          `<h2>Authorization Successful</h2><p>You can close this window now.</p>`
        }
        <script>
          console.log('OAuth callback script starting...');
          
          // Send message to parent window
          if (window.opener) {
            console.log('Sending message to parent window...');
            try {
              window.opener.postMessage({
                type: 'GOOGLE_OAUTH_CALLBACK',
                success: ${!error},
                code: '${code || ''}',
                error: '${error || ''}',
                state: '${state || ''}'
              }, '*');
              console.log('Message sent successfully');
              
              // Close window after a short delay
              setTimeout(() => {
                console.log('Closing window...');
                window.close();
              }, 500);
            } catch (e) {
              console.error('Error sending message:', e);
            }
          } else {
            console.error('No window.opener found');
          }
        </script>
      </body>
    </html>
  `

  return new Response(html, {
    headers: { 
      'Content-Type': 'text/html',
      'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none';",
      'X-Frame-Options': 'DENY'
    },
  })
})