# Vocabulary Flashcards Connection Error - Complete Analysis

## 🔍 Issue Summary

You're experiencing a "Connection Problem - Unable to connect to vocabulary services" error when clicking "Start New Session" in the Vocabulary Flashcards feature.

## ✅ Confirmation: AI Generation is Active

**YES**, the Vocabulary Flashcards feature **DOES use AI generation** (Gemini API). It does NOT use fallback/static data.

## 📊 Complete Generation Flow

### 1. User Action
```
User clicks "Start New Session" button
  ↓
VocabularyFlashcardsTab.tsx → startNewSession()
```

### 2. Session Creation
```
lib/vocabulary-session.ts → vocabularySessionManager.createSession()
  ↓
Calls generateVocabularyFromAI()
  ↓
Makes HTTP POST request to:
/api/supabase/functions/generate-vocabulary-words
```

### 3. API Route (Next.js)
```
app/api/supabase/functions/generate-vocabulary-words/route.ts
  ↓
Validates environment variables:
  - NEXT_PUBLIC_SUPABASE_URL
  - SERVICE_ROLE_KEY
  ↓
Proxies request to Supabase Edge Function
```

### 4. Edge Function (Supabase)
```
supabase/functions/generate-vocabulary-words/index.ts
  ↓
Fetches student profile from database
  ↓
Creates personalized AI prompt based on:
  - Student level (A1-C2)
  - Learning goals
  - Vocabulary gaps
  - Conversational barriers
  - Native language
  ↓
Calls Gemini API (gemini-flash-latest model)
```

### 5. AI Generation
```
Gemini API generates 20 vocabulary words with:
  - Word
  - IPA pronunciation
  - Part of speech
  - Level-appropriate definition
  - 6 example sentences (different tenses)
  ↓
Returns JSON array of VocabularyCardData
```

### 6. Response Flow
```
Edge Function → API Route → Session Manager → Component
  ↓
Displays flashcards to user
```

## 🐛 Root Cause Analysis

The "Connection Problem" error indicates a **network-level failure** in this flow. Based on the code analysis, here are the most likely causes:

### Cause 1: Edge Function Not Deployed ⚠️ MOST LIKELY
**Symptom:** 404 or "function not found" error

**Why:** The Supabase Edge Function `generate-vocabulary-words` may not be deployed to your Supabase project.

**Evidence:**
- The Edge Function code exists in `supabase/functions/generate-vocabulary-words/index.ts`
- But it needs to be explicitly deployed to Supabase cloud
- Similar issue was documented in `docs/vocabulary-production-fix.md` for production

**How to Check:**
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/urmuwjcjcyohsrkgyapl
2. Navigate to "Edge Functions" in the left sidebar
3. Look for `generate-vocabulary-words` in the list
4. If it's not there or shows as "Not Deployed", this is the issue

**How to Fix:**
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref urmuwjcjcyohsrkgyapl

# Deploy the Edge Function
supabase functions deploy generate-vocabulary-words

# Set the required secret
supabase secrets set GEMINI_API_KEY=AIzaSyCOK7Uim0JUd3Gzg0dfmhFwTSjL7NyTDJ8
```

### Cause 2: Missing GEMINI_API_KEY Secret
**Symptom:** Edge Function returns error about missing API key

**Why:** The Edge Function needs `GEMINI_API_KEY` as a Supabase secret (not just in .env.local)

**How to Check:**
1. Go to Supabase Dashboard > Edge Functions > generate-vocabulary-words
2. Click on "Secrets" tab
3. Check if `GEMINI_API_KEY` is listed

**How to Fix:**
```bash
# Via CLI
supabase secrets set GEMINI_API_KEY=AIzaSyCOK7Uim0JUd3Gzg0dfmhFwTSjL7NyTDJ8

