# How Interactive Lesson Sections Are Created

## Overview
Interactive lesson sections in LinguaFlow are created through a sophisticated template-based system that combines predefined structures with AI-generated personalized content. This document explains the complete process from template definition to final rendering.

---

## The Three-Layer Architecture

### Layer 1: Template Definition (Database)
Templates are stored in the `lesson_templates` table with a JSONB structure.

### Layer 2: AI Content Generation (Edge Function)
DeepSeek AI fills the template with personalized content based on student profile.

### Layer 3: Dynamic Rendering (React Component)
The LessonMaterialDisplay component renders sections based on their type and content.

---

## Part 1: Template Structure in Database

### Template Schema
```sql
CREATE TABLE lesson_templates (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,  -- Grammar, Conversation, Business English, etc.
  level TEXT NOT NULL,     -- a1, a2, b1, b2, c1, c2
  template_json JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Template JSON Structure
```json
{
  "name": "Grammar Lesson",
  "category": "Grammar",
  "level": "a2",
  "colors": {
    "primary_bg": "bg-yellow-50",
    "secondary_bg": "bg-orange-50",
    "text_color": "text-gray-800",
    "accent_color": "text-yellow-600",
    "border_color": "border-gray-200"
  },
  "sections": [
    {
      "id": "header",
      "type": "title",
      "title": "Lesson Title Here",
      "subtitle": "Topic Overview",
      "image_url": "https://..."
    },
    {
      "id": "introduction_overview",
      "type": "info_card",
      "title": "Introduction/Overview",
      "background_color_var": "primary_bg",
      "content_type": "text",
      "ai_placeholder": "introduction_overview"
    },
    {
      "id": "key_vocabulary",
      "type": "exercise",
      "title": "Key Vocabulary",
      "instruction": "Essential words and phrases",
      "instruction_bg_color_var": "secondary_bg",
      "content_type": "vocabulary_matching",
      "vocabulary_items": [],
      "ai_placeholder": "vocabulary_grammar_focus"
    }
    // ... more sections
  ]
}
```

---

## Part 2: Section Types & Their Properties

### 1. **Title Section** (`type: "title"`)
**Purpose:** Displays the lesson header with banner image

**Properties:**
- `title` - Main lesson title
- `subtitle` - Optional subtitle
- `image_url` - Banner image URL (optional)

**AI Fills:** Title and subtitle based on sub-topic

**Renders As:** Large banner with AI-generated or stock image

---

### 2. **Info Card Section** (`type: "info_card"`)
**Purpose:** Displays informational text content

**Properties:**
- `title` - Section heading
- `background_color_var` - Background color reference
- `content_type` - Always "text"
- `ai_placeholder` - Field name for AI to create

**AI Fills:** Creates a new field with the `ai_placeholder` name containing text content

**Example:**
```json
// Template defines:
{
  "id": "introduction_overview",
  "type": "info_card",
  "ai_placeholder": "introduction_overview"
}

