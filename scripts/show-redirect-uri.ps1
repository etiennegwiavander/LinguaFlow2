# Show the exact redirect URI for Google Cloud Console

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  GOOGLE CLOUD CONSOLE - REDIRECT URI" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
$envContent = Get-Content .env.local
$siteUrl = ($envContent | Select-String "NEXT_PUBLIC_SITE_URL=" | ForEach-Object { $_ -replace "NEXT_PUBLIC_SITE_URL=", "" }).Trim()

# Default to production URL if not set
if (-not $siteUrl) {
    $siteUrl = "https://linguaflow.online"
}

# Use Next.js API route (not Edge Function directly)
$redirectUri = "$siteUrl/api/oauth/google-callback"

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
Write-Host "  4. REMOVE the old Supabase Edge Function URI" -ForegroundColor White
Write-Host "  5. ADD the above Next.js API route URI" -ForegroundColor White
Write-Host "  6. Click SAVE" -ForegroundColor White
Write-Host "  7. Wait 5-10 minutes for changes to propagate" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: This is a Next.js API route, not the Edge Function!" -ForegroundColor Yellow
Write-Host "   The API route will proxy to the Edge Function with proper auth." -ForegroundColor Gray
Write-Host ""

# Copy to clipboard
$redirectUri | Set-Clipboard
Write-Host "✅ URI has been copied to your clipboard!" -ForegroundColor Green
Write-Host ""
