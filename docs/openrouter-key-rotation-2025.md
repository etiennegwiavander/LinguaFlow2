# OpenRouter API Key Rotation - January 2025

## Issue
OpenRouter detected that an API key was exposed in a public GitHub repository and automatically disabled it for security.

**Alert Details:**
- Date: January 30, 2025
- Exposed key ending: ...539e
- Location: `docs/api-key-security-fix-summary.md` in public GitHub repo
- Action taken by OpenRouter: Key automatically disabled

## Resolution Steps

### 1. ✅ New API Key Generated
A new OpenRouter API key has been generated and is now active.

### 2. ✅ Updated Local Environment
The new key has been added to `.env.local`:
```bash
OPENROUTER_API_KEY=your_new_key_here
```

### 3. ⚠️ Update Supabase Secrets (REQUIRED)
You must update the Supabase Edge Function secrets with the new key:

```bash
# Login to Supabase CLI
supabase login

# Set the new OpenRouter API key
supabase secrets set OPENROUTER_API_KEY=your_new_openrouter_api_key

# Verify the secret was set
supabase secrets list
```

**Important:** Replace `your_new_openrouter_api_key` with the actual new key from your `.env.local` file.

### 4. ✅ Removed Exposed Keys from Documentation
Updated the following files to remove actual API keys:
- `docs/api-key-security-fix-summary.md` - Replaced with placeholders
- All documentation now uses example keys only

### 5. ✅ Verified .gitignore Protection
Confirmed that `.env.local` is properly excluded from Git commits.

## Security Best Practices Applied

### Files Protected from Commits
- `.env` and `.env*.local` are in `.gitignore`
- `.env.example` contains only placeholder values
- All documentation uses example keys (e.g., `sk-or-v1-abc123...`)

### Code Practices
- All scripts read from environment variables
- No hardcoded API keys in any tracked files
- Supabase Edge Functions use secrets, not environment variables

## Verification

Run this command to ensure no real keys are in tracked files:
```bash
git grep "sk-or-v1-" -- ':!.env.local' ':!.env.example'
```

Expected results should only show:
- Documentation with example keys
- Search patterns in utility scripts
- No actual API keys

## Next Steps

1. **Update Supabase Secrets** (if not done yet):
   ```bash
   supabase secrets set OPENROUTER_API_KEY=<your_new_key>
   ```

2. **Test Edge Functions**:
   ```bash
   node test-lesson-generation.js
   node test-deepseek-api.js
   ```

3. **Monitor OpenRouter Dashboard**:
   - Check usage at https://openrouter.ai/dashboard
   - Verify the new key is working
   - Confirm the old key is disabled

4. **Consider Additional Security**:
   - Set up GitHub secret scanning alerts
   - Use pre-commit hooks to prevent key exposure
   - Regularly rotate API keys (every 90 days recommended)

## Files Modified

### Updated:
- `docs/api-key-security-fix-summary.md` - Removed actual keys
- `.env.local` - Added new key (not committed)

### Created:
- `docs/openrouter-key-rotation-2025.md` - This document

## Important Notes

- **Old key is permanently disabled** by OpenRouter
- **New key must be set in Supabase** for Edge Functions to work
- **Git history still contains old key** - consider using BFG Repo-Cleaner if needed
- **Repository visibility** - Consider making repo private if it contains sensitive data

## Support

If you encounter issues:
1. Verify `.env.local` has the new key
2. Confirm Supabase secrets are updated: `supabase secrets list`
3. Check Edge Function logs: `supabase functions logs generate-lesson-plan`
4. Test API directly: `node test-deepseek-api.js`

## Status

- ✅ New key generated
- ✅ Local environment updated
- ✅ Documentation sanitized
- ⚠️ **ACTION REQUIRED:** Update Supabase secrets
- ⚠️ **ACTION REQUIRED:** Test Edge Functions after secret update
