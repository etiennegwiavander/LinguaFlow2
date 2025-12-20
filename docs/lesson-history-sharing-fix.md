# Lesson History Sharing Fix

## Problem Summary

When users generated a fresh lesson, the "Share with Student" flow worked perfectly. However, when loading the same or any other lesson from the Lesson History tab, the share flow failed with:

```
"Failed to create shareable link: Permission denied. Make sure you own this lesson."
```

## Root Cause Analysis

### Data Structure Mismatch

The issue stemmed from a fundamental difference in data structures between fresh lessons and history lessons:

**Fresh Lesson (from `lessons` table):**
```typescript
{
  id: 'lesson-uuid',           // ✅ This is the LESSON ID
  tutor_id: 'tutor-uuid',      // ✅ Has tutor_id at top level
  student_id: 'student-uuid',
  interactive_lesson_content: {...},
  ...
}
```

**History Lesson (from `lesson_sessions` table):**
```typescript
{
  id: 'session-uuid',          // ❌ This is the SESSION ID, not LESSON ID!
  lesson_id: 'lesson-uuid',    // ✅ Actual lesson ID is here
  tutor_id: 'tutor-uuid',      // ⚠️ Available but not passed through
  student_id: 'student-uuid',
  lesson: {                    // ⚠️ Nested lesson object
    id: 'lesson-uuid',
    date: '...',
    status: '...'
  },
  tutor: {                     // ⚠️ Nested tutor object
    id: 'tutor-uuid',
    name: '...'
  },
  interactive_content: {...},  // ⚠️ Different field name
  ...
}
```

### The Sharing Flow Failure

When attempting to share a history lesson:

1. **User clicks "Share with Student"** on a lesson loaded from history
2. **`handleShareLesson()` is called** with the lesson data
3. **Tries to insert into `shared_lessons` table:**
   ```typescript
   {
     lesson_id: lessonEntry.id,  // ❌ Using SESSION ID instead of LESSON ID!
     ...
   }
   ```
4. **RLS Policy checks:**
   ```sql
   CREATE POLICY "Tutors can create shared lessons for their lessons" 
   ON shared_lessons
   FOR INSERT WITH CHECK (
     EXISTS (
       SELECT 1 FROM lessons 
       WHERE lessons.id = lesson_id        -- ❌ No lesson with this SESSION ID
       AND lessons.tutor_id = auth.uid()   -- ❌ Fails ownership check
     )
   );
   ```
5. **Result:** Permission denied error

### Why Fresh Lessons Worked

Fresh lessons passed the correct `lesson.id` directly because:
- The lesson data came directly from the `lessons` table
- The `id` field was the actual lesson ID
- The `tutor_id` field was present at the top level
- RLS policy could verify ownership

## Solution Implemented

### 1. Enhanced Data Transformation

**File:** `lib/lesson-history-service.ts`

Added missing fields to the transformed lesson history data:

```typescript
const transformedSessions: LessonHistoryEntry[] = sessions?.map(session => ({
  id: session.id,
  lesson_id: session.lesson_id,  // ✅ Add actual lesson ID for sharing
  tutor_id: session.tutor_id,    // ✅ Add tutor ID for RLS validation
  student_id: session.student_id, // ✅ Add student ID for context
  completedAt: session.completed_at,
  completedSubTopic: session.sub_topic_data,
  interactive_lesson_content: session.interactive_content,
  lesson_template_id: session.lesson_template_id,
  student: session.students,
  tutor: session.tutors,
  lesson: session.lessons,
  duration_minutes: session.duration_minutes,
  status: session.status
})) || [];
```

### 2. Updated TypeScript Interface

**File:** `lib/lesson-history-service.ts`

```typescript
export interface LessonHistoryEntry {
  id: string;
  lesson_id?: string;  // Actual lesson ID for sharing
  tutor_id?: string;   // Tutor ID for RLS validation
  student_id?: string; // Student ID for context
  completedAt: string;
  completedSubTopic: any;
  interactive_lesson_content?: any;
  lesson_template_id?: string;
  student?: any;
  tutor?: any;
  lesson?: any;
  duration_minutes?: number;
  status: string;
}
```

### 3. Fixed API Route

**File:** `app/api/lesson-history/route.ts`

Applied the same transformation to ensure consistency:

```typescript
const transformedSessions = sessions?.map(session => ({
  id: session.id,
  lesson_id: session.lesson_id,  // ✅ Add actual lesson ID
  tutor_id: session.tutor_id,    // ✅ Add tutor ID
  student_id: session.student_id, // ✅ Add student ID
  // ... rest of fields
})) || [];
```

### 4. Updated History Lesson Loading

**File:** `components/students/StudentProfileClient.tsx`

Fixed the `onViewLesson` handler to use the correct lesson ID:

