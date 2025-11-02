# Check Supabase Edge Function logs for sync-calendar
Write-Host "Checking sync-calendar Edge Function logs..." -ForegroundColor Cyan
Write-Host ""

# Check if supabase CLI is available
if (!(Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

# Get logs for sync-calendar function
Write-Host "Fetching logs for sync-calendar function..." -ForegroundColor Yellow
supabase functions logs sync-calendar --limit 20

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
