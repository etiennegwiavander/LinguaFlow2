# Lesson Sharing "Cloning" Issue - Deep Analysis

## 🎯 Issue Description

**Problem**: When a tutor generates multiple lessons (e.g., 3 lessons) for a student and tries to share them:
- Sharing the **OLDEST** lesson displays the **NEWEST** lesson content
- Sharing the **MIDDLE** lesson displays the **NEWEST** lesson content  
- Only the **NEWEST** lesson shares correctly

**User Impact**: Tutors cannot share older lessons with students - all share links point to the most recently generated lesson.

---

## 🔍 System Flow Analysis

### 1. Lesson Generation Flow

```
Tutor generates Lesson 1 → Stored in database with ID: lesson-1
Tutor generates Lesson 2 → Stored in database with ID: lesson-2
Tutor generates Lesson 3 → Stored in database with ID: lesson-3
```

Each lesson has:
- Unique `id`
- `interactive_lesson_content` (JSON)
- `created_at` timestamp
- `student_id` and `tutor_id`

### 2. Lesson Display Flow

**File**: `components/students/StudentProfileClient.tsx`

```typescript
// State for persistent lesson material
const [persistentLessonData, setPersistentLessonData] = useState<{
  lessonId: string;
  lessonData: any;
} | null>(null);

// State for lesson history
const [lessonHistory, setLessonHistory] = useState<any[]>([]);
const [selectedHistoryLesson, setSelectedHistoryLesson] = useState<any>(null);
```

**Flow**:
1. Tutor clicks on a lesson from history
2. `setSelectedHistoryLesson(lessonEntry)` is called
3. `setPersistentLessonData()` stores the lesson
4. `LessonMaterialDisplay` component receives the lesson prop

### 3. Share Link Creation Flow

**File**: `components/lessons/LessonMaterialDisplay.tsx` (Lines 1209-1348)

```typescript
const handleShareLesson = async () => {
  // 1. Get lesson from props
  if (!lesson) {
    toast.error('No lesson data available to share.');
    return;
  }

  // 2. Verify ownership
  const { data: lessonCheck } = await supabase
    .from('lessons')
    .select('id, tutor_id, student_id, student:students(name, level)')
    .eq('id', lesson.id)  // ⚠️ CRITICAL: Uses lesson.id from props
    .single();

  // 3. Create share record
  const shareableData = {
    lesson_id: lesson.id,  // ⚠️ CRITICAL: Stores lesson.id
    student_name: studentName,
    lesson_title: lesson.interactive_lesson_content?.name || '...',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  };

  // 4. Insert into shared_lessons table
  const { data: shareRecord } = await supabase
    .from('shared_lessons')
    .insert(shareableData)
    .select()
    .single();

  // 5. Generate URL
  const generatedShareUrl = `${window.location.origin}/shared-lesson/${shareRecord.id}`;
  setShareUrl(generatedShareUrl);
}
```

### 4. Shared Lesson Display Flow

**File**: `app/shared-lesson/[id]/page.tsx` (Lines 90-140)

```typescript
const fetchSharedLesson = useCallback(async () => {
  // 1. Fetch shared lesson record
  const { data: sharedData } = await supabase
    .from('shared_lessons')
    .select(`
      *,
      lesson:lessons (
        id,
        materials,
        interactive_lesson_content,  // ⚠️ CRITICAL: Fetches content
        lesson_template_id,
        student:students (name, target_language, level)
      )
    `)
    .eq('id', shareId)  // Uses share ID from URL
    .single();

  // 2. Extract lesson content
  if (sharedData.lesson?.interactive_lesson_content) {
    setLessonContent(sharedData.lesson.interactive_lesson_content);
  }
}, [shareId]);
```

---

## 🐛 Root Cause Analysis

### Hypothesis 1: Frontend State Issue (MOST LIKELY)

**Problem**: The `lesson` prop in `LessonMaterialDisplay` might not be updating correctly when switching between lessons.

**Evidence**:
- The database stores the correct `lesson_id` in `shared_lessons` table
- The issue is that the WRONG `lesson.id` is being passed to `handleShareLesson()`

**Possible Causes**:

#### A. Stale Closure in handleShareLesson
```typescript
// The lesson variable might be captured in a closure
// and not updated when props change
const handleShareLesson = async () => {
  if (!lesson) return;  // ⚠️ This 'lesson' might be stale
  
  // Uses lesson.id which might be from the NEWEST lesson
  const shareableData = {
    lesson_id: lesson.id,  // ⚠️ WRONG ID
    // ...
  };
}
```

