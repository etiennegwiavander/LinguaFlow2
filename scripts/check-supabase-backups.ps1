# Check for available Supabase backups
Write-Host "=== CHECKING FOR SUPABASE BACKUPS ===" -ForegroundColor Yellow
Write-Host ""

Write-Host "Attempting to list available backups..." -ForegroundColor Cyan
Write-Host ""

# Try to list backups
try {
    $backupList = supabase db backups list 2>&1 | Out-String
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Backups found:" -ForegroundColor Green
        Write-Host $backupList
        Write-Host ""
        Write-Host "To restore a backup:" -ForegroundColor Yellow
        Write-Host "  supabase db restore --backup-id BACKUP_ID" -ForegroundColor White
    } else {
        Write-Host "Could not list backups via CLI" -ForegroundColor Red
        Write-Host "Error: $backupList" -ForegroundColor Red
        Write-Host ""
        Write-Host "ALTERNATIVE: Check Supabase Dashboard" -ForegroundColor Yellow
        Write-Host "1. Go to: https://supabase.com/dashboard" -ForegroundColor White
        Write-Host "2. Select your project" -ForegroundColor White
        Write-Host "3. Navigate to: Settings -> Database -> Backups" -ForegroundColor White
        Write-Host "4. Look for backups from before the reset" -ForegroundColor White
    }
} catch {
    Write-Host "Error running backup command: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check Supabase Dashboard manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== CRITICAL INFORMATION ===" -ForegroundColor Red
Write-Host "Data Loss Summary:" -ForegroundColor Yellow
Write-Host "  - Expected: 80+ users" -ForegroundColor White
Write-Host "  - Current: 15 users" -ForegroundColor White
Write-Host "  - Lost: ~65 users" -ForegroundColor Red
Write-Host ""
Write-Host "  - Expected: 70+ students" -ForegroundColor White
Write-Host "  - Current: 26 students" -ForegroundColor White
Write-Host "  - Lost: ~44 students" -ForegroundColor Red
Write-Host ""
Write-Host "IMMEDIATE ACTION REQUIRED:" -ForegroundColor Red
Write-Host "1. Check Supabase Dashboard for backups" -ForegroundColor Yellow
Write-Host "2. Restore most recent backup BEFORE the reset" -ForegroundColor Yellow
Write-Host "3. Contact Supabase support if no backups found" -ForegroundColor Yellow
