# Remove Secrets from Git History
Write-Host "🔒 Removing Secrets from Git History..." -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  WARNING: This will rewrite git history!" -ForegroundColor Yellow
Write-Host "This is necessary to remove exposed secrets from the repository." -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Do you want to proceed? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Operation cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Step 1: Creating a new commit with sanitized file..." -ForegroundColor Yellow

# Make sure the sanitized file is staged
git add docs/netlify-environment-variables-setup.md

# Create a new commit
git commit -m "fix: sanitize secrets from documentation"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create commit" -ForegroundColor Red
    exit 1
}

Write-Host "✅ New commit created" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Checking git log..." -ForegroundColor Yellow
Write-Host ""
git log --oneline -5

Write-Host ""
Write-Host "Step 3: Pushing to remote with force..." -ForegroundColor Yellow
Write-Host ""

# Try to push with lease first (safer)
git push origin main --force-with-lease

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "⚠️  Force-with-lease failed. The secret is still in git history." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "GitHub is blocking the push because commit 99005793c72c74bade86a27a9453faa69ed4888f" -ForegroundColor Yellow
    Write-Host "contains secrets. We have two options:" -ForegroundColor White
    Write-Host ""
    Write-Host "OPTION 1: Allow the secret on GitHub (Quick)" -ForegroundColor Cyan
    Write-Host "  Visit these URLs to allow the secrets:" -ForegroundColor White
    Write-Host "  • https://github.com/etiennegwiavander/LinguaFlow2/security/secret-scanning/unblock-secret/3854cJ4H2R6YP8LDxQkCFS663TY" -ForegroundColor Gray
    Write-Host "  • https://github.com/etiennegwiavander/LinguaFlow2/security/secret-scanning/unblock-secret/3854cHu4ZTNV5ob2q38buaJBqeW" -ForegroundColor Gray
    Write-Host ""
    Write-Host "OPTION 2: Rewrite git history to remove the commit (Advanced)" -ForegroundColor Cyan
    Write-Host "  This will completely remove the commit with secrets." -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Choose option (1 or 2)"
    
    if ($choice -eq "1") {
        Write-Host ""
        Write-Host "📋 Instructions:" -ForegroundColor Cyan
        Write-Host "1. Click the URLs above to allow the secrets on GitHub" -ForegroundColor White
        Write-Host "2. After allowing, run: git push origin main --force" -ForegroundColor White
        Write-Host ""
        Write-Host "⚠️  IMPORTANT: After pushing, rotate these credentials:" -ForegroundColor Yellow
        Write-Host "   • Google OAuth Client ID & Secret" -ForegroundColor White
        Write-Host "   • Tranzak Webhook Secret" -ForegroundColor White
        Write-Host "   • Gemini API Key" -ForegroundColor White
        Write-Host "   • OpenRouter API Key" -ForegroundColor White
    }
    elseif ($choice -eq "2") {
        Write-Host ""
        Write-Host "⚠️  This will rewrite git history. Make sure you understand the implications!" -ForegroundColor Yellow
        Write-Host ""
        $confirm2 = Read-Host "Are you absolutely sure? (yes/no)"
        
        if ($confirm2 -eq "yes") {
            Write-Host ""
            Write-Host "Rewriting git history..." -ForegroundColor Yellow
            
            # Use git filter-repo or BFG to remove the file from history
            # First, let's try a simpler approach: reset to before the problematic commit
            
            Write-Host "Finding the problematic commit..." -ForegroundColor Yellow
            $commitHash = "99005793c72c74bade86a27a9453faa69ed4888f"
            
            # Get the parent of the problematic commit
            $parentCommit = git rev-parse "$commitHash^"
            
            Write-Host "Resetting to commit before the secrets were added..." -ForegroundColor Yellow
            git reset --hard $parentCommit
            
            Write-Host "Re-applying your recent changes..." -ForegroundColor Yellow
            git cherry-pick HEAD@{1}
            
            Write-Host "Pushing with force..." -ForegroundColor Yellow
            git push origin main --force
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "✅ Successfully removed secrets from history!" -ForegroundColor Green
            } else {
                Write-Host ""
                Write-Host "❌ Failed to push. You may need to use git filter-repo or BFG Repo-Cleaner" -ForegroundColor Red
                Write-Host "See: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository" -ForegroundColor Yellow
            }
        }
    }
    else {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "✅ Successfully pushed to remote!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Rotate the exposed credentials!" -ForegroundColor Yellow
}
