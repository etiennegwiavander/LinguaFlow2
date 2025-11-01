# Verify No API Keys Before Commit
# Run this before every commit to ensure no keys are exposed

Write-Host "🔍 VERIFYING NO API KEYS IN STAGED FILES" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$hasIssues = $false

# Check 1: Verify .env.local is not staged
Write-Host "1. Checking if .env.local is staged..." -ForegroundColor Yellow
$envLocalStaged = git diff --cached --name-only | Select-String -Pattern "\.env\.local"

if ($envLocalStaged) {
    Write-Host "   ❌ ERROR: .env.local is staged!" -ForegroundColor Red
    Write-Host "   Run: git reset HEAD .env.local" -ForegroundColor Red
    $hasIssues = $true
} else {
    Write-Host "   ✅ .env.local is not staged" -ForegroundColor Green
}
Write-Host ""

# Check 2: Search for OpenRouter keys in staged files
Write-Host "2. Checking for OpenRouter keys in staged files..." -ForegroundColor Yellow
$stagedFiles = git diff --cached --name-only
$foundKeys = $false

foreach ($file in $stagedFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        if ($content -match "sk-or-v1-[a-f0-9]{64}") {
            # Check if it's being removed (old key) or added (new key)
            $diff = git diff --cached $file
            $addedLines = $diff | Select-String -Pattern "^\+.*sk-or-v1-[a-f0-9]{64}"
            
            if ($addedLines) {
                Write-Host "   ❌ ERROR: OpenRouter key found in $file" -ForegroundColor Red
                Write-Host "   This appears to be a NEW key being added!" -ForegroundColor Red
                $foundKeys = $true
                $hasIssues = $true
            }
        }
    }
}

if (-not $foundKeys) {
    Write-Host "   ✅ No OpenRouter keys found in staged files" -ForegroundColor Green
}
Write-Host ""

# Check 3: Search for Gemini keys in staged files
Write-Host "3. Checking for Gemini keys in staged files..." -ForegroundColor Yellow
$foundGeminiKeys = $false

foreach ($file in $stagedFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        if ($content -match "AIzaSy[a-zA-Z0-9_-]{33}") {
            $diff = git diff --cached $file
            $addedLines = $diff | Select-String -Pattern "^\+.*AIzaSy[a-zA-Z0-9_-]{33}"
            
            if ($addedLines) {
                Write-Host "   ❌ ERROR: Gemini key found in $file" -ForegroundColor Red
                $foundGeminiKeys = $true
                $hasIssues = $true
            }
        }
    }
}

if (-not $foundGeminiKeys) {
    Write-Host "   ✅ No Gemini keys found in staged files" -ForegroundColor Green
}
Write-Host ""

# Check 4: Search for Resend keys in staged files
Write-Host "4. Checking for Resend keys in staged files..." -ForegroundColor Yellow
$foundResendKeys = $false

foreach ($file in $stagedFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        if ($content -match "re_[a-zA-Z0-9]{32,}") {
            $diff = git diff --cached $file
            $addedLines = $diff | Select-String -Pattern "^\+.*re_[a-zA-Z0-9]{32,}"
            
            if ($addedLines) {
                Write-Host "   ❌ ERROR: Resend key found in $file" -ForegroundColor Red
                $foundResendKeys = $true
                $hasIssues = $true
            }
        }
    }
}

if (-not $foundResendKeys) {
    Write-Host "   ✅ No Resend keys found in staged files" -ForegroundColor Green
}
Write-Host ""

# Check 5: Verify sensitive files are not staged
Write-Host "5. Checking for sensitive files..." -ForegroundColor Yellow
$sensitiveFiles = @(
    "LESSON-GENERATION-AI-FIX-COMPLETE.md",
    "DEPLOYMENT-SUMMARY-LESSON-GENERATION-FIX.md",
    "test-ai-generation-direct.js",
    "regenerate-etienne-lessons.js",
    "check-etienne-lessons.js",
    "regenerate-all-fallback-lessons.js",
    "verify-all-students-ai-generation.js"
)

$foundSensitive = $false
foreach ($file in $sensitiveFiles) {
    $isStaged = git diff --cached --name-only | Select-String -Pattern "^$file$"
    if ($isStaged) {
        Write-Host "   ❌ ERROR: Sensitive file staged: $file" -ForegroundColor Red
        Write-Host "   Run: git reset HEAD $file" -ForegroundColor Red
        $foundSensitive = $true
        $hasIssues = $true
    }
}

if (-not $foundSensitive) {
    Write-Host "   ✅ No sensitive files staged" -ForegroundColor Green
}
Write-Host ""

# Summary
Write-Host "=========================================" -ForegroundColor Cyan
if ($hasIssues) {
    Write-Host "❌ VERIFICATION FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the issues above before committing." -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "  - Unstage .env.local: git reset HEAD .env.local" -ForegroundColor White
    Write-Host "  - Remove keys from files and use placeholders" -ForegroundColor White
    Write-Host "  - Unstage sensitive files: git reset HEAD <file>" -ForegroundColor White
    Write-Host ""
    exit 1
} else {
    Write-Host "✅ VERIFICATION PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "Safe to commit! No API keys or sensitive files detected." -ForegroundColor Green
    Write-Host ""
    Write-Host "Staged files:" -ForegroundColor Cyan
    git diff --cached --name-only | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    Write-Host ""
    exit 0
}
