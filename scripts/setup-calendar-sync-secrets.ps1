# Setup Supabase secrets for calendar sync Edge Function
Write-Host "Setting up Supabase secrets for calendar sync..." -ForegroundColor Cyan
Write-Host ""

# Check if supabase CLI is available
if (!(Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

# Load environment variables from .env.local
if (!(Test-Path ".env.local")) {
    Write-Host "❌ .env.local file not found" -ForegroundColor Red
    exit 1
}

Write-Host "Reading .env.local file..." -ForegroundColor Yellow

# Read the file and extract values
$envContent = Get-Content ".env.local" -Raw
$googleClientId = if ($envContent -match 'GOOGLE_CLIENT_ID=([^\r\n]+)') { $matches[1].Trim() } else { $null }
$googleClientSecret = if ($envContent -match 'GOOGLE_CLIENT_SECRET=([^\r\n]+)') { $matches[1].Trim() } else { $null }

if (!$googleClientId -or !$googleClientSecret) {
    Write-Host "❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found Google credentials" -ForegroundColor Green
Write-Host "  Client ID: $($googleClientId.Substring(0, 20))..." -ForegroundColor White
Write-Host "  Client Secret: $($googleClientSecret.Substring(0, 10))..." -ForegroundColor White
Write-Host ""

Write-Host "Setting Supabase secrets..." -ForegroundColor Yellow
supabase secrets set GOOGLE_CLIENT_ID="$googleClientId"
supabase secrets set GOOGLE_CLIENT_SECRET="$googleClientSecret"

Write-Host ""
Write-Host "✅ Secrets set successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Now deploying sync-calendar function..." -ForegroundColor Yellow
supabase functions deploy sync-calendar

Write-Host ""
Write-Host "✅ Done! Calendar sync should now work." -ForegroundColor Green
