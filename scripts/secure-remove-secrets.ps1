# Securely Remove Secrets from Git History
Write-Host "🔒 SECURE Secret Removal from Git History" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will completely remove the commit containing secrets." -ForegroundColor Yellow
Write-Host "⚠️  This rewrites git history - all team members will need to re-clone!" -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "Do you understand and want to proceed? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Operation cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Step 1: Checking current branch..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor White

Write-Host ""
Write-Host "Step 2: Finding commits..." -ForegroundColor Yellow
Write-Host "Recent commits:" -ForegroundColor White
git log --oneline -10

Write-Host ""
Write-Host "Step 3: Removing the file from ALL git history..." -ForegroundColor Yellow
Write-Host "This uses git filter-branch to rewrite history..." -ForegroundColor Gray

# Use git filter-branch to remove the file from all commits
git filter-branch --force --index-filter `
  "git rm --cached --ignore-unmatch docs/netlify-environment-variables-setup.md" `
  --prune-empty --tag-name-filter cat -- --all

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Filter-branch failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Use BFG Repo-Cleaner (faster and safer)" -ForegroundColor Yellow
    Write-Host "1. Download BFG: https://rtyley.github.io/bfg-repo-cleaner/" -ForegroundColor White
    Write-Host "2. Run: java -jar bfg.jar --delete-files netlify-environment-variables-setup.md" -ForegroundColor White
    Write-Host "3. Run: git reflog expire --expire=now --all && git gc --prune=now --aggressive" -ForegroundColor White
    Write-Host "4. Run: git push origin main --force" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "Step 4: Re-adding the sanitized file..." -ForegroundColor Yellow
git add docs/netlify-environment-variables-setup.md
git commit -m "docs: add environment variables setup guide (sanitized)"

Write-Host ""
Write-Host "Step 5: Cleaning up..." -ForegroundColor Yellow
# Force garbage collection to remove old objects
git reflog expire --expire=now --all
git gc --prune=now --aggressive

Write-Host ""
Write-Host "Step 6: Pushing to remote with force..." -ForegroundColor Yellow
Write-Host "⚠️  This will rewrite remote history!" -ForegroundColor Red
Write-Host ""

$pushConfirm = Read-Host "Push to remote? (yes/no)"
if ($pushConfirm -ne "yes") {
    Write-Host "❌ Push cancelled" -ForegroundColor Yellow
    Write-Host "When ready, run: git push origin main --force" -ForegroundColor Cyan
    exit 0
}

git push origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully removed secrets from git history!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 IMPORTANT NEXT STEPS:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. ✅ Secrets removed from git history" -ForegroundColor Green
    Write-Host "2. ⚠️  Still rotate credentials as a precaution:" -ForegroundColor Yellow
    Write-Host "   • Google OAuth Client ID & Secret" -ForegroundColor White
    Write-Host "   • Tranzak Webhook Secret" -ForegroundColor White
    Write-Host "   • Gemini API Key" -ForegroundColor White
    Write-Host "   • OpenRouter API Key" -ForegroundColor White
    Write-Host ""
    Write-Host "3. ⚠️  Team members must re-clone the repository:" -ForegroundColor Yellow
    Write-Host "   git clone https://github.com/etiennegwiavander/LinguaFlow2.git" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Or if they have local changes:" -ForegroundColor Yellow
    Write-Host "   git fetch origin" -ForegroundColor Gray
    Write-Host "   git reset --hard origin/main" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Push failed!" -ForegroundColor Red
    Write-Host "The secrets have been removed locally but not pushed to GitHub yet." -ForegroundColor Yellow
}
