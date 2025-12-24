# Sub-Topic Completion Flow: Complete Analysis

## Overview
This document provides an in-depth explanation of how sub-topics are marked as "generated" or "complete" in the "Choose a Sub-Topic" dialog, and how this connects to the lesson history system.

---

## 1. The Complete Flow: From Generation to Completion

### Phase 1: Lesson Plan Generation
**Location**: `StudentProfileClient.tsx` → AI Lesson Architect Tab

1. **User Action**: Tutor clicks "Generate Ideas for Next Lesson"
2. **API Call**: `handleGenerateLessons()` calls the Edge Function `/functions/v1/generate-lesson-plan`
3. **Response**: Returns lesson plans with **sub-topics array**
4. **Storage**: Sub-topics are stored in the `lessons` table:
   ```typescript
   {
     id: 'lesson-uuid',
     student_id: 'student-uuid',
     tutor_id: 'tutor-uuid',
     generated_lessons: [...], // Array of lesson plan objects
     sub_topics: [              // Array of SubTopic objects
       {
         id: 'subtopic_1',
         title: 'Present Perfect vs. Past Perfect',
         category: 'Grammar',
         level: 'c1',
         description: '...'
       },
       // ... more sub-topics
     ],
     status: 'upcoming'
   }
   ```

### Phase 2: Sub-Topic Selection Dialog
**Location**: `SubTopicSelectionDialog.tsx`

When the tutor clicks "Choose Sub-topic & Create Material":

1. **Dialog Opens**: Displays all available sub-topics from `upcomingLesson.sub_topics`
2. **Completion Check**: For each sub-topic, the dialog checks:
   ```typescript
   const isCompleted = isSubTopicCompleted(subTopic.id);
   ```
3. **Visual Indication**:
   - **Not Completed**: Blue/purple gradient button "Create Interactive Material"
   - **Completed**: Green badge with checkmark + "Material Created" label
   - **Completed Button**: Green button "Recreate Material"

### Phase 3: Interactive Material Generation
**Location**: `StudentProfileClient.tsx` → `handleSelectSubTopic()`

When a sub-topic is selected:

1. **API Call**: Calls `/functions/v1/generate-interactive-material`
   ```typescript
   const requestBody = {
     lesson_id: upcomingLesson.id,
     selected_sub_topic: subTopic
   };
   ```

2. **Edge Function Processing**:
   - Matches sub-topic to appropriate lesson template
   - Generates interactive content (vocabulary, dialogues, exercises)
   - Returns structured lesson material

3. **Success Response**:
   ```typescript
   {
     success: true,
     interactive_content: { /* lesson materials */ },
     lesson_template_id: 'template-uuid',
     template_name: 'Grammar B2'
   }
   ```

### Phase 4: Marking Sub-Topic as Complete
**Location**: `StudentProfileClient.tsx` → After successful generation

This is the **critical moment** where completion is recorded:

```typescript
// Mark the sub-topic as completed with full context
await markSubTopicComplete(subTopic.id, subTopic, {
  lesson_id: upcomingLesson?.id,
  lesson_template_id: upcomingLesson?.lesson_template_id,
  interactive_content: result.interactive_content,
  lesson_materials: result.interactive_content
});
```

---

## 2. The Progress Tracking System

### ProgressContext Architecture
**Location**: `lib/progress-context.tsx`

The ProgressContext manages completion state across the entire application:

#### State Management
```typescript
interface ProgressContextType {
  completedSubTopics: string[];                    // Simple array of IDs
  completedSubTopicsWithTimestamps: CompletedSubTopic[];  // With timestamps
  markSubTopicComplete: (subTopicId, subTopicData, lessonSessionData) => Promise<void>;
  isSubTopicCompleted: (subTopicId: string) => boolean;
  getSubTopicCompletionDate: (subTopicId: string) => string | null;
  // ... other methods
}
```

#### The `markSubTopicComplete` Function

This is the **core function** that records completion:

