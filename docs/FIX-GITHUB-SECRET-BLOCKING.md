# Fix GitHub Secret Blocking Issue

## Problem
GitHub is blocking your push because it detected secrets in commit `99005793c72c74bade86a27a9453faa69ed4888f`.

## Quick Solution (Recommended)

### Step 1: Allow the Secrets on GitHub
Click these URLs to allow the secrets (you'll need to be logged into GitHub):

1. **Google OAuth Client ID:**
   https://github.com/etiennegwiavander/LinguaFlow2/security/secret-scanning/unblock-secret/3854cJ4H2R6YP8LDxQkCFS663TY

2. **Google OAuth Client Secret:**
   https://github.com/etiennegwiavander/LinguaFlow2/security/secret-scanning/unblock-secret/3854cHu4ZTNV5ob2q38buaJBqeW

### Step 2: Push Your Changes
After allowing the secrets, run:
```powershell
git push origin main --force
```

### Step 3: Rotate the Exposed Credentials (IMPORTANT!)
Since these secrets were exposed in git history, you should rotate them:

#### Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Delete the old OAuth 2.0 Client ID
4. Create a new OAuth 2.0 Client ID
5. Update your `.env.local` and Netlify environment variables

#### Tranzak Webhook Secret
1. Log into your Tranzak dashboard
2. Regenerate the webhook secret
3. Update your `.env.local` and Netlify environment variables

#### Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Delete the old API key
3. Create a new API key
4. Update your `.env.local`, Netlify, and Supabase secrets

#### OpenRouter API Key
1. Go to [OpenRouter Keys](https://openrouter.ai/keys)
2. Delete the old API key
3. Create a new API key
4. Update your `.env.local`, Netlify, and Supabase secrets

## Alternative Solution: Remove from Git History

If you don't want to allow the secrets on GitHub, you'll need to rewrite git history to remove the commit entirely. This is more complex and requires tools like `git filter-repo` or `BFG Repo-Cleaner`.

See: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

## Prevention

To prevent this in the future:

1. **Never commit secrets to git** - Always use environment variables
2. **Use .gitignore** - Make sure `.env.local` is in `.gitignore`
3. **Use pre-commit hooks** - Run `scripts/pre-commit-security-scan.js` before commits
4. **Review before pushing** - Always review your changes before pushing

## Current Status

✅ The file `docs/netlify-environment-variables-setup.md` has been sanitized
✅ All secrets have been replaced with placeholders
⏳ Waiting for you to allow the secrets on GitHub or rewrite history
