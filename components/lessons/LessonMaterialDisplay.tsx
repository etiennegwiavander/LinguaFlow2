"use client";

import React, { useState, useEffect } from 'react';
import { safeGetString, safeGetArray, debounce } from "@/lib/utils";
import { exportToPdf, exportToWord, showExportDialog } from "@/lib/export-utils";
import { showImprovedExportDialog } from "@/lib/improved-export-utils";
import LessonBannerImage from "./LessonBannerImage";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getLessonBannerUrl } from "@/lib/lesson-banner-url-generator";
import { useAuth } from "@/lib/auth-context";
import { useSupabaseFetch } from "@/hooks/useSupabaseQuery";
import {
  Loader2,
  BookOpen,
  Target,
  Users,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Volume2,
  Edit3,
  RotateCcw,
  Mic,
  Play,
  Pause,
  Image as ImageIcon,
  PenTool,
  Eye,
  MessageCircle,
  Globe,
  Download,
  FileText,
  Share2,
  Copy,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import WordTranslationPopup from "./WordTranslationPopup";
import EnhancedVocabularySection from "./EnhancedVocabularySection";
import DialogueAvatar from "./DialogueAvatar";
import DialogueAvatarErrorBoundary from "./DialogueAvatarErrorBoundary";
import FloatingTranslationToggle from "./FloatingTranslationToggle";
import { useDialogueAvatars } from "@/hooks/useDialogueAvatars";
import { supabase } from '@/lib/supabase';

interface LessonTemplate {
  id: string;
  name: string;
  category: string;
  level: string;
  template_json: {
    name: string;
    category: string;
    level: string;
    colors: {
      primary_bg: string;
      secondary_bg: string;
      text_color: string;
      accent_color: string;
      border_color: string;
    };
    sections: TemplateSection[];
  };
}

interface TemplateSection {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  instruction?: string;
  instruction_bg_color_var?: string;
  background_color_var?: string;
  content_type?: string;
  items?: string[];
  dialogue_elements?: any[];
  dialogue_lines?: any[];
  vocabulary_items?: any[];
  matching_pairs?: any[];
  ordering_items?: string[];
  ai_placeholder?: string;
  content?: string;
  explanation_content?: string;
  sentences?: string[];
}

interface Lesson {
  id: string;
  student_id: string;
  tutor_id: string;
  date: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  materials: string[];
  notes: string | null;
  previous_challenges: string[] | null;
  generated_lessons: string[] | null;
  sub_topics: any[] | null;
  lesson_template_id: string | null;
  interactive_lesson_content: any | null;
  created_at: string;
  student: {
    name: string;
    target_language: string;
    native_language: string | null;
    level: string;
  };
}

interface LessonPlan {
  title: string;
  objectives: string[];
  activities: string[];
  materials: string[];
  assessment: string[];
}

interface LessonMaterialDisplayProps {
  lessonId: string;
  studentNativeLanguage?: string | null;
  preloadedLessonData?: any; // Optional pre-loaded lesson data to avoid database fetch
}

interface TranslationPopupState {
  isVisible: boolean;
  word: string;
  translation: string;
  wordRect: DOMRect | null;
}

// Helper function to safely convert any value to a string for rendering
const safeStringify = (value: any): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return '[Object]';
    }
  }
  return String(value);
};

// Helper function to parse dialogue strings like "A: Hello! I am Maria."
const parseDialogueLine = (line: string): { character: string; text: string } => {
  if (typeof line !== 'string') {
    return { character: 'Speaker', text: 'No text available' };
  }

  const match = line.match(/^([^:]+):\s*(.*)$/);
  if (match) {
    return {
      character: match[1].trim(),
      text: match[2].trim()
    };
  }

  // Fallback if no colon found
  return { character: 'Speaker', text: line };
};

// Helper function to generate proper IPA phonetic notation
const generatePhoneticNotation = (word: string): string => {
  // Basic phonetic mapping for common English words
  const phoneticMap: Record<string, string> = {
    // Common words with known IPA
    'quest': '/kwɛst/',
    'question': '/ˈkwɛstʃən/',
    'quick': '/kwɪk/',
    'quiet': '/ˈkwaɪət/',
    'quality': '/ˈkwɑləti/',
    'business': '/ˈbɪznəs/',
    'finance': '/faɪˈnæns/',
    'money': '/ˈmʌni/',
    'time': '/taɪm/',
    'place': '/pleɪs/',
    'movement': '/ˈmuvmənt/',
    'preposition': '/ˌprɛpəˈzɪʃən/',
    'important': '/ɪmˈpɔrtənt/',
    'language': '/ˈlæŋɡwɪdʒ/',
    'learning': '/ˈlɜrnɪŋ/',
    'student': '/ˈstudənt/',
    'teacher': '/ˈtitʃər/',
    'education': '/ˌɛdʒuˈkeɪʃən/',
    'communication': '/kəˌmjunəˈkeɪʃən/',
    'conversation': '/ˌkɑnvərˈseɪʃən/',
    'vocabulary': '/voʊˈkæbjəˌlɛri/',
    'pronunciation': '/prəˌnʌnsiˈeɪʃən/',
    'grammar': '/ˈɡræmər/',
    'practice': '/ˈpræktəs/',
    'example': '/ɪɡˈzæmpəl/',
    'sentence': '/ˈsɛntəns/',
    'understand': '/ˌʌndərˈstænd/',
    'explain': '/ɪkˈspleɪn/',
    'listen': '/ˈlɪsən/',
    'speak': '/spik/',
    'read': '/rid/',
    'write': '/raɪt/',
    'study': '/ˈstʌdi/',
    'work': '/wɜrk/',
    'help': '/hɛlp/',
    'know': '/noʊ/',
    'think': '/θɪŋk/',
    'good': '/ɡʊd/',
    'great': '/ɡreɪt/',
    'better': '/ˈbɛtər/',
    'best': '/bɛst/',
    'new': '/nu/',
    'old': '/oʊld/',
    'big': '/bɪɡ/',
    'small': '/smɔl/',
    'long': '/lɔŋ/',
    'short': '/ʃɔrt/',
    'high': '/haɪ/',
    'low': '/loʊ/',
    'fast': '/fæst/',
    'slow': '/sloʊ/',
    'easy': '/ˈizi/',
    'difficult': '/ˈdɪfəkəlt/',
    'simple': '/ˈsɪmpəl/',
    'complex': '/kəmˈplɛks/',
    'clear': '/klɪr/',
    'different': '/ˈdɪfərənt/',
    'same': '/seɪm/',
    'similar': '/ˈsɪmələr/',
    'every': '/ˈɛvri/',
    'each': '/itʃ/',
    'many': '/ˈmɛni/',
    'much': '/mʌtʃ/',
    'some': '/sʌm/',
    'few': '/fju/',
    'little': '/ˈlɪtəl/',
    'more': '/mɔr/',
    'most': '/moʊst/',
    'less': '/lɛs/',
    'least': '/list/',
    'first': '/fɜrst/',
    'last': '/læst/',
    'next': '/nɛkst/',
    'before': '/bɪˈfɔr/',
    'after': '/ˈæftər/',
    'during': '/ˈdʊrɪŋ/',
    'while': '/waɪl/',
    'when': '/wɛn/',
    'where': '/wɛr/',
    'why': '/waɪ/',
    'how': '/haʊ/',
    'what': '/wʌt/',
    'which': '/wɪtʃ/',
    'who': '/hu/',
    'whose': '/huz/',
    'with': '/wɪθ/',
    'without': '/wɪˈθaʊt/',
    'through': '/θru/',
    'across': '/əˈkrɔs/',
    'around': '/əˈraʊnd/',
    'between': '/bɪˈtwin/',
    'among': '/əˈmʌŋ/',
    'above': '/əˈbʌv/',
    'below': '/bɪˈloʊ/',
    'under': '/ˈʌndər/',
    'over': '/ˈoʊvər/',
    'inside': '/ɪnˈsaɪd/',
    'outside': '/ˈaʊtˌsaɪd/',
    'near': '/nɪr/',
    'far': '/fɑr/',
    'here': '/hɪr/',
    'there': '/ðɛr/',
    'everywhere': '/ˈɛvriˌwɛr/',
    'somewhere': '/ˈsʌmˌwɛr/',
    'nowhere': '/ˈnoʊˌwɛr/',
    'anywhere': '/ˈɛniˌwɛr/'
  };

  // Check if we have a specific mapping
  const lowerWord = word.toLowerCase();
  if (phoneticMap[lowerWord]) {
    return phoneticMap[lowerWord];
  }

  // Generate basic phonetic approximation for unknown words
  let phonetic = word.toLowerCase();

  // Basic phonetic transformations
  phonetic = phonetic
    .replace(/qu/g, 'kw')
    .replace(/ch/g, 'tʃ')
    .replace(/sh/g, 'ʃ')
    .replace(/th/g, 'θ')
    .replace(/ng/g, 'ŋ')
    .replace(/ph/g, 'f')
    .replace(/gh/g, 'f')
    .replace(/tion/g, 'ʃən')
    .replace(/sion/g, 'ʒən')
    .replace(/ough/g, 'ʌf')
    .replace(/augh/g, 'ɔf')
    .replace(/eigh/g, 'eɪ')
    .replace(/ight/g, 'aɪt')
    .replace(/ould/g, 'ʊd')
    .replace(/alk/g, 'ɔk')
    .replace(/alf/g, 'æf')
    .replace(/ear/g, 'ɪr')
    .replace(/air/g, 'ɛr')
    .replace(/oor/g, 'ɔr')
    .replace(/our/g, 'aʊr')
    .replace(/ow/g, 'aʊ')
    .replace(/ew/g, 'u')
    .replace(/ay/g, 'eɪ')
    .replace(/ey/g, 'eɪ')
    .replace(/ie/g, 'aɪ')
    .replace(/oe/g, 'oʊ')
    .replace(/ue/g, 'u')
    .replace(/ee/g, 'i')
    .replace(/ea/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/ou/g, 'aʊ')
    .replace(/au/g, 'ɔ')
    .replace(/aw/g, 'ɔ')
    .replace(/ai/g, 'eɪ')
    .replace(/ei/g, 'eɪ')
    .replace(/oi/g, 'ɔɪ')
    .replace(/oy/g, 'ɔɪ')
    .replace(/a/g, 'æ')
    .replace(/e/g, 'ɛ')
    .replace(/i/g, 'ɪ')
    .replace(/o/g, 'ɑ')
    .replace(/u/g, 'ʌ')
    .replace(/y/g, 'aɪ');

  return `/${phonetic}/`;
};

// Helper function to bold vocabulary words in AI-generated examples
const boldVocabularyInExamples = (examples: string[], word: string): string[] => {
  const regex = new RegExp(`\\b${word}\\b`, 'gi');
  return examples.map(example => example.replace(regex, `<strong>${word}</strong>`));
};