```typescript
const markSubTopicComplete = async (
  subTopicId: string,      // e.g., 'subtopic_1'
  subTopicData?: any,      // Full sub-topic object
  lessonSessionData?: any  // Lesson context
) => {
  const completionTimestamp = new Date().toISOString();
  
  // 1. Update local state immediately (for responsive UI)
  setCompletedSubTopicsWithTimestamps(prev => [
    ...prev, 
    { id: subTopicId, completedAt: completionTimestamp }
  ]);
  
  // 2. Save to database
  if (currentStudentId && currentTutorId) {
    if (lessonSessionData && subTopicData) {
      // Create full lesson session record
      await lessonHistoryService.createLessonSession({
        student_id: currentStudentId,
        tutor_id: currentTutorId,
        sub_topic_id: subTopicId,
        sub_topic_data: subTopicData,
        lesson_id: lessonSessionData.lesson_id,
        lesson_template_id: lessonSessionData.lesson_template_id,
        interactive_content: lessonSessionData.interactive_content,
        lesson_materials: lessonSessionData.lesson_materials
      });
    } else {
      // Just mark progress
      await lessonHistoryService.markSubTopicComplete({
        student_id: currentStudentId,
        tutor_id: currentTutorId,
        sub_topic_id: subTopicId,
        sub_topic_title: subTopicData?.title,
        sub_topic_category: subTopicData?.category,
        sub_topic_level: subTopicData?.level
      });
    }
  }
  
  // 3. Fallback to localStorage if database fails
  // (for offline support)
};
```

---

## 3. Database Storage

### Two Tables Work Together

#### Table 1: `lesson_sessions`
**Purpose**: Complete record of each lesson session

```sql
CREATE TABLE lesson_sessions (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  tutor_id UUID NOT NULL,
  lesson_id UUID,              -- Links to original lesson
  lesson_template_id UUID,     -- Which template was used
  
  sub_topic_id TEXT NOT NULL,  -- The completed sub-topic ID
  sub_topic_data JSONB,        -- Full sub-topic details
  
  interactive_content JSONB,   -- Generated lesson materials
  lesson_materials JSONB,      -- Additional materials
  
  status TEXT DEFAULT 'completed',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```

**Example Record**:
```json
{
  "id": "session-uuid",
  "student_id": "student-uuid",
  "tutor_id": "tutor-uuid",
  "lesson_id": "lesson-uuid",
  "lesson_template_id": "grammar-b2-template",
  "sub_topic_id": "subtopic_1",
  "sub_topic_data": {
    "id": "subtopic_1",
    "title": "Present Perfect vs. Past Perfect",
    "category": "Grammar",
    "level": "c1",
    "description": "..."
  },
  "interactive_content": {
    "vocabulary": [...],
    "dialogues": [...],
    "exercises": [...]
  },
  "status": "completed",
  "completed_at": "2025-12-22T10:30:00Z"
}
```

#### Table 2: `student_progress`
**Purpose**: Quick lookup for completion status

```sql
CREATE TABLE student_progress (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  tutor_id UUID NOT NULL,
  
  sub_topic_id TEXT NOT NULL,     -- Unique per student
  sub_topic_title TEXT,
  sub_topic_category TEXT,
  sub_topic_level TEXT,
  
  completion_date TIMESTAMPTZ,
  lesson_session_id UUID,         -- Links to full session
  
  UNIQUE(student_id, sub_topic_id)  -- One record per sub-topic
);
```

**Example Record**:
```json
{
  "id": "progress-uuid",
  "student_id": "student-uuid",
  "tutor_id": "tutor-uuid",
  "sub_topic_id": "subtopic_1",
  "sub_topic_title": "Present Perfect vs. Past Perfect",
  "sub_topic_category": "Grammar",
  "sub_topic_level": "c1",
  "completion_date": "2025-12-22T10:30:00Z",
  "lesson_session_id": "session-uuid"
}
```

---

## 4. How Completion Status is Displayed

### In SubTopicSelectionDialog

```typescript
// For each sub-topic in the dialog:
const isCompleted = isSubTopicCompleted(subTopic.id);

// Visual rendering:
{isCompleted && (
  <Badge className="bg-green-100 text-green-800">
    <CheckCircle className="w-3 h-3 mr-1" />
    Material Created
  </Badge>
)}

// Button state:
<Button className={isCompleted ? 'bg-green-600' : 'bg-gradient-to-r from-cyan-400 to-purple-500'}>
  {isCompleted ? (
    <>
      <CheckCircle className="w-5 h-5 mr-2" />
      Recreate Material
    </>
  ) : (
    <>
      <Play className="w-5 h-5 mr-2" />
      Create Interactive Material
    </>
  )}
</Button>
```

### The `isSubTopicCompleted` Check

