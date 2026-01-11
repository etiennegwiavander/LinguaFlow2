# Deploy Pronunciation Vocabulary Examples Enhancement
# This script deploys the enhanced AI prompt for Pronunciation templates

Write-Host "🚀 Deploying Pronunciation Vocabulary Examples Enhancement..." -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "✓ Checking Supabase CLI..." -ForegroundColor Yellow
$supabaseVersion = supabase --version 2>$null
if (-not $supabaseVersion) {
    Write-Host "❌ Supabase CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "   Visit: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}
Write-Host "  Found: $supabaseVersion" -ForegroundColor Green
Write-Host ""

# Check if logged in to Supabase
Write-Host "✓ Checking Supabase authentication..." -ForegroundColor Yellow
$loginCheck = supabase projects list 2>&1
if ($loginCheck -match "not logged in" -or $loginCheck -match "No access token") {
    Write-Host "❌ Not logged in to Supabase. Please run: supabase login" -ForegroundColor Red
    exit 1
}
Write-Host "  Authenticated ✓" -ForegroundColor Green
Write-Host ""

# Confirm deployment
Write-Host "📋 Deployment Summary:" -ForegroundColor Cyan
Write-Host "  • Function: generate-interactive-material" -ForegroundColor White
Write-Host "  • Change: Enhanced AI prompt for vocabulary_matching" -ForegroundColor White
Write-Host "  • Scope: Pronunciation templates only" -ForegroundColor White
Write-Host "  • Risk: Minimal (scoped change)" -ForegroundColor Green
Write-Host ""

$confirmation = Read-Host "Deploy to production? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Deploying Edge Function..." -ForegroundColor Cyan

# Deploy the function
$deployResult = supabase functions deploy generate-interactive-material --no-verify-jwt 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Test by generating a new Pronunciation lesson (A2, B1, or B2)" -ForegroundColor White
    Write-Host "  2. Verify vocabulary sections show 3 contextual examples per word" -ForegroundColor White
    Write-Host "  3. Check that examples use the actual word (not generic text)" -ForegroundColor White
    Write-Host "  4. Monitor Edge Function logs for any errors" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Test Command:" -ForegroundColor Yellow
    Write-Host "  node scripts/test-pronunciation-vocabulary-fix.js" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📊 Monitor Logs:" -ForegroundColor Yellow
    Write-Host "  supabase functions logs generate-interactive-material --tail" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error output:" -ForegroundColor Yellow
    Write-Host $deployResult -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check your Supabase project is linked: supabase link" -ForegroundColor White
    Write-Host "  2. Verify you have deployment permissions" -ForegroundColor White
    Write-Host "  3. Check the function file exists: supabase/functions/generate-interactive-material/index.ts" -ForegroundColor White
    Write-Host ""
    exit 1
}
