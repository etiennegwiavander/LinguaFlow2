# Deploy Resend Integration to Supabase
# PowerShell script for Windows

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "DEPLOYING RESEND INTEGRATION TO SUPABASE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "1. Checking Supabase CLI..." -ForegroundColor Yellow
Write-Host "------------------------------------------------------------"

$supabaseVersion = npx supabase --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Supabase CLI not found. Installing..." -ForegroundColor Red
    npm install -g supabase
} else {
    Write-Host "✅ Supabase CLI installed: $supabaseVersion" -ForegroundColor Green
}
Write-Host ""

# Check environment variables
Write-Host "2. Checking Environment Variables..." -ForegroundColor Yellow
Write-Host "------------------------------------------------------------"

$envContent = Get-Content .env.local -Raw
$hasResendKey = $envContent -match "RESEND_API_KEY="
$hasEncryptionKey = $envContent -match "EMAIL_ENCRYPTION_KEY="

if ($hasResendKey) {
    Write-Host "✅ RESEND_API_KEY found in .env.local" -ForegroundColor Green
} else {
    Write-Host "❌ RESEND_API_KEY not found in .env.local" -ForegroundColor Red
    Write-Host "   Please add: RESEND_API_KEY=your_key_here" -ForegroundColor Yellow
    exit 1
}

if ($hasEncryptionKey) {
    Write-Host "✅ EMAIL_ENCRYPTION_KEY found in .env.local" -ForegroundColor Green
} else {
    Write-Host "❌ EMAIL_ENCRYPTION_KEY not found in .env.local" -ForegroundColor Red
    Write-Host "   Please add: EMAIL_ENCRYPTION_KEY=your_32_char_key_here" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Extract RESEND_API_KEY from .env.local
$resendKey = ($envContent -split "`n" | Where-Object { $_ -match "^RESEND_API_KEY=" }) -replace "RESEND_API_KEY=", ""
$resendKey = $resendKey.Trim()

if ([string]::IsNullOrWhiteSpace($resendKey)) {
    Write-Host "❌ RESEND_API_KEY is empty in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "3. Linking Supabase Project..." -ForegroundColor Yellow
Write-Host "------------------------------------------------------------"
Write-Host "Project Reference: urmuwjcjcyohsrkgyapl" -ForegroundColor Cyan

# Link project (will prompt for login if needed)
npx supabase link --project-ref urmuwjcjcyohsrkgyapl

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to link Supabase project" -ForegroundColor Red
    Write-Host "   Please run: npx supabase login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Project linked successfully" -ForegroundColor Green
Write-Host ""

# Set Resend API key as secret
Write-Host "4. Setting RESEND_API_KEY Secret..." -ForegroundColor Yellow
Write-Host "------------------------------------------------------------"

npx supabase secrets set RESEND_API_KEY=$resendKey

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to set RESEND_API_KEY secret" -ForegroundColor Red
    exit 1
}

Write-Host "✅ RESEND_API_KEY secret set successfully" -ForegroundColor Green
Write-Host ""

# Deploy Edge Function
Write-Host "5. Deploying Edge Function..." -ForegroundColor Yellow
Write-Host "------------------------------------------------------------"

npx supabase functions deploy send-integrated-email

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to deploy Edge Function" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Edge Function deployed successfully" -ForegroundColor Green
Write-Host ""

# Verify deployment
Write-Host "6. Verifying Deployment..." -ForegroundColor Yellow
Write-Host "------------------------------------------------------------"

npx supabase secrets list

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "DEPLOYMENT COMPLETE! ✅" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Test the integration:" -ForegroundColor White
Write-Host "   node scripts/test-resend-integration.js" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Check the deployment guide:" -ForegroundColor White
Write-Host "   docs/resend-integration-complete.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Test with a real email:" -ForegroundColor White
Write-Host "   - Sign up a new user" -ForegroundColor Yellow
Write-Host "   - Check for welcome email" -ForegroundColor Yellow
Write-Host ""