```typescript
// In ProgressContext:
const isSubTopicCompleted = (subTopicId: string) => {
  return completedSubTopics.includes(subTopicId);
};

// completedSubTopics is loaded from database on mount:
const { data: progress } = await supabase
  .from('student_progress')
  .select('*')
  .eq('student_id', studentId);

const completedSubTopics = progress.map(p => p.sub_topic_id);
```

---

## 5. Connection to Lesson History

### Loading Lesson History
**Location**: `StudentProfileClient.tsx` → Lesson History Tab

```typescript
const loadLessonHistory = async () => {
  // Primary method: Load from database
  const { sessions } = await lessonHistoryService.getLessonHistory(student.id);
  
  // Each session includes:
  // - completedSubTopic: The sub-topic that was completed
  // - interactive_lesson_content: The generated materials
  // - completedAt: When it was completed
  // - lesson_id: Link to original lesson (for sharing)
  
  setLessonHistory(sessions);
};
```

### Displaying History

```typescript
// In the Lesson History tab:
{lessonHistory.map(historyEntry => (
  <LessonHistoryCard
    key={historyEntry.id}
    lesson={historyEntry}
    onViewLesson={() => {
      // Load the completed lesson materials
      setSelectedHistoryLesson(historyEntry);
      setActiveTab("lesson-material");
    }}
    onShareLesson={() => {
      // Share using the lesson_id
      shareLesson(historyEntry.lesson_id);
    }}
  />
))}
```

### The Link: Sub-Topic ID

The **sub-topic ID** is the key that connects everything:

1. **Generation**: Sub-topic created with unique ID (`subtopic_1`)
2. **Selection**: User selects sub-topic by ID
3. **Completion**: ID stored in `student_progress` table
4. **Display**: Dialog checks if ID exists in completed list
5. **History**: Lesson sessions linked by sub-topic ID
6. **Sharing**: Lesson can be shared using the `lesson_id` from the session

---

## 6. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. LESSON PLAN GENERATION                                       │
│    ┌──────────────┐                                             │
│    │ Tutor clicks │ → Edge Function → Returns sub-topics        │
│    │  "Generate"  │                   with unique IDs           │
│    └──────────────┘                                             │
│                                                                  │
│    Stored in: lessons.sub_topics = [                            │
│      { id: 'subtopic_1', title: '...', category: '...' },      │
│      { id: 'subtopic_2', title: '...', category: '...' }       │
│    ]                                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. SUB-TOPIC SELECTION DIALOG                                   │
│    ┌──────────────────┐                                         │
│    │ Dialog opens     │ → Loads sub-topics from lesson          │
│    │ Shows sub-topics │ → Checks completion status              │
│    └──────────────────┘                                         │
│                                                                  │
│    For each sub-topic:                                          │
│    isCompleted = isSubTopicCompleted('subtopic_1')              │
│                                                                  │
│    Query: SELECT * FROM student_progress                        │
│           WHERE student_id = ? AND sub_topic_id = 'subtopic_1'  │
│                                                                  │
│    Result: ✅ Found → Show green badge "Material Created"       │
│            ❌ Not found → Show blue button "Create Material"    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. INTERACTIVE MATERIAL GENERATION                              │
│    ┌──────────────────┐                                         │
│    │ User selects     │ → Edge Function generates content       │
│    │ sub-topic        │                                         │
│    └──────────────────┘                                         │
│                                                                  │
│    Returns: {                                                   │
│      interactive_content: { vocabulary, dialogues, exercises }, │
│      lesson_template_id: 'grammar-b2'                           │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. MARK AS COMPLETE (THE CRITICAL STEP)                         │
│    ┌──────────────────────────────────────────────────────┐    │
│    │ markSubTopicComplete('subtopic_1', subTopicData, {   │    │
│    │   lesson_id: 'lesson-uuid',                          │    │
│    │   interactive_content: {...}                         │    │
│    │ })                                                   │    │
│    └──────────────────────────────────────────────────────┘    │
│                                                                  │
│    Writes to TWO tables:                                        │
│                                                                  │
│    A) lesson_sessions:                                          │
│       INSERT INTO lesson_sessions (                             │
│         student_id, tutor_id, lesson_id,                        │
│         sub_topic_id: 'subtopic_1',                             │
│         sub_topic_data: { full object },                        │
│         interactive_content: { generated materials },           │
│         completed_at: NOW()                                     │
│       )                                                         │
│                                                                  │
│    B) student_progress:                                         │
│       INSERT INTO student_progress (                            │
│         student_id, tutor_id,                                   │
│         sub_topic_id: 'subtopic_1',                             │
│         sub_topic_title: 'Present Perfect vs. Past Perfect',    │
│         completion_date: NOW(),                                 │
│         lesson_session_id: <session-uuid>                       │
│       )                                                         │
│       ON CONFLICT (student_id, sub_topic_id) DO UPDATE          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. COMPLETION STATUS UPDATE                                     │
│    ┌──────────────────────────────────────────────────────┐    │
│    │ ProgressContext updates local state:                 │    │
│    │ completedSubTopics = ['subtopic_1', ...]             │    │
│    └──────────────────────────────────────────────────────┘    │
│                                                                  │
│    Next time dialog opens:                                      │
│    isSubTopicCompleted('subtopic_1') → TRUE ✅                  │
│                                                                  │
│    Visual change:                                               │
│    - Green badge appears                                        │
│    - Button changes to "Recreate Material"                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. LESSON HISTORY DISPLAY                                       │
│    ┌──────────────────────────────────────────────────────┐    │
│    │ Query: SELECT * FROM lesson_sessions                 │    │
│    │        WHERE student_id = ?                          │    │
│    │        ORDER BY completed_at DESC                    │    │
│    └──────────────────────────────────────────────────────┘    │
│                                                                  │
│    Each history entry shows:                                    │
│    - Sub-topic title                                            │
│    - Completion date                                            │
│    - Category badge                                             │
│    - "View Lesson" button → Opens lesson materials              │
│    - "Share Lesson" button → Creates shareable link             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Key Insights

