# Deploy Google OAuth Callback with Secrets
Write-Host "🚀 Deploying Google OAuth Callback with Supabase Secrets" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ Error: .env.local file not found" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Loading environment variables..." -ForegroundColor Yellow
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

$ANON_KEY = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY
$GOOGLE_CLIENT_ID = $env:NEXT_PUBLIC_GOOGLE_CLIENT_ID
$GOOGLE_CLIENT_SECRET = $env:GOOGLE_CLIENT_SECRET

# Verify variables
Write-Host ""
Write-Host "🔍 Verifying environment variables..." -ForegroundColor Yellow
if (-not $ANON_KEY) {
    Write-Host "  ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing" -ForegroundColor Red
    exit 1
}
if (-not $GOOGLE_CLIENT_ID) {
    Write-Host "  ❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing" -ForegroundColor Red
    exit 1
}
if (-not $GOOGLE_CLIENT_SECRET) {
    Write-Host "  ❌ GOOGLE_CLIENT_SECRET is missing" -ForegroundColor Red
    exit 1
}

Write-Host "  ✅ All environment variables present" -ForegroundColor Green

# Set Supabase secrets
Write-Host ""
Write-Host "🔐 Setting Supabase Edge Function secrets..." -ForegroundColor Yellow

Write-Host "  Setting SUPABASE_ANON_KEY..." -ForegroundColor Gray
supabase secrets set "SUPABASE_ANON_KEY=$ANON_KEY"

Write-Host "  Setting GOOGLE_CLIENT_ID..." -ForegroundColor Gray
supabase secrets set "GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID"

Write-Host "  Setting GOOGLE_CLIENT_SECRET..." -ForegroundColor Gray
supabase secrets set "GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET"

Write-Host ""
Write-Host "✅ Secrets configured successfully" -ForegroundColor Green

# Deploy the Edge Function
Write-Host ""
Write-Host "📦 Deploying google-oauth-callback Edge Function..." -ForegroundColor Yellow
supabase functions deploy google-oauth-callback

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Google OAuth callback is now deployed with secrets!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Test the OAuth flow by going to /calendar" -ForegroundColor White
    Write-Host "  2. Click 'Connect Google Calendar'" -ForegroundColor White
    Write-Host "  3. Complete the Google OAuth flow" -ForegroundColor White
    Write-Host "  4. Verify successful connection" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Please check the error messages above." -ForegroundColor Red
    exit 1
}
