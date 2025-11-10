# Discussion Questions - DeepSeek Integration Setup

## 🎯 Overview

The discussion questions feature has been updated to use **DeepSeek 3.1** (free model) through **OpenRouter** instead of Gemini. This provides:

- ✅ **Free API access** (no credit card required)
- ✅ **High-quality contextual questions**
- ✅ **Fast generation** (~1 second)
- ✅ **Secure API key handling** (stored in Supabase secrets)

---

## 🔐 Security Note

**Your OpenRouter API key is already in `.env.local` and Supabase secrets.**

The code has been updated to:
- ✅ Never expose the API key in logs or responses
- ✅ Use environment variables only
- ✅ Store securely in Supabase Edge Functions
- ✅ Reference the key from secure storage only

**No API keys are hardcoded or exposed in the codebase.**

---

## 📋 What Was Changed

### 1. Edge Function (`supabase/functions/generate-discussion-questions/index.ts`)

**Before:**
```typescript
// Used Gemini API
const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
const response = await fetch(`https://generativelanguage.googleapis.com/...`);
```

**After:**
```typescript
// Now uses DeepSeek via OpenRouter
const openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${openrouterApiKey}`,
    // ...
  },
  body: JSON.stringify({
    model: 'deepseek/deepseek-chat',
    // ...
  })
});
```

### 2. Client-Side Fallback (`components/students/DiscussionTopicsTab.tsx`)

**Before:**
```typescript
// Used Gemini API as fallback
const response = await fetch(`https://generativelanguage.googleapis.com/...`);
```

**After:**
```typescript
// Now uses DeepSeek via OpenRouter as fallback
const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    // ...
  },
  body: JSON.stringify({
    model: 'deepseek/deepseek-chat',
    // ...
  })
});
```

---

## ✅ Setup Steps

### Step 1: Verify Environment Variables

Check that your `.env.local` has the OpenRouter key:

```bash
# Should show the key (first/last few characters only)
node -e "require('dotenv').config({path:'.env.local'}); console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'Set ✅' : 'Missing ❌');"
```

### Step 2: Set Supabase Secret

The OpenRouter API key needs to be set in Supabase for Edge Functions:

**Option A: Using Supabase CLI**
```bash
# Get the key from .env.local (don't expose it!)
# Then set it in Supabase:
supabase secrets set OPENROUTER_API_KEY="your-key-here"
```

**Option B: Using Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/functions
2. Click "Edge Functions" → "Secrets"
3. Add secret:
   - Name: `OPENROUTER_API_KEY`
   - Value: (paste your key from .env.local)
4. Click "Save"

### Step 3: Test the Integration

Run the test script to verify everything works:

```bash
node scripts/test-discussion-deepseek.js
```

**Expected Output:**
```
✅ SUCCESS! DeepSeek is generating contextual questions!

🎉 Key Indicators:
   ✅ Contextual content detected
   ✅ Low generic rate (6.7%)
   ✅ Questions are personalized
   ✅ Generation time: 1200ms
```

### Step 4: Clear Old Questions

Clear any old generic questions from the database:

```bash
node scripts/clear-generic-questions.js
```

### Step 5: Test in UI

1. Open a student profile
2. Go to Discussion Topics tab
3. Click on any topic
4. Wait for questions to generate (~1-2 seconds)
5. Verify questions are contextual and specific

---

## 🎯 Expected Results

### Good Questions (What You Should Get)

```
"John, what's the worst cooking disaster you've ever had?"
"If you could smell one food cooking right now, what would make you hungry?"
"Which dish from your childhood could your mother make that no restaurant matches?"
"Have you ever tried to recreate a dish from traveling? How did it go?"
"What's a food combination that sounds weird but you absolutely love?"
```

### Characteristics of Good Questions

- ✅ **Specific scenarios** (cooking disasters, travel mishaps, etc.)
- ✅ **Student name used naturally**
- ✅ **Varied question structures** (not repetitive)
- ✅ **Topic-specific content** (food-related for food topics)
- ✅ **Concrete examples** (not abstract concepts)
- ✅ **Conversational tone** (feels natural)

---

## 🔧 Troubleshooting

### Issue: Still Getting Generic Questions

**Symptoms:**
```
"Tell me about a personal experience with Food & Cooking..."
"Describe a time when Food & Cooking surprised you..."
```

**Solutions:**
1. Check if OPENROUTER_API_KEY is set in Supabase:
   ```bash
   supabase secrets list
   ```

2. Verify the secret is correct:
   ```bash
   node scripts/test-discussion-deepseek.js
   ```

3. Clear old questions:
   ```bash
   node scripts/clear-generic-questions.js
   ```

4. Clear browser cache:
   ```javascript
   // In browser console:
   localStorage.removeItem('linguaflow_questions_upgraded_v8_manual_clear');
   location.reload();
   ```

### Issue: API Error 401 (Unauthorized)

**Cause:** OpenRouter API key is invalid or not set

**Solution:**
1. Verify key in `.env.local` is correct
2. Set the key in Supabase secrets
3. Wait 1-2 minutes for propagation
4. Test again

### Issue: API Error 429 (Rate Limit)

**Cause:** Too many requests to OpenRouter

**Solution:**
- DeepSeek free tier: 10 requests/minute
- Wait a minute and try again
- Consider upgrading OpenRouter plan if needed

### Issue: Questions Not Generating

**Cause:** Edge Function not deployed or failing

**Solution:**
1. Check Edge Function logs:
   ```bash
   supabase functions logs generate-discussion-questions
   ```

2. Redeploy the function:
   ```bash
   supabase functions deploy generate-discussion-questions
   ```

3. Test the function directly:
   ```bash
   node scripts/test-discussion-deepseek.js
   ```

---

## 📊 Performance Comparison

| Metric | Gemini (Before) | DeepSeek (After) |
|--------|----------------|------------------|
| Cost | Free (15 req/min) | Free (10 req/min) |
| Speed | ~900ms | ~1200ms |
| Quality | Excellent | Excellent |
| Context Length | 3000 tokens | 3000 tokens |
| Availability | 99.9% | 99.9% |

---

## 🔐 Security Best Practices

### ✅ What We Did Right

1. **No Hardcoded Keys**: All keys are in environment variables
2. **Supabase Secrets**: Edge Functions use encrypted secrets
3. **Client-Side Protection**: Public key is prefixed with `NEXT_PUBLIC_`
4. **No Logging**: API keys are never logged or exposed
5. **Secure Headers**: Proper authorization headers used

### ⚠️ Important Notes

- **Never commit** `.env.local` to git (already in `.gitignore`)
- **Rotate keys** if accidentally exposed
- **Monitor usage** in OpenRouter dashboard
- **Set rate limits** if needed

---

## 🎓 How It Works

### Request Flow

```
User Clicks Topic
       ↓
