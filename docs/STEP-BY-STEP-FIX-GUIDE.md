# Step-by-Step Guide: Fix AI Lesson Generation

## 🎯 Goal
Fix the lesson generation to use AI instead of fallback templates.

## 📋 Prerequisites
- Access to Supabase Dashboard
- Your Gemini API key (found in `.env.local`)

---

## 🔧 Step 1: Access Supabase Dashboard

1. Open your browser and go to:
   ```
   https://supabase.com/dashboard/project/urmuwjcjcyohsrkgyapl
   ```

2. Log in if prompted

3. You should see your project dashboard

---

## 🔧 Step 2: Navigate to Edge Functions

1. In the left sidebar, click on **"Edge Functions"**
   - It's usually near the bottom of the sidebar
   - Icon looks like a lightning bolt ⚡

2. You should see a list of your Edge Functions:
   - `generate-discussion-questions`
   - `generate-interactive-material`
   - `generate-lesson-plan` ← **This is the one we need**
   - `generate-topic-description`
   - `generate-vocabulary-words`
   - And others...

---

## 🔧 Step 3: Configure generate-lesson-plan Function

1. **Click on `generate-lesson-plan`** in the list

2. You'll see tabs at the top:
   - Details
   - Logs
   - **Secrets** ← Click this one
   - Settings

3. In the **Secrets** tab:
   - Look for existing secrets
   - Check if `GEMINI_API_KEY` already exists

4. **Add the secret:**
   
   **If GEMINI_API_KEY doesn't exist:**
   - Click **"Add Secret"** or **"New Secret"** button
   - Name: `GEMINI_API_KEY`
   - Value: `your_gemini_api_key_from_env_local`
   - Click **"Save"** or **"Add"**

   **If GEMINI_API_KEY already exists:**
   - Click **"Edit"** or the pencil icon
   - Update the value to: `your_gemini_api_key_from_env_local`
   - Click **"Save"**

5. **Redeploy the function** (if needed):
   - Some platforms auto-redeploy when secrets change
   - If you see a "Deploy" or "Redeploy" button, click it
   - Wait for deployment to complete (usually 10-30 seconds)

---

## 🔧 Step 4: Repeat for Other AI Functions

The same secret needs to be added to these functions:

### 4a. generate-discussion-questions
1. Go back to Edge Functions list
2. Click on `generate-discussion-questions`
3. Go to Secrets tab
4. Add `GEMINI_API_KEY` with the same value
5. Save/Deploy

### 4b. generate-vocabulary-words
1. Click on `generate-vocabulary-words`
2. Go to Secrets tab
3. Add `GEMINI_API_KEY` with the same value
4. Save/Deploy

### 4c. generate-interactive-material
1. Click on `generate-interactive-material`
2. Go to Secrets tab
3. Add `GEMINI_API_KEY` with the same value
4. Save/Deploy

### 4d. generate-topic-description
1. Click on `generate-topic-description`
2. Go to Secrets tab
3. Add `GEMINI_API_KEY` with the same value
4. Save/Deploy

---

## ✅ Step 5: Test the Fix

### Option A: Test in the Application