// AI adds:
{
  "id": "introduction_overview",
  "type": "info_card",
  "ai_placeholder": "introduction_overview",
  "introduction_overview": "Welcome to this lesson on Present Perfect..."
}
```

**Renders As:** Card with icon, title, and formatted text content

---

### 3. **Exercise Section** (`type: "exercise"`)
**Purpose:** Interactive learning activities

**Properties:**
- `title` - Exercise heading
- `instruction` - Instructions for the student
- `instruction_bg_color_var` - Instruction box color
- `content_type` - Determines exercise format (see below)
- `ai_placeholder` - Field name for AI content

**Content Types:**

#### 3.1 **List** (`content_type: "list"`)
Simple bullet-point list

**AI Fills:**
```json
{
  "ai_placeholder": "discussion_prompts",
  "discussion_prompts": [
    "What is your favorite hobby?",
    "How often do you practice it?",
    "Why do you enjoy it?"
  ]
}
```

**Renders As:** Bulleted list with icons

---

#### 3.2 **Vocabulary Matching** (`content_type: "vocabulary_matching"`)
Vocabulary words with definitions and examples

**AI Fills:**
```json
{
  "ai_placeholder": "vocabulary_grammar_focus",
  "vocabulary_grammar_focus": [
    {
      "word": "accomplish",
      "definition": "To successfully complete or achieve something",
      "part_of_speech": "verb",
      "examples": [
        "I have accomplished all my goals this year.",
        "She accomplished the task in record time.",
        "They accomplished great things together."
      ]
    }
  ]
}
```

**Number of Examples by Level:**
- A1/A2: 5 examples per word
- B1/B2: 4 examples per word
- C1/C2: 3 examples per word

**Renders As:** Enhanced vocabulary cards with:
- Flip animation
- Phonetic notation (IPA)
- Part of speech badge
- Multiple example sentences
- Audio pronunciation button

---

#### 3.3 **Full Dialogue** (`content_type: "full_dialogue"`)
Conversation between characters

**AI Fills:**
```json
{
  "ai_placeholder": "example_content",
  "example_content": [
    {
      "character": "Teacher",
      "text": "Good morning! How are you today?"
    },
    {
      "character": "Student",
      "text": "I'm fine, thank you. How are you?"
    },
    {
      "character": "Teacher",
      "text": "I'm very well, thanks for asking."
    }
  ]
}
```

**Renders As:** Dialogue with:
- Character avatars (generated or default)
- Speech bubbles
- Audio playback for each line
- Character-specific styling

---

#### 3.4 **Matching** (`content_type: "matching"`)
Match questions with answers

**AI Fills:**
```json
{
  "ai_placeholder": "comprehension_practice",
  "comprehension_practice": [
    {
      "question": "What is the present perfect tense used for?",
      "answer": "To describe actions that started in the past and continue to the present"
    },
    {
      "question": "How do you form the present perfect?",
      "answer": "have/has + past participle"
    }
  ]
}
```

**Renders As:** Interactive matching exercise with drag-and-drop or click-to-match

---

#### 3.5 **Fill in the Blanks** (`content_type: "fill_in_the_blanks"`)
Sentences with missing words

**AI Fills:**
```json
{
  "ai_placeholder": "fill_blanks_exercise",
  "fill_blanks_exercise": [
    {
      "sentence": "I ___ been to Paris three times.",
      "answer": "have",
      "options": ["have", "has", "had", "having"]
    }
  ]
}
```

**Renders As:** Interactive fill-in-the-blank with:
- Input fields or dropdown options
- Instant feedback
- Reveal answer button

---

#### 3.6 **Multiple Choice** (`content_type: "multiple_choice"`)
Questions with multiple answer options

**AI Fills:**
```json
{
  "ai_placeholder": "quiz_questions",
  "quiz_questions": [
    {
      "question": "Which sentence uses present perfect correctly?",
      "options": [
        "I have seen that movie yesterday.",
        "I have seen that movie before.",
        "I have saw that movie before.",
        "I seen that movie before."
      ],
      "correct_answer": 1
    }
  ]
}
```

**Renders As:** Radio button quiz with:
- Question text
- Multiple options
- Submit button
- Correct/incorrect feedback

---

#### 3.7 **Ordering Exercise** (`content_type: "ordering"`)
Put items in correct sequence

**AI Fills:**
```json
{
  "ai_placeholder": "sentence_ordering",
  "sentence_ordering": [
    "have",
    "I",
    "finished",
    "my",
    "homework"
  ]
}
```

**Renders As:** Drag-and-drop ordering interface

---

#### 3.8 **Role Play Scenario** (`content_type: "role_play"`)
Practice scenarios for conversation

**AI Fills:**
```json
{
  "ai_placeholder": "role_play_scenarios",
  "role_play_scenarios": [
    {
      "scenario": "At a Restaurant",
      "role_a": "Customer",
      "role_b": "Waiter",
      "prompts": [
        "Customer: Ask for the menu",
        "Waiter: Offer recommendations",
        "Customer: Order food and drinks"
      ]
    }
  ]
}
```

**Renders As:** Scenario card with roles and prompts

---

### 4. **Objectives Section** (`type: "objectives"`)
**Purpose:** Learning goals for the lesson

**Properties:**
- `title` - Section heading
- `items` or `objectives` - Array of learning objectives

**AI Fills:** Array of specific, measurable objectives

**Renders As:** List with target icons

---

### 5. **Activities Section** (`type: "activities"`)
**Purpose:** Suggested classroom or practice activities

**Properties:**
- `title` - Section heading
- `items` or `activities` - Array of activities

**AI Fills:** Array of engaging activities

**Renders As:** List with arrow icons

---

### 6. **Materials Section** (`type: "materials"`)
**Purpose:** Required materials for the lesson

**Properties:**
- `title` - Section heading
- `items` or `materials` - Array of materials

**AI Fills:** Array of necessary materials

**Renders As:** List with pen tool icons

---

### 7. **Assessment Section** (`type: "assessment"`)
**Purpose:** How to evaluate student progress

**Properties:**
- `title` - Section heading
- `items` or `assessment` - Array of assessment methods

**AI Fills:** Array of assessment strategies

**Renders As:** List with checkmark icons

---

## Part 3: The AI Placeholder System

### How It Works

**1. Template Definition:**
```json
{
  "id": "introduction_overview",
  "type": "info_card",
  "ai_placeholder": "introduction_overview"
}
```

**2. AI Instruction:**
The Edge Function tells AI:
> "The 'ai_placeholder' field is a LABEL, not content!
> - NEVER replace the 'ai_placeholder' value
> - CREATE A NEW FIELD with the name from 'ai_placeholder'
> - Put generated content in that NEW field"

**3. AI Response:**
```json
{
  "id": "introduction_overview",
  "type": "info_card",
  "ai_placeholder": "introduction_overview",  // ← Unchanged
  "introduction_overview": "Welcome to this lesson..."  // ← New field added
}
```

**4. Rendering Logic:**
```typescript
const aiPlaceholderKey = section.ai_placeholder;
const content = section[aiPlaceholderKey];  // Access the new field
```

### Why This System?

**Benefits:**
- Clear separation between template structure and content
- AI knows exactly where to put content
- Easy to validate and debug
- Supports multiple content formats (text, arrays, objects)

**Common AI Mistakes (Handled):**
- Replacing `ai_placeholder` value instead of creating new field
- Putting content in wrong location
- Missing required fields
- Invalid JSON structure

---

## Part 4: Content Validation & Fallbacks

### Vocabulary Validation

**Ensures all vocabulary words have correct number of examples:**

```typescript
function validateAndEnsureExamples(template, subTopic, student) {
  // Determine required example count based on level
  const targetCount = student.level.startsWith('a') ? 5 :
                     student.level.startsWith('b') ? 4 : 3;
  
  // Check each vocabulary item
  for (const item of vocabularyItems) {
    if (!item.examples || item.examples.length < targetCount) {
      // Generate contextual examples
      item.examples = generateContextualExamples(
        item.word,
        item.definition,
        item.part_of_speech,
        targetCount
      );
    }
  }
}
```

### Fallback Content Generation

**If AI fails to generate content:**

```typescript
function generateFallbackContent(section, level) {
  const sectionType = section.type;
  const sectionTitle = section.title;
  
  // Generate basic content based on section type
  switch (sectionType) {
    case 'info_card':
      return `This section provides information about ${sectionTitle}.`;
    case 'exercise':
      return `Practice exercises for ${sectionTitle}.`;
    default:
      return `Content for ${sectionTitle}.`;
  }
}
```

---

## Part 5: Rendering Process

### Step 1: Load Template & Content

```typescript
// Fetch lesson with interactive content
const lesson = await supabase
  .from('lessons')
  .select('*, student(*)')
  .eq('id', lessonId)
  .single();

