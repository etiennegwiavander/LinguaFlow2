# Lesson Regeneration Duplication Fix

## Problem Summary

When regenerating interactive lesson material (clicking "Recreate Material"), the system was creating **duplicate lesson sessions** instead of updating the existing one. This caused completion status to disappear after page refresh.

### Symptoms
1. ✅ Completion highlights show correctly immediately after generation
2. ❌ After page refresh, completion highlights disappear
3. 🔄 Each regeneration creates a new lesson_session with a new sub_topic_id
4. 📊 Old completion records remain tied to old sub_topic_ids that no longer exist in UI

## Root Cause

### The Flow (Before Fix)

```
User clicks "Recreate Material" for a sub-topic
  ↓
handleSelectSubTopic() in StudentProfileClient.tsx
  ↓
Calls generate-interactive-material Edge Function
  ↓
Returns NEW sub_topic_id with NEW timestamp
  (e.g., "lesson123_subtopic1_1735123456789")
  ↓
markSubTopicComplete() → createLessonSession()
  ↓
ALWAYS creates NEW lesson_session in database
  ↓
Creates NEW student_progress record with NEW sub_topic_id
  ↓
OLD lesson_session and OLD progress record remain in database
  ↓
UI shows completion (in memory state)
  ↓
Page refresh → loads from database
  ↓
UI loads NEW sub_topic_id from latest lesson_session
  ↓
Completion check looks for NEW sub_topic_id in student_progress
  ↓
❌ NOT FOUND (completion is tied to OLD sub_topic_id)
```

### Database State After Multiple Regenerations

**lesson_sessions table:**
```
id  | student_id | sub_topic_id                        | sub_topic_data.title        | created_at
----|------------|-------------------------------------|----------------------------|------------
1   | abc123     | lesson1_subtopic1_1735100000000    | "Navigating Transportation" | 2024-12-25 10:00
2   | abc123     | lesson1_subtopic1_1735110000000    | "Navigating Transportation" | 2024-12-25 11:00  ← Regeneration 1
3   | abc123     | lesson1_subtopic1_1735120000000    | "Navigating Transportation" | 2024-12-25 12:00  ← Regeneration 2
```

**student_progress table:**
```
id  | student_id | sub_topic_id                        | completion_date
----|------------|-------------------------------------|----------------
1   | abc123     | lesson1_subtopic1_1735100000000    | 2024-12-25 10:00
2   | abc123     | lesson1_subtopic1_1735110000000    | 2024-12-25 11:00
3   | abc123     | lesson1_subtopic1_1735120000000    | 2024-12-25 12:00
```

**Problem:** UI loads sub_topic_id from session #3, but completion check fails because it's looking for a different ID each time.

## Solution

### Modified `createLessonSession()` in `lib/lesson-history-service.ts`

The fix implements **UPDATE instead of INSERT** when regenerating:

```typescript
async createLessonSession(sessionData) {
  // 1. Check if we're regenerating by looking for existing session
  //    with same student + sub-topic title
  const existingSession = await findExistingSession(
    sessionData.student_id,
    sessionData.lesson_id,
    sessionData.sub_topic_data.title
  );

  if (existingSession) {
    // 2. UPDATE existing session with new data
    await updateSession(existingSession.id, {
      sub_topic_id: sessionData.sub_topic_id,  // New ID with new timestamp
      interactive_content: sessionData.interactive_content,
      // ... other fields
    });

    // 3. UPDATE progress record to use new sub_topic_id
    await updateSubTopicProgress({
      old_sub_topic_id: existingSession.sub_topic_id,
      new_sub_topic_id: sessionData.sub_topic_id
    });

    return existingSession.id;  // Return SAME session ID
  }

  // 4. If no existing session, create new one (first time)
  return await createNewSession(sessionData);
}
```

### New Helper Method

```typescript
private async updateSubTopicProgress(progressData: {
  student_id: string;
  old_sub_topic_id: string;
  new_sub_topic_id: string;
  // ...
}): Promise<void> {
  // Update the existing progress record with new sub_topic_id
  await supabase
    .from('student_progress')
    .update({
      sub_topic_id: progressData.new_sub_topic_id,
      completion_date: new Date().toISOString()
    })
    .eq('student_id', progressData.student_id)
    .eq('sub_topic_id', progressData.old_sub_topic_id);
}
```

## How It Works Now

### The Flow (After Fix)

