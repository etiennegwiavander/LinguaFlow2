# Design Document

## Overview

The Discussion Topics and Questions feature will integrate seamlessly into the existing student profile system, adding a new tab to the current tabbed interface. This feature will provide an AI-powered discussion topic generator that creates personalized conversation questions based on the student's profile, level, and learning goals. The feature will include a gamified flashcard interface for presenting questions in an engaging, focused manner.

## Architecture

### High-Level Architecture

The feature will follow the existing application patterns:

1. **Frontend Components**: React components using the established UI library (shadcn/ui)
2. **Database Layer**: New tables in Supabase for storing discussion topics and questions
3. **AI Integration**: Supabase Edge Function using Gemini AI (following existing pattern)
4. **State Management**: React hooks and context for managing flashcard state
5. **Routing**: Integration with Next.js app router structure

### Component Hierarchy

```
StudentProfileClient (existing)
├── Tabs (existing)
│   ├── AI Lesson Architect (existing)
│   ├── Lesson Material (existing)
│   ├── History (existing)
│   ├── Discussion Topics (NEW)
│   └── Learning Profile (existing)
└── DiscussionTopicsTab (NEW)
    ├── TopicsList (NEW)
    │   ├── PredefinedTopics (NEW)
    │   └── CustomTopicInput (NEW)
    └── FlashcardInterface (NEW)
        ├── FlashcardOverlay (NEW)
        ├── QuestionCard (NEW)
        └── NavigationControls (NEW)
```

## Components and Interfaces

### 1. DiscussionTopicsTab Component

**Purpose**: Main container for the discussion topics feature
**Location**: `components/students/DiscussionTopicsTab.tsx`

**Props**:
```typescript
interface DiscussionTopicsTabProps {
  student: Student;
}
```

**State**:
```typescript
interface DiscussionTopicsState {
  topics: DiscussionTopic[];
  selectedTopic: DiscussionTopic | null;
  questions: Question[];
  isGenerating: boolean;
  generationProgress: string;
  customTopicInput: string;
}
```

### 2. FlashcardInterface Component

**Purpose**: Gamified flashcard presentation of questions
**Location**: `components/students/FlashcardInterface.tsx`

**Props**:
```typescript
interface FlashcardInterfaceProps {
  questions: Question[];
  isOpen: boolean;
  onClose: () => void;
  topicTitle: string;
}
```

**State**:
```typescript
interface FlashcardState {
  currentQuestionIndex: number;
  isAnimating: boolean;
  direction: 'forward' | 'backward';
}
```

### 3. TopicsList Component

**Purpose**: Display available topics and custom topic input
**Location**: `components/students/TopicsList.tsx`

**Features**:
- Grid layout of topic cards
- Search/filter functionality
- Custom topic creation input
- Level-appropriate topic filtering

### 4. QuestionCard Component

**Purpose**: Individual flashcard display
**Location**: `components/students/QuestionCard.tsx`

**Features**:
- Smooth animations
- Question text display
- Progress indicator
- Accessibility support

## Data Models

### Discussion Topics Table

```sql
CREATE TABLE discussion_topics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  tutor_id uuid REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'custom',
  level text NOT NULL,
  is_custom boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Discussion Questions Table

```sql
CREATE TABLE discussion_questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id uuid REFERENCES discussion_topics(id) ON DELETE CASCADE NOT NULL,
  question_text text NOT NULL,
  question_order integer NOT NULL,
  difficulty_level text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

### TypeScript Interfaces

```typescript
export interface DiscussionTopic {
  id: string;
  student_id: string;
  tutor_id: string;
  title: string;
  description?: string;
  category: string;
  level: string;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
  questions?: Question[];
}

export interface Question {
  id: string;
  topic_id: string;
  question_text: string;
  question_order: number;
  difficulty_level: string;
  created_at: string;
}

export interface FlashcardSession {
  topicId: string;
  questions: Question[];
  currentIndex: number;
  startedAt: Date;
}
```

## AI Integration

### Supabase Edge Function: generate-discussion-questions

**Location**: `supabase/functions/generate-discussion-questions/index.ts`

**Input**:
```typescript
interface GenerateQuestionsRequest {
  student_id: string;
  topic_title: string;
  custom_topic?: boolean;
}
```

