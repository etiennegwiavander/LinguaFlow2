export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'tutor' | 'admin';
}

export interface Student {
  id: string;
  name: string;
  avatar_url: string | null;
  target_language: string;
  native_language: string | null;
  level: string;
  age_group?: string;
  tutor_id: string;
  end_goals: string | null;
  grammar_weaknesses: string | null;
  vocabulary_gaps: string | null;
  pronunciation_challenges: string | null;
  conversational_fluency_barriers: string | null;
  learning_styles: string[] | null;
  notes: string | null;
  created_at: string;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface SubTopic {
  id: string;
  title: string;
  category: string;
  level: string;
  description?: string;
}

export interface Lesson {
  id: string;
  student_id: string;
  tutor_id: string;
  date: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  materials: string[];
  notes: string | null;
  previous_challenges: string[] | null;
  generated_lessons: string[] | null;
  sub_topics: SubTopic[] | null;
  lesson_template_id: string | null;
  interactive_lesson_content: any | null;
  created_at: string;
  student: Student;
}

export interface Stat {
  id: string;
  label: string;
  value: number;
  change: number;
  icon: string;
  clickable?: boolean;
  onClick?: () => void;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  requiresAdmin?: boolean;
}

export interface DiscussionTopic {
  id: string;
  student_id: string | null;
  tutor_id: string | null;
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

// Vocabulary Flashcards Types

export interface VocabularyCardData {
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  definition: string;
  exampleSentences: {
    present: string;
    past: string;
    future: string;
    presentPerfect: string;
    pastPerfect: string;
    futurePerfect: string;
  };
}

export interface VocabularySession {
  sessionId: string;
  studentId: string;
  startTime: Date;
  currentPosition: number;
  words: VocabularyCardData[];
  isActive: boolean;
}

export interface StudentVocabularyProfile {
  studentId: string;
  proficiencyLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  nativeLanguage: string;
  learningGoals: string[];
  vocabularyWeaknesses: string[];
  conversationalBarriers: string[];
  lastSessionPosition?: number;
  seenWords: string[];
}

export interface VocabularyGenerationRequest {
  studentProfile: StudentVocabularyProfile;
  excludeWords: string[];
  count: number;
  difficulty?: string;
  focusAreas?: string[];
}

export interface VocabularyGenerationResponse {
  words: VocabularyCardData[];
  sessionId: string;
  success: boolean;
  error?: string;
}

// Infinite Vocabulary Types

export interface VocabularyHistory {
  id: string;
  studentId: string;
  word: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  timesSeen: number;
  difficultyLevel: string;
  masteryScore: number;
  semanticCategory?: string;
  wordFamily?: string;
}

export interface SemanticRelationship {
  word: string;
  relatedWord: string;
  relationshipType: 'synonym' | 'antonym' | 'family' | 'concept' | 'theme';
  strength: number;
  difficultyLevel: string;
}

export interface GenerationPattern {
  studentId: string;
  difficultyLevel: string;
  semanticCategories: string[];
  wordFamilies: string[];
  learningVelocity: number;
  successRate: number;
  preferredThemes: string[];
  avoidedPatterns: string[];
}

export interface ExpansionQueue {
  id: string;
  studentId: string;
  baseWord: string;
  expansionWords: string[];
  expansionType: 'semantic' | 'thematic' | 'difficulty' | 'family';
  priorityScore: number;
  isActive: boolean;
}

export interface VocabularyAnalytics {
  totalWordsLearned: number;
  averageMasteryScore: number;
  learningVelocity: number;
  strongCategories: string[];
  weakCategories: string[];
  recommendedDifficulty: string;
}