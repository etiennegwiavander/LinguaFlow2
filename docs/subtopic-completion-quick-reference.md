# Sub-Topic Completion: Quick Reference

## The 5-Step Journey

### Step 1: Generation
**File**: `StudentProfileClient.tsx`
```typescript
// Tutor clicks "Generate Ideas"
handleGenerateLessons() 
  → Edge Function: /generate-lesson-plan
  → Returns: { lessons: [...], sub_topics: [...] }
  → Stored in: lessons.sub_topics
```

### Step 2: Display
**File**: `SubTopicSelectionDialog.tsx`
```typescript
// Dialog opens, checks each sub-topic
{subTopics.map(subTopic => {
  const isCompleted = isSubTopicCompleted(subTopic.id);
  // ✅ Completed: Green badge + "Material Created"
  // ❌ Not completed: Blue button + "Create Material"
})}
```

### Step 3: Selection
**File**: `StudentProfileClient.tsx`
```typescript
// User selects a sub-topic
handleSelectSubTopic(subTopic)
  → Edge Function: /generate-interactive-material
  → Returns: { interactive_content: {...}, lesson_template_id: '...' }
```

### Step 4: Completion (THE KEY MOMENT)
**File**: `StudentProfileClient.tsx` → `lib/progress-context.tsx`
```typescript
// After successful generation
await markSubTopicComplete(subTopic.id, subTopic, {
  lesson_id: upcomingLesson.id,
  interactive_content: result.interactive_content
});

// This function:
// 1. Updates local state (immediate UI feedback)
// 2. Writes to lesson_sessions table (full record)
// 3. Writes to student_progress table (quick lookup)
```

### Step 5: History
**File**: `StudentProfileClient.tsx` → Lesson History Tab
```typescript
// Load completed lessons
const { sessions } = await lessonHistoryService.getLessonHistory(studentId);
// Each session includes the completed sub-topic and materials
```

---

## Database Tables

### `student_progress` (Quick Lookup)
```sql
-- Purpose: Fast "is this completed?" checks
-- Unique constraint: One record per student per sub-topic

{
  student_id: 'uuid',
  sub_topic_id: 'subtopic_1',  ← THE KEY
  completion_date: '2025-12-22T10:30:00Z',
  lesson_session_id: 'session-uuid'
}
```

### `lesson_sessions` (Full History)
```sql
-- Purpose: Complete lesson records with materials

{
  student_id: 'uuid',
  lesson_id: 'lesson-uuid',
  sub_topic_id: 'subtopic_1',  ← THE KEY
  sub_topic_data: { full object },
  interactive_content: { vocabulary, dialogues, exercises },
  completed_at: '2025-12-22T10:30:00Z'
}
```

---

## The Completion Check

### How "Material Created" Badge Appears

```typescript
// In SubTopicSelectionDialog.tsx:
const isCompleted = isSubTopicCompleted(subTopic.id);

// In ProgressContext:
const isSubTopicCompleted = (subTopicId: string) => {
  return completedSubTopics.includes(subTopicId);
  // completedSubTopics loaded from database:
  // SELECT sub_topic_id FROM student_progress WHERE student_id = ?
};

// Visual result:
if (isCompleted) {
  // ✅ Green badge: "Material Created"
  // ✅ Green button: "Recreate Material"
} else {
  // ❌ Blue button: "Create Interactive Material"
}
```

---

## Key Files

| File | Purpose |
|------|---------|
| `StudentProfileClient.tsx` | Main orchestrator - handles generation, selection, completion |
| `SubTopicSelectionDialog.tsx` | Displays sub-topics with completion status |
| `lib/progress-context.tsx` | Manages completion state across app |
| `lib/lesson-history-service.ts` | Database operations for sessions and progress |
| `supabase/migrations/20251219000001_*.sql` | Database schema |

---

## The Magic Variable: `sub_topic_id`

This single ID connects everything:

```
Lesson Generation → sub_topic_id: 'subtopic_1'
                           ↓
Selection Dialog → Check if 'subtopic_1' is completed
                           ↓
Material Generation → Create content for 'subtopic_1'
                           ↓
Mark Complete → INSERT INTO student_progress (sub_topic_id: 'subtopic_1')
                           ↓
Next Dialog Open → 'subtopic_1' found in database → Show green badge ✅
                           ↓
Lesson History → Display all sessions with 'subtopic_1'
```

---

## Visual States

### Before Completion
```
┌─────────────────────────────────────────┐
│ Present Perfect vs. Past Perfect        │
│ Category: Grammar | Level: C1           │
│                                         │
│ [Create Interactive Material] ← Blue   │
└─────────────────────────────────────────┘
```

### After Completion
```
┌─────────────────────────────────────────┐
│ Present Perfect vs. Past Perfect        │
│ Category: Grammar | Level: C1           │
│ ✅ Material Created ← Green badge       │
│                                         │
│ [Recreate Material] ← Green button      │
└─────────────────────────────────────────┘
```

---

## Troubleshooting

### Sub-topic not showing as complete?

Check these in order:

1. **Was `markSubTopicComplete()` called?**
   - Look for console log: `🎯 Marking sub-topic as complete`

2. **Is it in the database?**
   ```sql
   SELECT * FROM student_progress 
   WHERE sub_topic_id = 'subtopic_1' 
   AND student_id = 'your-student-id';
   ```

3. **Is ProgressContext loaded?**
   - Check: `completedSubTopics` array in React DevTools

4. **Is the student context set?**
   - Look for: `🎯 Setting student context` in console

### Sub-topic showing as complete but shouldn't be?

1. **Check for duplicate IDs**
   - Sub-topic IDs should be unique per lesson

2. **Check student_progress table**
   - May have old records from previous sessions

3. **Clear and refresh**
   ```typescript
   // In ProgressContext:
   resetProgress(); // Clears local state
   refreshProgress(); // Reloads from database
   ```

---

## Quick Facts

- ✅ Completion is **immediate** - UI updates instantly
- ✅ Data is **persisted** - survives page refresh
- ✅ Works **cross-device** - synced via Supabase
- ✅ Allows **recreation** - can generate material multiple times
- ✅ Full **history** - all sessions preserved
- ✅ **Shareable** - lessons can be shared via lesson_id