1. Go to your LinguaFlow application
2. Navigate to a student profile (e.g., Mine's profile)
3. Click **"Generate Lesson Ideas"** or **"Regenerate Ideas"**
4. Wait 15-30 seconds for generation
5. Check the lesson titles:

   **✅ GOOD (AI-Generated):**
   ```
   Mine's Professional English Journey: Mastering Business Communication
   Mine's Pronunciation Power-Up: Clarity in Professional Settings
   Mine's Grammar Excellence: Advanced Structures for Business
   ```

   **❌ BAD (Fallback):**
   ```
   English Business English for Mine
   English Pronunciation for Mine
   English Grammar for Mine
   ```

### Option B: Test with Script

Run the verification script:

```bash
node scripts/verify-ai-generation-fix.js
```

This will:
- Create a test lesson
- Generate content
- Analyze if it's AI or fallback
- Show detailed results
- Clean up test data

---

## 🔍 Step 6: Verify Success

### Check for these indicators:

1. **Lesson Titles are Personalized**
   - Contains student's name
   - Descriptive and unique
   - Not generic templates

2. **"AI Generated" Badge**
   - Should appear in the UI
   - Indicates successful AI generation

3. **Rich Content**
   - 4+ objectives per lesson
   - 5+ activities per lesson
   - 6 unique sub-topics per lesson
   - Detailed descriptions

4. **No Duplicate Sub-topics**
   - Each sub-topic should be unique
   - Specific to the lesson's focus

---

## 🐛 Troubleshooting

### Issue: Still seeing fallback content

**Check 1: Verify Secret is Set**
```bash
node scripts/check-edge-function-secrets.js
```

**Check 2: Test API Key Locally**
```bash
node scripts/test-gemini-api-direct.js
```

**Check 3: View Edge Function Logs**
1. Go to Supabase Dashboard
2. Edge Functions > generate-lesson-plan
3. Click "Logs" tab
4. Look for errors:
   - `GEMINI_API_KEY not configured`
   - `Gemini API error: 403`
   - `Rate limit exceeded`

**Check 4: Verify Function Redeployed**
- After adding secrets, function must redeploy
- Check deployment status in Supabase
- Manually redeploy if needed

### Issue: API Key Invalid

**Symptoms:**
- Logs show "403 Forbidden" or "Invalid API key"

**Solution:**
1. Go to Google AI Studio: https://aistudio.google.com/
2. Generate a new API key
3. Update the secret in Supabase
4. Redeploy the function

### Issue: Rate Limiting

**Symptoms:**
- Some lessons are AI, some are fallback
- Logs show "429 Too Many Requests"

**Solution:**
- Wait a few minutes and try again
- The code has built-in rate limiting (12 requests/minute)
- This is normal for the first generation

---

## 📊 Expected Results

### Before Fix:
```
❌ 5 Fallback Lessons
   - Generic titles
   - Basic content
   - No personalization
```

### After Fix:
```
✅ 5 AI-Generated Lessons
   - Personalized titles with student name
   - Rich, detailed content
   - Unique sub-topics
   - Addresses student's specific needs
```

---

## 🎉 Success Criteria

You'll know it's working when:

- ✅ Lesson titles include student's name
- ✅ Titles are descriptive and unique
- ✅ "AI Generated" badge appears
- ✅ Each lesson has 6 unique sub-topics
- ✅ Content is in the target language
- ✅ Lessons address student's weaknesses/goals
- ✅ No generic "English [Category] for [Name]" patterns

---

## 📞 Need Help?

If you're still having issues:

1. **Check the logs:**
   - Supabase Dashboard > Edge Functions > Logs

2. **Run diagnostic scripts:**
   ```bash
   node scripts/test-gemini-api-direct.js
   node scripts/check-edge-function-secrets.js
   node scripts/verify-ai-generation-fix.js
   ```

3. **Review documentation:**
   - `docs/lesson-generation-fallback-diagnosis.md`
   - `QUICK-FIX-LESSON-GENERATION.md`

4. **Check API status:**
   - Google AI Studio: https://aistudio.google.com/
   - Verify API key is active
   - Check usage quotas

---

## 🔐 Security Note

The `GEMINI_API_KEY` is sensitive. Make sure:
- ✅ It's stored in Supabase Secrets (encrypted)
- ✅ It's in `.env.local` (not committed to git)
- ❌ Never commit it to version control
- ❌ Never share it publicly

---

## ✨ Additional Improvements

After fixing the main issue, consider:

1. **Monitor API Usage**
   - Track Gemini API calls
   - Set up usage alerts
   - Monitor costs

2. **Optimize Rate Limiting**
   - Current: 12 requests/minute
   - Adjust based on your API quota

3. **Add Error Notifications**
   - Alert when fallback is used
   - Log AI generation failures
   - Track success rate

4. **Cache Generated Content**
   - Reduce API calls
   - Faster regeneration
   - Lower costs
