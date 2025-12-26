# Deploy the fixed schedule-lesson-reminders Edge Function

Write-Host "🚀 Deploying Fixed Lesson Reminder Function" -ForegroundColor Cyan
Write-Host "=" * 80

# Check if supabase CLI is installed
if (!(Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n📦 Deploying schedule-lesson-reminders function..." -ForegroundColor Yellow

try {
    # Deploy the function
    supabase functions deploy schedule-lesson-reminders

    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Function deployed successfully!" -ForegroundColor Green
        
        Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
        Write-Host "   1. The function will now work without SMTP config" -ForegroundColor White
        Write-Host "   2. It uses Resend API directly (RESEND_API_KEY)" -ForegroundColor White
        Write-Host "   3. Test it with: node scripts/test-reminder-fix.js" -ForegroundColor White
        Write-Host "   4. Check logs: supabase functions logs schedule-lesson-reminders" -ForegroundColor White
    } else {
        Write-Host "`n❌ Deployment failed!" -ForegroundColor Red
        Write-Host "   Check the error messages above" -ForegroundColor Yellow
    }
} catch {
    Write-Host "`n❌ Error during deployment: $_" -ForegroundColor Red
}

Write-Host "`n" + "=" * 80