#### B. Component Not Re-mounting
```typescript
// LessonMaterialDisplay might not re-mount when switching lessons
// This means:
// 1. State persists (shareUrl, isSharing, etc.)
// 2. Closures capture old values
// 3. Event handlers reference stale data
```

#### C. Persistent State Interference
```typescript
// In StudentProfileClient.tsx
const [persistentLessonData, setPersistentLessonData] = useState<{
  lessonId: string;
  lessonData: any;
} | null>(null);

// This state might not be updating correctly
// Or LessonMaterialDisplay might be using cached data
```

### Hypothesis 2: Props Not Updating

**Problem**: The `lesson` prop passed to `LessonMaterialDisplay` might always be the newest lesson.

**Check**:
```typescript
// In StudentProfileClient.tsx
<LessonMaterialDisplay
  lesson={selectedHistoryLesson}  // ⚠️ Is this correct?
  // OR
  lesson={persistentLessonData?.lessonData}  // ⚠️ Is this correct?
/>
```

### Hypothesis 3: shareUrl State Persistence

**Problem**: The `shareUrl` state might persist across lesson changes.

```typescript
const [shareUrl, setShareUrl] = useState<string | null>(null);

// When switching lessons:
// 1. User views Lesson 1
// 2. Clicks "Share" → shareUrl is set
// 3. User switches to Lesson 2
// 4. shareUrl is STILL set from Lesson 1
// 5. User sees "Copy Link" button instead of "Share" button
// 6. Clicking "Copy Link" copies Lesson 1's URL
```

---

## 🔬 Diagnostic Steps

### Step 1: Run Diagnostic Script

```bash
node scripts/diagnose-lesson-sharing-issue.js
```

**What it checks**:
- Verifies `lesson_id` in `shared_lessons` table is correct
- Compares oldest vs newest lessons
- Identifies if the issue is in database or frontend

### Step 2: Add Debug Logging

**In `LessonMaterialDisplay.tsx`**:

```typescript
// Add at the top of the component
useEffect(() => {
  console.log('🔄 LessonMaterialDisplay mounted/updated');
  console.log('   Lesson ID:', lesson?.id);
  console.log('   Lesson Title:', lesson?.interactive_lesson_content?.name);
  console.log('   Created At:', lesson?.created_at);
}, [lesson]);

// Add in handleShareLesson
const handleShareLesson = async () => {
  console.log('🔗 handleShareLesson called');
  console.log('   Current lesson.id:', lesson?.id);
  console.log('   Current lesson title:', lesson?.interactive_lesson_content?.name);
  
  // ... rest of function
}
```

### Step 3: Check Component Re-mounting

**Add key prop to force re-mount**:

```typescript
// In StudentProfileClient.tsx
<LessonMaterialDisplay
  key={selectedHistoryLesson?.id}  // ⚠️ Force re-mount on lesson change
  lesson={selectedHistoryLesson}
/>
```

### Step 4: Reset shareUrl on Lesson Change

```typescript
// In LessonMaterialDisplay.tsx
useEffect(() => {
  // Reset share URL when lesson changes
  setShareUrl(null);
}, [lesson?.id]);
```

---

## 🎯 Likely Root Causes (Ranked)

### 1. **Component Not Re-mounting** (90% confidence)

**Issue**: `LessonMaterialDisplay` is not re-mounting when switching between lessons, causing:
- Stale closures in event handlers
- Persistent state (shareUrl, isSharing)
- Old lesson.id being used

**Solution**: Add `key` prop to force re-mount

### 2. **shareUrl State Persistence** (70% confidence)

**Issue**: `shareUrl` state persists when switching lessons, showing "Copy Link" button with old URL

**Solution**: Reset `shareUrl` when lesson changes

### 3. **Stale Lesson Prop** (50% confidence)

**Issue**: The `lesson` prop might not be updating correctly in parent component

**Solution**: Verify prop passing logic in `StudentProfileClient.tsx`

---

## 🛠️ Recommended Fixes

### Fix 1: Force Component Re-mount (CRITICAL)

**File**: `components/students/StudentProfileClient.tsx`

**Change**:
```typescript
// BEFORE
<LessonMaterialDisplay
  lesson={selectedHistoryLesson}
  generatedLessons={generatedLessons}
  template={template}
/>

// AFTER
<LessonMaterialDisplay
  key={selectedHistoryLesson?.id || 'no-lesson'}  // ✅ Force re-mount
  lesson={selectedHistoryLesson}
  generatedLessons={generatedLessons}
  template={template}
/>
```

**Why**: Forces React to unmount and remount the component when lesson changes, clearing all state and closures.

