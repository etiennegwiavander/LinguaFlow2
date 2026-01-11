# Fix Git Secrets and Push to Remote
Write-Host "🔒 Fixing Git Secrets Issue..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Check current status
Write-Host "1. Checking git status..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "2. The secrets have been sanitized in:" -ForegroundColor Green
Write-Host "   ✅ docs/netlify-environment-variables-setup.md" -ForegroundColor White
Write-Host ""

# Step 2: Add the sanitized file
Write-Host "3. Staging sanitized file..." -ForegroundColor Yellow
git add docs/netlify-environment-variables-setup.md

# Step 3: Amend the last commit to remove secrets
Write-Host ""
Write-Host "4. Amending the last commit to remove secrets..." -ForegroundColor Yellow
git commit --amend --no-edit

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Commit amended successfully" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to amend commit" -ForegroundColor Red
    exit 1
}

# Step 4: Force push to remote
Write-Host ""
Write-Host "5. Force pushing to remote (this will rewrite history)..." -ForegroundColor Yellow
Write-Host "   ⚠️  This will overwrite the remote branch!" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Do you want to force push? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Push cancelled" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To push manually later, run:" -ForegroundColor Cyan
    Write-Host "   git push origin main --force" -ForegroundColor White
    exit 0
}

git push origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully pushed to remote!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Git secrets issue resolved!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT SECURITY NOTES:" -ForegroundColor Yellow
    Write-Host "1. The exposed secrets are now in git history" -ForegroundColor White
    Write-Host "2. You should rotate these credentials:" -ForegroundColor White
    Write-Host "   • Google OAuth Client ID & Secret" -ForegroundColor White
    Write-Host "   • Tranzak Webhook Secret" -ForegroundColor White
    Write-Host "   • Gemini API Key" -ForegroundColor White
    Write-Host "   • OpenRouter API Key" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Update your .env.local and Netlify environment variables" -ForegroundColor White
    Write-Host "4. Update Supabase secrets if needed" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Failed to push to remote" -ForegroundColor Red
    Write-Host ""
    Write-Host "You may need to:" -ForegroundColor Yellow
    Write-Host "1. Check your git remote configuration" -ForegroundColor White
    Write-Host "2. Verify your GitHub authentication" -ForegroundColor White
    Write-Host "3. Try pushing manually: git push origin main --force" -ForegroundColor White
    exit 1
}
