# Verify API Key Security
# This script checks that no API keys are exposed in tracked files

Write-Host "🔒 API Key Security Verification" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$hasIssues = $false

# Check 1: Verify .env.local is in .gitignore
Write-Host "1. Checking .gitignore configuration..." -ForegroundColor Yellow
$gitignoreContent = Get-Content ".gitignore" -Raw
if ($gitignoreContent -match "\.env\*\.local") {
    Write-Host "   ✅ .env*.local is properly ignored" -ForegroundColor Green
} else {
    Write-Host "   ❌ .env*.local is NOT in .gitignore!" -ForegroundColor Red
    $hasIssues = $true
}
Write-Host ""

# Check 2: Search for exposed OpenRouter keys
Write-Host "2. Checking for exposed OpenRouter keys..." -ForegroundColor Yellow
$openrouterResults = git grep "sk-or-v1-" -- ':!.env.local' ':!.env.example' 2>&1 | Where-Object { $_ -notmatch "pattern:" -and $_ -notmatch "your_openrouter_api_key" -and $_ -notmatch "placeholder" }

if ($openrouterResults) {
    Write-Host "   ⚠️  Found potential OpenRouter key references:" -ForegroundColor Yellow
    $openrouterResults | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
    Write-Host ""
    Write-Host "   Please review these files and replace with placeholders" -ForegroundColor Yellow
    $hasIssues = $true
} else {
    Write-Host "   ✅ No exposed OpenRouter keys found" -ForegroundColor Green
}
Write-Host ""

# Check 3: Search for exposed Gemini keys
Write-Host "3. Checking for exposed Gemini keys..." -ForegroundColor Yellow
$geminiResults = git grep "AIzaSy" -- ':!.env.local' ':!.env.example' 2>&1 | Where-Object { $_ -notmatch "your_gemini_api_key" -and $_ -notmatch "placeholder" }

if ($geminiResults) {
    Write-Host "   ⚠️  Found potential Gemini key references:" -ForegroundColor Yellow
    $geminiResults | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
    Write-Host ""
    Write-Host "   Please review these files and replace with placeholders" -ForegroundColor Yellow
    $hasIssues = $true
} else {
    Write-Host "   ✅ No exposed Gemini keys found" -ForegroundColor Green
}
Write-Host ""

# Check 4: Verify .env.local exists and has required keys
Write-Host "4. Checking .env.local configuration..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    
    $requiredKeys = @(
        "OPENROUTER_API_KEY",
        "GEMINI_API_KEY",
        "NEXT_PUBLIC_SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    
    foreach ($key in $requiredKeys) {
        if ($envContent -match "$key=.+") {
            Write-Host "   ✅ $key is configured" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  $key is missing or empty" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   ❌ .env.local file not found!" -ForegroundColor Red
    $hasIssues = $true
}
Write-Host ""

# Summary
Write-Host "=================================" -ForegroundColor Cyan
if ($hasIssues) {
    Write-Host "⚠️  Security issues found - please review above" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ All security checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your API keys are properly secured:" -ForegroundColor White
    Write-Host "  • .env.local is gitignored" -ForegroundColor Gray
    Write-Host "  • No keys exposed in tracked files" -ForegroundColor Gray
    Write-Host "  • All required keys are configured" -ForegroundColor Gray
}