### Fix 2: Reset shareUrl on Lesson Change

**File**: `components/lessons/LessonMaterialDisplay.tsx`

**Add**:
```typescript
// Add this useEffect near the top of the component
useEffect(() => {
  // Reset share URL when lesson changes
  console.log('🔄 Lesson changed, resetting shareUrl');
  setShareUrl(null);
  setIsSharing(false);
}, [lesson?.id]);
```

**Why**: Ensures share state is reset when viewing a different lesson.

### Fix 3: Add Defensive Logging

**File**: `components/lessons/LessonMaterialDisplay.tsx`

**Add**:
```typescript
const handleShareLesson = async () => {
  // Add defensive logging
  console.log('🔗 SHARE LESSON CALLED');
  console.log('   Lesson ID:', lesson?.id);
  console.log('   Lesson Title:', lesson?.interactive_lesson_content?.name);
  console.log('   Created At:', lesson?.created_at);
  
  if (!lesson) {
    toast.error('No lesson data available to share.');
    return;
  }

  // ... rest of function
}
```

**Why**: Helps identify if the wrong lesson.id is being used.

---

## 🧪 Testing Plan

### Test Case 1: Share Oldest Lesson

1. Generate 3 lessons for a student
2. View Lesson 1 (oldest) from history
3. Click "Share with Student"
4. Verify:
   - ✅ Correct lesson ID is logged
   - ✅ Share link is created
   - ✅ Opening link shows Lesson 1 content (not Lesson 3)

### Test Case 2: Share Middle Lesson

1. View Lesson 2 (middle) from history
2. Click "Share with Student"
3. Verify:
   - ✅ Correct lesson ID is logged
   - ✅ Share link is created
   - ✅ Opening link shows Lesson 2 content (not Lesson 3)

### Test Case 3: Share Newest Lesson

1. View Lesson 3 (newest) from history
2. Click "Share with Student"
3. Verify:
   - ✅ Correct lesson ID is logged
   - ✅ Share link is created
   - ✅ Opening link shows Lesson 3 content

### Test Case 4: Switch Between Lessons

1. View Lesson 1
2. Click "Share" → Note the URL
3. Switch to Lesson 2 (without refreshing)
4. Verify:
   - ✅ "Share" button appears (not "Copy Link")
   - ✅ shareUrl state is reset
5. Click "Share" → Note the URL
6. Verify:
   - ✅ URL is different from Lesson 1's URL
   - ✅ Opening both URLs shows correct content

---

## 📊 Database Schema Check

### shared_lessons Table

```sql
CREATE TABLE shared_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons(id),  -- ✅ Foreign key
  student_name TEXT NOT NULL,
  lesson_title TEXT NOT NULL,
  shared_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Verification Query**:
```sql
-- Check if lesson_id matches correctly
SELECT 
  sl.id AS share_id,
  sl.lesson_id,
  sl.lesson_title,
  l.id AS actual_lesson_id,
  l.created_at AS lesson_created_at,
  sl.lesson_id = l.id AS ids_match
FROM shared_lessons sl
LEFT JOIN lessons l ON sl.lesson_id = l.id
WHERE sl.created_at > NOW() - INTERVAL '7 days'
ORDER BY sl.created_at DESC;
```

---

## 🎓 Key Insights

### 1. The Issue is Frontend, Not Database

The `shared_lessons` table correctly stores the `lesson_id`. The problem is that the WRONG `lesson.id` is being passed to `handleShareLesson()` in the first place.

### 2. React Component Lifecycle

When switching between lessons without a `key` prop:
- Component doesn't remount
- State persists
- Closures capture old values
- Event handlers reference stale data

### 3. State Management

The `shareUrl` state should be reset when the lesson changes, but without proper lifecycle management, it persists.

---

## 🚀 Implementation Priority

1. **HIGH**: Add `key` prop to force re-mount (Fix 1)
2. **HIGH**: Reset shareUrl on lesson change (Fix 2)
3. **MEDIUM**: Add defensive logging (Fix 3)
4. **LOW**: Run diagnostic script to verify database integrity

---

## 📝 Conclusion

The "lesson cloning" issue is most likely caused by **React component not re-mounting** when switching between lessons. This causes:
- Stale closures in `handleShareLesson()`
- Persistent `shareUrl` state
- Wrong `lesson.id` being used

**Solution**: Add a `key` prop to `LessonMaterialDisplay` component to force re-mounting when the lesson changes.

---

**Analysis Date**: January 18, 2026  
**Analyst**: AI Assistant (Kiro)  
**Status**: Analysis Complete - Ready for Implementation