// Fetch template structure
const template = await supabase
  .from('lesson_templates')
  .select('*')
  .eq('id', lesson.lesson_template_id)
  .single();

// Merge: Use interactive_lesson_content as template_json
const finalTemplate = {
  ...template,
  template_json: lesson.interactive_lesson_content
};
```

### Step 2: Iterate Through Sections

```typescript
const sections = template.template_json.sections;

return (
  <div>
    {sections.map((section, index) => (
      renderSection(section, index)
    ))}
  </div>
);
```

### Step 3: Render Each Section

```typescript
function renderSection(section, index) {
  const sectionType = section.type;
  
  switch (sectionType) {
    case 'title':
      return <LessonBannerImage {...section} />;
      
    case 'info_card':
      return <InfoCardSection {...section} />;
      
    case 'exercise':
      return <ExerciseSection {...section} />;
      
    // ... more cases
  }
}
```

### Step 4: Render Exercise Content

```typescript
function renderExerciseContent(section) {
  const contentType = section.content_type;
  
  switch (contentType) {
    case 'vocabulary_matching':
      return <VocabularySection items={section.vocabulary_items} />;
      
    case 'full_dialogue':
      return <DialogueSection lines={section.dialogue_lines} />;
      
    case 'matching':
      return <MatchingExercise pairs={section.matching_pairs} />;
      
    // ... more cases
  }
}
```

---

## Part 6: Interactive Features

### 1. Word Translation
**Double-click any word to translate:**

```typescript
const handleTextDoubleClick = (e) => {
  const selectedText = window.getSelection().toString();
  if (selectedText) {
    translateWord(selectedText, studentNativeLanguage);
  }
};
```

### 2. Audio Pronunciation
**Text-to-speech for vocabulary and dialogues:**

```typescript
const speakText = (text, language) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  speechSynthesis.speak(utterance);
};
```

### 3. Vocabulary Flip Cards
**Click to flip between word and definition:**

```typescript
const [flipped, setFlipped] = useState(false);

