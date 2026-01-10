# Interactive Material Generation - Complete Visual Flow

**Last Updated**: January 6, 2026  
**Purpose**: Visual guide to understand the complete flow from button click to lesson display

---

## 🎯 Quick Overview

```
User clicks button → Selects subtopic → AI generates content → Lesson displays
Total time: 15-30 seconds
```

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PHASE 1: USER INTERACTION                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    User clicks "Use This Plan" button
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  Validation Checks        │
                    │  • Lesson exists?         │
                    │  • Sub-topics available?  │
                    └───────────────────────────┘
                                    │
                            ✅ Valid │ ❌ Invalid → Show error toast
                                    ▼
                    ┌───────────────────────────┐
                    │  SubTopicSelectionDialog  │
                    │  Opens                    │
                    └───────────────────────────┘
                                    │
                    Displays all available sub-topics
                    with intelligent category matching
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│                      PHASE 2: SUBTOPIC SELECTION                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    User reviews sub-topics:
                    • Title (editable)
                    • Category (auto-selected, editable)
                    • Level (A1-C2)
                    • Description
                    • Status badge
                                    │
                                    ▼
            User clicks "Create Interactive Material"
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  UI State Changes         │
                    │  • Progress bar appears   │
                    │  • Button disabled        │
                    │  • Dialog closes          │
                    │  • Loading messages start │
                    └───────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│                       PHASE 3: API REQUEST                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────────────────┐
                    │  Get User Session         │
                    │  (JWT Token)              │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  Construct Request        │
                    │  • lesson_id              │
                    │  • selected_sub_topic     │
                    └───────────────────────────┘
                                    │
                                    ▼
                    POST /functions/v1/generate-interactive-material
                    Headers: Authorization: Bearer {token}
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│                    PHASE 4: EDGE FUNCTION PROCESSING                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────────────────┐
                    │  1. Verify JWT Token      │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  2. Fetch Lesson Data     │
                    │  with Student Profile     │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  3. Fetch Active          │
                    │  Lesson Templates         │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  4. Select Template       │
                    │  Priority:                │
                    │  • Category + Level match │
                    │  • Category match         │
                    │  • Level match            │
                    │  • Fallback/Error         │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  5. Build AI Prompt       │
                    │  Including:               │
                    │  • Student profile        │
                    │  • Sub-topic details      │
                    │  • Template structure     │
                    │  • Personalization rules  │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  6. Call DeepSeek AI      │
                    │  via OpenRouter           │
                    │  Model: deepseek-chat     │
                    │  Temperature: 0.1         │
                    │  Max tokens: 4000         │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  7. Process AI Response   │
                    │  • Clean JSON             │
                    │  • Validate structure     │
                    │  • Fix common errors      │
                    │  • Validate vocabulary    │
                    │  • Generate missing items │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  8. Update Database       │
                    │  Table: lessons           │
                    │  Fields:                  │
                    │  • interactive_content    │
                    │  • lesson_template_id     │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  9. Return Success        │
                    │  Response to Client       │
                    └───────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│                    PHASE 5: CLIENT RESPONSE HANDLING                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────────────────┐
                    │  1. Mark Subtopic         │
                    │  Complete (ProgressCtx)   │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  2. Update Lesson Data    │
                    │  with Interactive Content │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  3. Set Persistent Data   │
                    │  (survives tab switches)  │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  4. Switch to             │
                    │  "Lesson Material" Tab    │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  5. Refresh Data          │
                    │  in Background            │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  6. Show Success Toast    │
                    └───────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│                    PHASE 6: LESSON DISPLAY                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────────────────┐
                    │  LessonMaterialDisplay    │
                    │  Component Renders        │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  Parse Interactive        │
                    │  Content JSON             │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  Render Sections:         │
                    │  • Info cards             │
                    │  • Vocabulary             │
                    │  • Dialogues              │
                    │  • Exercises              │
                    │  • Quizzes                │
                    │  • Discussion questions   │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  Interactive Features:    │
                    │  • Word translation       │
                    │  • Audio playback         │
                    │  • Flip cards             │
                    │  • Export options         │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  ✅ Lesson Ready!         │
                    │  User can interact        │
                    └───────────────────────────┘
