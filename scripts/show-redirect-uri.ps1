# Show the exact redirect URI for Google Cloud Console

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  GOOGLE CLOUD CONSOLE - REDIRECT URI" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
$envContent = Get-Content .env.local
$supabaseUrl = ($envContent | Select-String "NEXT_PUBLIC_SUPABASE_URL=" | ForEach-Object { $_ -replace "NEXT_PUBLIC_SUPABASE_URL=", "" }).Trim()
$anonKey = ($envContent | Select-String "NEXT_PUBLIC_SUPABASE_ANON_KEY=" | ForEach-Object { $_ -replace "NEXT_PUBLIC_SUPABASE_ANON_KEY=", "" }).Trim()

$redirectUri = "$supabaseUrl/functions/v1/google-oauth-callback?apikey=$anonKey"

Write-Host "Copy this EXACT URI to Google Cloud Console:" -ForegroundColor Yellow
Write-Host ""
Write-Host $redirectUri -ForegroundColor Green
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Steps:" -ForegroundColor Yellow
Write-Host "  1. Go to https://console.cloud.google.com/" -ForegroundColor White
Write-Host "  2. Navigate to APIs & Services > Credentials" -ForegroundColor White
Write-Host "  3. Click on your OAuth 2.0 Client ID" -ForegroundColor White
Write-Host "  4. Add the above URI to 'Authorized redirect URIs'" -ForegroundColor White
Write-Host "  5. Click SAVE" -ForegroundColor White
Write-Host "  6. Wait 5-10 minutes for changes to propagate" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Copy the ENTIRE URI including the apikey parameter!" -ForegroundColor Red
Write-Host ""

# Copy to clipboard
$redirectUri | Set-Clipboard
Write-Host "✅ URI has been copied to your clipboard!" -ForegroundColor Green
Write-Host ""