// AI-powered contextual example generator
const generateAIContextualExamples = async (word: string, partOfSpeech: string, definition: string, count: number, level: string, lesson: Lesson | null): Promise<string[]> => {
  try {
    // Get current session for API call
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Determine the lesson context/sub-topic
    const lessonContext = lesson?.interactive_lesson_content?.selected_sub_topic?.title ||
      lesson?.interactive_lesson_content?.name ||
      'general language learning';

    console.log(`🤖 Generating AI examples for "${word}" in context: ${lessonContext}`);

    // Call AI to generate contextual examples
    const response = await fetch('/api/generate-contextual-examples', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        word,
        partOfSpeech,
        definition,
        count,
        level,
        lessonContext,
        studentId: lesson?.student_id
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate contextual examples');
    }

    const result = await response.json();

    if (result.success && result.examples) {
      console.log(`✅ AI generated ${result.examples.length} contextual examples for: ${word}`);
      return result.examples;
    } else {
      throw new Error('Invalid response from AI');
    }
  } catch (error) {
    console.error('❌ Failed to generate AI examples for:', word, error);

    // Minimal fallback - just return a simple contextual sentence
    const lessonContext = lesson?.interactive_lesson_content?.selected_sub_topic?.title || 'language learning';
    return [
      `The word "${word}" is used in the context of ${lessonContext}.`,
      `Understanding "${word}" helps with communication skills.`,
      `Students practice using "${word}" in relevant situations.`
    ].slice(0, count);
  }
};

// Legacy function for backward compatibility - now returns empty array to force AI generation
const generateContextualExamples = (word: string, partOfSpeech: string, definition: string, count: number, level: string, lesson: Lesson | null): string[] => {
  console.log(`⚠️ Legacy function called for "${word}", will use AI-generated examples instead`);
  return [];
};

// Helper function to generate fallback content for empty sections
const generateFallbackContent = (section: TemplateSection, level: string): React.ReactNode => {
  const sectionTitle = safeGetString(section, 'title', 'Section').toLowerCase();
  const levelLower = level.toLowerCase();

  // Generate appropriate content based on section title and level
  if (sectionTitle.includes('introduction') || sectionTitle.includes('overview')) {
    if (levelLower === 'a1' || levelLower === 'a2') {
      return (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            Welcome to this lesson! Today we will learn new words and practice speaking.
          </p>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            This lesson will help you understand important language concepts step by step.
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>Learn new vocabulary words</li>
            <li>Practice pronunciation</li>
            <li>Use words in sentences</li>
            <li>Complete fun exercises</li>
          </ul>
        </div>
      );
    } else if (levelLower === 'b1' || levelLower === 'b2') {
      return (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            This lesson focuses on expanding your language skills through practical exercises and real-world applications.
          </p>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            You&apos;ll develop confidence in using new vocabulary and grammar structures in meaningful contexts.
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>Master advanced vocabulary and expressions</li>
            <li>Apply grammar rules in complex sentences</li>
            <li>Engage in interactive communication exercises</li>
            <li>Develop fluency through structured practice</li>
          </ul>
        </div>
      );
    } else {
      return (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            This advanced lesson explores sophisticated language concepts and their practical applications in professional and academic contexts.
          </p>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            Through comprehensive analysis and practice, you&apos;ll refine your linguistic competence and develop nuanced communication skills.
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>Analyze complex linguistic structures and their usage</li>
            <li>Master sophisticated vocabulary and idiomatic expressions</li>
            <li>Develop advanced communication strategies</li>
            <li>Apply language skills in professional contexts</li>
          </ul>
        </div>
      );
    }
  } else if (sectionTitle.includes('wrap') || sectionTitle.includes('reflection') || sectionTitle.includes('summary')) {
    if (levelLower === 'a1' || levelLower === 'a2') {
      return (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            Great job! You have learned many new things in this lesson.
          </p>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            Let&apos;s think about what we learned today:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>What new words did you learn?</li>
            <li>Which exercises were easy for you?</li>
            <li>Which parts need more practice?</li>
            <li>How will you use these words tomorrow?</li>
          </ul>
          <p className="text-sm leading-relaxed font-medium text-gray-700 dark:text-gray-300">
            Keep practicing these new words every day!
          </p>
        </div>
      );
    } else if (levelLower === 'b1' || levelLower === 'b2') {
      return (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            Congratulations on completing this lesson! Take a moment to reflect on your learning journey.
          </p>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            Consider these reflection questions:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>How confident do you feel using the new vocabulary in conversation?</li>
            <li>Which grammar concepts require additional practice?</li>
            <li>What strategies helped you understand difficult concepts?</li>
            <li>How can you apply these skills in real-world situations?</li>
          </ul>
          <p className="text-sm leading-relaxed font-medium text-gray-700 dark:text-gray-300">
            Continue practicing to build fluency and confidence in your language skills.
          </p>
        </div>
      );
    } else {
      return (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            This lesson has provided comprehensive coverage of advanced linguistic concepts. Reflect on your analytical and practical engagement with the material.
          </p>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            Critical reflection points:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>How effectively can you apply these concepts in professional discourse?</li>
            <li>What connections do you see between these concepts and broader linguistic patterns?</li>
            <li>Which aspects of the material challenge your current understanding?</li>
            <li>How might these skills enhance your academic or professional communication?</li>
          </ul>
          <p className="text-sm leading-relaxed font-medium text-gray-700 dark:text-gray-300">
            Continue to engage with complex materials to further develop your sophisticated language competence.
          </p>
        </div>
      );
    }
  } else {
    // Generic fallback content
    if (levelLower === 'a1' || levelLower === 'a2') {
      return (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            This section will help you learn and practice important language skills.
          </p>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            Follow the instructions and take your time to understand each part.
          </p>
        </div>
      );
    } else if (levelLower === 'b1' || levelLower === 'b2') {
      return (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            This section provides structured practice opportunities to develop your language proficiency.
          </p>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            Engage actively with the material to maximize your learning outcomes.
          </p>
        </div>
      );
    } else {
      return (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            This section presents advanced concepts designed to enhance your linguistic competence and analytical skills.
          </p>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            Apply critical thinking and draw connections to broader linguistic principles.
          </p>
        </div>
      );
    }
  }
};

// Helper function to get content from info_card sections
const getInfoCardContent = (section: TemplateSection): string => {
  console.log('🔍 getInfoCardContent called for section:', section.id, section.title);
  console.log('📋 Section keys:', Object.keys(section));
  
  const aiPlaceholderKey = safeGetString(section, 'ai_placeholder');
  console.log('🎯 ai_placeholder value:', aiPlaceholderKey);
  
  // PRIORITY 1: Check if AI content is in the correct place (new field with ai_placeholder name)
  // This is the CORRECT structure we want
  if (aiPlaceholderKey && aiPlaceholderKey.length < 100) {
    // If ai_placeholder is short (like "introduction_overview"), it's a field name
    const aiContent = (section as any)[aiPlaceholderKey];
    if (aiContent && typeof aiContent === 'string') {
      console.log(`✅ Found AI content in CORRECT field "${aiPlaceholderKey}":`, aiContent.substring(0, 100) + '...');
      return aiContent;
    }
  }
  
  // PRIORITY 2: TEMPORARY FIX - Check if content is wrongly placed IN the ai_placeholder field itself
  // This handles the current broken case where AI put content directly in ai_placeholder
  if (aiPlaceholderKey && aiPlaceholderKey.length > 100) {
    // If ai_placeholder is long (like a full sentence), it's actually the content (WRONG but we handle it)
    console.log(`⚠️ Found AI content WRONGLY placed in ai_placeholder field (temporary fix):`, aiPlaceholderKey.substring(0, 100) + '...');
    return aiPlaceholderKey;
  }

  // PRIORITY 3: Check for content in section.content
  const directContent = safeGetString(section, 'content');
  if (directContent && directContent !== 'Content will be displayed here.') {
    console.log('✅ Found content in section.content');
    return directContent;
  }

  // PRIORITY 4: Check for content in items array
  const items = safeGetArray(section, 'items');
  if (items.length > 0) {
    console.log('✅ Found content in items array');
    return items.map(item => `• ${safeStringify(item)}`).join('\n');
  }

  // PRIORITY 5: Check for content in other common fields
  const commonContentFields = ['text', 'description', 'summary', 'overview', 'introduction_overview', 'wrap_up_reflection'];
  for (const field of commonContentFields) {
    const fieldContent = safeGetString(section, field);
    if (fieldContent && fieldContent !== 'Content will be displayed here.') {
      console.log(`✅ Found content in field "${field}"`);
      return fieldContent;
    }
  }

  // NO FALLBACK - Return empty to show error
  console.error(`❌ NO CONTENT FOUND for info_card section: ${section.title}`);
  console.log('📦 Full section object:', JSON.stringify(section, null, 2));
  return '';
};

