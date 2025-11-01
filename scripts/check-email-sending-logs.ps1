# Check Email Sending Logs
# Troubleshooting script for Resend integration

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "CHECKING EMAIL SENDING LOGS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Checking Supabase Function Logs..." -ForegroundColor Yellow
Write-Host "------------------------------------------------------------"
Write-Host ""

# Get recent logs from the Edge Function
npx supabase functions logs send-integrated-email --limit 50

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "2. Checking Supabase Secrets..." -ForegroundColor Yellow
Write-Host "------------------------------------------------------------"
Write-Host ""

npx supabase secrets list

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "TROUBLESHOOTING CHECKLIST" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check the logs above for:" -ForegroundColor Yellow
Write-Host "1. ❌ 'RESEND_API_KEY environment variable is not set'" -ForegroundColor White
Write-Host "   → Solution: npx supabase secrets set RESEND_API_KEY=your_key" -ForegroundColor Gray
Write-Host ""
Write-Host "2. ❌ 'Resend error: ...' or 'Resend API error: ...'" -ForegroundColor White
Write-Host "   → Check Resend dashboard for more details" -ForegroundColor Gray
Write-Host ""
Write-Host "3. ❌ 'SMTP configuration not found or inactive'" -ForegroundColor White
Write-Host "   → The test script needs a valid SMTP config in database" -ForegroundColor Gray
Write-Host ""
Write-Host "4. ❌ 'Failed to create email log: ...'" -ForegroundColor White
Write-Host "   → Database table might not exist" -ForegroundColor Gray
Write-Host ""
Write-Host "5. ✅ 'Email sent successfully via Resend'" -ForegroundColor White
Write-Host "   → Check spam folder or Resend dashboard" -ForegroundColor Gray
Write-Host ""
