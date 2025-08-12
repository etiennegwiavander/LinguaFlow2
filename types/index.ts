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