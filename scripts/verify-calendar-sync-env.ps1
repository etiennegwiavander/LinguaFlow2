# Verify that sync-calendar Edge Function has required environment variables
Write-Host "Checking sync-calendar Edge Function environment..." -ForegroundColor Cyan
Write-Host ""

# Check if supabase CLI is available
if (!(Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

Write-Host "Required environment variables for sync-calendar:" -ForegroundColor Yellow
Write-Host "  - GOOGLE_CLIENT_ID" -ForegroundColor White
Write-Host "  - GOOGLE_CLIENT_SECRET" -ForegroundColor White
Write-Host "  - SUPABASE_URL (auto-provided)" -ForegroundColor White
Write-Host "  - SUPABASE_SERVICE_ROLE_KEY (auto-provided)" -ForegroundColor White
Write-Host ""

Write-Host "Checking Supabase secrets..." -ForegroundColor Yellow
supabase secrets list

Write-Host ""
Write-Host "To set missing secrets, run:" -ForegroundColor Cyan
Write-Host "  supabase secrets set GOOGLE_CLIENT_ID=your_client_id" -ForegroundColor White
Write-Host "  supabase secrets set GOOGLE_CLIENT_SECRET=your_client_secret" -ForegroundColor White
