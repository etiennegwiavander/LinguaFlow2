# Manual Testing Guide: Vocabulary 5-7 Words Enhancement

## Overview
This guide walks you through manually testing the vocabulary count enhancement to verify that lessons now generate 5-7 vocabulary words instead of 4.

---

## Prerequisites

✅ Edge Function code has been updated with 5-7 word requirement  
✅ You have access to the LinguaFlow application  
✅ You have a tutor account  
✅ You have at least one student profile  

---

## Testing Steps

### Step 1: Deploy the Updated Edge Function

```bash
# Deploy the function to Supabase
supabase functions deploy generate-interactive-material
```

**Expected output:**
```
Deploying function generate-interactive-material...
Function deployed successfully
```

### Step 2: Log In to the Application

1. Open your browser and navigate to your LinguaFlow instance
2. Log in with your tutor credentials
3. Navigate to the Dashboard

### Step 3: Select a Student

1. Click on "Students" in the sidebar
2. Select an existing student or create a new one
3. Click on the student's name to open their profile

### Step 4: Generate Lesson Plans

1. In the student profile, go to the "AI Lesson Architect" tab
2. Click "Generate Lesson Ideas" button
3. Wait for the AI to generate lesson plans (10-20 seconds)
4. You should see 3 lesson plan options with sub-topics

### Step 5: Create Interactive Material

1. Choose one of the generated lesson plans
2. Click "Use This Plan" button
3. A dialog will open showing available sub-topics
4. Select any sub-topic
5. Click "Create Interactive Material" button
6. Wait for generation to complete (15-30 seconds)

### Step 6: Verify Vocabulary Count

1. After generation completes, you'll be automatically switched to the "Lesson Material" tab
2. Scroll down to find the "Key Vocabulary" or vocabulary section
3. Count the number of vocabulary words displayed

**Expected Result:**
- ✅ You should see **5-7 vocabulary words** (not 4)
- ✅ Each word should have:
  - Word in target language
  - Definition
  - Part of speech (noun, verb, adjective, etc.)
  - 3-5 example sentences (depending on student level)

### Step 7: Test Multiple Scenarios

Repeat Steps 4-6 with:
- Different sub-topics
- Different lesson categories (Grammar, Conversation, Business English, etc.)
- Different student levels (A1, A2, B1, B2, C1, C2)

**Expected Results:**
- All lessons should have 5-7 vocabulary words
- Quality should remain high
- Examples should be contextually relevant

---

## Verification Checklist

Use this checklist to verify the enhancement:

### Vocabulary Count
- [ ] Lesson has at least 5 vocabulary words
- [ ] Lesson has at most 7 vocabulary words
- [ ] Average across multiple lessons is around 6 words

### Vocabulary Quality
- [ ] Each word has a clear definition
- [ ] Part of speech is accurate
- [ ] Example sentences are contextually relevant
- [ ] Examples relate to the lesson topic
- [ ] Examples are appropriate for student level

### Different Categories
- [ ] Grammar lessons: 5-7 words ✓
- [ ] Conversation lessons: 5-7 words ✓
- [ ] Business English lessons: 5-7 words ✓
- [ ] Vocabulary lessons: 5-7 words ✓
- [ ] Pronunciation lessons: 5-7 words ✓

### Different Levels
- [ ] A1 lessons: 5-7 words with 5 examples each ✓
- [ ] A2 lessons: 5-7 words with 5 examples each ✓
- [ ] B1 lessons: 5-7 words with 4 examples each ✓
- [ ] B2 lessons: 5-7 words with 4 examples each ✓
- [ ] C1 lessons: 5-7 words with 3 examples each ✓
- [ ] C2 lessons: 5-7 words with 3 examples each ✓

---

## Example: What to Look For

### ✅ CORRECT (5-7 words)

```
Key Vocabulary

1. accomplish (verb)
   Definition: To successfully complete or achieve something
   Examples:
   - I have accomplished all my goals this year.
   - She accomplished the task in record time.
   - They accomplished great things together.

2. achievement (noun)
   Definition: Something successfully completed
   Examples:
   - Graduating was her greatest achievement.
   - The team celebrated their achievement.
   - His achievements are impressive.

3. successful (adjective)
   Definition: Having achieved desired aims
   Examples:
   - She is a successful entrepreneur.
   - The project was very successful.
   - They had a successful meeting.

4. progress (noun)
   Definition: Forward movement toward a goal
   Examples:
   - We have made good progress this week.
   - The student's progress is excellent.
   - They track their progress daily.

5. improve (verb)
   Definition: To make or become better
   Examples:
   - I want to improve my English skills.
   - She has improved significantly.
   - They are working to improve the system.

6. dedication (noun)
   Definition: Commitment to a task or purpose
   Examples:
   - Her dedication to learning is admirable.
   - Success requires dedication and hard work.
   - They showed great dedication to the project.
```

**Count: 6 words ✅**

### ❌ INCORRECT (Only 4 words)

```
Key Vocabulary

1. accomplish (verb)
   ...

2. achievement (noun)
   ...

3. successful (adjective)
   ...

4. progress (noun)
   ...
```

**Count: 4 words ❌ (Too few - should be 5-7)**

---

## Troubleshooting

### Issue: Still seeing only 4 words

**Possible Causes:**
1. Edge Function not deployed
2. Using cached/old lesson
3. Browser cache

**Solutions:**
1. Redeploy Edge Function:
   ```bash
   supabase functions deploy generate-interactive-material
   ```

2. Create a NEW lesson (don't reuse old ones)

3. Clear browser cache and refresh

4. Check Edge Function logs:
   ```bash
   supabase functions logs generate-interactive-material --tail
   ```

### Issue: Getting more than 7 words

**Possible Cause:** AI not following instructions

**Solution:**
- This is rare but acceptable if quality is good
- If consistent, may need to adjust AI temperature or prompt

### Issue: Vocabulary quality is poor

**Possible Causes:**
- AI model issue
- Prompt not clear enough

**Solutions:**
- Regenerate the lesson
- Check Edge Function logs for errors
- Verify student profile has complete information

---

## Reporting Results

After testing, please document:

1. **Number of lessons tested:** _____
2. **Vocabulary count range:** _____ to _____ words
3. **Average vocabulary count:** _____ words
4. **Lessons with 5-7 words:** _____% 
5. **Quality assessment:** ⭐⭐⭐⭐⭐ (1-5 stars)
6. **Issues encountered:** _____________________
7. **Overall result:** ✅ PASS / ❌ FAIL

---

## Success Criteria

The enhancement is successful if:

- ✅ 95%+ of lessons have 5-7 vocabulary words
- ✅ Average count is 6 words
- ✅ No lessons have fewer than 5 words
- ✅ Vocabulary quality remains high
- ✅ Generation time is acceptable (<35 seconds)
- ✅ No errors during generation

---

## Next Steps

After successful testing:

1. ✅ Mark enhancement as verified
2. ✅ Update documentation
3. ✅ Notify users of improvement
4. ✅ Monitor production usage
5. ✅ Collect user feedback

---

## Support

If you encounter issues:

1. Check Edge Function logs
2. Verify deployment status
3. Review error messages
4. Test with different students/levels
5. Contact development team if issues persist

---

**Happy Testing!** 🎉
