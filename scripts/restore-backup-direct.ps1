# Direct restore of database backup to Supabase
Write-Host "=== RESTORING DATABASE FROM BACKUP ===" -ForegroundColor Yellow
Write-Host ""

# Get database connection string from .env.local
$envContent = Get-Content .env.local
$supabaseUrl = ($envContent | Select-String "NEXT_PUBLIC_SUPABASE_URL=").ToString().Split('=')[1]
$projectRef = $supabaseUrl -replace 'https://', '' -replace '.supabase.co', ''

Write-Host "Project Reference: $projectRef" -ForegroundColor Cyan
Write-Host ""
Write-Host "You need your database password to restore." -ForegroundColor Yellow
Write-Host "Find it in: Supabase Dashboard → Settings → Database → Database password" -ForegroundColor White
Write-Host ""

$password = Read-Host "Enter your database password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

Write-Host ""
Write-Host "Restoring backup..." -ForegroundColor Cyan
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
Write-Host ""

# Build connection string
$dbUrl = "postgresql://postgres:$passwordPlain@db.$projectRef.supabase.co:5432/postgres"

# Use psql if available, otherwise provide instructions
try {
    $psqlVersion = psql --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ psql found, restoring database..." -ForegroundColor Green
        Get-Content temp_complete_original.sql | psql $dbUrl
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ DATABASE RESTORED SUCCESSFULLY!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Verifying restoration..." -ForegroundColor Cyan
            node scripts/check-auth-state.js
        } else {
            Write-Host ""
            Write-Host "❌ Restore failed" -ForegroundColor Red
            Write-Host "Try manual restore via Supabase Dashboard SQL Editor" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ psql not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "MANUAL RESTORE INSTRUCTIONS:" -ForegroundColor Yellow
    Write-Host "1. Install PostgreSQL client tools, OR" -ForegroundColor White
    Write-Host "2. Use Supabase Dashboard SQL Editor:" -ForegroundColor White
    Write-Host "   a. Go to: https://supabase.com/dashboard/project/$projectRef/sql" -ForegroundColor White
    Write-Host "   b. Click 'New Query'" -ForegroundColor White
    Write-Host "   c. Copy contents of temp_complete_original.sql" -ForegroundColor White
    Write-Host "   d. Paste and run (may need to run in sections)" -ForegroundColor White
}
