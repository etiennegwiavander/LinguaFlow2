# PowerShell script to verify no API keys are exposed in Git-tracked files

Write-Host "🔍 Checking for exposed API keys..." -ForegroundColor Cyan
Write-Host ""

$foundIssues = $false

# Check for OpenRouter keys
Write-Host "Checking for OpenRouter keys..." -ForegroundColor Yellow
$openrouterResults = git grep "sk-or-v1-" -- ':!.env.local' ':!.env.example' ':!UPDATE-SUPABASE-SECRETS.md' ':!SECURITY-FIX-COMPLETE.md' 2>&1 | Select-String -Pattern "sk-or-v1-"

if ($openrouterResults) {
    $safePatterns = @(
        "git grep",           # Command examples in docs
        "sk-or-v1-abc123",    # Placeholder examples
        "pattern:",           # Regex patterns in scripts
        "/const OPENROUTER"   # Code patterns
    )
    
    $unsafeResults = $openrouterResults | Where-Object {
        $line = $_.Line
        $isSafe = $false
        foreach ($pattern in $safePatterns) {
            if ($line -like "*$pattern*") {
                $isSafe = $true
                break
            }
        }
        -not $isSafe
    }
    
    if ($unsafeResults) {
        Write-Host "❌ Found potentially exposed OpenRouter keys:" -ForegroundColor Red
        $unsafeResults | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
        $foundIssues = $true
    } else {
        Write-Host "✅ All OpenRouter key references are safe (examples/patterns only)" -ForegroundColor Green
    }
} else {
    Write-Host "✅ No OpenRouter keys found in tracked files" -ForegroundColor Green
}

Write-Host ""

# Check for Gemini keys
Write-Host "Checking for Gemini keys..." -ForegroundColor Yellow
$geminiResults = git grep "AIzaSy" -- ':!.env.local' ':!.env.example' ':!UPDATE-SUPABASE-SECRETS.md' ':!SECURITY-FIX-COMPLETE.md' 2>&1 | Select-String -Pattern "AIzaSy"

if ($geminiResults) {
    $safePatterns = @(
        "AIzaSy...",          # Placeholder examples
        "your_gemini_api",    # Template text
        "git grep",           # Command examples in docs
        "pattern:",           # Regex patterns in scripts
        "/const GEMINI"       # Code patterns
    )
    
    $unsafeResults = $geminiResults | Where-Object {
        $line = $_.Line
        $isSafe = $false
        foreach ($pattern in $safePatterns) {
            if ($line -like "*$pattern*") {
                $isSafe = $true
                break
            }
        }
        -not $isSafe
    }
    
    if ($unsafeResults) {
        Write-Host "❌ Found potentially exposed Gemini keys:" -ForegroundColor Red
        $unsafeResults | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
        $foundIssues = $true
    } else {
        Write-Host "✅ All Gemini key references are safe (examples/patterns only)" -ForegroundColor Green
    }
} else {
    Write-Host "✅ No Gemini keys found in tracked files" -ForegroundColor Green
}

Write-Host ""

# Check .gitignore
Write-Host "Checking .gitignore protection..." -ForegroundColor Yellow
$gitignoreContent = Get-Content ".gitignore" -Raw

$requiredPatterns = @(
    ".env",
    ".env*.local",
    "UPDATE-SUPABASE-SECRETS.md"
)

$allProtected = $true
foreach ($pattern in $requiredPatterns) {
    if ($gitignoreContent -notlike "*$pattern*") {
        Write-Host "❌ Missing .gitignore entry: $pattern" -ForegroundColor Red
        $allProtected = $false
        $foundIssues = $true
    }
}

if ($allProtected) {
    Write-Host "✅ All sensitive files are protected in .gitignore" -ForegroundColor Green
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

if ($foundIssues) {
    Write-Host ""
    Write-Host "❌ SECURITY ISSUES FOUND!" -ForegroundColor Red
    Write-Host "Please review and fix the issues above before committing." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host ""
    Write-Host "✅ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your repository is secure. No exposed API keys found." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Update Supabase secrets: .\scripts\update-supabase-secrets.ps1" -ForegroundColor White
    Write-Host "2. Test Edge Functions: node test-lesson-generation.js" -ForegroundColor White
    Write-Host "3. Commit changes: git add . && git commit -m 'Security: Remove exposed API keys'" -ForegroundColor White
    exit 0
}
