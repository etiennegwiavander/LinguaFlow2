# Lesson Generation Fallback Issue - Diagnosis & Fix

## Problem
Lesson generation is producing fallback content like:
- "English Business English for Mine"
- "English Pronunciation for Mine"
- "English Conversation for Mine"

Instead of personalized AI-generated content like:
- "Oana's English Conversation Launchpad: Building a Strong Foundation"
- "Oana's Business English Boost: Mastering Past and Perfect Tenses for Work and Life"

## Root Cause Analysis

The fallback content indicates that the AI generation is **failing** and the system is falling back to basic template-based generation. This happens when:

1. **GEMINI_API_KEY is not set in Supabase Edge Function secrets** (Most likely)
2. API key is invalid or expired
3. Rate limiting or API quota exceeded
4. Network issues reaching Gemini API
5. Parsing errors in AI response

## Diagnosis Steps

### Step 1: Test Gemini API Locally
```bash
node scripts/test-gemini-api-direct.js
```

This will verify:
- ✅ API key is valid
- ✅ API is accessible
- ✅ Response format is correct

### Step 2: Test Full Lesson Generation Flow
```bash
node scripts/test-lesson-generation-debug.js
```

This will:
- Find a student
- Call the Edge Function
- Analyze if AI or fallback content is generated
- Identify the exact failure point

### Step 3: Check Edge Function Logs
1. Go to Supabase Dashboard
2. Navigate to **Edge Functions** > **generate-lesson-plan**
3. Click on **Logs** tab
4. Look for errors like:
   - `GEMINI_API_KEY not configured`
   - `Gemini API error: 403`
   - `Failed to parse AI response`
   - `AI generation failed, falling back...`

## Most Likely Fix: Set Edge Function Secrets

The Edge Function runs in Supabase's cloud environment, which is **separate** from your local `.env.local` file. You need to set the API key as a secret in Supabase.

### How to Fix:

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/urmuwjcjcyohsrkgyapl

2. **Navigate to Edge Functions**
   - Click on "Edge Functions" in the left sidebar

3. **Select generate-lesson-plan function**
   - Click on the `generate-lesson-plan` function

4. **Go to Secrets tab**
   - Click on "Secrets" or "Environment Variables"

5. **Add the GEMINI_API_KEY secret**
   - Name: `GEMINI_API_KEY`
   - Value: `your_gemini_api_key_from_env_local`
   - Click "Add Secret" or "Save"

6. **Redeploy the function** (if needed)
   - Some platforms auto-redeploy on secret changes
   - If not, manually redeploy the function

### Alternative: Deploy with Supabase CLI

If you have Supabase CLI installed:

```bash
# Set the secret (get the key from your .env.local file)
supabase secrets set GEMINI_API_KEY=your_gemini_api_key

# Redeploy the function
supabase functions deploy generate-lesson-plan
```

## Verification

After setting the secret:

1. **Test lesson generation** for a student
2. **Check the lesson titles** - they should be personalized:
   - ✅ Good: "Mine's Business English Mastery: Professional Communication Skills"
   - ❌ Bad: "English Business English for Mine"

3. **Check for "AI Generated" badge** in the UI

4. **Verify sub-topics are unique and detailed**

## Code Flow Reference

### Where AI Generation Happens
`supabase/functions/generate-lesson-plan/index.ts`

```typescript
// Line ~400: Checks for API key
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY not configured');
}
```

### Fallback Triggers
The function falls back to basic generation when:

```typescript
try {
  const aiResponse = await callGeminiAPI(prompt);
  return aiResponse;
} catch (error) {
  console.error('❌ AI generation failed:', error);
  // Falls back to generateFallbackLesson()
  return generateFallbackLesson(student, template, lessonNumber);
}
```

## Expected Behavior After Fix

### Before (Fallback):
```
1. English Business English for Mine
2. English Pronunciation for Mine
3. English Business English for Mine
4. English Conversation for Mine
5. English Grammar for Mine
```

### After (AI Generated):
```
1. Mine's Professional English Journey: Mastering Business Communication
2. Mine's Pronunciation Power-Up: Clarity in Professional Settings
3. Mine's Grammar Excellence: Advanced Structures for Business
4. Mine's Conversational Confidence: Real-World Business Scenarios
5. Mine's English Mastery: Integration and Future Planning
```

## Additional Checks

### Check Other Edge Functions
The same issue might affect other AI-powered functions:
- `generate-discussion-questions`
- `generate-vocabulary-words`
- `generate-interactive-material`

Make sure `GEMINI_API_KEY` is set for all of them.

### Check API Quota
- Go to Google AI Studio: https://aistudio.google.com/
- Check your API usage and quotas
- Ensure billing is enabled if required

## Support

If the issue persists after setting the secret:

1. Check Edge Function logs for specific errors
2. Verify API key is valid by testing locally
3. Check for rate limiting (12 requests/minute limit in code)
4. Ensure Gemini API is enabled in your Google Cloud project
