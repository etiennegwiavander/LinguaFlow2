"use client";

import React from 'react';
import { safeGetString, safeGetArray, debounce } from "@/lib/utils";
import { exportToPdf, exportToWord, showExportDialog } from "@/lib/export-utils";

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
// import {  } from "react";
import { DetailedHTMLProps, HTMLAttributes, useState, useEffect, useRef } from 'react';
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
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
  FileDown,
  Download
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
  status: string;
  materials: string[];
  notes: string | null;
  generated_lessons: string[] | null;
  sub_topics: any[] | null;
  lesson_template_id: string | null;
  interactive_lesson_content: any | null;
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

// Helper function to get content from info_card sections
const getInfoCardContent = (section: TemplateSection): string => {
  console.log('🔍 DEBUG: getInfoCardContent called with section:', {
    id: safeGetString(section, 'id'),
    type: safeGetString(section, 'type'),
    title: safeGetString(section, 'title'),
    ai_placeholder: safeGetString(section, 'ai_placeholder'),
    content_type: safeGetString(section, 'content_type'),
    fullSection: section,
    allKeys: Object.keys(section)
  });

  // Check for content in section.content
  const directContent = safeGetString(section, 'content');
  if (directContent) {
    console.log('✅ Found content in section.content:', directContent.substring(0, 100) + '...');
    return directContent;
  } else {
    console.log('❌ No content found in section.content:', directContent);
  }

  // Check for content in the ai_placeholder field (this should contain the actual content)
  const aiPlaceholderKey = safeGetString(section, 'ai_placeholder');
  if (aiPlaceholderKey && (section as any)[aiPlaceholderKey]) {
    console.log('✅ Found content in ai_placeholder field:', (section as any)[aiPlaceholderKey]);
    return safeStringify((section as any)[aiPlaceholderKey]);
  } else {
    console.log('❌ No content found in ai_placeholder field');
  }

  // Check for content in items array
  const items = safeGetArray(section, 'items');
  if (items.length > 0) {
    console.log('✅ Found content in items array:', items);
    return items.map(item => `• ${safeStringify(item)}`).join('\n');
  } else {
    console.log('❌ No content found in items array');
  }

  // Check for content in other common fields
  const commonContentFields = ['text', 'description', 'summary', 'overview'];
  for (const field of commonContentFields) {
    const fieldContent = safeGetString(section, field);
    if (fieldContent) {
      console.log(`✅ Found content in ${field} field:`, fieldContent);
      return fieldContent;
    }
  }
  console.log('❌ No content found in any common fields');

  // Debug: Log all available fields
  console.log('🔍 All available fields in section:', Object.keys(section).map(key => ({
    key,
    value: (section as any)[key],
    type: typeof (section as any)[key]
  })));

  // Check if there's a 'text' field specifically (this might be where the AI content is stored)
  if ((section as any).text) {
    console.log('✅ Found content in text field:', (section as any).text);
    return safeStringify((section as any).text);
  }

  console.log('❌ No content found anywhere in section');
  return '';
};