```

---

## 🔄 Data Flow

### Request Flow
```
Browser → Next.js API → Supabase Edge Function → DeepSeek AI → Database
```

### Response Flow
```
Database → Edge Function → Next.js API → Browser → UI Update
```

---

## 📦 Key Data Structures

### 1. Request Payload
```typescript
{
  lesson_id: "uuid-of-lesson",
  selected_sub_topic: {
    id: "uuid-of-subtopic",
    title: "Present Perfect Tense",
    category: "Grammar",
    level: "B1",
    description: "Understanding and using present perfect..."
  }
}
```

### 2. Student Profile (used in AI prompt)
```typescript
{
  name: "John Doe",
  target_language: "English",
  proficiency_level: "B1",
  native_language: "Spanish",
  end_goals: "Business communication",
  grammar_weaknesses: ["Present perfect", "Conditionals"],
  vocabulary_gaps: ["Business terminology"],
  pronunciation_challenges: ["TH sounds", "R vs L"],
  conversational_fluency_barriers: ["Small talk", "Idioms"],
  learning_styles: ["Visual", "Interactive"],
  additional_notes: "Prefers practical examples"
}
```

### 3. Lesson Template Structure
```typescript
{
  id: "template-uuid",
  name: "Grammar Lesson Template",
  category: "Grammar",
  level: "B1",
  template_json: {
    name: "Grammar Lesson",
    colors: {
      primary: "#3B82F6",
      secondary: "#10B981"
    },
    sections: [
      {
        id: "introduction",
        type: "info_card",
        title: "Introduction",
        ai_placeholder: "introduction_overview"
      },
      {
        id: "vocabulary",
        type: "vocabulary_section",
        vocabulary_items: []
      }
      // ... more sections
    ]
  }
}
```

### 4. Generated Interactive Content
```typescript
{
  selected_sub_topic: { ... },
  created_at: "2026-01-06T10:00:00Z",
  sections: [
    {
      id: "introduction",
      type: "info_card",
      title: "Introduction",
      ai_placeholder: "introduction_overview",
      introduction_overview: "Welcome to this lesson on Present Perfect..."
    },
    {
      id: "vocabulary",
      type: "vocabulary_section",
      vocabulary_items: [
        {
          word: "experience",
          phonetic: "/ɪkˈspɪəriəns/",
          part_of_speech: "noun",
          definition: "Knowledge or skill from doing something",
          examples: [
            "I have experience in teaching.",
            "She gained valuable experience.",
            "His experience helped him succeed.",
            "They shared their experiences."
          ]
        }
        // ... 4-6 more words
      ]
    }
    // ... more sections
  ]
}
```

---

## ⏱️ Timing Breakdown

| Phase | Duration | Description |
|-------|----------|-------------|
| User Interaction | < 1s | Button click, dialog open |
| Subtopic Selection | Variable | User reviews and selects |
| API Request | < 1s | Network call to edge function |
| Template Selection | < 1s | Database query and matching |
| AI Generation | 10-20s | DeepSeek processes prompt |
| Response Processing | 1-3s | JSON validation and fixing |
| Database Update | < 1s | Save to Supabase |
| UI Update | < 1s | Render lesson material |
| **Total** | **15-30s** | **Complete flow** |

---

## 🎨 UI States

### Before Generation
```
┌─────────────────────────────────┐
│ Sub-Topic Card                  │
│                                 │
│ 📚 Present Perfect Tense        │
│ Grammar • B1                    │
│                                 │
│ [Create Interactive Material]  │ ← Blue button
└─────────────────────────────────┘
```

### During Generation
```
┌─────────────────────────────────┐
│ Generating...                   │
│                                 │
│ ████████████░░░░░░░░░░░ 60%    │
│                                 │
│ Creating interactive exercises  │
│ and activities...               │
└─────────────────────────────────┘
```

### After Generation
```
┌─────────────────────────────────┐
│ Sub-Topic Card                  │
│                                 │
│ 📚 Present Perfect Tense        │
│ Grammar • B1                    │
│ ✅ Material Created             │ ← Green badge
│                                 │
│ [Recreate Material]             │ ← Green button
└─────────────────────────────────┘
```

---

## 🔐 Security Flow

```
1. User Authentication
   ↓
