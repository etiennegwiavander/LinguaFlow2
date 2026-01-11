# Deploy Pronunciation Vocabulary Fix
Write-Host "🚀 Deploying Pronunciation Vocabulary Fix" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will update the generate-interactive-material Edge Function" -ForegroundColor Yellow
Write-Host "to include contextual example sentences in Pronunciation vocabulary." -ForegroundColor Yellow
Write-Host ""

# Check if supabase CLI is available
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Please install it from: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI found" -ForegroundColor Green
Write-Host ""

# Show what will be deployed
Write-Host "📋 Changes to deploy:" -ForegroundColor Cyan
Write-Host "   • Enhanced vocabulary_matching instructions for Pronunciation templates" -ForegroundColor White
Write-Host "   • Added requirement for 3 contextual example sentences per word" -ForegroundColor White
Write-Host "   • Examples will use actual vocabulary words in natural contexts" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  Impact:" -ForegroundColor Yellow
Write-Host "   ✅ Pronunciation lessons: Will show contextual examples" -ForegroundColor Green
Write-Host "   ✅ Other templates: No changes (Grammar, Conversation, etc.)" -ForegroundColor Green
Write-Host ""

$confirmation = Read-Host "Deploy to Supabase? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Deploying generate-interactive-material function..." -ForegroundColor Yellow

supabase functions deploy generate-interactive-material

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Function deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Test the fix:" -ForegroundColor White
    Write-Host "   node scripts/test-pronunciation-vocabulary-fix.js" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Generate a new Pronunciation lesson (A2, B1, or B2)" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Verify vocabulary sections show:" -ForegroundColor White
    Write-Host "   ✅ Word" -ForegroundColor Green
    Write-Host "   ✅ Pronunciation (IPA)" -ForegroundColor Green
    Write-Host "   ✅ Meaning" -ForegroundColor Green
    Write-Host "   ✅ 3 contextual example sentences" -ForegroundColor Green
    Write-Host ""
    Write-Host "4. Confirm NO generic sentences like:" -ForegroundColor White
    Write-Host "   ❌ 'The walked is an important concept...'" -ForegroundColor Red
    Write-Host ""
    Write-Host "5. Test other lesson types to ensure no regression:" -ForegroundColor White
    Write-Host "   • Generate a Grammar lesson" -ForegroundColor Gray
    Write-Host "   • Generate a Conversation lesson" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📖 See docs/pronunciation-vocabulary-fix-implementation.md for details" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check if you're linked to the correct Supabase project" -ForegroundColor White
    Write-Host "2. Verify your Supabase credentials" -ForegroundColor White
    Write-Host "3. Check function logs: supabase functions logs generate-interactive-material" -ForegroundColor White
    exit 1
}