# Or via Dashboard
# 1. Go to Edge Functions > generate-vocabulary-words > Secrets
# 2. Click "Add Secret"
# 3. Name: GEMINI_API_KEY
# 4. Value: AIzaSyCOK7Uim0JUd3Gzg0dfmhFwTSjL7NyTDJ8
```

### Cause 3: Timeout Issues
**Symptom:** Request times out after 30 seconds

**Why:** AI generation can take 10-30 seconds, and the timeout might be too short

**Current Timeout:** 30 seconds (set in `lib/vocabulary-session.ts`)

**How to Fix:**
Increase timeout in `lib/vocabulary-session.ts`:
```typescript
const GENERATION_TIMEOUT = 60000; // Increase to 60 seconds
```

### Cause 4: CORS or Authentication Issues
**Symptom:** CORS error or 401/403 status codes

**Why:** Missing or invalid authorization headers

**How to Check:**
- Open browser DevTools > Network tab
- Click "Start New Session"
- Look at the request to `/api/supabase/functions/generate-vocabulary-words`
- Check the response status and headers

**How to Fix:**
Ensure proper authentication token is passed in the request headers.

## 🔧 Diagnostic Steps

### Step 1: Run the Diagnostic Script
```bash
node scripts/diagnose-vocabulary-connection.js
```

This script will:
- ✅ Check environment variables
- ✅ Test Supabase connection
- ✅ Test Edge Function deployment
- ✅ Test API route
- ✅ Test Gemini API directly
- 📊 Provide specific diagnosis and fix recommendations

### Step 2: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Click "Start New Session"
4. Look for error messages
5. Note the exact error text and status code

### Step 3: Check Supabase Logs
1. Go to Supabase Dashboard
2. Navigate to Edge Functions > generate-vocabulary-words
3. Click on "Logs" tab
4. Look for recent errors or failed invocations

### Step 4: Check Network Tab
1. Open browser DevTools > Network tab
2. Click "Start New Session"
3. Find the request to `generate-vocabulary-words`
4. Check:
   - Status code (200, 404, 500, etc.)
   - Response body
   - Request headers
   - Response time

## 🎯 Quick Fix Checklist

- [ ] Edge Function is deployed to Supabase
- [ ] GEMINI_API_KEY secret is set in Supabase
- [ ] Environment variables are set in .env.local
- [ ] Supabase URL and keys are correct
- [ ] Development server is running (npm run dev)
- [ ] Internet connection is stable
- [ ] No CORS errors in browser console
- [ ] Gemini API key is valid and has quota

## 📝 Code Locations

### Key Files:
1. **Component:** `components/students/VocabularyFlashcardsTab.tsx`
   - Handles UI and user interactions
   - Calls session manager

2. **Session Manager:** `lib/vocabulary-session.ts`
   - Manages vocabulary sessions
   - Makes API calls
   - Handles errors and timeouts

3. **API Route:** `app/api/supabase/functions/generate-vocabulary-words/route.ts`
   - Proxies requests to Edge Function
   - Validates environment variables

4. **Edge Function:** `supabase/functions/generate-vocabulary-words/index.ts`
   - Fetches student data
   - Calls Gemini API
   - Returns generated vocabulary

5. **Error Handling:** `components/students/VocabularyErrorFallbacks.tsx`
   - Displays error messages
   - Provides retry options

### Environment Variables:
```bash
# Required in .env.local
NEXT_PUBLIC_SUPABASE_URL=https://urmuwjcjcyohsrkgyapl.supabase.co
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=AIzaSyCOK7Uim0JUd3Gzg0dfmhFwTSjL7NyTDJ8

# Required in Supabase Secrets (for Edge Function)
GEMINI_API_KEY=AIzaSyCOK7Uim0JUd3Gzg0dfmhFwTSjL7NyTDJ8
```

## 🚀 Recommended Action Plan

### Immediate Actions:
1. **Run diagnostic script:**
   ```bash
   node scripts/diagnose-vocabulary-connection.js
   ```

2. **Check Edge Function deployment:**
   - Go to Supabase Dashboard
   - Verify `generate-vocabulary-words` is deployed

3. **If not deployed, deploy it:**
   ```bash
   supabase functions deploy generate-vocabulary-words
   supabase secrets set GEMINI_API_KEY=AIzaSyCOK7Uim0JUd3Gzg0dfmhFwTSjL7NyTDJ8
   ```

4. **Test again:**
   - Refresh the page
   - Click "Start New Session"
   - Check if error persists

### If Issue Persists:
1. Check browser console for specific error messages
2. Check Supabase Edge Function logs
3. Verify Gemini API key is valid
4. Check network connectivity
5. Try increasing timeout in `vocabulary-session.ts`

## 📚 Related Documentation

- `docs/vocabulary-production-fix.md` - Similar issue in production
- `docs/infinite-vocabulary-enhancement-proposal.md` - Feature overview
- `.kiro/specs/vocabulary-flashcards-feature/` - Complete feature specs
- `SECURITY-FIX-COMPLETE.md` - Edge Function secrets setup

## 🆘 Getting Help

If the issue persists after following these steps:

1. **Collect diagnostic information:**
   - Run diagnostic script output
   - Browser console errors
   - Supabase Edge Function logs
   - Network tab request/response details

2. **Check these specific things:**
   - Is the Edge Function showing in Supabase Dashboard?
   - What's the exact error message in browser console?
   - What's the HTTP status code of the failed request?
   - Are there any errors in Supabase Edge Function logs?

3. **Common solutions:**
   - Redeploy Edge Function
   - Reset Supabase secrets
   - Clear browser cache
   - Restart development server
   - Check Gemini API quota/limits

## ✨ Expected Behavior

When working correctly:
1. User clicks "Start New Session"
2. Loading indicator appears
3. After 10-30 seconds, 20 personalized vocabulary words appear
4. Each word has:
   - Word and pronunciation
   - Part of speech
   - Definition
   - 6 example sentences in different tenses
5. Words are tailored to student's level and learning goals

## 🎓 Technical Details

### AI Prompt Structure:
The Edge Function creates a detailed prompt including:
- Student name and level
- Native language
- Learning goals
- Vocabulary gaps
- Conversational barriers
- Words to exclude (already seen)

### Gemini API Configuration:
```javascript
{
  model: "gemini-flash-latest",
  temperature: 0.7,
  maxOutputTokens: 4000,
  responseMimeType: "application/json"
}
```

### Response Format:
```json
[
  {
    "word": "opportunity",
    "pronunciation": "/ˌɑːpərˈtuːnəti/",
    "partOfSpeech": "noun",
    "definition": "A chance to do something good or beneficial",
    "exampleSentences": {
      "present": "Every job interview presents a new opportunity...",
      "past": "She recognized the opportunity and applied...",
      "future": "This internship will provide valuable opportunity...",
      "presentPerfect": "Many students have found opportunity...",
      "pastPerfect": "He had missed several opportunity...",
      "futurePerfect": "By graduation, you will have explored..."
    }
  }
]
```

---

**Last Updated:** Based on codebase analysis on 2025-01-30
**Status:** Awaiting diagnostic results to confirm root cause
