# 🚨 QUICK FIX: Lesson Generation Fallback Issue

## Problem
Lessons are showing fallback content like "English Business English for Mine" instead of personalized AI content.

## Root Cause
**The GEMINI_API_KEY is not set in Supabase Edge Function secrets.**

Your `.env.local` file has the key, but Edge Functions run in Supabase's cloud and need the secret configured there.

## Fix (5 minutes)

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/urmuwjcjcyohsrkgyapl/functions
   ```

2. **Click on `generate-lesson-plan` function**

3. **Go to "Secrets" or "Environment Variables" tab**

4. **Add new secret:**
   - Name: `GEMINI_API_KEY`
   - Value: `your_gemini_api_key_from_env_local`

5. **Save** (function will auto-redeploy)

6. **Test** by generating lesson ideas for a student

### Option 2: Supabase CLI

```bash
# Set the secret (get the key from your .env.local file)
supabase secrets set GEMINI_API_KEY=your_gemini_api_key

# Deploy the function
supabase functions deploy generate-lesson-plan
```

## Verify the Fix

### Before Fix:
```
❌ English Business English for Mine
❌ English Pronunciation for Mine
❌ English Conversation for Mine
```

### After Fix:
```
✅ Mine's Professional English Journey: Mastering Business Communication
✅ Mine's Pronunciation Power-Up: Clarity in Professional Settings
✅ Mine's Conversational Confidence: Real-World Business Scenarios
```

## Test Scripts

Run these to diagnose the issue:

```bash
# Test if Gemini API works locally
node scripts/test-gemini-api-direct.js

# Test if Edge Function can access secrets
node scripts/check-edge-function-secrets.js

# Full lesson generation test
node scripts/test-lesson-generation-debug.js
```

## Other Functions to Fix

Apply the same fix to these Edge Functions:
- `generate-discussion-questions`
- `generate-vocabulary-words`
- `generate-interactive-material`
- `generate-topic-description`

All need `GEMINI_API_KEY` in their secrets.

## Still Not Working?

1. **Check Edge Function Logs**
   - Dashboard > Edge Functions > generate-lesson-plan > Logs
   - Look for "GEMINI_API_KEY not configured" or API errors

2. **Verify API Key**
   - Test locally: `node scripts/test-gemini-api-direct.js`
   - Check Google AI Studio: https://aistudio.google.com/

3. **Check API Quota**
   - Ensure you haven't exceeded rate limits
   - Gemini has 12 requests/minute limit in the code

## Need Help?

See full diagnosis: `docs/lesson-generation-fallback-diagnosis.md`
