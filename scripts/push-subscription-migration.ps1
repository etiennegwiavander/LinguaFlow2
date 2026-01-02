# Push subscription migration to remote database
Write-Host "🚀 Pushing Subscription Migration to Remote Database..." -ForegroundColor Cyan
Write-Host ""

# First, let's check if we're logged in
Write-Host "🔐 Checking Supabase authentication..." -ForegroundColor Yellow
npx supabase link --project-ref urmuwjcjcyohsrkgyapl

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to link to Supabase project" -ForegroundColor Red
    Write-Host "Please run: npx supabase login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Linked to Supabase project" -ForegroundColor Green
Write-Host ""

# Now push the migration
Write-Host "📤 Pushing migration..." -ForegroundColor Yellow
npx supabase db push

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration pushed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Running verification..." -ForegroundColor Cyan
    node scripts/test-subscription-system.js
} else {
    Write-Host ""
    Write-Host "⚠️  Migration push encountered issues" -ForegroundColor Yellow
    Write-Host "You can apply the migration manually:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://supabase.com/dashboard/project/urmuwjcjcyohsrkgyapl/sql" -ForegroundColor White
    Write-Host "2. Copy contents of: supabase/migrations/20250102000001_create_subscription_system.sql" -ForegroundColor White
    Write-Host "3. Paste and execute in SQL editor" -ForegroundColor White
}
