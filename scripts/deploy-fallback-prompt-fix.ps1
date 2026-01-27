# Deploy Fallback Prompt Removal Fix
# This script deploys the updated generate-interactive-material Edge Function

Write-Host "🚀 DEPLOYING FALLBACK PROMPT REMOVAL FIX" -ForegroundColor Cyan
Write-Host "=" * 80
Write-Host ""

Write-Host "📋 Changes being deployed:" -ForegroundColor Yellow
Write-Host "  1. Modified selectAppropriateTemplate() to NEVER return null"
Write-Host "  2. Removed fallback prompt entirely (~270 lines)"
Write-Host "  3. Removed generateContextualExamples() dead code (~90 lines)"
Write-Host "  4. Template-based prompt is ALWAYS used"
Write-Host ""

Write-Host "⚠️  This will fix the generic sentence issue!" -ForegroundColor Green
Write-Host ""

# Confirm deployment
$confirm = Read-Host "Deploy to Supabase? (y/n)"
if ($confirm -ne "y") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Deploying Edge Function..." -ForegroundColor Cyan

# Deploy the function
supabase functions deploy generate-interactive-material

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Generate a new lesson for student 'test'"
    Write-Host "  2. Use subtopic 'Simuler une conversation dans un café'"
    Write-Host "  3. Check vocabulary examples"
    Write-Host "  4. Verify NO generic sentences appear"
    Write-Host ""
    Write-Host "Expected: Contextually relevant French sentences"
    Write-Host "NOT: 'The word X is used in the context of language learning'"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ DEPLOYMENT FAILED!" -ForegroundColor Red
    Write-Host "Please check the error messages above and try again."
    Write-Host ""
    exit 1
}
