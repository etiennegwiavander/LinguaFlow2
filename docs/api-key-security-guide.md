# API Key Security Guide

## ⚠️ CRITICAL: Never Commit API Keys to Git

API keys are sensitive credentials that should **NEVER** be committed to version control or shared publicly.

## Current API Keys (Stored Securely)

### Local Development
All API keys are stored in `.env.local` which is:
- ✅ Excluded from Git via `.gitignore`
- ✅ Only exists on your local machine
- ✅ Never committed to GitHub

### Production (Supabase Edge Functions)
API keys are stored as **Supabase Secrets**:
- ✅ Encrypted and secure
- ✅ Only accessible by Edge Functions
- ✅ Not visible in code or logs

## How to Update API Keys Securely

### 1. Update Local Environment (.env.local)
```bash
# Edit .env.local file
OPENROUTER_API_KEY=your-new-key-here
GEMINI_API_KEY=your-new-key-here
```

### 2. Update Supabase Secrets
```bash
# Update OpenRouter API key
supabase secrets set OPENROUTER_API_KEY=your-new-key-here

# Update Gemini API key (if needed)
supabase secrets set GEMINI_API_KEY=your-new-key-here
```

### 3. Redeploy Edge Functions
```bash
# Redeploy all functions that use the updated keys
supabase functions deploy generate-lesson-plan
supabase functions deploy generate-discussion-questions
supabase functions deploy generate-vocabulary-words
supabase functions deploy generate-interactive-material
```

## What to Do If a Key is Exposed

### Immediate Actions:
1. **Revoke the exposed key** in the provider's dashboard
   - OpenRouter: https://openrouter.ai/keys
   - Google AI Studio (Gemini): https://aistudio.google.com/app/apikey

2. **Generate a new key** from the provider

3. **Update the key everywhere**:
   ```bash
   # Update .env.local
   # Update Supabase secrets
   supabase secrets set OPENROUTER_API_KEY=new-key-here
   
   # Redeploy functions
   supabase functions deploy generate-lesson-plan
   ```

4. **Check Git history** to ensure the key wasn't committed:
   ```bash
   git log -p | grep "sk-or-v1"
   ```

5. **If committed to Git**, you must:
   - Remove from history using `git filter-branch` or BFG Repo-Cleaner
   - Force push to remote
   - Notify all collaborators to re-clone the repository

## Test Scripts Security

All test scripts now read API keys from environment variables:

```javascript
// ✅ CORRECT - Reads from environment
require('dotenv').config({ path: '.env.local' });
const API_KEY = process.env.OPENROUTER_API_KEY;

// ❌ WRONG - Hardcoded key
const API_KEY = 'sk-or-v1-abc123...';
```

## Files That Should NEVER Contain Keys

- ❌ Any `.js`, `.ts`, `.tsx` files
- ❌ Any `.md` documentation files
- ❌ Any files tracked by Git

## Files That CAN Contain Keys (Safely)

- ✅ `.env.local` (excluded from Git)
- ✅ `.env` (excluded from Git)
- ✅ Supabase Secrets (encrypted, not in code)

## Verification Checklist

Before committing code:
- [ ] No API keys in code files
- [ ] No API keys in documentation
- [ ] `.env.local` is in `.gitignore`
- [ ] Test scripts use environment variables
- [ ] Supabase secrets are up to date

## Current Status

### ✅ Secured
- `.env.local` is in `.gitignore`
- Supabase secrets configured:
  - `OPENROUTER_API_KEY` ✅
  - `GEMINI_API_KEY` ✅
- Test scripts updated to use environment variables

### ⚠️ Action Required
- Review all documentation files for exposed keys
- Update any hardcoded keys in test scripts
- Verify Git history doesn't contain keys

## Additional Resources

- [Supabase Secrets Documentation](https://supabase.com/docs/guides/functions/secrets)
- [OpenRouter API Keys](https://openrouter.ai/keys)
- [Google AI Studio](https://aistudio.google.com/app/apikey)
- [Git Secrets Tool](https://github.com/awslabs/git-secrets)