export default function LessonMaterialDisplay({ lessonId, studentNativeLanguage, preloadedLessonData }: LessonMaterialDisplayProps) {
  const { user } = useAuth();

  // Initialize loading state based on whether we have preloaded data
  const [loading, setLoading] = useState(() => {
    const hasPreloadedData = !!preloadedLessonData;
    console.log('🔍 Initial loading state:', { hasPreloadedData, loading: !hasPreloadedData });
    return !hasPreloadedData;
  });

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [template, setTemplate] = useState<LessonTemplate | null>(null);
  const [generatedLessons, setGeneratedLessons] = useState<LessonPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationPopup, setTranslationPopup] = useState<TranslationPopupState>({
    isVisible: false,
    word: '',
    translation: '',
    wordRect: null
  });
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Initialize dialogue avatars hook
  const { getCharacterInfo, preloadAvatars } = useDialogueAvatars();

  // Character tracking for dialogue alternating colors
  const [dialogueCharacterMap, setDialogueCharacterMap] = useState<Record<string, number>>({});

  // Simple alternating colors for dialogue participants (like in your image)
  const DIALOGUE_COLORS = [
    {
      // Purple - First character color (like Sarah in your image)
      bg: 'bg-purple-100 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-700 dark:text-purple-200'
    },
    {
      // Emerald - Second character color (alternating)
      bg: 'bg-emerald-100 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-200'
    }
  ];

  // Function to get dialogue character color index (proper alternating - no state updates during render)
  const getDialogueCharacterIndex = (character: string, isTeacher: boolean, role: string): number => {
    // Only teachers and students keep their fixed colors - everyone else gets alternating colors
    if (isTeacher || role === 'teacher' || role === 'student') {
      console.log(`🎓 Fixed color for "${character}" (${role})`);
      return 0; // Index doesn't matter for fixed colors
    }

    // SIMPLE DETERMINISTIC ALTERNATING: No state updates during render
    const characterName = character.toLowerCase().trim();

    let colorIndex: number;
    if (characterName.includes('sarah')) {
      colorIndex = 0; // Purple
      console.log(`🎭 FORCED color assignment for "${character}": Index ${colorIndex} (Purple)`);
    } else if (characterName.includes('mark')) {
      colorIndex = 1; // Emerald
      console.log(`🎭 FORCED color assignment for "${character}": Index ${colorIndex} (Emerald)`);
    } else if (characterName.includes('alice')) {
      colorIndex = 0; // Purple (alternating back)
    } else if (characterName.includes('bob')) {
      colorIndex = 1; // Emerald
    } else if (characterName.includes('carol')) {
      colorIndex = 0; // Purple
    } else if (characterName.includes('david')) {
      colorIndex = 1; // Emerald
    } else {
      // For unknown characters, use a simple hash
      let hash = 0;
      for (let i = 0; i < character.length; i++) {
        hash = character.charCodeAt(i) + ((hash << 5) - hash);
      }
      colorIndex = Math.abs(hash) % 2;
      console.log(`🎭 HASH color assignment for "${character}": Index ${colorIndex} (${colorIndex === 0 ? 'Purple' : 'Emerald'})`);
    }

    return colorIndex;
  };

  // Debug function to log character assignments
  const debugCharacterAssignment = (character: string, colorIndex: number, colorScheme: any) => {
    console.log(`🎨 Character: "${character}" → Color Index: ${colorIndex} → Color: ${colorScheme.bg}`);
  };

  // Function to get character color scheme (simplified for dialogue alternating)
  const getCharacterColorScheme = (character: string, isTeacher: boolean, role: string, colorIndex: number) => {
    // Teacher: Always green
    if (isTeacher || role === 'teacher') {
      return {
        bg: 'bg-green-100 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-600 dark:text-green-200'
      };
    }

    // Student: Always blue
    if (role === 'student') {
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-600 dark:text-blue-200'
      };
    }

    // For all other characters: Use simple alternating dialogue colors (purple and emerald)
    // This creates the alternating effect like in your image
    return DIALOGUE_COLORS[colorIndex % DIALOGUE_COLORS.length];
  };

  // Preload avatars when lesson content is available
  useEffect(() => {
    if (!template?.template_json?.sections) return;

    const extractCharactersFromSections = (sections: TemplateSection[]): string[] => {
      const characters: string[] = [];

      sections.forEach(section => {
        // Extract from dialogue_lines
        const dialogueLines = safeGetArray(section, 'dialogue_lines');
        dialogueLines.forEach((line: any) => {
          if (typeof line === 'object' && line !== null) {
            const character = safeGetString(line, 'character', '');
            if (character) characters.push(character);
          } else if (typeof line === 'string') {
            const parsed = parseDialogueLine(line);
            if (parsed.character) characters.push(parsed.character);
          }
        });

        // Extract from dialogue_elements
        const dialogueElements = safeGetArray(section, 'dialogue_elements');
        dialogueElements.forEach((element: any) => {
          if (element && typeof element === 'object') {
            const character = safeGetString(element, 'character', '');
            if (character) characters.push(character);
          }
        });
      });

      return Array.from(new Set(characters)); // Remove duplicates
    };

    const characters = extractCharactersFromSections(template.template_json.sections);
    if (characters.length > 0) {
      console.log('🎭 Preloading avatars for characters:', characters);
      preloadAvatars(characters).catch(error => {
        console.warn('Failed to preload some avatars:', error);
      });
    }
  }, [template, preloadAvatars]);

  // Handle preloaded data immediately when component mounts or when preloaded data changes
  useEffect(() => {
    console.log('🔍 LessonMaterialDisplay useEffect triggered:', {
      hasPreloadedData: !!preloadedLessonData,
      lessonId,
      currentLoading: loading
    });

    if (preloadedLessonData) {
      console.log('🚀 Using preloaded lesson data - immediate display');
      console.log('🔍 Preloaded data IDs:', {
        id: preloadedLessonData.id,
        lesson_id: preloadedLessonData.lesson_id,
        tutor_id: preloadedLessonData.tutor_id,
        student_id: preloadedLessonData.student_id
      });

      // CRITICAL: Use lesson_id if available (from history), otherwise use id (from fresh lesson)
      const correctLessonId = preloadedLessonData.lesson_id || preloadedLessonData.id;
      
      console.log('✅ Using lesson ID:', correctLessonId);

      const lessonData = {
        ...preloadedLessonData,
        // CRITICAL FIX: Override id with the correct lesson ID
        id: correctLessonId,  // Use lesson_id from history, or id from fresh lesson
        tutor_id: preloadedLessonData.tutor_id,  // Preserve tutor_id
        student_id: preloadedLessonData.student_id,  // Preserve student_id
        student: {
          name: 'Student',
          target_language: 'en',
          native_language: null,
          level: 'intermediate'
        }
      };

      console.log('🎯 Setting lesson state with correct IDs:', {
        id: lessonData.id,
        tutor_id: lessonData.tutor_id,
        student_id: lessonData.student_id
      });

      setLesson(lessonData as Lesson);
      setError(null); // Clear any previous errors

      if (lessonData.interactive_lesson_content) {
        console.log('🚀 Using preloaded interactive content - immediate template setup', lessonData.interactive_lesson_content);
        const mockTemplate = {
          id: lessonData.lesson_template_id || 'interactive',
          name: lessonData.interactive_lesson_content.template_name || 'Interactive Lesson',
          category: 'Interactive',
          level: lessonData.student?.level || 'intermediate',
          template_json: lessonData.interactive_lesson_content
        } as LessonTemplate;

        setTemplate(mockTemplate);
        console.log('✅ Template set successfully:', {
          templateId: mockTemplate.id,
          templateName: mockTemplate.name,
          hasSections: !!mockTemplate.template_json?.sections,
          sectionsCount: mockTemplate.template_json?.sections?.length || 0,
          templateJsonKeys: Object.keys(mockTemplate.template_json || {})
        });
      } else {
        console.log('❌ No interactive lesson content found in preloaded data');
      }

      console.log('🎯 Setting loading to false');
      setLoading(false);
    }
  }, [preloadedLessonData, lessonId, loading]);

  // Handle database fetch only when needed
  useEffect(() => {
    if (!user || !lessonId || preloadedLessonData || lesson?.id === lessonId) return;

    // Only fetch from database if no preloaded data
    const fetchLessonData = async () => {
      try {
        console.log('📡 Fetching lesson data from database');
        // Fetch lesson with student details and interactive content
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select(`
            *,
            student:students(
              name,
              target_language,
              native_language,
              level
            )
          `)
          .eq('id', lessonId)
          .eq('tutor_id', user.id)
          .single();

        if (lessonError) {
          throw new Error('Failed to fetch lesson data');
        }

        if (!lessonData) {
          throw new Error('Lesson not found');
        }

        setLesson(lessonData as Lesson);

        // Check if we have interactive lesson content
        if (lessonData.interactive_lesson_content) {
          // If we have a lesson template ID, fetch the template structure
          if (lessonData.lesson_template_id) {
            const { data: templateData, error: templateError } = await supabase
              .from('lesson_templates')
              .select('*')
              .eq('id', lessonData.lesson_template_id)
              .single();

            if (templateError) {
              console.error('Could not fetch lesson template:', templateError);
              // Fallback to mock template
              const mockTemplate = {
                id: 'interactive',
                name: 'Interactive Lesson',
                category: 'Interactive',
                level: lessonData.student?.level || 'intermediate',
                template_json: lessonData.interactive_lesson_content
              } as LessonTemplate;

              setTemplate(mockTemplate);
            } else {
              // Use the interactive content as the template JSON
              const finalTemplate = {
                ...templateData,
                template_json: lessonData.interactive_lesson_content
              } as LessonTemplate;

              setTemplate(finalTemplate);
            }
          } else {
            // Create a mock template with the interactive content
            const mockTemplate = {
              id: 'interactive',
              name: 'Interactive Lesson',
              category: 'Interactive',
              level: lessonData.student?.level || 'intermediate',
              template_json: lessonData.interactive_lesson_content
            } as LessonTemplate;

            setTemplate(mockTemplate);
          }
        } else {
          // Fall back to generated lessons if no interactive content
          if (lessonData.generated_lessons && lessonData.generated_lessons.length > 0) {
            try {
              const parsedLessons = lessonData.generated_lessons.map((lessonStr: string) =>
                JSON.parse(lessonStr)
              );
              setGeneratedLessons(parsedLessons);
            } catch (parseError) {
              console.error('Error parsing generated lessons:', parseError);
              setError('Failed to parse lesson content');
              return;
            }
          }

          // Fetch lesson template if available for fallback
          if (lessonData.lesson_template_id) {
            const { data: templateData, error: templateError } = await supabase
              .from('lesson_templates')
              .select('*')
              .eq('id', lessonData.lesson_template_id)
              .single();

            if (templateError) {
              console.error('Could not fetch lesson template:', templateError);
            } else {
              setTemplate(templateData as LessonTemplate);
            }
          }
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [user, lessonId, preloadedLessonData, lesson?.id]);

  // Global click handler to close translation popup
  useEffect(() => {
    if (!translationPopup.isVisible) return;

    const handleGlobalClick = () => {
      setTranslationPopup(prev => ({ ...prev, isVisible: false }));
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [translationPopup.isVisible]);

  // Add scroll event listener to dismiss translation popup
  useEffect(() => {
    const handleScroll = () => {
      if (translationPopup.isVisible) {
        setTranslationPopup(prev => ({ ...prev, isVisible: false }));
      }
    };

    // Add scroll event listener to window
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Also listen for scroll events on any scrollable containers within the lesson content
    const scrollableElements = document.querySelectorAll('[data-lesson-content]');
    scrollableElements.forEach(element => {
      element.addEventListener('scroll', handleScroll, { passive: true });
    });

    // Cleanup function to remove event listeners
    return () => {
      window.removeEventListener('scroll', handleScroll);
      scrollableElements.forEach(element => {
        element.removeEventListener('scroll', handleScroll);
      });
    };
  }, [translationPopup.isVisible]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleAudioPlay = (audioId: string) => {
    setIsPlaying(prev => ({
      ...prev,
      [audioId]: !prev[audioId]
    }));

    // Simulate audio playback
    setTimeout(() => {
      setIsPlaying(prev => ({
        ...prev,
        [audioId]: false
      }));
    }, 3000);
  };

  const toggleAnswerReveal = (questionId: string) => {
    setRevealedAnswers(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const translateWord = async (word: string, wordRect: DOMRect) => {
    if (!studentNativeLanguage || isTranslating) return;

    setIsTranslating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/translate-text`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text_to_translate: word,
          target_language_code: studentNativeLanguage
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Translation failed');
      }

      const result = await response.json();

      if (result.success && result.translated_text) {
        setTranslationPopup({
          isVisible: true,
          word: word,
          translation: result.translated_text,
          wordRect: wordRect
        });
      } else {
        throw new Error(result.error || 'Translation failed');
      }
    } catch (error: any) {
      console.error('Translation error:', error);
      toast.error(error.message || 'Failed to translate text');
    } finally {
      setIsTranslating(false);
    }
  };

  // Debounced translation function
  const debouncedTranslateWord = debounce(translateWord, 300);

  const handleTextDoubleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!studentNativeLanguage) return;

    e.preventDefault();

    // Get the selected text
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 0) {
      // Get the range and its bounding rect
      const range = selection?.getRangeAt(0);
      if (range) {
        const rect = range.getBoundingClientRect();

        // Close any existing popup first
        setTranslationPopup(prev => ({ ...prev, isVisible: false }));

        // Trigger translation with debouncing
        debouncedTranslateWord(selectedText, rect);
      }
    }
  };

  const handleTranslateText = async (text: string) => {
    if (!studentNativeLanguage) {
      toast.info("No native language set for this student. Please add it in the student profile.");
      return;
    }

    if (isTranslating) return;

    setIsTranslating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/translate-text`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text_to_translate: text,
          target_language_code: studentNativeLanguage
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Translation failed');
      }

      const result = await response.json();

      if (result.success && result.translated_text) {
        toast.success("Translation successful", {
          description: result.translated_text,
          duration: 5000,
          action: {
            label: "Close",
            onClick: () => { }
          }
        });
      } else {
        throw new Error(result.error || 'Translation failed');
      }
    } catch (error: any) {
      console.error('Translation error:', error);
      toast.error(error.message || 'Failed to translate text');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleExportLesson = () => {
    if (!lesson) return;

    const fileName = `lesson-${lesson.student.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}`;
    showImprovedExportDialog('lesson-content-container', fileName);
  };

  const handleShareLesson = async () => {
    if (!lesson) {
      toast.error('No lesson data available to share.');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to share lessons.');
      return;
    }

    setIsSharing(true);

    try {
      console.log('🔍 DEBUG: Sharing lesson');
      console.log('   Lesson ID:', lesson.id);
      console.log('   Lesson tutor_id:', lesson.tutor_id);
      console.log('   Lesson student_id:', lesson.student_id);
      console.log('   Current user ID:', user.id);
      console.log('   Do IDs match?', lesson.tutor_id === user.id);

      // Check if user is authenticated with Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Authentication error:', sessionError);
        toast.error('Authentication required. Please log in again.');
        setIsSharing(false);
        return;
      }

      console.log('   Session user ID:', session.user.id);
      console.log('   Session matches user?', session.user.id === user.id);
      
      // Verify the lesson exists and we own it
      console.log('🔍 Verifying lesson ownership...');
      const { data: lessonCheck, error: lessonCheckError } = await supabase
        .from('lessons')
        .select('id, tutor_id, student_id')
        .eq('id', lesson.id)
        .single();
      
      if (lessonCheckError) {
        console.error('❌ Lesson verification failed:', lessonCheckError);
        toast.error(`Lesson not found: ${lessonCheckError.message}`);
        setIsSharing(false);
        return;
      }
      
      console.log('✅ Lesson found in database:', lessonCheck);
      console.log('   Lesson tutor_id:', lessonCheck.tutor_id);
      console.log('   Current user ID:', session.user.id);
      console.log('   Ownership match:', lessonCheck.tutor_id === session.user.id);
      
      if (lessonCheck.tutor_id !== session.user.id) {
        console.error('❌ Ownership mismatch!');
        toast.error('You do not own this lesson. Cannot share.');
        setIsSharing(false);
        return;
      }

      // Create a shareable lesson record in the database
      const shareableData = {
        lesson_id: lesson.id,
        student_name: lesson.student?.name || 'Student',
        lesson_title: lesson.interactive_lesson_content?.name || lesson.interactive_lesson_content?.selected_sub_topic?.title || 'Interactive Lesson',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        is_active: true,
        // Add metadata for rich previews
        lesson_category: lesson.interactive_lesson_content?.selected_sub_topic?.category || lesson.interactive_lesson_content?.category || null,
        lesson_level: lesson.student?.level || lesson.interactive_lesson_content?.level || null,
        // Generate banner image URL from lesson content
        banner_image_url: getLessonBannerUrl(lesson)
      };

      console.log('Attempting to insert shareableData:', shareableData);

      const { data: shareRecord, error } = await supabase
        .from('shared_lessons')
        .insert(shareableData)
        .select()
        .single();

      console.log('Supabase response:', { shareRecord, error });

      if (error) {
        console.error('Supabase error details:', error);

        // Check for specific RLS policy errors
        if (error.code === '42501' || error.message?.includes('policy')) {
          throw new Error('Permission denied. Make sure you own this lesson.');
        } else if (error.code === '23503') {
          throw new Error('Lesson not found or invalid lesson ID.');
        } else {
          throw new Error(`Database error: ${error.message}`);
        }
      }

      if (!shareRecord) {
        throw new Error('No record returned from database');
      }

      // Generate shareable URL using the record ID
      const generatedShareUrl = `${window.location.origin}/shared-lesson/${shareRecord.id}`;
      console.log('Generated share URL:', generatedShareUrl);

      // Store the share URL in state to show the buttons
      setShareUrl(generatedShareUrl);

      // Copy to clipboard automatically
      await navigator.clipboard.writeText(generatedShareUrl);

      toast.success('Lesson link created and copied to clipboard!', {
        description: `"${lesson.interactive_lesson_content?.name || lesson.interactive_lesson_content?.selected_sub_topic?.title || 'Interactive Lesson'}" - Link expires in 7 days.`,
        duration: 5000,
      });

    } catch (error: any) {
      console.error('Error sharing lesson:', error);
      toast.error(`Failed to create shareable link: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link to clipboard');
    }
  };

  const handleOpenLink = () => {
    if (!shareUrl) return;
    window.open(shareUrl, '_blank');
  };

  const renderTemplateSection = (section: TemplateSection, lessonIndex: number = 0) => {
    if (!template) return null;

    // Defensive check for section object
    if (!section || typeof section !== 'object') {
      console.warn('Invalid section object:', section);
      return (
        <div key="invalid-section" className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
          <p className="text-red-600 dark:text-red-400">Invalid section data</p>
        </div>
      );
    }

    const colors = template.template_json.colors || {};
    const currentLesson = generatedLessons[lessonIndex];

    // Get background color class
    const getBgColor = (colorVar?: string) => {
      if (!colorVar || !colors) return '';
      return colors[colorVar as keyof typeof colors] || '';
    };

    const sectionId = safeGetString(section, 'id', 'unknown-section');
    const sectionType = safeGetString(section, 'type', 'unknown');

    // console.log('🔍 Rendering section:', sectionId, 'type:', sectionType, 'title:', safeGetString(section, 'title', 'No title'));
    
    switch (sectionType) {
      case 'title':
        const lessonTitle = safeGetString(section, 'title', 'Lesson Title');
        const lessonSubtitle = section.subtitle ? safeGetString(section, 'subtitle', '') : undefined;

        return (
          <div key={sectionId} className="mb-8">
            <LessonBannerImage
              title={lessonTitle}
              subtitle={lessonSubtitle}
              subject={lesson?.student?.target_language}
              level={lesson?.student?.level}
              className="mb-6"
            />
          </div>
        );

      case 'info_card':
        const objectives = safeGetArray(section, 'items');
        const cardContent = getInfoCardContent(section);

        return (
          <Card key={sectionId} className={`mb-6 floating-card glass-effect border-cyber-400/20 ${getBgColor(section.background_color_var)}`}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-cyber-400" />
                {safeGetString(section, 'title', 'Information')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Check if we have content as a string */}
              {cardContent ? (
                <div
                  className="prose max-w-none info-card-content"
                  onDoubleClick={handleTextDoubleClick}
                >
                  {/* Process markdown content with icons */}
                  <div className="space-y-4">
                    {processGrammarContent(cardContent)}
                  </div>
                </div>
              ) : objectives.length > 0 ? (
                <ul className="space-y-2">
                  {objectives.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300" onDoubleClick={handleTextDoubleClick}>{safeStringify(item)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ AI-generated content not available for this section. Please regenerate the lesson material.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'exercise':
        // console.log('🎯 EXERCISE case - calling renderExerciseContent for section:', safeGetString(section, 'title', 'Exercise'));
        return (
          <Card key={sectionId} className="mb-6 floating-card glass-effect border-cyber-400/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-cyber-400" />
                {safeGetString(section, 'title', 'Exercise')}
              </CardTitle>
              {section.instruction && (
                <div className={`p-3 rounded-lg ${getBgColor(section.instruction_bg_color_var)}`}>
                  <p
                    className="text-sm font-medium text-gray-900 dark:text-gray-900"
                    onDoubleClick={handleTextDoubleClick}
                  >
                    {safeGetString(section, 'instruction', '')}
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {renderExerciseContent(section, lessonIndex)}
            </CardContent>
          </Card>
        );

      case 'objectives':
        const objectiveItems = safeGetArray(section, 'objectives') || safeGetArray(section, 'items');

        return (
          <Card key={sectionId} className={`mb-6 floating-card glass-effect border-blue-400/20 ${getBgColor(section.background_color_var)}`}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-500" />
                {safeGetString(section, 'title', 'Learning Objectives')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {objectiveItems.length > 0 ? (
                <ul className="space-y-2">
                  {objectiveItems.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <Target className="w-4 h-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300" onDoubleClick={handleTextDoubleClick}>{safeStringify(item)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="prose max-w-none lesson-content">
                  <div className="lesson-section-content" onDoubleClick={handleTextDoubleClick}>
                    {generateFallbackContent(section, lesson?.student?.level || 'intermediate')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'activities':
        const activityItems = safeGetArray(section, 'activities') || safeGetArray(section, 'items');

        // Debug logging to see what's in the section
        console.log('🔍 Activities section debug:', {
          sectionId,
          sectionKeys: Object.keys(section),
          activitiesField: (section as any).activities,
          itemsField: (section as any).items,
          activityItems,
          fullSection: section
        });

        return (
          <Card key={sectionId} className={`mb-6 floating-card glass-effect border-green-400/20 ${getBgColor(section.background_color_var)}`}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-500" />
                {safeGetString(section, 'title', 'Activities')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityItems.length > 0 ? (
                <ul className="space-y-2">
                  {activityItems.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <ArrowRight className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300" onDoubleClick={handleTextDoubleClick}>{safeStringify(item)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="prose max-w-none">
                  <div onDoubleClick={handleTextDoubleClick}>
                    {generateFallbackContent(section, lesson?.student?.level || 'intermediate')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'materials':
        const materialItems = safeGetArray(section, 'materials') || safeGetArray(section, 'items');

        return (
          <Card key={sectionId} className={`mb-6 floating-card glass-effect border-purple-400/20 ${getBgColor(section.background_color_var)}`}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-purple-500" />
                {safeGetString(section, 'title', 'Materials')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {materialItems.length > 0 ? (
                <ul className="space-y-2">
                  {materialItems.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <PenTool className="w-4 h-4 mr-2 mt-0.5 text-purple-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300" onDoubleClick={handleTextDoubleClick}>{safeStringify(item)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="prose max-w-none">
                  <div onDoubleClick={handleTextDoubleClick}>
                    {generateFallbackContent(section, lesson?.student?.level || 'intermediate')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'assessment':
        const assessmentItems = safeGetArray(section, 'assessment') || safeGetArray(section, 'items');

        return (
          <Card key={sectionId} className={`mb-6 floating-card glass-effect border-orange-400/20 ${getBgColor(section.background_color_var)}`}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2 text-orange-500" />
                {safeGetString(section, 'title', 'Assessment')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assessmentItems.length > 0 ? (
                <ul className="space-y-2">
                  {assessmentItems.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-orange-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300" onDoubleClick={handleTextDoubleClick}>{safeStringify(item)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="prose max-w-none">
                  <div onDoubleClick={handleTextDoubleClick}>
                    {generateFallbackContent(section, lesson?.student?.level || 'intermediate')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      default:
        console.warn(`Unknown section type: ${sectionType}`);
        return (
          <div key={sectionId} className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
            <p className="text-yellow-600">Unknown section type: {sectionType}</p>
          </div>
        );
    }
  };

  // Process content and replace markdown headers with styled components directly
  const processGrammarContent = (content: string) => {
    // console.log('🔧 processGrammarContent called with content:', content.substring(0, 100) + '...');
    // Split content by lines and process each line
    const lines = content.split('\n');
    const processedElements: React.ReactNode[] = [];
    let currentParagraph: string[] = [];
    
    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const paragraphText = currentParagraph.join('\n').trim();
        if (paragraphText) {
          processedElements.push(
            <p key={processedElements.length} className="mb-3 leading-relaxed text-gray-700 dark:text-gray-300" onDoubleClick={handleTextDoubleClick}>
              {paragraphText}
            </p>
          );
        }
        currentParagraph = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('## ')) {
        flushParagraph();
        const headerText = trimmedLine.substring(3).trim();
        // console.log('✅ Processing H2 header:', headerText);
        processedElements.push(
          <h2 key={processedElements.length} className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-300 mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-400">
            {headerText}
          </h2>
        );
      } else if (trimmedLine.startsWith('### ')) {
        flushParagraph();
        const headerText = trimmedLine.substring(4).trim();
        processedElements.push(
          <h3 key={processedElements.length} className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 mt-5 bg-gray-50 dark:bg-gray-800/50 p-3 rounded border-l-4 border-gray-400">
            {headerText}
          </h3>
        );
      } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        flushParagraph();
        const boldText = trimmedLine.substring(2, trimmedLine.length - 2);
        processedElements.push(
          <p key={processedElements.length} className="mb-2 font-bold text-gray-900 dark:text-gray-100 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">
            {boldText}
          </p>
        );
      } else if (trimmedLine.startsWith('- ')) {
        flushParagraph();
        const listText = trimmedLine.substring(2).trim();
        processedElements.push(
          <li key={processedElements.length} className="mb-2 text-gray-700 dark:text-gray-300 leading-relaxed ml-4 list-disc" onDoubleClick={handleTextDoubleClick}>
            {listText}
          </li>
        );
      } else if (trimmedLine === '') {
        flushParagraph();
      } else {
        currentParagraph.push(line);
      }
    });
    
    flushParagraph();
    return processedElements;
  };

  const renderExerciseContent = (
    section: TemplateSection,
    lessonIndex: number
  ) => {
    const currentLesson = generatedLessons[lessonIndex];
    const contentType = safeGetString(section, 'content_type', 'unknown');
    // console.log('🔍 renderExerciseContent - contentType:', contentType, 'section:', safeGetString(section, 'title', 'No title'));

    switch (contentType) {
      case 'list': {
        // PRIORITY 1: Check AI-generated content first
        const aiPlaceholderKey = safeGetString(section, 'ai_placeholder');
        let items = safeGetArray(section, 'items');
        
        // If items is empty, check if AI filled the placeholder field
        if (items.length === 0 && aiPlaceholderKey) {
          // Check if content is in the correct place (new field with ai_placeholder name)
          if (aiPlaceholderKey.length < 100) {
            const aiContent = (section as any)[aiPlaceholderKey];
            if (aiContent) {
              // AI content might be an array or a string
              if (Array.isArray(aiContent)) {
                items = aiContent;
                console.log(`✅ Using AI-generated items from CORRECT field "${aiPlaceholderKey}":`, items.length, 'items');
              } else if (typeof aiContent === 'string') {
                // Try to parse as JSON first (for legacy pronunciation content)
                try {
                  const parsed = JSON.parse(aiContent);
                  if (Array.isArray(parsed)) {
                    // Extract text from JSON objects
                    items = parsed.map(obj => {
                      if (typeof obj === 'object' && obj !== null) {
                        // Handle pronunciation format: {"word":"telephone","contains":"cognate"}
                        if (obj.word && obj.contains) {
                          return `${obj.word} - ${obj.contains}`;
                        }
                        // Handle other object formats
                        return obj.text || obj.content || obj.word || JSON.stringify(obj);
                      }
                      return String(obj);
                    });
                    console.log(`✅ Parsed legacy JSON content from "${aiPlaceholderKey}":`, items.length, 'items');
                  } else {
                    // Single JSON object
                    items = [JSON.stringify(parsed)];
                  }
                } catch (e) {
                  // Not JSON, split string content into items
                  items = aiContent.split('\n').filter(line => line.trim());
                  console.log(`✅ Using AI-generated content from CORRECT field "${aiPlaceholderKey}" (split into items):`, items.length, 'items');
                }
              }
            }
          }
          
          // TEMPORARY FIX: Check if content is wrongly placed IN the ai_placeholder field itself
          if (items.length === 0 && aiPlaceholderKey.length > 100) {
            // Try to parse as JSON first (for legacy pronunciation content)
            try {
              const parsed = JSON.parse(aiPlaceholderKey);
              if (Array.isArray(parsed)) {
                // Extract text from JSON objects
                items = parsed.map(obj => {
                  if (typeof obj === 'object' && obj !== null) {
                    // Handle pronunciation format: {"word":"telephone","contains":"cognate"}
                    if (obj.word && obj.contains) {
                      return `${obj.word} - ${obj.contains}`;
                    }
                    // Handle other object formats
                    return obj.text || obj.content || obj.word || JSON.stringify(obj);
                  }
                  return String(obj);
                });
                console.log(`⚠️ Parsed legacy JSON from ai_placeholder:`, items.length, 'items');
              } else {
                items = [JSON.stringify(parsed)];
              }
            } catch (e) {
              // Not JSON, content is wrongly in ai_placeholder field
              if (aiPlaceholderKey.includes('\n')) {
                items = aiPlaceholderKey.split('\n').filter(line => line.trim());
                console.log(`⚠️ Using AI content WRONGLY placed in ai_placeholder (split into items):`, items.length, 'items');
              } else {
                items = [aiPlaceholderKey];
                console.log(`⚠️ Using AI content WRONGLY placed in ai_placeholder (single item)`);
              }
            }
          }
        }

        if (items.length === 0) {
          return (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ No items available for this exercise. Please regenerate the lesson material.
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-3">
            {items.map((item: string, index: number) => {
              const itemText = safeStringify(item);

              // Process markdown formatting for expressions and other content
              const processedContent = itemText
                .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-gray-100">$1</strong>')
                .replace(/\*([^*]+)\*/g, '<em class="italic text-gray-600 dark:text-gray-400">$1</em>');

              return (
                <div
                  key={index}
                  className="p-3 bg-gradient-to-r from-cyber-50/50 to-neon-50/50 dark:from-cyber-900/20 dark:to-neon-900/20 rounded-lg border border-cyber-400/20"
                  onDoubleClick={handleTextDoubleClick}
                >
                  <span
                    className="font-medium text-gray-700 dark:text-gray-300"
                    dangerouslySetInnerHTML={{ __html: processedContent }}
                  />
                </div>
              );
            })}
          </div>
        );
      }

      case 'text': {
        // PRIORITY 1: Check AI-generated content first
        const aiPlaceholderKey = safeGetString(section, 'ai_placeholder');
        let textContent = safeGetString(section, 'content', '');
        
        // If content is empty or placeholder, check if AI filled the placeholder field
        if ((!textContent || textContent === 'Content will be displayed here.') && aiPlaceholderKey) {
          // Check if content is in the correct place (new field with ai_placeholder name)
          if (aiPlaceholderKey.length < 100) {
            const aiContent = (section as any)[aiPlaceholderKey];
            if (aiContent) {
              textContent = safeStringify(aiContent);
              console.log(`✅ Using AI-generated text from CORRECT field "${aiPlaceholderKey}":`, textContent.substring(0, 100) + '...');
            }
          }
          
          // TEMPORARY FIX: Check if content is wrongly placed IN the ai_placeholder field itself
          if ((!textContent || textContent === 'Content will be displayed here.') && aiPlaceholderKey.length > 100) {
            textContent = aiPlaceholderKey;
            console.log(`⚠️ Using AI content WRONGLY placed in ai_placeholder field:`, textContent.substring(0, 100) + '...');
          }
        }
        
        // If still no content, show error message
        if (!textContent || textContent === 'Content will be displayed here.') {
          return (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Content not available for this section. Please regenerate the lesson material.
              </p>
            </div>
          );
        }

        // AGGRESSIVE GRAMMAR DETECTION: Format ANY content that contains grammar patterns
        // This ensures NO asterisks or raw markdown EVER appears in grammar explanations
        if (textContent.includes('**') || textContent.includes('* ') || textContent.includes('##') || textContent.includes('###') ||
          textContent.includes('Grammar Focus') || textContent.includes('Formation Rules') || textContent.includes('Examples') ||
          textContent.includes('Imperative Verbs') || textContent.includes('Modal Verbs') ||
          textContent.includes('Conditional Sentences') || textContent.includes('Passive voice') ||
          textContent.includes('emergency situations') || textContent.includes('grammatical structures')) {

          // console.log('🎯 FORMATTING GRAMMAR CONTENT - Processing headers and markdown!');

          // Process grammar content with professional formatting
          const sections = textContent.split('\n\n').filter(s => s.trim());

          return (
            <div className="space-y-8 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              {sections.map((section, sectionIndex) => {
                const lines = section.split('\n').filter(l => l.trim());

                return (
                  <div key={sectionIndex} className="space-y-6">
                    {lines.map((line, lineIndex) => {
                      const trimmedLine = line.trim();

                      // Handle ## headers
                      if (trimmedLine.startsWith('## ')) {
                        const headerText = trimmedLine.substring(3).trim();
                        return (
                          <h2 key={lineIndex} className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-300 mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            {headerText}
                          </h2>
                        );
                      }
                      
                      // Handle ### headers
                      else if (trimmedLine.startsWith('### ')) {
                        const headerText = trimmedLine.substring(4).trim();
                        return (
                          <h3 key={lineIndex} className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 mt-5 bg-gray-50 dark:bg-gray-800/50 p-3 ">
                            {headerText}
                          </h3>
                        );
                      }
                      
                      // Handle grammar rules like "**Imperative Verbs:** These are used..."
                      else if (trimmedLine.match(/^\*\*([^*]+)\*\*:\s*(.*)/)) {
                        const match = trimmedLine.match(/^\*\*([^*]+)\*\*:\s*(.*)/);
                        if (match) {
                          const [, grammarType, explanation] = match;
                          return (
                            <div key={lineIndex} className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 p-6 rounded-lg border border-blue-300 dark:border-blue-700 shadow-sm">
                              <div className="flex flex-col space-y-4">
                                <h4 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                  {grammarType}
                                </h4>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base" onDoubleClick={handleTextDoubleClick}>
                                  {explanation}
                                </p>
                              </div>
                            </div>
                          );
                        }
                      }

                      // Handle regular paragraphs with enhanced formatting
                      else if (trimmedLine.length > 0) {
                        const processedContent = trimmedLine
                          .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-slate-100">$1</strong>')
                          .replace(/\*([^*]+)\*/g, '<em class="italic text-slate-600 dark:text-slate-400">$1</em>')
                          .replace(/'([^']+)'/g, '<span class="font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-1 rounded">\'$1\'</span>');

                        return (
                          <p
                            key={lineIndex}
                            className="text-slate-700 dark:text-slate-300 leading-relaxed text-base mb-6"
                            onDoubleClick={handleTextDoubleClick}
                            dangerouslySetInnerHTML={{ __html: processedContent }}
                          />
                        );
                      }

                      return null;
                    }).filter(Boolean)}
                  </div>
                );
              })}
            </div>
          );
        }

        // Default text rendering - process markdown content with icons
        return (
          <div className="prose max-w-none">
            <div className="space-y-4" onDoubleClick={handleTextDoubleClick}>
              {processGrammarContent(textContent)}
            </div>
          </div>
        );
      }

      case 'grammar_explanation': {
        // PRIORITY 1: Check AI-generated content first
        const aiPlaceholderKey = safeGetString(section, 'ai_placeholder');
        let explanationContent = '';
        
        // Check AI placeholder field first
        if (aiPlaceholderKey) {
          // Check if content is in the correct place (new field with ai_placeholder name)
          if (aiPlaceholderKey.length < 100) {
            const aiContent = (section as any)[aiPlaceholderKey];
            if (aiContent) {
              explanationContent = safeStringify(aiContent);
              console.log(`✅ Using AI-generated grammar explanation from CORRECT field "${aiPlaceholderKey}"`);
            }
          }
          
          // TEMPORARY FIX: Check if content is wrongly placed IN the ai_placeholder field itself
          if (!explanationContent && aiPlaceholderKey.length > 100) {
            explanationContent = aiPlaceholderKey;
            console.log(`⚠️ Using AI grammar explanation WRONGLY placed in ai_placeholder field`);
          }
        }
        
        // Fallback to other fields if no AI content
        if (!explanationContent) {
          explanationContent = safeGetString(section, 'explanation_content', '') || safeGetString(section, 'content', '');
        }

        // Generate fallback content if empty
        if (!explanationContent || explanationContent.trim() === '' || explanationContent === 'Content will be displayed here.') {
          const currentLevel = lesson?.student?.level || 'intermediate';
          const levelLower = currentLevel.toLowerCase();

          if (levelLower === 'a1' || levelLower === 'a2') {
            explanationContent = `## Grammar Focus: Basic Grammar Rules

### Formation Rules
Follow these simple steps to build correct sentences:
1. **Subject** (who or what)
2. **Verb** (action word)  
3. **Object** (receives the action)

### Examples

**Positive/Affirmative:**
- I eat breakfast every morning.
- She studies English at school.
- They play football on weekends.

**Negative:**
- I do not eat meat.
- She does not like coffee.

**Questions:**
- Do you speak English?
- What time do you wake up?

### When to Use
Use this grammar pattern for:
- Daily activities and routines
- Simple statements about facts
- Basic conversations

### Common Mistakes
- ❌ "I no eat meat" → ✅ "I do not eat meat"
- ❌ "She like coffee" → ✅ "She likes coffee"

### Memory Tips
Remember: **Subject + Verb + Object** = Complete sentence
Think: "Who does what to whom?"`;
          } else if (levelLower === 'b1' || levelLower === 'b2') {
            explanationContent = `## Grammar Focus: Intermediate Grammar Concepts

### Formation Rules
This grammar structure follows these patterns:
1. **Main clause** + **connecting word** + **dependent clause**
2. Use appropriate **tense consistency** throughout
3. Apply **subject-verb agreement** rules

### Examples

**Positive/Affirmative:**
- I have been studying English for three years.
- She will have finished her project by tomorrow.
- They had already left when we arrived.

**Negative:**
- I haven't been feeling well lately.
- She won't have completed the task on time.

**Questions:**
- How long have you been working here?
- Will you have finished by 5 PM?

### When to Use
Apply this grammar for:
- **Expressing duration** and time relationships
- **Connecting past, present, and future** events
- **Showing cause and effect** relationships
- **Academic and professional** communication

### Common Mistakes
- ❌ "I am studying English since 2020" → ✅ "I have been studying English since 2020"
- ❌ "She will finished tomorrow" → ✅ "She will have finished tomorrow"

### Memory Tips
- **Present Perfect**: Past action, present relevance
- **Future Perfect**: Action completed before future time
- Use **time markers** (since, for, by, already) as clues

### Comparison with Simple Tenses
**Simple Present**: "I work" (general fact)
**Present Perfect**: "I have worked" (experience/duration)
**Present Perfect Continuous**: "I have been working" (ongoing duration)`;
          } else {
            explanationContent = `## Grammar Focus: Advanced Grammatical Structures

### Formation Rules
Complex grammatical constructions require:
1. **Syntactic awareness** of clause relationships
2. **Semantic precision** in meaning construction
3. **Pragmatic sensitivity** to context and register
4. **Stylistic consideration** of rhetorical effect

### Examples

**Formal/Academic:**
- Having thoroughly analyzed the data, researchers concluded that the hypothesis was supported.
- Were it not for the intervention, the outcome would have been significantly different.
- The extent to which these findings can be generalized remains to be determined.

**Professional/Business:**
- Should you require further clarification, please do not hesitate to contact us.
- Having reviewed your proposal, we are pleased to inform you of our acceptance.

**Literary/Sophisticated:**
- Scarcely had the sun risen when the village began to stir with activity.
- Not only did she excel academically, but she also demonstrated exceptional leadership qualities.

### When to Use
Deploy these structures for:
- **Academic writing** and research papers
- **Professional correspondence** and reports
- **Formal presentations** and speeches
- **Literary expression** and creative writing

### Common Mistakes
- ❌ "If I would have known" → ✅ "If I had known" (conditional perfection)
- ❌ "Despite of the rain" → ✅ "Despite the rain" (preposition usage)
- ❌ "The reason is because" → ✅ "The reason is that" (redundancy avoidance)

### Memory Tips
- **Inversion patterns**: Negative adverbs trigger subject-verb inversion
- **Conditional hierarchy**: Real → Unreal → Past unreal
- **Register awareness**: Match complexity to audience and purpose

### Stylistic Considerations
**Conciseness vs. Elaboration**: Balance detail with clarity
**Formality Spectrum**: Adjust grammatical choices to context
**Rhetorical Impact**: Use structure to emphasize key points

### Cross-Linguistic Influences
Consider how native language patterns may interfere with target language structures, particularly in:
- **Word order variations**
- **Tense and aspect systems**
- **Modal verb usage**
- **Passive voice preferences**`;
          }
        }

        // Define explicit components for ReactMarkdown with enhanced formatting for grammar explanations
        const enhancedComponents = {
          p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
            <p className="mb-3 leading-relaxed text-gray-700 dark:text-gray-300" onDoubleClick={handleTextDoubleClick} {...props}>
              {children}
            </p>
          ),
          ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
            <ul className="list-disc list-inside mb-4 space-y-2 ml-4" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }: React.OlHTMLAttributes<HTMLOListElement>) => (
            <ol className="list-decimal list-inside mb-4 space-y-2 ml-4" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
            <li className="mb-2 text-gray-700 dark:text-gray-300 leading-relaxed" onDoubleClick={handleTextDoubleClick} {...props}>
              {children}
            </li>
          ),
          strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
            <strong className="font-bold text-gray-900 dark:text-gray-100 bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
            <em className="italic text-blue-600 dark:text-blue-400 font-medium" {...props}>
              {children}
            </em>
          ),
          h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
            <h1 className="text-2xl font-bold mb-4 text-blue-800 dark:text-blue-200 border-b-2 border-blue-200 dark:border-blue-700 pb-2" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
            <h2 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-300 mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-400" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 mt-5 bg-gray-50 dark:bg-gray-800/50 p-3 rounded border-l-4 border-gray-400" {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
            <h4 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-200 mt-4" {...props}>
              {children}
            </h4>
          ),
          blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
            <blockquote className="border-l-4 border-blue-400 bg-blue-50 dark:bg-blue-900/20 pl-4 pr-4 py-3 my-4 rounded-r-lg text-gray-700 dark:text-gray-300" {...props}>
              {children}
            </blockquote>
          ),
          code: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
            <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono border" {...props}>
              {children}
            </code>
          ),
          pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4 border" {...props}>
              {children}
            </pre>
          ),
        };



        // console.log('🎯 GRAMMAR_EXPLANATION case - about to call processGrammarContent with:', explanationContent.substring(0, 100) + '...');
        
        return (
          <div className="space-y-4 grammar-explanation-content">
            {processGrammarContent(explanationContent)}
          </div>
        );
      }

      case 'example_sentences': {
        const sentences = safeGetArray(section, 'sentences');

        if (sentences.length === 0) {
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No example sentences available.</p>
            </div>
          );
        }

        return (
          <div className="space-y-2">
            <ul className="space-y-3">
              {sentences.map((sentence: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                    {index + 1}
                  </span>
                  <span
                    className="text-sm"
                    onDoubleClick={handleTextDoubleClick}
                  >
                    {safeStringify(sentence)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      }

      case 'vocabulary_matching':
      case 'vocabulary': {
        const vocabularyItems = safeGetArray(section, 'vocabulary_items');

        if (vocabularyItems.length === 0) {
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No vocabulary items available for this exercise.</p>
            </div>
          );
        }

        // Transform the vocabulary items to match our enhanced format
        const enhancedVocabularyItems = vocabularyItems.map((item: any) => {
          // Extract data with fallbacks
          const word = safeStringify(item.word || item.name || 'Unknown word');
          const definition = safeStringify(item.definition || item.prompt || item.meaning || 'No definition available');

          // Improved part of speech detection
          let partOfSpeech = 'noun'; // default
          if (item.part_of_speech || item.partOfSpeech || item.pos) {
            partOfSpeech = safeStringify(item.part_of_speech || item.partOfSpeech || item.pos).toLowerCase();
          } else {
            // Enhanced part of speech inference based on word patterns and definition
            const wordLower = word.toLowerCase();
            const defLower = definition.toLowerCase();

            // Check definition for explicit part of speech mentions
            const posMatch = definition.match(/\b(noun|verb|adjective|adverb|preposition|conjunction|pronoun|interjection|article)\b/i);
            if (posMatch) {
              partOfSpeech = posMatch[1].toLowerCase();
            }
            // Specific word-based detection (most accurate)
            else if (wordLower === 'cohabitate' || wordLower === 'communicate' || wordLower === 'participate' ||
              wordLower === 'collaborate' || wordLower === 'negotiate') {
              partOfSpeech = 'verb';
            }
            else if (wordLower === 'extended family' || wordLower === 'nuclear family' || wordLower === 'sibling rivalry' ||
              wordLower === 'relationship status' || wordLower === 'in-laws' || wordLower.includes('family')) {
              partOfSpeech = 'noun';
            }
            // Verb detection patterns
            else if (wordLower.endsWith('ate') || wordLower.endsWith('ize') || wordLower.endsWith('ify') ||
              defLower.includes('to ') || defLower.includes('action of') || defLower.includes('the act of') ||
              defLower.includes('process of') || defLower.startsWith('to ')) {
              partOfSpeech = 'verb';
            }
            // Adjective detection patterns
            else if (wordLower.endsWith('ful') || wordLower.endsWith('less') || wordLower.endsWith('ous') ||
              wordLower.endsWith('ive') || wordLower.endsWith('able') || wordLower.endsWith('ible') ||
              defLower.includes('describes') || defLower.includes('quality') || defLower.includes('characteristic') ||
              defLower.includes('having the quality')) {
              partOfSpeech = 'adjective';
            }
            // Adverb detection patterns
            else if (wordLower.endsWith('ly') || defLower.includes('manner') || defLower.includes('how ') ||
              defLower.includes('in a way') || defLower.includes('to the degree')) {
              partOfSpeech = 'adverb';
            }
            // Preposition detection
            else if (['at', 'in', 'on', 'by', 'for', 'with', 'from', 'to', 'of', 'about', 'under', 'over', 'through', 'during'].includes(wordLower)) {
              partOfSpeech = 'preposition';
            }
            // Compound noun detection (most family/relationship terms are nouns)
            else if (wordLower.includes('relationship') || wordLower.includes('status') || wordLower.includes('rivalry') ||
              wordLower.includes('laws') || defLower.includes('family') || defLower.includes('person') ||
              defLower.includes('group') || defLower.includes('type of') || defLower.includes('a ') ||
              defLower.includes('refers to') || defLower.includes('consists of')) {
              partOfSpeech = 'noun';
            }
          }

          // Generate phonetic pronunciation with better fallbacks
          let phonetic = item.phonetic || item.pronunciation || item.ipa;
          if (!phonetic) {
            // Use the improved phonetic notation generator
            phonetic = generatePhoneticNotation(word);
          } else {
            // Ensure phonetic is wrapped in forward slashes
            if (!phonetic.startsWith('/')) phonetic = '/' + phonetic;
            if (!phonetic.endsWith('/')) phonetic = phonetic + '/';
          }

          // Generate example sentences based on level (ensure correct counts)
          const currentLevel = lesson?.student?.level || 'intermediate';
          const levelLower = currentLevel.toLowerCase();
          let exampleCount = 4; // default

          if (levelLower === 'a1' || levelLower === 'a2') {
            exampleCount = 5;
          } else if (levelLower === 'b1' || levelLower === 'b2') {
            exampleCount = 4;
          } else if (levelLower === 'c1' || levelLower === 'c2') {
            exampleCount = 3;
          }

          let examples: string[] = [];
          if (item.examples && Array.isArray(item.examples)) {
            examples = item.examples.map((ex: any) => safeStringify(ex));
          } else if (item.example_sentences && Array.isArray(item.example_sentences)) {
            examples = item.example_sentences.map((ex: any) => safeStringify(ex));
          } else if (item.sentences && Array.isArray(item.sentences)) {
            examples = item.sentences.map((ex: any) => safeStringify(ex));
          }

          // Use AI-generated examples from lesson content if available, otherwise use fallback
          if (item.examples && Array.isArray(item.examples) && item.examples.length > 0) {
            examples = item.examples.map((ex: any) => safeStringify(ex));
            console.log(`✅ Using AI-generated examples from lesson content for: ${word}`, examples);
          } else if (item.example_sentences && Array.isArray(item.example_sentences) && item.example_sentences.length > 0) {
            examples = item.example_sentences.map((ex: any) => safeStringify(ex));
            console.log(`✅ Using AI-generated example sentences from lesson content for: ${word}`, examples);
          } else if (item.sentences && Array.isArray(item.sentences) && item.sentences.length > 0) {
            examples = item.sentences.map((ex: any) => safeStringify(ex));
            console.log(`✅ Using AI-generated sentences from lesson content for: ${word}`, examples);
          } else {
            // Fallback: Use minimal contextual examples (no hardcoded generic ones)
            const lessonContext = lesson?.interactive_lesson_content?.selected_sub_topic?.title || 'language learning';
            examples = [
              `The word "${word}" is used in the context of ${lessonContext}.`,
              `Understanding "${word}" helps with communication skills.`,
              `Students practice using "${word}" in relevant situations.`
            ].slice(0, exampleCount);
            console.log(`⚠️ Using minimal fallback examples for: ${word} (AI examples missing)`);
          }

          // Bold the vocabulary word in the examples for better visual emphasis
          const boldedExamples = examples.length > 0 ? boldVocabularyInExamples(examples, word) : [];

          // Debug logging for vocabulary processing
          console.log(`🔍 Processing vocabulary word: ${word}`, {
            originalExamples: examples.length,
            boldedExamples: boldedExamples.length,
            finalExamples: boldedExamples.slice(0, exampleCount).length,
            sampleExamples: boldedExamples.slice(0, 2)
          });

          return {
            word,
            partOfSpeech,
            phonetic,
            definition,
            examples: boldedExamples.slice(0, exampleCount),
            level: currentLevel
          };
        });

        // Debug logging before passing to EnhancedVocabularySection
        console.log('🔍 LessonMaterialDisplay - Passing vocabulary items to EnhancedVocabularySection:', {
          itemsCount: enhancedVocabularyItems.length,
          sampleItem: enhancedVocabularyItems[0] ? {
            word: enhancedVocabularyItems[0].word,
            examplesCount: enhancedVocabularyItems[0].examples?.length || 0,
            examples: enhancedVocabularyItems[0].examples
          } : null
        });

        return (
          <EnhancedVocabularySection
            vocabularyItems={enhancedVocabularyItems}
            level={lesson?.student?.level || 'intermediate'}
            onTextDoubleClick={handleTextDoubleClick}
          />
        );
      }

      case 'full_dialogue': {
        const dialogueLines = safeGetArray(section, 'dialogue_lines');

        if (dialogueLines.length === 0) {
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No dialogue content available for this exercise.</p>
            </div>
          );
        }

        return (
          <div className="space-y-3">
            {dialogueLines.map((line, index) => {
              let character: string;
              let text: string;

              // Handle both object format and string format
              if (typeof line === 'object' && line !== null) {
                // Object format: { speaker: "Person A", line: "Hello!" }
                character = safeGetString(line, 'character', 'Speaker');
                text = safeGetString(line, 'text', 'No text available');
              } else {
                // String format: "A: Hello! I am Maria."
                const parsed = parseDialogueLine(line);
                character = parsed.character;
                text = parsed.text;
              }

              // Get character information using the avatar system
              const characterInfo = getCharacterInfo(character);
              const isTeacher = characterInfo.isTeacher;
              const colorIndex = getDialogueCharacterIndex(character, isTeacher, characterInfo.role);
              const colorScheme = getCharacterColorScheme(character, isTeacher, characterInfo.role, colorIndex);

              // Debug logging to see what's happening
              debugCharacterAssignment(character, colorIndex, colorScheme);

              return (
                <div key={index} className="flex items-start space-x-4 mb-4">
                  {/* Avatar with character name below - similar to the provided image */}
                  <div className="flex flex-col items-center space-y-1">
                    <DialogueAvatarErrorBoundary
                      fallbackCharacter={character}
                      fallbackSize="sm"
                    >
                      <DialogueAvatar
                        character={character}
                        isTeacher={isTeacher}
                        role={characterInfo.role}
                        size="sm"
                      />
                    </DialogueAvatarErrorBoundary>
                    {/* Character name below avatar, like in the provided image */}
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center">
                      {character}
                    </span>
                  </div>

                  {/* Message bubble with professional alternating colors */}
                  <div className={`flex-1 p-3 rounded-lg ${colorScheme.bg} border ${colorScheme.border}`}>
                    <p
                      className={`leading-relaxed ${colorScheme.text}`}
                      onDoubleClick={handleTextDoubleClick}
                    >
                      {text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'fill_in_the_blanks_dialogue': {
        const dialogueElements = safeGetArray(section, 'dialogue_elements');

        if (dialogueElements.length === 0) {
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No dialogue elements available for this exercise.</p>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            {dialogueElements.map((element, index) => {
              // Defensive check for element object
              if (!element || typeof element !== 'object') {
                return (
                  <div key={index} className="p-3 border border-red-200 rounded-lg bg-red-50">
                    <p className="text-red-600 text-sm">Invalid dialogue element</p>
                  </div>
                );
              }

              // Determine the element type dynamically
              let determinedElementType = safeGetString(element, 'type', 'unknown');
              if (element.character && element.text && determinedElementType === 'unknown') {
                // If it has character and text, and no explicit type, it's a dialogue line
                determinedElementType = 'dialogue';
              }

              // Handle different element types properly
              if (determinedElementType === 'dialogue') {
                const character = safeGetString(element, 'character', 'Speaker');
                const text = safeGetString(element, 'text', 'No text available');

                // Get character information using the avatar system
                const characterInfo = getCharacterInfo(character);
                const isTeacher = characterInfo.isTeacher;
                const colorIndex = getDialogueCharacterIndex(character, isTeacher, characterInfo.role);
                const colorScheme = getCharacterColorScheme(character, isTeacher, characterInfo.role, colorIndex);

                return (
                  <div key={index} className="flex items-start space-x-4 mb-4">
                    {/* Avatar with character name below - consistent with full_dialogue style */}
                    <div className="flex flex-col items-center space-y-1">
                      <DialogueAvatarErrorBoundary
                        fallbackCharacter={character}
                        fallbackSize="sm"
                      >
                        <DialogueAvatar
                          character={character}
                          isTeacher={isTeacher}
                          role={characterInfo.role}
                          size="sm"
                        />
                      </DialogueAvatarErrorBoundary>
                      {/* Character name below avatar */}
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center">
                        {character}
                      </span>
                    </div>

                    {/* Message bubble with professional alternating colors */}
                    <div className={`flex-1 p-3 rounded-lg ${colorScheme.bg} border ${colorScheme.border}`}>
                      <p
                        className={`leading-relaxed ${colorScheme.text}`}
                        onDoubleClick={handleTextDoubleClick}
                      >
                        {text}
                      </p>
                    </div>
                  </div>
                );
              } else if (determinedElementType === 'multiple_choice') {
                const question = safeGetString(element, 'question', '') || safeGetString(element, 'text', 'Question not available');
                const options = safeGetArray(element, 'options');
                const correctAnswer = safeGetString(element, 'correct_answer', '');

                return (
                  <div key={index} className="border border-cyber-400/20 rounded-lg p-4 bg-gradient-to-r from-yellow-50/50 to-amber-50/50 dark:from-yellow-900/20 dark:to-amber-900/20">
                    <p
                      className="font-medium mb-3"
                      onDoubleClick={handleTextDoubleClick}
                    >
                      {question}
                    </p>
                    <RadioGroup
                      onValueChange={(value) => handleAnswerChange(`${section.id}_mc_${index}`, value)}
                    >
                      {options.length > 0 ? options.map((option: any, optIndex: number) => (
                        <div key={optIndex} className="flex items-center space-x-2">
                          <RadioGroupItem value={safeStringify(option)} id={`${section.id}_${index}_${optIndex}`} />
                          <Label
                            htmlFor={`${section.id}_${index}_${optIndex}`}
                            onDoubleClick={handleTextDoubleClick}
                          >
                            {safeStringify(option)}
                          </Label>
                        </div>
                      )) : (
                        <p className="text-sm text-gray-500">No answer options available</p>
                      )}
                    </RadioGroup>
                    {correctAnswer && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAnswerReveal(`${section.id}_mc_${index}`)}
                          className="text-xs"
                        >
                          {revealedAnswers[`${section.id}_mc_${index}`] ? 'Hide Answer' : 'Show Answer'}
                        </Button>

                        {revealedAnswers[`${section.id}_mc_${index}`] && (
                          <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm">
                            <span className="font-medium text-green-700 dark:text-green-300">Correct answer:</span> {correctAnswer}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              } else {
                // Return a warning for unrecognized element types
                return (
                  <div key={index} className="p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                    <p className="text-yellow-600 text-sm">Unknown element type: {determinedElementType}</p>
                  </div>
                );
              }
            })}
          </div>
        );
      }

      case 'matching': {
        const matchingPairs = safeGetArray(section, 'matching_pairs');

        if (matchingPairs.length === 0) {
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No matching questions available for this exercise.</p>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            {matchingPairs.map((pair, index) => {
              const question = safeGetString(pair, 'question', 'Question not available');
              const answer = safeGetString(pair, 'answer', 'No answer available');
              const pairId = `${section.id}_match_${index}`;

              return (
                <div key={index} className="border border-cyber-400/20 rounded-lg p-4 bg-gradient-to-r from-cyber-50/50 to-neon-50/50 dark:from-cyber-900/20 dark:to-neon-900/20">
                  <div className="space-y-3">
                    <div>
                      <p
                        className="font-medium text-gray-800 dark:text-gray-200"
                        onDoubleClick={handleTextDoubleClick}
                      >
                        {question}
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAnswerReveal(pairId)}
                        className="text-xs"
                      >
                        {revealedAnswers[pairId] ? 'Hide Answer' : 'Show Answer'}
                      </Button>
                    </div>

                    {revealedAnswers[pairId] && (
                      <div className="pl-4 border-l-2 border-cyber-400/30 mt-2">
                        <p
                          className="text-sm text-cyber-600 dark:text-cyber-400 font-medium"
                          onDoubleClick={handleTextDoubleClick}
                        >
                          Answer: {answer}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>Content type &quot;{contentType}&quot; will be displayed here.</p>
          </div>
        );
    }
  };

  const handleTranslationRequest = async () => {
    if (!studentNativeLanguage) {
      toast.info("No native language set for this student. Please add it in the student profile.");
      return;
    }

    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (!selectedText || selectedText.length === 0) {
      toast.info("Please select text to translate by double-clicking on it.");
      return;
    }

    await handleTranslateText(selectedText);
  };

  // Debug logging removed to prevent infinite loop

  if (loading) {
    console.log('❌ Still loading - showing loading screen');
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyber-400 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading lesson material...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Failed to Load Lesson</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-cyber-400 to-neon-400 hover:from-cyber-500 hover:to-neon-500 text-white border-0"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Lesson Not Found</h3>
          <p className="text-muted-foreground">The requested lesson could not be found.</p>
        </div>
      </div>
    );
  }

  // If we have interactive content and a template, render the interactive lesson
  if (lesson.interactive_lesson_content && template) {
    // Defensive check for template structure
    if (!template.template_json || !template.template_json.sections) {
      return (
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Invalid Template Structure</h3>
            <p className="text-muted-foreground">The lesson template has an invalid structure.</p>
          </div>
        </div>
      );
    }

    const sections = safeGetArray(template.template_json, 'sections');

    return (
      <>
        {/* Floating Translation Toggle - Always visible and truly floating */}
        <FloatingTranslationToggle
          isTranslating={isTranslating}
          onToggle={handleTranslationRequest}
          position="bottom-right"
          offset={{ x: 20, y: 40 }}
        />

        <div id="lesson-content-container" className="space-y-6 max-w-4xl mx-auto" data-lesson-content>

          {/* <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start space-x-2 flex-1">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200">
                  Interactive Lesson Material Ready
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  This lesson has been personalized for {lesson.student.name} using the {template.name} template.
                </p>
              </div>
            </div>
          </div> */}

          {sections.map((section, index) =>
            renderTemplateSection(section, 0)
          )}

          <div className="flex justify-center pt-8 space-x-4">
            {!shareUrl ? (
              <Button
                size="lg"
                className="px-8 bg-gradient-to-r from-blue-400 to-indigo-400 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300"
                onClick={handleShareLesson}
                disabled={isSharing}
              >
                {isSharing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Link...
                  </>
                ) : (
                  <>
                    <Share2 className="w-5 h-5 mr-2" />
                    Share with Student
                  </>
                )}
              </Button>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div className="flex space-x-3">
                  <Button
                    size="lg"
                    className="px-6 bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500 text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300"
                    onClick={handleOpenLink}
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Open Link
                  </Button>
                  <Button
                    size="lg"
                    className="px-6 bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300"
                    onClick={handleCopyLink}
                  >
                    <Copy className="w-5 h-5 mr-2" />
                    Copy Link
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Share this link with your student. Link expires in 7 days.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShareUrl(null)}
                  className="text-xs"
                >
                  Create New Link
                </Button>
              </div>
            )}
            {/* Export button temporarily removed */}
            {/* {false && (
              <Button
                size="lg"
                className="px-8 bg-gradient-to-r from-cyber-400 to-neon-400 hover:from-cyber-500 hover:to-neon-500 text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300"
                onClick={handleExportLesson}
              >
                <Download className="w-5 h-5 mr-2" />
                Export Lesson
              </Button>
            )} */}
          </div>

          {/* Translation Popup */}
          {translationPopup.isVisible && translationPopup.wordRect && (
            <WordTranslationPopup
              word={translationPopup.word}
              translation={translationPopup.translation}
              wordRect={translationPopup.wordRect}
              onClose={() => setTranslationPopup(prev => ({ ...prev, isVisible: false }))}
            />
          )}
        </div>
      </>
    );
  }

  // Fall back to basic lesson plan view if no interactive content
  return (
    <div id="lesson-content-container" className="space-y-6" data-lesson-content>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 gradient-text">
          Lesson for {lesson.student.name}
        </h1>
        <div className="flex items-center justify-center space-x-2">
          <Badge variant="outline" className="capitalize border-cyber-400/30">
            {lesson.student.level} Level {lesson.student.target_language}
          </Badge>
          {lesson.student.native_language && (
            <Badge variant="secondary" className="flex items-center">
              <Globe className="w-3 h-3 mr-1" />
              Native: {lesson.student.native_language}
            </Badge>
          )}
        </div>
      </div>

      {generatedLessons.length > 0 ? (
        <div className="space-y-6">
          {generatedLessons.map((lessonPlan, index) => (
            <Card key={index} className="floating-card glass-effect border-cyber-400/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-cyber-400" />
                  {safeStringify(lessonPlan.title)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center text-gray-900 dark:text-gray-100">
                    <Target className="w-4 h-4 mr-2 text-blue-600" />
                    Objectives
                  </h4>
                  <ul className="space-y-2">
                    {Array.isArray(lessonPlan.objectives) && lessonPlan.objectives.map((objective, objIndex) => (
                      <li key={objIndex} className="flex items-start">
                        <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300" onDoubleClick={studentNativeLanguage ? handleTextDoubleClick : undefined}>
                          {safeStringify(objective)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator className="bg-cyber-400/20" />

                <div>
                  <h4 className="font-semibold mb-3 flex items-center text-gray-900 dark:text-gray-100">
                    <Users className="w-4 h-4 mr-2 text-purple-600" />
                    Activities
                  </h4>
                  <ul className="space-y-2">
                    {Array.isArray(lessonPlan.activities) && lessonPlan.activities.map((activity, actIndex) => (
                      <li key={actIndex} className="flex items-start">
                        <ArrowRight className="w-4 h-4 mr-2 mt-0.5 text-purple-500 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300" onDoubleClick={studentNativeLanguage ? handleTextDoubleClick : undefined}>
                          {safeStringify(activity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator className="bg-cyber-400/20" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center text-gray-900 dark:text-gray-100">
                      <BookOpen className="w-4 h-4 mr-2 text-green-600" />
                      Materials
                    </h4>
                    <ul className="space-y-2">
                      {Array.isArray(lessonPlan.materials) && lessonPlan.materials.map((material, matIndex) => (
                        <li key={matIndex} className="flex items-start">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          <span className="text-gray-700 dark:text-gray-300" onDoubleClick={studentNativeLanguage ? handleTextDoubleClick : undefined}>
                            {safeStringify(material)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center text-gray-900 dark:text-gray-100">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-orange-600" />
                      Assessment
                    </h4>
                    <ul className="space-y-2">
                      {Array.isArray(lessonPlan.assessment) && lessonPlan.assessment.map((item, assIndex) => (
                        <li key={assIndex} className="flex items-start">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          <span className="text-gray-700 dark:text-gray-300" onDoubleClick={studentNativeLanguage ? handleTextDoubleClick : undefined}>
                            {safeStringify(item)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-center pt-4 space-x-4">
            {!shareUrl ? (
              <Button
                size="lg"
                className="px-8 bg-gradient-to-r from-blue-400 to-indigo-400 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300"
                onClick={handleShareLesson}
                disabled={isSharing}
              >
                {isSharing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Link...
                  </>
                ) : (
                  <>
                    <Share2 className="w-5 h-5 mr-2" />
                    Share with Student
                  </>
                )}
              </Button>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div className="flex space-x-3">
                  <Button
                    size="lg"
                    className="px-6 bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500 text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300"
                    onClick={handleOpenLink}
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Open Link
                  </Button>
                  <Button
                    size="lg"
                    className="px-6 bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300"
                    onClick={handleCopyLink}
                  >
                    <Copy className="w-5 h-5 mr-2" />
                    Copy Link
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Share this link with your student. Link expires in 7 days.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShareUrl(null)}
                  className="text-xs"
                >
                  Create New Link
                </Button>
              </div>
            )}
            {/* Export button temporarily hidden */}
            {/* {false && (
              <Button
                size="lg"
                className="px-8 bg-gradient-to-r from-cyber-400 to-neon-400 hover:from-cyber-500 hover:to-neon-500 text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300"
                onClick={handleExportLesson}
              >
                <FileText className="w-5 h-5 mr-2" />
                Export Lesson
              </Button>
            )} */}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">No Lesson Content</h3>
          <p className="text-muted-foreground">
            This lesson doesn&apos;t have any generated content yet. Generate lesson plans first, then use &quot;Use This Plan&quot; to create interactive material.
          </p>
        </div>
      )}

      {/* Translation Popup */}
      {translationPopup.isVisible && translationPopup.wordRect && (
        <WordTranslationPopup
          word={translationPopup.word}
          translation={translationPopup.translation}
          wordRect={translationPopup.wordRect}
          onClose={() => setTranslationPopup(prev => ({ ...prev, isVisible: false }))}
        />
      )}
    </div>
  );
}