```
User clicks "Recreate Material" for a sub-topic
  ↓
handleSelectSubTopic() in StudentProfileClient.tsx
  ↓
Calls generate-interactive-material Edge Function
  ↓
Returns NEW sub_topic_id with NEW timestamp
  ↓
markSubTopicComplete() → createLessonSession()
  ↓
🔍 Checks for existing session with same sub-topic title
  ↓
✅ FOUND existing session
  ↓
🔄 UPDATES existing lesson_session with new sub_topic_id
  ↓
🔄 UPDATES existing student_progress with new sub_topic_id
  ↓
✅ Returns SAME session ID (no duplicate created)
  ↓
UI shows completion (in memory state)
  ↓
Page refresh → loads from database
  ↓
UI loads NEW sub_topic_id from UPDATED lesson_session
  ↓
Completion check looks for NEW sub_topic_id in student_progress
  ↓
✅ FOUND (progress record was updated to new sub_topic_id)
```

### Database State After Multiple Regenerations (Fixed)

**lesson_sessions table:**
```
id  | student_id | sub_topic_id                        | sub_topic_data.title        | created_at          | updated_at
----|------------|-------------------------------------|----------------------------|---------------------|--------------------
1   | abc123     | lesson1_subtopic1_1735120000000    | "Navigating Transportation" | 2024-12-25 10:00   | 2024-12-25 12:00
```
☝️ **Only ONE session** - gets updated on each regeneration

**student_progress table:**
```
id  | student_id | sub_topic_id                        | completion_date         | updated_at
----|------------|-------------------------------------|------------------------|--------------------
1   | abc123     | lesson1_subtopic1_1735120000000    | 2024-12-25 12:00       | 2024-12-25 12:00
```
☝️ **Only ONE progress record** - gets updated with new sub_topic_id

## Benefits

1. ✅ **No more duplicates** - One lesson session per sub-topic
2. ✅ **Completion persists** - Progress record stays in sync with current sub_topic_id
3. ✅ **History preserved** - Updated timestamps show when regeneration occurred
4. ✅ **Database cleaner** - No orphaned records accumulating over time

## Testing

### Diagnostic Script

Run to check for existing duplicates:
```bash
node scripts/diagnose-regeneration-duplication.js
```

### Manual Test

1. Generate interactive material for a sub-topic
2. Verify completion highlight appears
3. Click "Recreate Material" for the same sub-topic
4. Verify completion highlight still shows
5. Refresh the page
6. ✅ Completion highlight should STILL be visible

### Database Verification

```sql
-- Check for duplicate sessions (should be 0 after fix)
SELECT 
  student_id,
  sub_topic_data->>'title' as title,
  COUNT(*) as session_count
FROM lesson_sessions
GROUP BY student_id, sub_topic_data->>'title'
HAVING COUNT(*) > 1;

-- Check progress records match current sessions
SELECT 
  ls.id as session_id,
  ls.sub_topic_id as session_subtopic_id,
  sp.sub_topic_id as progress_subtopic_id,
  CASE 
    WHEN ls.sub_topic_id = sp.sub_topic_id THEN '✅ Match'
    ELSE '❌ Mismatch'
  END as status
FROM lesson_sessions ls
LEFT JOIN student_progress sp 
  ON sp.student_id = ls.student_id 
  AND sp.sub_topic_id = ls.sub_topic_id;
```

## Files Modified

- `lib/lesson-history-service.ts` - Added update logic to `createLessonSession()`
- `scripts/diagnose-regeneration-duplication.js` - Diagnostic tool

## Related Issues

- Original issue: Sub-topic completion persistence
- Phase 1 fix: Added lesson ID prefix to sub_topic_ids
- Phase 2 fix: Added timestamp to prevent collisions
- **Phase 3 fix (this):** Update instead of insert on regeneration

## Migration

No database migration needed - the fix handles both old and new data formats automatically.

Existing duplicate sessions will remain in the database but won't cause issues. They can be cleaned up with:

```sql
-- Clean up old duplicate sessions (keep only the most recent)
DELETE FROM lesson_sessions
WHERE id NOT IN (
  SELECT DISTINCT ON (student_id, sub_topic_data->>'title')
    id
  FROM lesson_sessions
  ORDER BY student_id, sub_topic_data->>'title', created_at DESC
);
```

## Conclusion

This fix ensures that regenerating lesson material updates the existing session rather than creating duplicates, keeping completion status in sync across page refreshes.
