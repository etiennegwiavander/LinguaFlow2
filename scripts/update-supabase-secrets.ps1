# PowerShell script to update Supabase secrets with new OpenRouter API key
# This script reads from .env.local and updates Supabase

Write-Host "🔐 Updating Supabase Secrets..." -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ Error: .env.local file not found!" -ForegroundColor Red
    Write-Host "Please create .env.local with your API keys first."
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
    Write-Host ""
    Write-Host "✅ Successfully updated Supabase secret!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Current secrets:" -ForegroundColor Cyan
    supabase secrets list
    Write-Host ""
    Write-Host "🧪 Test your Edge Functions with:" -ForegroundColor Yellow
    Write-Host "   node test-lesson-generation.js"
    Write-Host "   node test-deepseek-api.js"
} else {
    Write-Host ""
    Write-Host "❌ Failed to update Supabase secret" -ForegroundColor Red
    Write-Host "Please make sure you're logged in: supabase login"
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $result
    exit 1
}
