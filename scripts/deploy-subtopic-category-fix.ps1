# Deploy Sub-Topic Category Fix
# This script deploys the updated generate-lesson-plan Edge Function

Write-Host "🚀 Deploying Sub-Topic Category Fix..." -ForegroundColor Cyan
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
Write-Host "  • Function: generate-lesson-plan" -ForegroundColor White
Write-Host "  • Change: Enforce category/level after AI generation" -ForegroundColor White
Write-Host "  • Fixes:" -ForegroundColor White
Write-Host "    - No more 'English for Kids' for non-kid students" -ForegroundColor Green
Write-Host "    - No more empty categories" -ForegroundColor Green
Write-Host "    - Categories always match the template" -ForegroundColor Green
Write-Host "  • Risk: Minimal (additive validation only)" -ForegroundColor Green
Write-Host ""

$confirmation = Read-Host "Deploy to production? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Deploying Edge Function..." -ForegroundColor Cyan

# Deploy the function
$deployResult = supabase functions deploy generate-lesson-plan --no-verify-jwt 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Test by generating new lessons for different student types" -ForegroundColor White
    Write-Host "  2. Verify no 'English for Kids' appears for non-kid students" -ForegroundColor White
    Write-Host "  3. Check that all sub-topics have non-empty categories" -ForegroundColor White
    Write-Host "  4. Monitor Edge Function logs for any errors" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Test Command:" -ForegroundColor Yellow
    Write-Host "  node scripts/test-subtopic-category-fix.js" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📊 Monitor Logs:" -ForegroundColor Yellow
    Write-Host "  supabase functions logs generate-lesson-plan --tail" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🎯 What to Test:" -ForegroundColor Yellow
    Write-Host "  • Generate lessons for an adult student" -ForegroundColor Gray
    Write-Host "  • Generate lessons for a teenager student" -ForegroundColor Gray
    Write-Host "  • Verify categories match templates (Grammar, Conversation, etc.)" -ForegroundColor Gray
    Write-Host "  • Verify no empty categories" -ForegroundColor Gray
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
    Write-Host "  3. Check the function file exists: supabase/functions/generate-lesson-plan/index.ts" -ForegroundColor White
    Write-Host ""
    exit 1
}
