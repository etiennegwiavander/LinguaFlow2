# Fix Generic Questions - Step-by-Step Guide

## 🎯 Problem Summary

You're seeing **generic questions** like "What do you think about..." instead of **contextual, personalized questions** because:

1. **Old questions are stored in the database** from before the AI improvements
2. **Cache clearing only runs once** per browser (flag prevents re-running)
3. **Generic detection threshold is too lenient** (30% allows many generic questions through)
4. **Custom topics use database** while predefined topics always generate fresh

---

## 🔍 Step 1: Diagnose the Problem

Run the diagnostic script to see what's in your database:

```bash
node scripts/diagnose-discussion-questions.js
```

This will show you:
- How many generic questions exist
- Which topics are affected
- Sample generic questions
- Recommendations

**Expected Output:**
```
📊 Total Questions: 150
Generic Questions: 75 / 150 (50.0%)

❌ Food & Cooking
   Type: Predefined
   Generic: 12/15 (80.0%)
   Age: 1/15/2025 - 1/20/2025
```

---

## 🧹 Step 2: Clear Generic Questions

### Option A: Clear Only Generic Questions (Recommended)

```bash
node scripts/clear-generic-questions.js
```

This will:
- Identify questions matching generic patterns
- Show you samples before deleting
- Ask for confirmation
- Delete only the generic questions

### Option B: Clear ALL Questions (Nuclear Option)

```bash
node scripts/clear-generic-questions.js --all
```

⚠️ **Warning**: This deletes EVERYTHING. Use only if you want a complete fresh start.

---

## 🔧 Step 3: Clear Browser Cache

After clearing database questions, you need to clear the browser cache flag.

### Method 1: Browser Console (Easiest)

1. Open the student profile page
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab
4. Paste and run:

```javascript
// Clear all discussion-related cache
Object.keys(localStorage).forEach(key => {
  if (key.includes('linguaflow') || 
      key.includes('discussion') || 
      key.includes('questions') || 
      key.includes('topics') || 
      key.includes('cache')) {
    console.log('Clearing:', key);
    localStorage.removeItem(key);
  }
});

// Clear the upgrade flag to force re-clearing
localStorage.removeItem('linguaflow_questions_upgraded_v8_manual_clear');

console.log('✅ Cache cleared! Reload the page.');
```

4. Reload the page (`Ctrl+R` or `Cmd+R`)

### Method 2: Manual Clearing

1. Open Developer Tools (`F12`)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Find **Local Storage** → Your domain
4. Delete the key: `linguaflow_questions_upgraded_v8_manual_clear`
5. Reload the page

---

## ✅ Step 4: Test the Fix

1. Go to a student profile page
2. Click on the **Discussion Topics** tab
3. Select any topic (predefined or custom)
4. Wait for questions to generate (30-45 seconds)
5. Verify questions are **contextual and personalized**

**Good Questions Look Like:**
```
✅ "What's the worst cooking disaster you've ever had, John?"
✅ "If you could smell one food cooking right now, what would instantly make you hungry?"
✅ "Which dish from your childhood could your mother make that no restaurant has ever matched?"
```

**Bad Questions Look Like:**
```
❌ "What do you think about food and cooking?"
❌ "How is cooking different in your country?"
❌ "Share your personal experience with food."
```

---

## 🔄 Step 5: Verify All Topics

Test multiple topics to ensure they all generate fresh questions:

1. **Predefined Topics** (should always work):
   - Food & Cooking
   - Travel & Tourism
   - Technology & Innovation
   - Work & Career
   - Hobbies & Interests

2. **Custom Topics** (if you have any):
   - Click on each custom topic
   - Verify fresh generation

---

## 🛠️ Optional: Permanent Fixes

### Fix 1: Always Generate Fresh Questions

Edit `components/students/DiscussionTopicsTab.tsx` around line 220:

```typescript
// Add this constant at the top of the component
const ALWAYS_GENERATE_FRESH = true; // Set to true for always fresh

// Then in handleTopicSelect, modify the logic:
if (ALWAYS_GENERATE_FRESH || !questionsInfo?.exists) {
  // Always generate fresh questions
  const newQuestions = await generateQuestionsForTopic(topic);
  // ... rest of the code
}
```

