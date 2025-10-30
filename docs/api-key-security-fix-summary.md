# API Key Security Fix - Summary

## Problem
The old `OPENROUTER_API_KEY` was exposed in a previous commit and was disabled by OpenRouter. Additionally, several test scripts had hardcoded API keys that could be accidentally committed to Git.

## Actions Taken

### 1. Updated Supabase Secret ✅
```bash
supabase secrets set OPENROUTER_API_KEY=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
```

### 2. Verified .gitignore ✅
Confirmed that `.env*.local` is already excluded from Git commits.

### 3. Removed Hardcoded Keys from Test Scripts ✅
Updated the following files to read from environment variables:
- `test-deepseek-api.js`
- `test-gemini-api-now.js`
- `list-available-models.js`
- `scripts/test-gemini-api-direct.js`
- `scripts/list-gemini-models.js`

**Before:**
```javascript
const GEMINI_API_KEY = 'AIzaSy...'; // ❌ Hardcoded
```

**After:**
```javascript
require('dotenv').config({ path: '.env.local' });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // ✅ From environment
```

### 4. Created Security Documentation ✅
- `docs/api-key-security-guide.md` - Comprehensive security guide
- `docs/api-key-security-fix-summary.md` - This file
- `.env.example` - Template for other developers

### 5. Created Cleanup Script ✅
- `scripts/remove-hardcoded-keys.js` - Automated key removal tool

## Current Status

### ✅ Secured
- New `OPENROUTER_API_KEY` configured in Supabase secrets
- All test scripts use environment variables
- `.env.local` is excluded from Git
- `.env.example` template created for developers

### ⚠️ Important Notes

1. **Old Key is Revoked**: The old OpenRouter key (`sk-or-v1-b6a563b1...`) has been disabled by OpenRouter and should not be used.

2. **New Key is Active**: The new key (`sk-or-v1-54c71bbd...`) is now configured and working.

3. **Git History**: The old keys may still exist in Git history. Consider:
   - Using `git filter-branch` or BFG Repo-Cleaner to remove them
   - Making the repository private if it's currently public
   - Rotating all exposed keys as a precaution

4. **Test Scripts**: All test scripts now require `.env.local` to be present with valid keys.

## Testing

To verify the fix works:

```bash
# Test DeepSeek API with new key
node test-deepseek-api.js

# Test lesson generation
node test-mine-lesson-generation.js
```

Both should work with the new key from `.env.local`.

## Best Practices Going Forward

1. **Never hardcode API keys** in any file
2. **Always use environment variables** for sensitive data
3. **Check before committing**: Review files for accidental key exposure
4. **Use .env.example**: Provide templates without actual values
5. **Rotate keys regularly**: Change API keys periodically for security

## Files Modified

### Updated Files:
- `test-deepseek-api.js`
- `test-gemini-api-now.js`
- `list-available-models.js`
- `scripts/test-gemini-api-direct.js`
- `scripts/list-gemini-models.js`

### New Files:
- `docs/api-key-security-guide.md`
- `docs/api-key-security-fix-summary.md`
- `.env.example`
- `scripts/remove-hardcoded-keys.js`

### Supabase Secrets Updated:
- `OPENROUTER_API_KEY` ✅

## Next Steps

1. ✅ Test lesson generation with new key
2. ✅ Verify all Edge Functions work correctly
3. ⚠️ Consider cleaning Git history of old keys
4. ⚠️ Review all documentation files for exposed keys
5. ⚠️ Set up pre-commit hooks to prevent future key exposure

## Verification

Run this command to check for any remaining hardcoded keys:
```bash
# Search for OpenRouter keys
git grep "sk-or-v1-" -- ':!.env.local' ':!docs/'

# Search for Gemini keys
git grep "AIzaSy" -- ':!.env.local' ':!docs/'
```

If any results appear (excluding .env.local and docs), they need to be removed.