<div 
  className={`flip-card ${flipped ? 'flipped' : ''}`}
  onClick={() => setFlipped(!flipped)}
>
  <div className="flip-card-front">{word}</div>
  <div className="flip-card-back">{definition}</div>
</div>
```

### 4. Exercise Feedback
**Instant feedback on answers:**

```typescript
const checkAnswer = (userAnswer, correctAnswer) => {
  if (userAnswer === correctAnswer) {
    toast.success("Correct! Well done!");
  } else {
    toast.error("Not quite. Try again!");
  }
};
```

---

## Part 7: Styling & Theming

### Color System
Each template defines color variables:

```json
"colors": {
  "primary_bg": "bg-yellow-50",
  "secondary_bg": "bg-orange-50",
  "text_color": "text-gray-800",
  "accent_color": "text-yellow-600",
  "border_color": "border-gray-200"
}
```

### Dynamic Color Application

```typescript
const getBgColor = (colorVar) => {
  const colors = template.template_json.colors;
  return colors[colorVar] || 'bg-white';
};

<Card className={getBgColor(section.background_color_var)}>
  {/* Content */}
</Card>
```

### Category-Specific Styling

```typescript
const categoryColors = {
  'Grammar': 'border-yellow-400/30',
  'Conversation': 'border-blue-400/30',
  'Business English': 'border-purple-400/30',
  'Vocabulary': 'border-green-400/30',
  'Pronunciation': 'border-orange-400/30'
};
```

---

## Part 8: Example: Complete Section Flow

### Template Definition (Database)
```json
{
  "id": "key_vocabulary",
  "type": "exercise",
  "title": "Key Vocabulary",
  "instruction": "Learn these essential words",
  "instruction_bg_color_var": "secondary_bg",
  "content_type": "vocabulary_matching",
  "vocabulary_items": [],
  "ai_placeholder": "vocabulary_grammar_focus"
}
```

### AI Generation (Edge Function)
```json
{
  "id": "key_vocabulary",
  "type": "exercise",
  "title": "Key Vocabulary",
  "instruction": "Learn these essential words",
  "instruction_bg_color_var": "secondary_bg",
  "content_type": "vocabulary_matching",
  "vocabulary_items": [],
  "ai_placeholder": "vocabulary_grammar_focus",
  "vocabulary_grammar_focus": [
    {
      "word": "accomplish",
      "definition": "To successfully complete something",
      "part_of_speech": "verb",
      "examples": [
        "I have accomplished my goals.",
        "She accomplished the task quickly.",
        "They accomplished great things."
      ]
    }
  ]
}
```

### Rendering (React Component)
```tsx
// 1. Detect section type
if (section.type === 'exercise') {
  
  // 2. Detect content type
  if (section.content_type === 'vocabulary_matching') {
    
    // 3. Get AI-generated content
    const aiKey = section.ai_placeholder;
    const vocabularyItems = section[aiKey];
    
    // 4. Render vocabulary cards
    return (
      <Card>
        <CardHeader>
          <CardTitle>Key Vocabulary</CardTitle>
          <Instruction>{section.instruction}</Instruction>
        </CardHeader>
        <CardContent>
          <EnhancedVocabularySection 
            items={vocabularyItems}
            onWordClick={handleWordClick}
            onAudioPlay={handleAudioPlay}
          />
        </CardContent>
      </Card>
    );
  }
}
```

### Final Display
```
┌─────────────────────────────────────┐
│ 📚 Key Vocabulary                   │
├─────────────────────────────────────┤
│ ℹ️ Learn these essential words      │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐  │
│  │ accomplish                   │  │
│  │ /əˈkʌmplɪʃ/                 │  │
│  │ [verb]                       │  │
│  │                              │  │
│  │ To successfully complete     │  │
│  │ something                    │  │
│  │                              │  │
│  │ Examples:                    │  │
│  │ • I have accomplished...     │  │
│  │ • She accomplished...        │  │
│  │ • They accomplished...       │  │
│  │                              │  │
│  │ [🔊 Play Audio]              │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

