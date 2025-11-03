# Setup Lesson Reminders Cron
# This script helps you set up the external cron for lesson reminders

Write-Host "🔔 Lesson Reminders Cron Setup" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Load environment variables
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$serviceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $supabaseUrl -or -not $serviceRoleKey) {
    Write-Host "❌ Missing environment variables" -ForegroundColor Red
    Write-Host "   Please ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Environment variables loaded`n" -ForegroundColor Green

# Display the Edge Function URL
$edgeFunctionUrl = "$supabaseUrl/functions/v1/schedule-lesson-reminders"

Write-Host "📋 Your Edge Function Details:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""
Write-Host "URL:" -ForegroundColor Cyan
Write-Host "  $edgeFunctionUrl" -ForegroundColor White
Write-Host ""
Write-Host "Authorization Header:" -ForegroundColor Cyan
Write-Host "  Bearer $serviceRoleKey" -ForegroundColor White
Write-Host ""
Write-Host "Schedule:" -ForegroundColor Cyan
Write-Host "  */5 * * * * (Every 5 minutes)" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Yellow

Write-Host "🎯 Recommended Setup Options:`n" -ForegroundColor Cyan

Write-Host "1. cron-job.org (Easiest)" -ForegroundColor Green
Write-Host "   • Go to: https://cron-job.org" -ForegroundColor Gray
Write-Host "   • Create free account" -ForegroundColor Gray
Write-Host "   • Add new cron job with the URL and header above" -ForegroundColor Gray
Write-Host "   • Set schedule to every 5 minutes`n" -ForegroundColor Gray

Write-Host "2. GitHub Actions (If using GitHub)" -ForegroundColor Green
Write-Host "   • Add SUPABASE_SERVICE_ROLE_KEY to repository secrets" -ForegroundColor Gray
Write-Host "   • Create .github/workflows/lesson-reminders.yml" -ForegroundColor Gray
Write-Host "   • See docs/lesson-reminders-cron-setup.md for template`n" -ForegroundColor Gray

Write-Host "3. Netlify Scheduled Functions (If deploying on Netlify)" -ForegroundColor Green
Write-Host "   • Add SUPABASE_SERVICE_ROLE_KEY to Netlify environment variables" -ForegroundColor Gray
Write-Host "   • Create netlify/functions/lesson-reminders-cron.js" -ForegroundColor Gray
Write-Host "   • See docs/lesson-reminders-cron-setup.md for code`n" -ForegroundColor Gray

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "🧪 Test the Edge Function now?" -ForegroundColor Yellow
$test = Read-Host "Press Y to test, or any other key to skip"

if ($test -eq "Y" -or $test -eq "y") {
    Write-Host "`n🔄 Testing Edge Function...`n" -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri $edgeFunctionUrl `
            -Method Post `
            -Headers @{
                "Authorization" = "Bearer $serviceRoleKey"
                "Content-Type" = "application/json"
            } `
            -Body '{"timestamp": "test"}'
        
        Write-Host "✅ Edge Function Response:" -ForegroundColor Green
        Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor White
        Write-Host ""
        
        if ($response.success) {
            Write-Host "✅ Edge Function is working correctly!" -ForegroundColor Green
            if ($response.scheduled -gt 0) {
                Write-Host "📧 Sent $($response.scheduled) reminder(s)" -ForegroundColor Green
            } else {
                Write-Host "📭 No lessons in reminder window (this is normal)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "⚠️  Edge Function returned an error" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Error testing Edge Function:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📚 For detailed setup instructions, see:" -ForegroundColor Cyan
Write-Host "   docs/lesson-reminders-cron-setup.md`n" -ForegroundColor White
