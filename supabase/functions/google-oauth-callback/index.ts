import { serve } from "jsr:@std/http@0.224.0/server"

serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const state = url.searchParams.get('state')

  // Minimal HTML response
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Google Calendar Authorization</title>
      </head>
      <body>
        <script>
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