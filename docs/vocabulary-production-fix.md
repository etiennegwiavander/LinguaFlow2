# Vocabulary Production Fix - API Route 404 Issue

## Problem
Vocabulary flashcards work on localhost but fail in production with:
```
POST https://linguaflow.online/api/supabase/functions/generate-vocabulary-words 404 (Not Found)
```

## Root Cause
The issue was caused by incorrect Netlify configuration that was interfering with Next.js API routes:

1. **Incorrect API redirect**: `netlify.toml` had a redirect that routed `/api/*` to Netlify Functions instead of Next.js API routes
2. **Incompatible output mode**: `next.config.js` had `output: 'standalone'` which conflicts with Netlify's Next.js plugin

## Solution Applied

### 1. Fixed netlify.toml
**Before:**
```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

**After:**
```toml
# Let Next.js handle all routing including API routes
# No manual redirects needed - the plugin handles everything
```

### 2. Fixed next.config.js
**Before:**
```javascript
output: 'standalone',
```

**After:**
```javascript
// output: 'standalone', // Removed - not compatible with Netlify
```

## Files Modified
- `netlify.toml` - Removed conflicting redirects
- `next.config.js` - Removed standalone output mode

## Expected Result
After deployment, the vocabulary API route should be accessible at:
`https://linguaflow.online/api/supabase/functions/generate-vocabulary-words`

## Testing
1. Deploy the changes
2. Test vocabulary flashcards by clicking "Start New Session"
3. Check browser console - should see successful API calls instead of 404 errors

## Technical Details
- Netlify's Next.js plugin automatically handles API routes when no conflicting redirects are present
- The `output: 'standalone'` mode is for Docker/self-hosted deployments, not Netlify
- Next.js API routes should work seamlessly on Netlify with proper configuration