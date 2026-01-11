# Secure Secret Removal Guide

## ⚠️ CRITICAL: Your Secrets Are Already Exposed

The secrets in commit `99005793c72c74bade86a27a9453faa69ed4888f` are already in your git history. Simply "allowing" them on GitHub will leave them exposed forever.

## The ONLY Secure Solution: Remove from History

You have two options to completely remove secrets from git history:

---

## Option 1: Using Git Filter-Branch (Built-in)

### Step 1: Run the secure removal script
```powershell
.\scripts\secure-remove-secrets.ps1
```

This will:
- Remove the file from ALL commits in history
- Re-add the sanitized version
- Clean up git objects
- Force push to remote

### Pros:
- No additional tools needed
- Works immediately

### Cons:
- Slower for large repositories
- More complex

---

## Option 2: Using BFG Repo-Cleaner (Recommended)

BFG is faster and safer than git filter-branch.

### Step 1: Download BFG
Download from: https://rtyley.github.io/bfg-repo-cleaner/

Or using Chocolatey:
```powershell
choco install bfg-repo-cleaner
```

### Step 2: Create a fresh clone
```powershell
cd ..
git clone --mirror https://github.com/etiennegwiavander/LinguaFlow2.git LinguaFlow2-mirror
cd LinguaFlow2-mirror
```

### Step 3: Remove the file from history
```powershell
bfg --delete-files netlify-environment-variables-setup.md
```

### Step 4: Clean up
```powershell
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Step 5: Push
```powershell
git push --force
```

### Step 6: Return to your working directory
```powershell
cd ../LinguaFlow2
git fetch origin
git reset --hard origin/main
```

### Step 7: Re-add the sanitized file
```powershell
git add docs/netlify-environment-variables-setup.md
git commit -m "docs: add environment variables setup guide (sanitized)"
git push origin main
```

---

## After Removal: Rotate ALL Credentials

Even after removing from git history, you should rotate these credentials as a precaution:

### 1. Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: APIs & Services > Credentials
3. Find your OAuth 2.0 Client ID
4. Click the trash icon to delete it
5. Click "Create Credentials" > "OAuth 2.0 Client ID"
6. Configure:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-domain.com/api/oauth/google-callback`
7. Copy the new Client ID and Client Secret
8. Update in:
   - `.env.local`
   - Netlify environment variables
   - Any other deployment platforms

### 2. Tranzak Webhook Secret
1. Log into [Tranzak Dashboard](https://dashboard.tranzak.me/)
2. Go to Settings > Webhooks
3. Regenerate the webhook secret
4. Update in:
   - `.env.local`
   - Netlify environment variables

### 3. Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Find your existing key and delete it
3. Click "Create API Key"
4. Copy the new key
5. Update in:
   - `.env.local`
   - Netlify environment variables
   - Supabase secrets: `supabase secrets set GEMINI_API_KEY=your-new-key`

### 4. OpenRouter API Key
1. Go to [OpenRouter Keys](https://openrouter.ai/keys)
2. Find your existing key and delete it
3. Click "Create New Key"
4. Copy the new key
5. Update in:
   - `.env.local`
   - Netlify environment variables
   - Supabase secrets: `supabase secrets set OPENROUTER_API_KEY=your-new-key`

---

## Team Impact

After rewriting git history, all team members must:

### If they have no local changes:
```powershell
git fetch origin
git reset --hard origin/main
```

### If they have local changes:
```powershell
# Save their work
git stash

# Reset to new history
git fetch origin
git reset --hard origin/main

# Reapply their work
git stash pop
```

### Or simply re-clone:
```powershell
cd ..
rm -rf LinguaFlow2
git clone https://github.com/etiennegwiavander/LinguaFlow2.git
```

---

## Prevention for Future

1. **Never commit secrets** - Always use environment variables
2. **Check .gitignore** - Ensure `.env.local` is listed
3. **Use pre-commit hooks**:
   ```powershell
   # Before each commit
   node scripts/pre-commit-security-scan.js
   ```
4. **Review before pushing** - Always check `git diff` before committing

---

## Why "Allowing" Secrets is Dangerous

When you "allow" a secret on GitHub:
- ✅ GitHub stops blocking your push
- ❌ The secret remains in git history FOREVER
- ❌ Anyone who clones your repo can see it
- ❌ It appears in GitHub's web interface
- ❌ Search engines may index it
- ❌ Automated bots scan for exposed secrets

**The ONLY secure solution is to remove it from history entirely.**
