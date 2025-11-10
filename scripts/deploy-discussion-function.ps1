# Deploy Discussion Questions Edge Function
# This script deploys the updated function to Supabase

Write-Host "🚀 Deploying Discussion Questions Edge Function" -ForegroundColor Cyan
Write-Host ("=" * 60)

Write-Host "`n📋 Pre-Deployment Checklist:" -ForegroundColor Yellow
Write-Host "   1. Edge Function code updated to use DeepSeek"
Write-Host "   2. Emergency fallback removed"
Write-Host "   3. OPENROUTER_API_KEY needs to be set in Supabase"

Write-Host "`n🔐 Checking if OPENROUTER_API_KEY is set..." -ForegroundColor Yellow
Write-Host "   Run: supabase secrets list"
Write-Host "   Look for: OPENROUTER_API_KEY"

Write-Host "`n⚠️  If not set, run this first:" -ForegroundColor Red
Write-Host "   supabase secrets set OPENROUTER_API_KEY=`"your-key-here`""

Write-Host "`n🚀 Deploying function..." -ForegroundColor Green
Write-Host "   Command: supabase functions deploy generate-discussion-questions"

Write-Host "`n💡 After deployment:" -ForegroundColor Yellow
Write-Host "   1. Wait 1-2 minutes for changes to propagate"
Write-Host "   2. Test: node scripts/check-discussion-function-logs.js"
Write-Host "   3. Verify questions are AI-generated (not fallback)"

Write-Host "`n📝 To deploy now, run:" -ForegroundColor Cyan
Write-Host "   supabase functions deploy generate-discussion-questions --no-verify-jwt"

Write-Host ""