**AI Prompt Strategy**:
```typescript
const prompt = `You are an expert ${languageName} conversation tutor creating discussion questions for ${student.name}.

STUDENT PROFILE:
- Name: ${student.name}
- Target Language: ${languageName}
- Current Level: ${student.level.toUpperCase()}
- Native Language: ${student.native_language || 'Not specified'}
- Learning Goals: ${student.end_goals || 'General improvement'}
- Conversational Barriers: ${student.conversational_fluency_barriers || 'None specified'}

TOPIC: "${topicTitle}"

Generate exactly 20 meaningful discussion questions that:
1. Are appropriate for ${student.level} level
2. Encourage natural conversation
3. Build from simple to more complex
4. Include cultural context when relevant
5. Address ${student.name}'s specific learning goals

Return a JSON array of questions with this structure:
[
  {
    "question_text": "question in ${languageName}",
    "difficulty_level": "beginner|intermediate|advanced",
    "question_order": 1
  }
  // ... 20 questions total
]`;
```

## User Experience Flow

### 1. Topic Selection Flow

1. User navigates to "Discussion Topics" tab
2. System displays predefined topics filtered by student level
3. User can:
   - Select a predefined topic
   - Enter a custom topic in the input field
   - Search/filter existing topics

### 2. Question Generation Flow

1. User selects or creates a topic
2. System checks if questions already exist for this topic
3. If not, system calls AI function to generate 20 questions
4. Progress indicator shows generation status
5. Questions are stored in database for future use

### 3. Flashcard Experience Flow

1. User clicks on a topic with questions
2. Flashcard overlay appears with background blur
3. First question displays prominently
4. User can navigate with arrow keys or buttons
5. Smooth animations between questions
6. User can exit anytime to return to topic list

## Error Handling

### AI Generation Failures
- Fallback to predefined question templates
- Retry mechanism with exponential backoff
- User-friendly error messages
- Graceful degradation to manual topic creation

### Network Issues
- Offline question caching
- Progressive loading of questions
- Connection status indicators
- Retry buttons for failed operations

### Validation
- Input sanitization for custom topics
- Question length limits
- Profanity filtering
- Level appropriateness validation

## Testing Strategy

### Unit Tests
- Component rendering and props handling
- State management logic
- Question navigation functionality
- Input validation

### Integration Tests
- AI function integration
- Database operations
- Tab navigation within student profile
- Flashcard overlay behavior

### E2E Tests
- Complete topic creation and question generation flow
- Flashcard navigation and exit functionality
- Custom topic creation and persistence
- Cross-browser compatibility

## Performance Considerations

### Optimization Strategies
- Lazy loading of questions
- Memoization of generated content
- Efficient re-rendering with React.memo
- Debounced search input
- Virtual scrolling for large question sets

### Caching
- Browser storage for recently viewed topics
- Server-side caching of generated questions
- CDN caching for static topic data

### Loading States
- Skeleton loaders during generation
- Progressive question loading
- Smooth transitions between states
- Background prefetching of related topics

## Security Considerations

### Data Protection
- Row Level Security (RLS) policies for topic access
- Input sanitization and validation
- Rate limiting on AI generation endpoints
- Secure handling of student data

### Access Control
- Tutor-only access to student discussion topics
- Student-specific topic isolation
- Audit logging for topic creation and access

## Accessibility

### WCAG Compliance
- Keyboard navigation for flashcards
- Screen reader support for questions
- High contrast mode compatibility
- Focus management in overlay
- Alternative text for visual elements

### Responsive Design
- Mobile-optimized flashcard interface
- Touch-friendly navigation controls
- Adaptive text sizing
- Flexible grid layouts

## Migration Strategy

### Database Migration
- Create new tables with proper indexes
- Add foreign key constraints
- Set up RLS policies
- Create necessary triggers

### Feature Rollout
- Feature flag for gradual rollout
- A/B testing for UI variations
- User feedback collection
- Performance monitoring

## Future Enhancements

### Phase 2 Features
- Question difficulty progression
- Student progress tracking
- Conversation recording integration
- Collaborative discussion topics
- AI-powered question adaptation based on student responses

### Analytics Integration
- Topic popularity tracking
- Question effectiveness metrics
- Student engagement analytics
- Tutor usage patterns