2. JWT Token Generation (Supabase Auth)
   ↓
3. Token Sent in Authorization Header
   ↓
4. Edge Function Validates Token
   ↓
5. Extract User ID from Token
   ↓
6. Verify Lesson Ownership (tutor_id = user.id)
   ↓
7. Process Request
   ↓
8. Return Data Only if Authorized
```

---

## 🚨 Error Handling

### Client-Side Errors
```
No Lesson Available
    ↓
Toast: "No lesson available to generate interactive material for"
    ↓
Prevent Dialog Open

No Sub-Topics
    ↓
Toast: "No sub-topics available. Please regenerate lesson plans."
    ↓
Suggest Regeneration

Network Error
    ↓
Toast: "Failed to generate interactive material. Please try again."
    ↓
Offer Retry Button
```

### Server-Side Errors
```
Authentication Failure
    ↓
Return 401 Unauthorized
    ↓
Client Shows Login Prompt

No Matching Template
    ↓
Return Detailed Error with Available Options
    ↓
Client Shows Template Selection

AI Generation Failure
    ↓
Retry with Fallback Model (GPT-4)
    ↓
If Still Fails, Use Basic Template

Database Update Failure
    ↓
Rollback Transaction
    ↓
Return Error Response
```

---

## 📊 Success Metrics

### What Gets Tracked
1. **Lesson Creation Events**
   - Timestamp
   - Tutor ID
   - Student ID
   - Template used
   - Generation time

2. **Template Usage**
   - Which templates are most popular
   - Success rate per template
   - Average generation time

3. **Error Rates**
   - Failed generations
   - Error types
   - Recovery success rate

4. **Performance**
   - API response times
   - AI generation duration
   - Database query performance

---

## 🎯 Key Files Reference

### Frontend
- `components/students/StudentProfileClient.tsx` - Main orchestration
- `components/students/SubTopicSelectionDialog.tsx` - Subtopic selection UI
- `components/lessons/LessonMaterialDisplay.tsx` - Lesson rendering
- `lib/progress-context.tsx` - Completion tracking

### Backend
- `supabase/functions/generate-interactive-material/index.ts` - Main edge function
- `app/api/supabase/functions/generate-interactive-material/route.ts` - API proxy

### Database
- `lessons` table - Stores lesson data and interactive content
- `lesson_templates` table - Template definitions
- `students` table - Student profiles
- `tutors` table - Tutor information

---

## 💡 Pro Tips

### For Developers
1. **Always check ProgressContext** for completion status
2. **Use persistentLessonData** to avoid re-fetching
3. **Validate AI responses** before saving to database
4. **Handle edge cases** (no templates, AI failures, etc.)
5. **Log everything** for debugging

### For Tutors
1. **Review sub-topic titles** before generating (they're editable)
2. **Check category selection** (auto-selected but can be changed)
3. **Wait for completion** (don't refresh during generation)
4. **Use "Recreate Material"** to regenerate if needed
5. **Export lessons** for offline use

---

## 🔄 Related Flows

### Lesson Plan Generation
```
User clicks "Generate Lesson Plans"
    ↓
AI generates 3 lesson plans with 6 sub-topics each
    ↓
Stored in lessons.lesson_plan_json
    ↓
Available for interactive material creation
```

### Lesson History
```
Interactive material created
    ↓
Automatically added to lesson history
    ↓
Accessible from "Lesson History" tab
    ↓
Can be viewed, shared, or recreated
```

### Progress Tracking
```
Sub-topic completed
    ↓
Marked in ProgressContext
    ↓
Stored in localStorage
    ↓
Persists across sessions
    ↓
Shows "Material Created" badge
```

---

## 📚 Additional Documentation

- [Complete Flow Analysis](./create-interactive-material-flow-analysis.md) - Detailed technical documentation
- [Lesson Sections Guide](./lesson-sections-creation-guide.md) - How sections are structured
- [Vocabulary Enhancement](./vocabulary-enhancement-summary.md) - Vocabulary generation details
- [Template Structure Fix](./template-structure-fix-summary.md) - Template matching logic

---

**Last Updated**: January 6, 2026  
**Maintained By**: Development Team  
**Questions?** Check the detailed flow analysis document or contact the team.
