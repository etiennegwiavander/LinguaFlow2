# Deploy Sub-Topic ID Fix to Supabase
# This script deploys the updated generate-lesson-plan Edge Function

Write-Host "🚀 Deploying Sub-Topic ID Fix" -ForegroundColor Cyan
Write-Host "=" * 60

# Check if Supabase CLI is installed
Write-Host "`n📋 Checking Supabase CLI..." -ForegroundColor Yellow
$supabaseCli = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseCli) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Please install it from: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI found" -ForegroundColor Green

# Check if we're logged in
Write-Host "`n📋 Checking Supabase login status..." -ForegroundColor Yellow
$loginCheck = supabase projects list 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Supabase!" -ForegroundColor Red
    Write-Host "Please run: supabase login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Logged in to Supabase" -ForegroundColor Green

# Deploy the function
Write-Host "`n📋 Deploying generate-lesson-plan function..." -ForegroundColor Yellow
Write-Host "⏳ This may take a moment..." -ForegroundColor Gray

$deployOutput = supabase functions deploy generate-lesson-plan 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Function deployed successfully!" -ForegroundColor Green
    Write-Host "`n$deployOutput" -ForegroundColor Gray
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "`n$deployOutput" -ForegroundColor Red
    exit 1
}

# Summary
Write-Host "`n" + "=" * 60
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=" * 60

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Test the fix by generating a new lesson" -ForegroundColor White
Write-Host "2. Run: node scripts/test-subtopic-id-fix.js" -ForegroundColor White
Write-Host "3. Verify sub-topic IDs now include lesson prefix" -ForegroundColor White

Write-Host "`n🎉 Sub-topic ID fix is now live!" -ForegroundColor Green