```typescript
onViewLesson={(lessonEntry) => {
  // Use the actual lesson ID, not the session ID
  const actualLessonId = lessonEntry.lesson_id || lessonEntry.lesson?.id || lessonEntry.id;
  
  setSelectedLessonId(actualLessonId);
  setSelectedHistoryLesson(lessonEntry);

  // Set persistent lesson data with correct IDs
  setPersistentLessonData({
    lessonId: actualLessonId,
    lessonData: {
      ...lessonEntry,
      id: actualLessonId,  // ✅ Ensure correct lesson ID
      tutor_id: lessonEntry.tutor_id || lessonEntry.tutor?.id,  // ✅ Add tutor_id
      student_id: lessonEntry.student_id || lessonEntry.student?.id,  // ✅ Add student_id
      selectedSubTopic: lessonEntry.completedSubTopic
    }
  });

  setActiveTab("lesson-material");
}}
```

## How the Fix Works

### Before (Broken Flow)

1. User loads lesson from history → receives session data with `id = session-uuid`
2. User clicks "Share with Student" → tries to share with `lesson_id = session-uuid`
3. RLS policy checks `lessons` table for `id = session-uuid` → **NOT FOUND**
4. Permission denied error

### After (Fixed Flow)

1. User loads lesson from history → receives session data with:
   - `id = session-uuid` (for reference)
   - `lesson_id = lesson-uuid` ✅ (actual lesson ID)
   - `tutor_id = tutor-uuid` ✅ (for RLS validation)
2. Component extracts actual lesson ID: `lessonEntry.lesson_id`
3. User clicks "Share with Student" → shares with `lesson_id = lesson-uuid` ✅
4. RLS policy checks `lessons` table for `id = lesson-uuid` → **FOUND**
5. RLS policy verifies `tutor_id = auth.uid()` → **VERIFIED**
6. Share link created successfully ✅

## Testing

### Diagnostic Script

Run the diagnostic script to verify the fix:

```bash
node scripts/diagnose-history-lesson-sharing.js
```

This script will:
1. Fetch a sample lesson session
2. Test sharing with session ID (should fail)
3. Test sharing with lesson ID (should succeed)
4. Show data structure comparison

### Manual Testing

1. **Generate a fresh lesson:**
   - Go to AI Lesson Architect
   - Generate lesson plans
   - Create interactive material
   - Click "Share with Student" → Should work ✅

2. **Load from history:**
   - Go to Lesson History tab
   - Click "View Lesson Material" on any completed lesson
   - Click "Share with Student" → Should now work ✅

3. **Verify shared link:**
   - Copy the generated link
   - Open in incognito/private window
   - Lesson should display correctly ✅

## Files Modified

1. `lib/lesson-history-service.ts` - Enhanced data transformation
2. `app/api/lesson-history/route.ts` - Updated API response
3. `components/students/StudentProfileClient.tsx` - Fixed lesson ID extraction
4. `scripts/diagnose-history-lesson-sharing.js` - Diagnostic tool (new)
5. `docs/lesson-history-sharing-fix.md` - This documentation (new)

## Database Schema Reference

### `lesson_sessions` Table
```sql
CREATE TABLE lesson_sessions (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  tutor_id UUID REFERENCES tutors(id),
  lesson_id UUID REFERENCES lessons(id),  -- ✅ Links to actual lesson
  lesson_template_id UUID,
  sub_topic_id TEXT,
  sub_topic_data JSONB,
  interactive_content JSONB,
  ...
);
```

### `shared_lessons` Table
```sql
CREATE TABLE shared_lessons (
  id UUID PRIMARY KEY,
  lesson_id UUID REFERENCES lessons(id),  -- ✅ Must be actual lesson ID
  student_name TEXT,
  lesson_title TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN,
  ...
);
```

### RLS Policy
```sql
CREATE POLICY "Tutors can create shared lessons for their lessons" 
ON shared_lessons
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM lessons 
    WHERE lessons.id = lesson_id           -- ✅ Checks actual lesson ID
    AND lessons.tutor_id = auth.uid()      -- ✅ Verifies ownership
  )
);
```

## Impact

### Before Fix
- ❌ Sharing history lessons: **BROKEN**
- ✅ Sharing fresh lessons: **WORKING**
- ⚠️ User confusion and frustration

### After Fix
- ✅ Sharing history lessons: **WORKING**
- ✅ Sharing fresh lessons: **WORKING**
- ✅ Consistent user experience

## Conclusion

The fix ensures that lesson sharing works consistently regardless of whether the lesson is freshly generated or loaded from history. By properly extracting and passing the actual lesson ID (not the session ID), the RLS policies can correctly verify ownership and allow the share operation to succeed.

The solution maintains backward compatibility while fixing the data structure mismatch that caused the permission denied error.