---

## Part 9: Advanced Features

### 1. Dialogue Avatars
**Automatically generated character avatars:**

```typescript
const useDialogueAvatars = (characterName) => {
  const [avatar, setAvatar] = useState(null);
  
  useEffect(() => {
    // Generate avatar based on character name
    const avatarUrl = generateAvatar(characterName);
    setAvatar(avatarUrl);
  }, [characterName]);
  
  return avatar;
};
```

### 2. Lesson Export
**Export to PDF or Word:**

```typescript
const handleExportLesson = () => {
  const fileName = `lesson-${student.name}-${date}`;
  exportToPdf('lesson-content-container', fileName);
};
```

### 3. Lesson Sharing
**Generate shareable link:**

```typescript
const handleShareLesson = async () => {
  const shareUrl = `${baseUrl}/shared-lesson/${lesson.id}`;
  await navigator.clipboard.writeText(shareUrl);
  toast.success("Link copied to clipboard!");
};
```

### 4. Progress Tracking
**Track completed sections:**

```typescript
const [completedSections, setCompletedSections] = useState(new Set());

const markSectionComplete = (sectionId) => {
  setCompletedSections(prev => new Set([...prev, sectionId]));
};
```

---

## Summary

**Section Creation Flow:**
1. **Template Defined** → Database stores structure with placeholders
2. **AI Generates** → DeepSeek fills placeholders with personalized content
3. **Content Validated** → System ensures all required fields present
4. **Sections Rendered** → React components display based on type
5. **Interactive Features** → Translation, audio, exercises activated
6. **User Interacts** → Feedback, progress tracking, export options

**Key Principles:**
- **Template-driven** → Consistent structure across lessons
- **AI-personalized** → Content tailored to each student
- **Type-based rendering** → Different section types render differently
- **Validation & fallbacks** → Graceful handling of missing content
- **Interactive & engaging** → Rich features for better learning

This system allows LinguaFlow to create highly personalized, interactive lessons at scale while maintaining quality and consistency.
