# Deploy Pronunciation 3-Examples Fix to Supabase
# This script deploys the updated generate-interactive-material Edge Function

Write-Host "🚀 Deploying Pronunciation 3-Examples Fix" -ForegroundColor Cyan
Write-Host "=" * 80
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "🔍 Checking Supabase CLI..." -ForegroundColor Yellow
$supabaseVersion = supabase --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor White
    exit 1
}
Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
Write-Host ""

# Check if logged in
Write-Host "🔍 Checking Supabase login status..." -ForegroundColor Yellow
$loginStatus = supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Supabase. Please login first:" -ForegroundColor Red
    Write-Host "   supabase login" -ForegroundColor White
    exit 1
}
Write-Host "✅ Logged in to Supabase" -ForegroundColor Green
Write-Host ""

# Confirm deployment
Write-Host "📋 Changes to be deployed:" -ForegroundColor Cyan
Write-Host "   • Updated validateAndEnsureExamples() function" -ForegroundColor White
Write-Host "   • Pronunciation lessons now limited to 3 examples (all levels)" -ForegroundColor White
Write-Host "   • Reduced fallback generation for pronunciation lessons" -ForegroundColor White
Write-Host "   • Updated AI prompt for pronunciation-specific example count" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Deploy to production? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Deploying generate-interactive-material function..." -ForegroundColor Cyan

# Deploy the function
supabase functions deploy generate-interactive-material

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=" * 80
    Write-Host "✅ ✅ ✅ DEPLOYMENT SUCCESSFUL! ✅ ✅ ✅" -ForegroundColor Green
    Write-Host "=" * 80
    Write-Host ""
    Write-Host "📝 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Test the fix by generating a new pronunciation lesson" -ForegroundColor White
    Write-Host "   2. Run: node scripts/test-pronunciation-3-examples-fix.js" -ForegroundColor White
    Write-Host "   3. Verify that all vocabulary items have exactly 3 examples" -ForegroundColor White
    Write-Host "   4. Check that no generic fallback sentences appear" -ForegroundColor White
    Write-Host ""
    Write-Host "🎯 Expected Results:" -ForegroundColor Cyan
    Write-Host "   • Pronunciation lessons: 3 examples per word (all levels)" -ForegroundColor Green
    Write-Host "   • Other lessons: 3-5 examples per word (level-based)" -ForegroundColor Green
    Write-Host "   • No 'healthy X requires mutual respect' sentences" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Please check the error messages above and try again." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