### Fix 2: Stricter Generic Detection

Edit `components/students/DiscussionTopicsTab.tsx` around line 465:

```typescript
// Change from 30% to 20% threshold
return genericCount > questions.length * 0.2; // More strict
```

### Fix 3: Add Regenerate Button

Add a button in the flashcard interface to manually regenerate:

```typescript
// In components/students/FlashcardInterface.tsx
<Button 
  onClick={handleRegenerateQuestions}
  variant="outline"
  className="flex items-center gap-2"
>
  <RefreshCw className="h-4 w-4" />
  Generate New Questions
</Button>
```

---

## 📊 Monitoring

After the fix, monitor question quality:

1. **Check Database Regularly**:
   ```bash
   node scripts/diagnose-discussion-questions.js
   ```

2. **User Feedback**: Ask users if questions feel personalized

3. **Analytics**: Track which questions get skipped vs engaged with

---

## 🚨 Troubleshooting

### Problem: Still seeing generic questions after clearing

**Solution**: 
1. Verify database is actually cleared:
   ```bash
   node scripts/diagnose-discussion-questions.js
   ```
2. Clear browser cache completely (not just localStorage)
3. Try incognito/private browsing mode

### Problem: Questions not generating at all

**Solution**:
1. Check Supabase Edge Function is deployed
2. Verify `GEMINI_API_KEY` is set in Supabase secrets
3. Check browser console for errors
4. Verify network requests in DevTools

### Problem: Gemini API errors

**Solution**:
1. Check API key is valid
2. Verify API quota hasn't been exceeded
3. Check Gemini API status page
4. System will fall back to emergency questions if API fails

---

## 📈 Expected Results

After following this guide:

- ✅ **0% generic questions** in database
- ✅ **Fresh AI generation** for all topics
- ✅ **Contextual questions** personalized to student
- ✅ **Varied question structures** (no repetitive patterns)
- ✅ **Topic-specific prompts** (Food questions about cooking disasters, Travel questions about mishaps, etc.)

---

## 💡 Key Insights

1. **Predefined topics always work correctly** - they skip database and always generate fresh
2. **Custom topics are the problem** - they check database first
3. **The AI generation is excellent** - the issue is persistence, not generation
4. **Cache clearing is one-time** - the flag prevents re-running
5. **Generic detection is too lenient** - 30% threshold allows many through

---

## 🎓 Understanding the Flow

```
User Clicks Topic
       ↓
Is it predefined? → YES → Generate fresh (ALWAYS WORKS ✅)
       ↓
       NO (Custom Topic)
       ↓
Check database for existing questions
       ↓
Questions exist? → YES → Check if generic
       ↓                      ↓
       NO                  Generic? → YES → Regenerate
       ↓                      ↓
Generate fresh            NO → Use existing (PROBLEM ❌)
```

The issue is in the "Use existing" path - old questions that don't match generic patterns exactly are reused.

---

## 📞 Need Help?

If you're still experiencing issues after following this guide:

1. Run the diagnostic script and share the output
2. Check browser console for errors
3. Verify Supabase Edge Function logs
4. Test with a fresh browser profile (no cache)

---

## ✨ Success Criteria

You'll know it's working when:

1. Every topic generates questions in 30-45 seconds
2. Questions are unique and contextual
3. Student's name appears naturally in questions
4. Questions explore specific scenarios, not abstract concepts
5. No repetitive "Tell me about..." or "What do you think..." patterns
6. Questions feel like they come from different conversations

**Example of Success:**
```
Topic: Food & Cooking
Student: Maria (B1 level Spanish)

Generated Questions:
1. "Maria, what's the most embarrassing thing that happened to you in a restaurant?"
2. "If you could only eat one dish for the rest of your life, which would you choose and why?"
3. "Have you ever tried to cook something from a different country? How did it turn out?"
4. "What smell from your childhood kitchen instantly makes you feel at home?"
5. "Which cooking skill do you wish you had learned from your grandmother?"
```

These are **contextual, specific, and personalized** - exactly what the system should produce!
