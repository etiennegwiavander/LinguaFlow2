# Update OpenRouter API Key in Supabase
# This script reads the new key from .env.local and updates Supabase secrets

Write-Host "🔐 OpenRouter API Key Update Script" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ Error: .env.local file not found" -ForegroundColor Red
    exit 1
}

# Read .env.local and extract OPENROUTER_API_KEY
$envContent = Get-Content ".env.local"
$apiKey = $null

foreach ($line in $envContent) {
    if ($line -match "^OPENROUTER_API_KEY=(.+)$") {
        $apiKey = $matches[1].Trim()
        break
    }
}

# Check if OPENROUTER_API_KEY was found
if (-not $apiKey) {
    Write-Host "❌ Error: OPENROUTER_API_KEY not found in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found OPENROUTER_API_KEY in .env.local" -ForegroundColor Green
Write-Host ""

# Update Supabase secret
Write-Host "📤 Updating Supabase secret..." -ForegroundColor Yellow
$result = supabase secrets set "OPENROUTER_API_KEY=$apiKey" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully updated OPENROUTER_API_KEY in Supabase" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔄 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Redeploy Edge Functions that use this key:" -ForegroundColor White
    Write-Host "      supabase functions deploy generate-vocabulary-words" -ForegroundColor Gray
    Write-Host "      supabase functions deploy generate-lesson-plan" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. Test the integration:" -ForegroundColor White
    Write-Host "      node scripts/test-vocabulary-deepseek.js" -ForegroundColor Gray
} else {
    Write-Host "❌ Failed to update Supabase secret" -ForegroundColor Red
    Write-Host "Error: $result" -ForegroundColor Red
    exit 1
}
