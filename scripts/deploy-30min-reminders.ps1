# Deploy 30-Minute Lesson Reminder System
Write-Host "🔔 Deploying 30-Minute Lesson Reminder System..." -ForegroundColor Cyan
Write-Host ""

# Check if supabase CLI is available
if (!(Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

# Step 1: Apply database migration
Write-Host "📊 Step 1: Applying database migration..." -ForegroundColor Yellow
Write-Host "  - Updating reminder timing to 30 minutes" -ForegroundColor White
Write-Host "  - Updating email template with preparation checklist" -ForegroundColor White
Write-Host ""

try {
    supabase db push
    Write-Host "✅ Database migration applied successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to apply migration: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Deploy Edge Function
Write-Host "📤 Step 2: Deploying schedule-lesson-reminders Edge Function..." -ForegroundColor Yellow
Write-Host ""

try {
    supabase functions deploy schedule-lesson-reminders --no-verify-jwt
    Write-Host "✅ Edge Function deployed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to deploy Edge Function: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ 30-Minute Lesson Reminder System Deployed!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 What's New:" -ForegroundColor Yellow
Write-Host "  ✓ Reminders now sent 30 minutes before lessons" -ForegroundColor White
Write-Host "  ✓ Enhanced email template with preparation checklist" -ForegroundColor White
Write-Host "  ✓ Direct links to student profiles" -ForegroundColor White
Write-Host "  ✓ Actionable steps for lesson preparation" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Automated Schedule:" -ForegroundColor Yellow
Write-Host "  - Cron job runs every 5 minutes" -ForegroundColor White
Write-Host "  - Checks for lessons starting in 30-35 minutes" -ForegroundColor White
Write-Host "  - Sends reminder emails to tutors" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Testing:" -ForegroundColor Yellow
Write-Host "  1. Go to Admin Portal > Email Management" -ForegroundColor White
Write-Host "  2. View the updated 'Lesson Reminder' template" -ForegroundColor White
Write-Host "  3. Schedule a test lesson in Google Calendar" -ForegroundColor White
Write-Host "  4. Wait for the reminder (or manually trigger)" -ForegroundColor White
Write-Host ""
Write-Host "📝 Manual Trigger (for testing):" -ForegroundColor Yellow
Write-Host "  supabase functions invoke schedule-lesson-reminders" -ForegroundColor White
Write-Host ""
Write-Host "Done! 🎉" -ForegroundColor Green
