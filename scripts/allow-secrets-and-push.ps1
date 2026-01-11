# Allow Secrets on GitHub and Push
Write-Host "🔓 GitHub Secret Blocking - Quick Fix" -ForegroundColor Cyan
Write-Host ""
Write-Host "GitHub is blocking your push because it detected secrets." -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Follow these steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open these URLs in your browser (Ctrl+Click):" -ForegroundColor White
Write-Host ""
Write-Host "   Google OAuth Client ID:" -ForegroundColor Yellow
Write-Host "   https://github.com/etiennegwiavander/LinguaFlow2/security/secret-scanning/unblock-secret/3854cJ4H2R6YP8LDxQkCFS663TY" -ForegroundColor Blue
Write-Host ""
Write-Host "   Google OAuth Client Secret:" -ForegroundColor Yellow
Write-Host "   https://github.com/etiennegwiavander/LinguaFlow2/security/secret-scanning/unblock-secret/3854cHu4ZTNV5ob2q38buaJBqeW" -ForegroundColor Blue
Write-Host ""
Write-Host "2. Click 'Allow secret' on each page" -ForegroundColor White
Write-Host ""
Write-Host "3. Come back here and press Enter to continue..." -ForegroundColor White
Read-Host

Write-Host ""
Write-Host "Attempting to push..." -ForegroundColor Yellow
git push origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  CRITICAL SECURITY STEP:" -ForegroundColor Red
    Write-Host ""
    Write-Host "The following credentials were exposed and MUST be rotated:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  ❌ Google OAuth Client ID" -ForegroundColor White
    Write-Host "  ❌ Google OAuth Client Secret" -ForegroundColor White
    Write-Host "  ❌ Tranzak Webhook Secret" -ForegroundColor White
    Write-Host "  ❌ Gemini API Key" -ForegroundColor White
    Write-Host "  ❌ OpenRouter API Key" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 See docs/FIX-GITHUB-SECRET-BLOCKING.md for rotation instructions" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Push failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible reasons:" -ForegroundColor Yellow
    Write-Host "  • You didn't allow the secrets on GitHub yet" -ForegroundColor White
    Write-Host "  • Network issue" -ForegroundColor White
    Write-Host "  • Authentication issue" -ForegroundColor White
    Write-Host ""
    Write-Host "Try again after allowing the secrets on GitHub" -ForegroundColor Cyan
}
