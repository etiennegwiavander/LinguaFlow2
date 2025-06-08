import { serve } from "jsr:@std/http@0.224.0/server"

serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const state = url.searchParams.get('state')

  // Create HTML response that will communicate with the parent window
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Google Calendar Authorization</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
          }
          .container {
            text-align: center;
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .success { color: #16a34a; }
          .error { color: #dc2626; }
        </style>
      </head>
      <body>
        <div class="container">
          ${error ? 
            `<h2 class="error">Authorization Failed</h2>
             <p>Error: ${error}</p>` :
            `<h2 class="success">Authorization Successful</h2>
             <p>You can close this window now.</p>`
          }
        </div>
        <script>
          // Send message to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'GOOGLE_OAUTH_CALLBACK',
              success: ${!error},
              code: '${code || ''}',
              error: '${error || ''}',
              state: '${state || ''}'
            }, '*');
            window.close();
          }
        </script>
      </body>
    </html>
  `

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  })
})