### Why Two Tables?

1. **`student_progress`**: Fast lookup for "is this completed?"
   - Unique constraint ensures one record per sub-topic
   - Optimized for quick checks in the dialog
   - Small, indexed table

2. **`lesson_sessions`**: Complete historical record
   - Stores all lesson materials
   - Allows multiple sessions for same sub-topic (if recreated)
   - Full context for sharing and review

### The Sub-Topic ID is Everything

The sub-topic ID (e.g., `subtopic_1`) is:
- Generated during lesson plan creation
- Used to check completion status
- Stored in progress tracking
- Links to lesson history
- Enables material recreation

### Completion is Immediate

When a sub-topic is marked complete:
1. **Local state updates** → UI shows green badge instantly
2. **Database writes** → Persisted for cross-device sync
3. **History appears** → Lesson History tab updates
4. **Dialog reflects** → Next time dialog opens, shows as complete

---

## 8. Common Scenarios

### Scenario 1: First Time Creating Material
```
1. Tutor generates lesson plans → 5 sub-topics created
2. Opens "Choose Sub-Topic" dialog → All show blue "Create Material"
3. Selects "Present Perfect" → Material generated
4. markSubTopicComplete() called → Database updated
5. Dialog closes, reopens → "Present Perfect" now shows green badge
6. Lesson History tab → New entry appears
```

### Scenario 2: Recreating Material
```
1. Tutor opens dialog → "Present Perfect" shows green badge
2. Clicks "Recreate Material" → New material generated
3. New lesson_session record created (old one preserved)
4. student_progress updated with new completion_date
5. Lesson History → Both sessions visible
```

### Scenario 3: Cross-Device Sync
```
1. Tutor completes lesson on Desktop → Saved to database
2. Opens app on Mobile → ProgressContext loads from database
3. completedSubTopics populated → Dialog shows correct status
4. No localStorage needed → Everything synced via Supabase
```

---

## 9. Summary

The "Choose a Sub-Topic" completion flow is a sophisticated system that:

1. **Generates** unique sub-topic IDs during lesson planning
2. **Tracks** completion in real-time using ProgressContext
3. **Persists** data in two database tables for different purposes
4. **Displays** visual indicators (green badges) for completed sub-topics
5. **Connects** to lesson history for review and sharing
6. **Syncs** across devices using Supabase

The key to understanding the system is recognizing that **the sub-topic ID is the thread** that connects lesson generation, completion tracking, visual display, and historical records. When you see a green badge in the dialog, it means that specific sub-topic ID exists in the `student_progress` table, which was written there when `markSubTopicComplete()` was called after successful interactive material generation.
