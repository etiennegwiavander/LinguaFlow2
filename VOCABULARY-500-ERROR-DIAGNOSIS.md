# Vocabulary 500 Error - Diagnosis & Next Steps

## 🐛 Current Status

The vocabulary flashcard generation is failing with a 500 Internal Server Error from the Supabase Edge Function.

## 🔍 What We've Discovered

### 1. Error Flow
```
User clicks "Start New Session"
  ↓
Client calls /api/supabase/functions/generate-vocabulary-words
  ↓
API route calls Supabase Edge Function
  ↓
Edge Function returns 500 Internal Server Error ❌
  ↓
Error propagates back as "[object Object]"
```

### 2. What's Working ✅
- Environment variables are set correctly
- OPENROUTER_API_KEY is configured in Supabase secrets
- API route is functioning
- Client-side error handling is in place
- Edge Function is deployed

### 3. What's Failing ❌
- Edge Function returns 500 error
- OpenRouter API call is likely failing
- Error message not being properly extracted

## 🔧 Fixes Applied

### 1. Fixed `[object Object]` Error Display
**File**: `lib/vocabulary-session.ts`

**Before**:
```typescript
lastError = error instanceof Error ? error : new Error(String(error));
```

**After**:
```typescript
lastError = error; // Preserve original error object
```

### 2. Improved Error Message Extraction
**File**: `lib/vocabulary-session.ts`

```typescript
message = 
  error.message || 
  error.error_description || 
  error.error || 
  error.statusText ||
  error.msg ||
  (error.toString && error.toString() !== '[object Object]' ? error.toString() : null) ||
  'An unexpected error occurred. Please try again.';
```

### 3. Enhanced API Route Error Logging
**File**: `app/api/supabase/functions/generate-vocabulary-words/route.ts`

Added detailed error logging:
```typescript
console.error('❌ Supabase Edge Function error:', error);
console.error('Error details:', {
  message: error.message,
  name: error.name,
  context: error.context,
  details: error.details,
  hint: error.hint,
  code: error.code
});
```

### 4. Added Edge Function Logging
**File**: `supabase/functions/generate-vocabulary-words/index.ts`

Added console logs at key points:
- API key check
- OpenRouter API call
- Response status
- Content validation

## 📊 Diagnostic Tools Created

### 1. Edge Function Diagnostic Script
**File**: `scripts/diagnose-vocabulary-edge-function.js`

Tests the Edge Function directly and provides detailed error information.

**Usage**:
```bash
node scripts/diagnose-vocabulary-edge-function.js
```

## 🎯 Root Cause Analysis

### Most Likely Causes:

1. **OpenRouter API Key Issue**
   - Key might be invalid or expired
   - Key might not have sufficient credits
   - Key might be rate-limited

2. **OpenRouter API Error**
   - DeepSeek model might be unavailable
   - API might be experiencing issues
   - Request format might be incorrect

3. **Edge Function Timeout**
   - OpenRouter API taking too long to respond
   - Edge Function timing out before completion

## 🔍 How to Debug Further

### 1. Check Supabase Dashboard Logs
```
1. Go to https://supabase.com/dashboard/project/urmuwjcjcyohsrkgyapl/functions
2. Click on "generate-vocabulary-words"
3. View the logs tab
4. Look for console.log and console.error messages
```

### 2. Test OpenRouter API Directly
Create a test script to call OpenRouter API directly:

```javascript
const fetch = require('node-fetch');

async function testOpenRouter() {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat',
      messages: [{
        role: 'user',
        content: 'Generate 3 English vocabulary words for B1 level'
      }]
    })
  });
  
  console.log('Status:', response.status);
  console.log('Response:', await response.json());
}

testOpenRouter();
```

### 3. Check OpenRouter Dashboard
```
1. Go to https://openrouter.ai/
2. Check API key status
3. Check credit balance
4. Check usage limits
```

### 4. Try Alternative AI Model
Temporarily switch to a different model in the Edge Function:

```typescript
// Instead of:
model: "deepseek/deepseek-chat"

// Try:
model: "openai/gpt-3.5-turbo"
// or
model: "anthropic/claude-2"
```

## 🚀 Immediate Next Steps

### Step 1: Check Supabase Logs
Look at the Edge Function logs in Supabase dashboard to see the actual error.

### Step 2: Verify OpenRouter API Key
```bash
# Test the API key directly
curl https://openrouter.ai/api/v1/auth/key \
  -H "Authorization: Bearer YOUR_KEY_HERE"
```

### Step 3: Test with Smaller Request
Modify the diagnostic script to request only 1-2 words instead of 5.

### Step 4: Add Fallback Model
If DeepSeek is failing, add a fallback to another model.

## 📝 Files Modified

1. `lib/vocabulary-session.ts` - Fixed error handling
2. `app/api/supabase/functions/generate-vocabulary-words/route.ts` - Enhanced logging
3. `supabase/functions/generate-vocabulary-words/index.ts` - Added detailed logs
4. `scripts/diagnose-vocabulary-edge-function.js` - Created diagnostic tool

## 🔐 Security Status

✅ All API keys remain secure
✅ No keys exposed in code
✅ Pre-commit security scan passed

## 📚 Related Documentation

- `docs/vocabulary-error-analysis.md` - Complete flow analysis
- `VOCABULARY-ERROR-FIX-COMPLETE.md` - Previous fix summary
- `docs/vocabulary-logging-optimization.md` - Logging improvements

## ⚠️ Known Issues

1. Edge Function returns 500 error (root cause unknown)
2. Error message shows "[object Object]" (partially fixed)
3. Vocabulary generation fails for all students

## ✅ What's Fixed

1. Error object preservation in retry logic
2. Better error message extraction
3. Enhanced error logging
4. Diagnostic tools created

## 🎯 Success Criteria

The issue will be resolved when:
1. Edge Function returns 200 status
2. Vocabulary words are generated successfully
3. No "[object Object]" errors appear
4. Users can create vocabulary sessions

---

**Status**: 🔴 In Progress - Edge Function 500 Error
**Priority**: High
**Next Action**: Check Supabase Dashboard Logs
**Date**: November 7, 2025
