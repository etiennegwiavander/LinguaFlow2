# Setup OpenRouter Secret for Discussion Questions
# This script helps you set the OPENROUTER_API_KEY in Supabase

Write-Host "🔐 OpenRouter Secret Setup for Discussion Questions" -ForegroundColor Cyan
Write-Host ("=" * 60)

# Load .env.local to get the key
$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    exit 1
}

# Read the OPENROUTER_API_KEY from .env.local
$openrouterKey = $null
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^OPENROUTER_API_KEY=(.+)$') {
        $openrouterKey = $matches[1].Trim()
    }
}

if (-not $openrouterKey) {
    Write-Host "❌ OPENROUTER_API_KEY not found in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found OPENROUTER_API_KEY in .env.local" -ForegroundColor Green
Write-Host "   Key: $($openrouterKey.Substring(0, 10))...$($openrouterKey.Substring($openrouterKey.Length - 4))"

Write-Host "`n$("=" * 60)"
Write-Host "📋 SETUP INSTRUCTIONS" -ForegroundColor Cyan
Write-Host ("=" * 60)

Write-Host "`n🔐 Setting the secret in Supabase..." -ForegroundColor Yellow
Write-Host "`nRun this command:"
Write-Host "supabase secrets set OPENROUTER_API_KEY=`"$openrouterKey`"" -ForegroundColor Green

Write-Host "`n⏳ After setting the secret:" -ForegroundColor Yellow
Write-Host "   1. Wait 1-2 minutes for propagation"
Write-Host "   2. Run: node scripts/test-discussion-deepseek.js"
Write-Host "   3. Verify questions are contextual and specific"

Write-Host "`n💡 Alternative: Set via Supabase Dashboard" -ForegroundColor Yellow
Write-Host "   1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/functions"
Write-Host "   2. Click 'Edge Functions' → 'Secrets'"
Write-Host "   3. Add secret:"
Write-Host "      Name: OPENROUTER_API_KEY"
Write-Host "      Value: $openrouterKey"
Write-Host "   4. Click 'Save'"

Write-Host "`nReady to set the secret!" -ForegroundColor Green
Write-Host ""
