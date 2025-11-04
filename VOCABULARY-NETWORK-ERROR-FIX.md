# Vocabulary Flashcards Network Error - Diagnosis & Fix

## 🔍 Problem Identified

You're experiencing a **network error** when trying to generate vocabulary flashcards. After thorough investigation, here's what I found:

### ✅ What's Working:
1. **Edge Function is deployed** - `generate-vocabulary-words` is active on Supabase (version 29)
2. **Edge Function works correctly** - Direct calls to the function succeed
3. **API route exists** - `/api/supabase/functions/generate-vocabulary-words/route.ts` is present
4. **API route works** - When dev server is running, the route returns vocabulary successfully
5. **Environment variables are set** - All required keys (OPENROUTER_API_KEY, SUPABASE keys) are configured

### ❌ Root Cause:
The error occurs when:
- **Development server is not running** (most likely)
- **Network connectivity issues** between browser and localhost
- **Auth token expired** or invalid

## 🛠️ Solutions

### Solution 1: Ensure Dev Server is Running (Most Common)

```bash
# Make sure your Next.js dev server is running
npm run dev
```

The vocabulary generation requires the Next.js API route to be accessible at `http://localhost:3000/api/supabase/functions/generate-vocabulary-words`

### Solution 2: Check Browser Console

Open your browser's Developer Tools (F12) and check the Console tab for detailed error messages:
- Look for failed fetch requests
- Check for CORS errors
- Verify the request URL

### Solution 3: Clear Cache and Retry

```bash
# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

### Solution 4: Verify Auth Session

The vocabulary generation requires an authenticated session. If you're logged out or your session expired:
1. Log out completely
2. Log back in
3. Try generating vocabulary again

## 🔧 Code Fixes Applied

### 1. Fixed Environment Variable Name
**File:** `app/api/supabase/functions/generate-vocabulary-words/route.ts`

Changed from:
```typescript
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!;
```

To:
```typescript
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
```

### 2. Enhanced Error Messages
**File:** `lib/vocabulary-session.ts`

Added more detailed error logging and user-friendly messages:
- 404 errors now suggest checking if dev server is running
- Network errors include connection troubleshooting hints
- All errors log request details for debugging

## 📊 Test Results

### ✅ Direct Edge Function Test
```bash
node scripts/test-vocabulary-with-real-student.js
```
**Result:** SUCCESS - Generated 5 vocabulary words

### ✅ API Route Test
```bash
node scripts/test-api-route-vocabulary.js
```
**Result:** SUCCESS - API route returned 5 words

### Example Generated Word:
```json
{
  "word": "achieve",
  "pronunciation": "/əˈtʃiːv/",
  "partOfSpeech": "verb",
  "definition": "To successfully complete something or reach a goal",
  "exampleSentences": {
    "present": "Bartek works hard to achieve good grades in his exams.",
    "past": "She achieved her dream of becoming a teacher last year.",
    "future": "If you study consistently, you will achieve your goals.",
    ...
  }
}
```

## 🚀 Quick Fix Steps

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Wait for the server to fully start** (look for "Ready" message)

3. **Refresh your browser** (Ctrl+F5 or Cmd+Shift+R)

4. **Try generating vocabulary again**

5. **If still failing, check browser console** (F12) for specific error messages

## 🔍 Debugging Commands

If the issue persists, run these diagnostic commands:

```bash
# Test Edge Function directly
node scripts/test-vocabulary-with-real-student.js

# Test API route (requires dev server running)
node scripts/test-api-route-vocabulary.js

# Check Supabase functions status
supabase functions list
```

## 📝 Additional Notes

- The vocabulary generation uses **DeepSeek AI** via OpenRouter
- Each request generates **20 personalized words** by default
- Words are cached for **10 minutes** to improve performance
- Sessions are saved to both **localStorage** and **Supabase database**
- The system has **retry logic** with exponential backoff (up to 3 retries)

## ✅ Verification

After applying fixes, the system should:
1. Generate vocabulary without network errors
2. Display personalized words based on student profile
3. Show proper error messages if something fails
4. Cache results for faster subsequent loads

## 🆘 If Still Not Working

1. Check if port 3000 is available and not blocked
2. Verify firewall settings aren't blocking localhost
3. Try a different browser
4. Check if any browser extensions are blocking requests
5. Review the full error stack in browser console and share it for further diagnosis
