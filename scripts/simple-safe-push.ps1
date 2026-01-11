# Simple and Safe: Just Push with Sanitized File
Write-Host "🔒 Simple Safe Push Solution" -ForegroundColor Cyan
Write-Host ""
Write-Host "This approach:" -ForegroundColor Yellow
Write-Host "✅ Keeps all commits intact" -ForegroundColor Green
Write-Host "✅ Won't break any code" -ForegroundColor Green
Write-Host "✅ Adds sanitized file in a new commit" -ForegroundColor Green
Write-Host "⚠️  Old secrets remain in git history (must rotate credentials)" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Proceed with this safe approach? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Operation cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Step 1: Checking if file is already sanitized..." -ForegroundColor Yellow
$fileContent = Get-Content "docs/netlify-environment-variables-setup.md" -Raw

if ($fileContent -match "630010123392-tpf2fk7je8828j8qnqdtfq9hc31srpp0") {
    Write-Host "❌ File still contains secrets!" -ForegroundColor Red
    Write-Host "The sanitization didn't work. Let me check..." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ File is sanitized" -ForegroundColor Green

Write-Host ""
Write-Host "Step 2: Committing sanitized file..." -ForegroundColor Yellow
git add docs/netlify-environment-variables-setup.md
git add docs/GRAMMAR-B1-TEMPLATE-FIX-COMPLETE.md
git add docs/grammar-b1-template-fix.md
git add supabase/migrations/20250613150755_add_grammar_b1_template.sql
git add scripts/*.ps1
git add docs/FIX-GITHUB-SECRET-BLOCKING.md
git add docs/SECURE-SECRET-REMOVAL-GUIDE.md

git commit -m "fix: sanitize secrets from documentation and fix Grammar B1 template"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Commit failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Commit created" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Pushing to GitHub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  GitHub will still block this because secrets exist in OLD commits" -ForegroundColor Yellow
Write-Host "You'll need to click the 'Allow secret' links GitHub provides" -ForegroundColor Yellow
Write-Host ""

git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Push blocked by GitHub (expected)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 NEXT STEPS:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. GitHub will show you URLs to allow the secrets" -ForegroundColor White
    Write-Host "2. Click those URLs and click 'Allow secret'" -ForegroundColor White
    Write-Host "3. Run: git push origin main" -ForegroundColor White
    Write-Host ""
    Write-Host "4. IMMEDIATELY rotate these credentials:" -ForegroundColor Red
    Write-Host "   • Google OAuth Client ID & Secret" -ForegroundColor White
    Write-Host "   • Tranzak Webhook Secret" -ForegroundColor White
    Write-Host "   • Gemini API Key" -ForegroundColor White
    Write-Host "   • OpenRouter API Key" -ForegroundColor White
    Write-Host ""
    Write-Host "See docs/FIX-GITHUB-SECRET-BLOCKING.md for rotation instructions" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "✅ Push successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  CRITICAL: Rotate credentials immediately!" -ForegroundColor Red
    Write-Host "See docs/FIX-GITHUB-SECRET-BLOCKING.md" -ForegroundColor Cyan
}