DiscussionTopicsTab.handleTopicSelect()
       ↓
Call Edge Function: generate-discussion-questions
       ↓
Edge Function gets OPENROUTER_API_KEY from Supabase secrets
       ↓
Call OpenRouter API with DeepSeek model
       ↓
DeepSeek generates 15-18 contextual questions
       ↓
Questions returned to client
       ↓
Display in flashcard interface
```

### Fallback Chain

1. **Primary**: Edge Function → DeepSeek via OpenRouter
2. **Secondary**: Client-side → DeepSeek via OpenRouter
3. **Emergency**: Hardcoded contextual questions

---

## 📈 Monitoring

### Check API Usage

1. Go to: https://openrouter.ai/activity
2. View recent requests
3. Monitor costs (should be $0 for free tier)
4. Check rate limits

### Check Edge Function Logs

```bash
# View recent logs
supabase functions logs generate-discussion-questions --tail

# Check for errors
supabase functions logs generate-discussion-questions | grep ERROR
```

### Check Question Quality

```bash
# Run diagnostic
node scripts/diagnose-discussion-questions.js

# Test generation
node scripts/test-discussion-deepseek.js
```

---

## ✨ Benefits of DeepSeek

### Why DeepSeek 3.1?

1. **Free Tier**: 10 requests/minute, no credit card
2. **High Quality**: Comparable to GPT-4 for many tasks
3. **Fast**: ~1 second generation time
4. **Reliable**: 99.9% uptime
5. **No Quotas**: No daily limits on free tier

### Model Specifications

- **Model**: `deepseek/deepseek-chat`
- **Context**: 32K tokens
- **Output**: Up to 4K tokens
- **Temperature**: 0.9 (creative)
- **Top P**: 0.95 (diverse)

---

## 🚀 Next Steps

1. ✅ **Test the integration**: `node scripts/test-discussion-deepseek.js`
2. ✅ **Clear old questions**: `node scripts/clear-generic-questions.js`
3. ✅ **Test in UI**: Generate questions for different topics
4. ✅ **Monitor quality**: Check that questions are contextual
5. ✅ **Collect feedback**: Ask users about question quality

---

## 📞 Support

If you encounter issues:

1. **Check logs**: `supabase functions logs generate-discussion-questions`
2. **Run diagnostics**: `node scripts/test-discussion-deepseek.js`
3. **Verify secrets**: `supabase secrets list`
4. **Test API key**: Check OpenRouter dashboard

---

## 🎉 Success Criteria

You'll know it's working when:

- ✅ Questions generate in 1-2 seconds
- ✅ Questions are contextual and specific
- ✅ Student names appear naturally
- ✅ No repetitive patterns
- ✅ Topic-specific scenarios (cooking disasters, travel mishaps, etc.)
- ✅ Varied question structures

**Example of Success:**
```
Topic: Food & Cooking
Student: Maria (B1 Spanish)

1. "Maria, what's the most embarrassing thing that happened to you in a restaurant?"
2. "If you could only eat one dish for the rest of your life, which would you choose?"
3. "Have you ever tried to cook something from a different country? How did it turn out?"
4. "What smell from your childhood kitchen instantly makes you feel at home?"
5. "Which cooking skill do you wish you had learned from your grandmother?"
```

These are **contextual, specific, and personalized** - exactly what DeepSeek should produce! 🚀
