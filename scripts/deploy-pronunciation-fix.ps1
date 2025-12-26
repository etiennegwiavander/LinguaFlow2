# Deploy the updated generate-interactive-material function with Pronunciation fixes

Write-Host "🚀 Deploying Pronunciation template fix..." -ForegroundColor Cyan
Write-Host ""

# Deploy the function
Write-Host "📦 Deploying generate-interactive-material function..." -ForegroundColor Yellow
supabase functions deploy generate-interactive-material

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 What was fixed:" -ForegroundColor Cyan
    Write-Host "  - Added specific instructions for vocabulary_matching content type" -ForegroundColor White
    Write-Host "  - Added specific instructions for matching content type" -ForegroundColor White
    Write-Host "  - AI will now generate vocabulary_items arrays for Pronunciation lessons" -ForegroundColor White
    Write-Host "  - AI will now generate matching_questions arrays for sound identification" -ForegroundColor White
    Write-Host ""
    Write-Host "🧪 To test:" -ForegroundColor Cyan
    Write-Host "  1. Go to a student profile" -ForegroundColor White
    Write-Host "  2. Select a Pronunciation lesson sub-topic" -ForegroundColor White
    Write-Host "  3. Generate interactive material" -ForegroundColor White
    Write-Host "  4. Check that 'Vocabulary Practice - Minimal Pairs' section has content" -ForegroundColor White
    Write-Host "  5. Check that 'Find the Sounds' section has content" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
}
