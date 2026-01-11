# Pronunciation Examples Fix - Deployment Checklist

## Pre-Deployment ✅

- [x] Code change implemented
- [x] Safety analysis completed
- [x] No breaking changes identified
- [x] Scoped to Pronunciation templates only
- [x] Documentation created
- [x] Test script created
- [x] Deployment script created
- [x] Rollback plan documented

## Deployment Steps

### Step 1: Deploy to Supabase
```powershell
.\scripts\deploy-pronunciation-examples-fix.ps1
```

**Expected Output:**
- ✅ Supabase CLI found
- ✅ Authentication verified
- ✅ Function deployed successfully

**If Deployment Fails:**
- Check Supabase CLI is installed: `supabase --version`
- Verify logged in: `supabase login`
- Check project is linked: `supabase link`

---

### Step 2: Test with Script
```bash
node scripts/test-pronunciation-examples-fix.js
```

**Expected Output:**
- ✅ Test student found
- ✅ Pronunciation lesson found
- ✅ Vocabulary sections analyzed
- ✅ 100% success rate for examples

**If Test Fails:**
- Generate a NEW Pronunciation lesson (old lessons won't have the fix)
- Verify the lesson was generated AFTER deployment
- Check Edge Function logs for errors

---

### Step 3: Manual Verification

1. **Generate New Lesson**
   - Go to student profile in the app
   - Create a new lesson
   - Select Pronunciation template (A2, B1, or B2)
   - Generate the lesson

2. **Check Vocabulary Sections**
   - Open the generated lesson
   - Find vocabulary sections
   - Verify each word has exactly 3 examples
   - Confirm examples use the actual word

3. **Quality Check**
   - [ ] Examples are contextual (use the actual word)
   - [ ] Examples show varied sentence structures
   - [ ] Examples are level-appropriate
   - [ ] No generic "The [word] is an important concept..." sentences

---

### Step 4: Regression Testing

Test other lesson types to ensure no breaking changes:

1. **Grammar Lesson**
   - [ ] Generate a Grammar lesson (any level)
   - [ ] Verify it generates successfully
   - [ ] Check vocabulary sections work correctly

2. **Conversation Lesson**
   - [ ] Generate a Conversation lesson (any level)
   - [ ] Verify it generates successfully
   - [ ] Check all sections render properly

3. **Business English Lesson**
   - [ ] Generate a Business English lesson (any level)
   - [ ] Verify it generates successfully
   - [ ] Check vocabulary sections work correctly

---

### Step 5: Monitor Production

```bash
# Watch Edge Function logs
supabase functions logs generate-interactive-material --tail

# Look for:
# ✅ Successful lesson generations
# ✅ No parsing errors
# ✅ No timeout errors
# ❌ Any error messages
```

**Monitor for 24 hours:**
- [ ] No increase in error rate
- [ ] No user complaints
- [ ] Lesson generation time unchanged
- [ ] All lesson types working

---

## Success Criteria

### Immediate (After Deployment)
- [ ] Deployment completed without errors
- [ ] Test script shows 100% success rate
- [ ] Manual verification passes all checks
- [ ] No errors in Edge Function logs

### Short-term (24 hours)
- [ ] At least 5 new Pronunciation lessons generated successfully
- [ ] All vocabulary words have exactly 3 examples
- [ ] No increase in error rate
- [ ] Other lesson types unaffected

### Long-term (1 week)
- [ ] Consistent quality across all Pronunciation lessons
- [ ] No user complaints about vocabulary examples
- [ ] Tutors report improved lesson quality
- [ ] No performance degradation

---

## Rollback Triggers

Rollback immediately if:
- ❌ Deployment fails repeatedly
- ❌ Edge Function errors increase significantly
- ❌ Pronunciation lessons fail to generate
- ❌ Other lesson types break
- ❌ Examples are still generic/incorrect

---

## Rollback Procedure

```bash
# Option 1: Git revert
git revert <commit-hash>
supabase functions deploy generate-interactive-material

# Option 2: Manual revert
# 1. Restore lines 340-360 in generate-interactive-material/index.ts
# 2. Deploy: supabase functions deploy generate-interactive-material
```

---

## Post-Deployment

### Documentation Updates
- [ ] Update main README if needed
- [ ] Mark this issue as resolved
- [ ] Archive deployment checklist
- [ ] Update changelog

### Communication
- [ ] Notify team of successful deployment
- [ ] Share test results
- [ ] Document any issues encountered
- [ ] Celebrate the fix! 🎉

---

## Contact

If issues arise:
1. Check Edge Function logs first
2. Review this checklist
3. Consult the rollback procedure
4. Test with a fresh lesson generation

---

## Notes

- This fix only affects NEW lessons generated AFTER deployment
- Old lessons will still have the old examples
- The fix is scoped to Pronunciation templates only
- No database migrations required
- No frontend changes required

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**Verification Completed**: _____________  
**Status**: _____________
