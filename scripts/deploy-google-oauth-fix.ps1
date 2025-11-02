# Deploy Google OAuth Callback Fix
# This script deploys the updated Edge Function and verifies configuration

Write-Host "🚀 Deploying Google OAuth Callback Fix" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ Error: .env.local file not found" -ForegroundColor Red
    exit 1
}

# Load environment variables
Write-Host "📋 Loading environment variables..." -ForegroundColor Yellow
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

# Get required variables
$SUPABASE_URL = $env:NEXT_PUBLIC_SUPABASE_URL
$ANON_KEY = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY
$GOOGLE_CLIENT_ID = $env:NEXT_PUBLIC_GOOGLE_CLIENT_ID
$GOOGLE_CLIENT_SECRET = $env:GOOGLE_CLIENT_SECRET

# Verify all required variables are set
Write-Host ""
Write-Host "🔍 Verifying environment variables..." -ForegroundColor Yellow
$allSet = $true

if (-not $SUPABASE_URL) {
    Write-Host "  ❌ NEXT_PUBLIC_SUPABASE_URL is not set" -ForegroundColor Red
    $allSet = $false
} else {
    Write-Host "  ✅ NEXT_PUBLIC_SUPABASE_URL is set" -ForegroundColor Green
}

if (-not $ANON_KEY) {
    Write-Host "  ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set" -ForegroundColor Red
    $allSet = $false
} else {
    Write-Host "  ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set" -ForegroundColor Green
}

if (-not $GOOGLE_CLIENT_ID) {
    Write-Host "  ❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set" -ForegroundColor Red
    $allSet = $false
} else {
    Write-Host "  ✅ NEXT_PUBLIC_GOOGLE_CLIENT_ID is set" -ForegroundColor Green
}

if (-not $GOOGLE_CLIENT_SECRET) {
    Write-Host "  ❌ GOOGLE_CLIENT_SECRET is not set" -ForegroundColor Red
    $allSet = $false
} else {
    Write-Host "  ✅ GOOGLE_CLIENT_SECRET is set" -ForegroundColor Green
}

if (-not $allSet) {
    Write-Host ""
    Write-Host "❌ Missing required environment variables. Please check your .env.local file." -ForegroundColor Red
    exit 1
}

# Display the redirect URI that needs to be configured in Google Cloud Console
Write-Host ""
Write-Host "📝 Google Cloud Console Configuration" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "Add this redirect URI to your Google Cloud Console:" -ForegroundColor Yellow
Write-Host ""
$redirectUri = "$SUPABASE_URL/functions/v1/google-oauth-callback?apikey=$ANON_KEY"
Write-Host "  $redirectUri" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: The apikey parameter is required for public access!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Steps:" -ForegroundColor Yellow
Write-Host "  1. Go to https://console.cloud.google.com/" -ForegroundColor White
Write-Host "  2. Select your project" -ForegroundColor White
Write-Host "  3. Navigate to APIs & Services > Credentials" -ForegroundColor White
Write-Host "  4. Click on your OAuth 2.0 Client ID" -ForegroundColor White
Write-Host "  5. Verify the above URI is in 'Authorized redirect URIs'" -ForegroundColor White
Write-Host "  6. If not, add it and click Save" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Ask user to confirm they've verified Google Cloud Console
$response = Read-Host "Have you verified the redirect URI in Google Cloud Console? (y/n)"
if ($response -ne 'y' -and $response -ne 'Y') {
    Write-Host ""
    Write-Host "⚠️  Please verify Google Cloud Console first, then run this script again." -ForegroundColor Yellow
    exit 0
}

# Set Supabase secrets
Write-Host ""
Write-Host "🔐 Setting Supabase Edge Function secrets..." -ForegroundColor Yellow

Write-Host "  Setting SUPABASE_ANON_KEY..." -ForegroundColor Gray
supabase secrets set "SUPABASE_ANON_KEY=$ANON_KEY" 2>&1 | Out-Null

Write-Host "  Setting GOOGLE_CLIENT_ID..." -ForegroundColor Gray
supabase secrets set "GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID" 2>&1 | Out-Null

Write-Host "  Setting GOOGLE_CLIENT_SECRET..." -ForegroundColor Gray
supabase secrets set "GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET" 2>&1 | Out-Null

Write-Host "  ✅ Secrets configured" -ForegroundColor Green

# Deploy the Edge Function
Write-Host ""
Write-Host "📦 Deploying google-oauth-callback Edge Function..." -ForegroundColor Yellow
supabase functions deploy google-oauth-callback

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Google OAuth callback fix has been deployed!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Test the OAuth flow by going to /calendar" -ForegroundColor White
    Write-Host "  2. Click 'Connect Google Calendar'" -ForegroundColor White
    Write-Host "  3. Complete the Google OAuth flow" -ForegroundColor White
    Write-Host "  4. Verify you're redirected back successfully" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Please check the error messages above." -ForegroundColor Red
    exit 1
}