export default function LessonMaterialDisplay({ lessonId, studentNativeLanguage }: LessonMaterialDisplayProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
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
  const lessonContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !lessonId) return;

    const fetchLessonData = async () => {
      try {
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

        console.log('🔍 DEBUG: Lesson data fetched:', {
          id: lessonData.id,
          hasInteractiveContent: !!lessonData.interactive_lesson_content,
          interactiveContentType: typeof lessonData.interactive_lesson_content,
          interactiveContent: lessonData.interactive_lesson_content
        });

        setLesson(lessonData as Lesson);

        // Check if we have interactive lesson content
        if (lessonData.interactive_lesson_content) {
          console.log('🔍 DEBUG: Interactive lesson content found:', lessonData.interactive_lesson_content);
          
          // If we have a lesson template ID, fetch the template structure
          if (lessonData.lesson_template_id) {
            const { data: templateData, error: templateError } = await supabase
              .from('lesson_templates')
              .select('*')
              .eq('id', lessonData.lesson_template_id)
              .single();

            if (templateError) {
              console.error('⚠️ Could not fetch lesson template:', templateError);
            } else {
              // Use the interactive content as the template JSON
              const finalTemplate = {
                ...templateData,
                template_json: lessonData.interactive_lesson_content
              } as LessonTemplate;
              
              console.log('🔍 DEBUG: Final template created:', {
                templateId: finalTemplate.id,
                templateName: finalTemplate.name,
                sectionsCount: finalTemplate.template_json.sections?.length,
                sections: finalTemplate.template_json.sections
              });
              
              setTemplate(finalTemplate);
            }
          } else {
            // Create a mock template with the interactive content
            const mockTemplate = {
              id: 'interactive',
              name: 'Interactive Lesson',
              category: 'Interactive',
              level: lessonData.student.level,
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
              console.error('❌ Error parsing generated lessons:', parseError);
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
              console.error('⚠️ Could not fetch lesson template:', templateError);
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
  }, [user, lessonId]);

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
            onClick: () => {}
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
    if (!lesson) {
      toast.error('No lesson data available to export');
      return;
    }

    const fileName = `${lesson.student.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`;
    
    // Show export dialog
    showExportDialog('lesson-content-container', fileName);
  };

  const renderTemplateSection = (section: TemplateSection, lessonIndex: number = 0) => {
    if (!template) return null;

    // Defensive check for section object
    if (!section || typeof section !== 'object') {
      console.warn('Invalid section object:', section);
      return (
        <div key="invalid-section" className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-600">Invalid section data</p>
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

    console.log('🔍 DEBUG: Rendering section:', {
      id: sectionId,
      type: sectionType,
      title: safeGetString(section, 'title', '')
    });

    switch (sectionType) {
      case 'title':
        return (
          <div key={sectionId} className="text-center mb-8">
            <h1 
              className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2 gradient-text"
              onDoubleClick={handleTextDoubleClick}
            >
              {safeGetString(section, 'title', 'Lesson Title')}
            </h1>
            {section.subtitle && (
              <p 
                className="text-xl text-gray-600 dark:text-gray-300"
                onDoubleClick={handleTextDoubleClick}
              >
                {safeGetString(section, 'subtitle', '')}
              </p>
            )}
          </div>
        );

      case 'info_card':
        const objectives = safeGetArray(section, 'items');
        const cardContent = getInfoCardContent(section);

        console.log('🔍 DEBUG: info_card section processing:', {
          sectionId,
          title: safeGetString(section, 'title', 'Information'),
          cardContent: cardContent.length > 50 ? cardContent.substring(0, 50) + '...' : cardContent,
          cardContentLength: cardContent.length,
          objectives: objectives,
          objectivesLength: objectives.length
        });

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
                  className="prose max-w-none"
                  onDoubleClick={handleTextDoubleClick}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {cardContent}
                  </p>
                </div>
              ) : objectives.length > 0 ? (
                <ul className="space-y-2">
                  {objectives.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span onDoubleClick={handleTextDoubleClick}>{safeStringify(item)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No content available for this section.</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'exercise':
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
                    className="text-sm font-medium"
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

      default:
        console.warn(`Unknown section type: ${sectionType}`);
        return (
          <div key={sectionId} className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
            <p className="text-yellow-600">Unknown section type: {sectionType}</p>
          </div>
        );
    }
  };

  const renderExerciseContent = (
    section: TemplateSection, 
    lessonIndex: number
  ) => {
    const currentLesson = generatedLessons[lessonIndex];
    const contentType = safeGetString(section, 'content_type', 'unknown');

    switch (contentType) {
      case 'list': {
        const items = safeGetArray(section, 'items');

        if (items.length === 0) {
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No items available for this exercise.</p>
            </div>
          );
        }

        return (
          <div className="space-y-3">
            {items.map((item: string, index: number) => (
              <div 
                key={index} 
                className="p-3 bg-gradient-to-r from-cyber-50/50 to-neon-50/50 dark:from-cyber-900/20 dark:to-neon-900/20 rounded-lg border border-cyber-400/20"
                onDoubleClick={handleTextDoubleClick}
              >
                <span className="font-medium">{safeStringify(item)}</span>
              </div>
            ))}
          </div>
        );
      }

      case 'text': {
        const textContent = safeGetString(section, 'content', 'Content will be displayed here.');
        
        return (
          <div className="prose max-w-none">
            <div 
              className="whitespace-pre-wrap text-sm leading-relaxed"
              onDoubleClick={handleTextDoubleClick}
            >
              {textContent}
            </div>
          </div>
        );
      }

      case 'grammar_explanation': {
        const explanationContent = safeGetString(section, 'explanation_content', '') || safeGetString(section, 'content', '');
        
        // Define explicit components for ReactMarkdown
        const components = {
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-4 leading-relaxed" onDoubleClick={handleTextDoubleClick} {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-inside mb-4 space-y-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-inside mb-4 space-y-2" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="mb-1" onDoubleClick={handleTextDoubleClick} {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-bold text-gray-900 dark:text-gray-100" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),
  h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-2xl font-bold mb-4" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-xl font-bold mb-3" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-lg font-bold mb-2" {...props}>
      {children}
    </h3>
  ),
};


        return (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown 
              key={explanationContent}
              remarkPlugins={[remarkGfm]}
              components={components}
            >
              {explanationContent}
            </ReactMarkdown>
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

      case 'vocabulary_matching': {
        const vocabularyItems = safeGetArray(section, 'vocabulary_items');

        if (vocabularyItems.length === 0) {
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No vocabulary items available for this exercise.</p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vocabularyItems.map((item, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border border-cyber-400/20 rounded-lg bg-gradient-to-r from-cyber-50/50 to-neon-50/50 dark:from-cyber-900/20 dark:to-neon-900/20">
                {item.image_url && (
                  <img 
                    src={safeStringify(item.image_url)} 
                    alt={safeStringify(item.word || item.name)}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <h4 
                    className="font-semibold"
                    onDoubleClick={handleTextDoubleClick}
                  >
                    {safeStringify(item.word || item.name)}
                  </h4>
                  <p 
                    className="text-sm text-gray-600 dark:text-gray-300"
                    onDoubleClick={handleTextDoubleClick}
                  >
                    {safeStringify(item.definition || item.prompt)}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="border-cyber-400/30 hover:bg-cyber-400/10">
                  <Volume2 className="w-4 h-4 text-cyber-400" />
                </Button>
              </div>
            ))}
          </div>
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
              
              const isTeacher = character.toLowerCase().includes('teacher') || 
                               character.toLowerCase().includes('tutor');
              
              return (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isTeacher ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <span className={`text-xs font-bold ${
                      isTeacher ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {character ? character[0] : '?'}
                    </span>
                  </div>
                  <div className={`flex-1 p-3 rounded-lg ${
                    isTeacher ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 
                    'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  }`}>
                    <p className={`font-medium ${
                      isTeacher ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-200'
                    }`}>
                      {character}:
                    </p>
                    <p onDoubleClick={handleTextDoubleClick}>{text}</p>
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
                const isTeacher = character === 'Tutor' || character.toLowerCase().includes('teacher');
                
                return (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isTeacher ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      <span className={`text-xs font-bold ${
                        isTeacher ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {character[0] || '?'}
                      </span>
                    </div>
                    <div className={`flex-1 p-3 rounded-lg ${
                      isTeacher ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 
                      'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    }`}>
                      <p className={`font-medium ${
                        isTeacher ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-400'
                      }`}>
                        {character}:
                      </p>
                      <p onDoubleClick={handleTextDoubleClick}>{text}</p>
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
            <p>Content type "{contentType}" will be displayed here.</p>
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

  if (loading) {
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
          <h3 className="text-lg font-semibold mb-2">Failed to Load Lesson</h3>
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
          <h3 className="text-lg font-semibold mb-2">Lesson Not Found</h3>
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
            <h3 className="text-lg font-semibold mb-2">Invalid Template Structure</h3>
            <p className="text-muted-foreground">The lesson template has an invalid structure.</p>
          </div>
        </div>
      );
    }

    const sections = safeGetArray(template.template_json, 'sections');

    return (
      <div className="space-y-6 max-w-4xl mx-auto" data-lesson-content ref={lessonContentRef} id="lesson-content-container">
<div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg">
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

  <div className="mt-4 lg:mt-0 lg:ml-4 w-full lg:w-auto flex flex-col sm:flex-row gap-2">
    {studentNativeLanguage && (
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center justify-center space-x-2 border-cyber-400/30 hover:bg-cyber-400/10"
        onClick={handleTranslationRequest}
        disabled={isTranslating}
      >
        {isTranslating ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Globe className="w-4 h-4 mr-2" />
        )}
        <span>Translate Text</span>
      </Button>
    )}
    
    <Button 
      variant="outline"
      size="sm"
      className="flex items-center justify-center space-x-2 border-cyber-400/30 hover:bg-cyber-400/10"
      onClick={handleExportLesson}
    >
      <Download className="w-4 h-4 mr-2" />
      <span>Export Lesson</span>
    </Button>
  </div>
</div>

        {sections.map((section, index) => 
          renderTemplateSection(section, 0)
        )}
        
        <div className="flex justify-center pt-8 space-x-4">
          <Button 
            size="lg" 
            className="px-8 bg-gradient-to-r from-cyber-400 to-neon-400 hover:from-cyber-500 hover:to-neon-500 text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Complete Lesson
          </Button>
          <Button 
            size="lg" 
            className="px-8 bg-gradient-to-r from-cyber-400 to-neon-400 hover:from-cyber-500 hover:to-neon-500 text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300"
            onClick={handleExportLesson}
          >
            <FileDown className="w-5 h-5 mr-2" />
            Export Lesson
          </Button>
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
    );
  }

  // Fall back to basic lesson plan view if no interactive content
  return (
    <div className="space-y-6" data-lesson-content ref={lessonContentRef} id="lesson-content-container">
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

      <div className="flex justify-end mb-4">
        <Button 
          variant="outline"
          size="sm"
          className="flex items-center justify-center space-x-2 border-cyber-400/30 hover:bg-cyber-400/10"
          onClick={handleExportLesson}
        >
          <Download className="w-4 h-4 mr-2" />
          <span>Export Lesson</span>
        </Button>
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
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Target className="w-4 h-4 mr-2 text-blue-600" />
                    Objectives
                  </h4>
                  <ul className="space-y-2">
                    {Array.isArray(lessonPlan.objectives) && lessonPlan.objectives.map((objective, objIndex) => (
                      <li key={objIndex} className="flex items-start">
                        <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                        <span onDoubleClick={studentNativeLanguage ? handleTextDoubleClick : undefined}>
                          {safeStringify(objective)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator className="bg-cyber-400/20" />

                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2 text-purple-600" />
                    Activities
                  </h4>
                  <ul className="space-y-2">
                    {Array.isArray(lessonPlan.activities) && lessonPlan.activities.map((activity, actIndex) => (
                      <li key={actIndex} className="flex items-start">
                        <ArrowRight className="w-4 h-4 mr-2 mt-0.5 text-purple-500 flex-shrink-0" />
                        <span onDoubleClick={studentNativeLanguage ? handleTextDoubleClick : undefined}>
                          {safeStringify(activity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator className="bg-cyber-400/20" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <BookOpen className="w-4 h-4 mr-2 text-green-600" />
                      Materials
                    </h4>
                    <ul className="space-y-2">
                      {Array.isArray(lessonPlan.materials) && lessonPlan.materials.map((material, matIndex) => (
                        <li key={matIndex} className="flex items-start">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          <span onDoubleClick={studentNativeLanguage ? handleTextDoubleClick : undefined}>
                            {safeStringify(material)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-orange-600" />
                      Assessment
                    </h4>
                    <ul className="space-y-2">
                      {Array.isArray(lessonPlan.assessment) && lessonPlan.assessment.map((item, assIndex) => (
                        <li key={assIndex} className="flex items-start">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          <span onDoubleClick={studentNativeLanguage ? handleTextDoubleClick : undefined}>
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
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Lesson Content</h3>
          <p className="text-muted-foreground">
            This lesson doesn't have any generated content yet. Generate lesson plans first, then use "Use This Plan" to create interactive material.
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