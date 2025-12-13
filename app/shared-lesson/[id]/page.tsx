"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  Clock,
  AlertCircle,
  Loader2,
  User,
  GraduationCap
} from 'lucide-react';
import LessonBannerImage from '@/components/lessons/LessonBannerImage';
import EnhancedVocabularySection from '@/components/lessons/EnhancedVocabularySection';
import DialogueAvatar from '@/components/lessons/DialogueAvatar';
import DialogueAvatarErrorBoundary from '@/components/lessons/DialogueAvatarErrorBoundary';
import { useDialogueAvatars } from '@/hooks/useDialogueAvatars';
import {
  CheckCircle2,
  Target,
  MessageSquare,
  Volume2
} from 'lucide-react';

interface SharedLessonData {
  id: string;
  lesson_id: string;
  student_name: string;
  lesson_title: string;
  shared_at: string;
  expires_at: string;
  is_active: boolean;
  lesson: {
    id: string;
    materials: string[];
    student: {
      name: string;
      target_language: string;
      level: string;
    };
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

function SharedLessonPage() {
  const params = useParams();
  const shareId = params.id as string;

  const [sharedLesson, setSharedLesson] = useState<SharedLessonData | null>(null);
  const [lessonContent, setLessonContent] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  const { getCharacterInfo } = useDialogueAvatars();

  const fetchSharedLesson = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch shared lesson data with lesson details
      const { data: sharedData, error: sharedError } = await supabase
        .from('shared_lessons')
        .select(`
          *,
          lesson:lessons (
            id,
            materials,
            interactive_lesson_content,
            lesson_template_id,
            generated_lessons,
            sub_topics,
            notes,
            student:students (
              name,
              target_language,
              level,
              native_language
            )
          )
        `)
        .eq('share_token', shareId)
        .single();

      if (sharedError) {
        throw new Error(`Shared lesson not found: ${sharedError.message}`);
      }

      if (!sharedData) {
        throw new Error('Shared lesson not found');
      }

      // Check if the lesson is expired or inactive
      const now = new Date();
      const expiresAt = new Date(sharedData.expires_at);

      if (!sharedData.is_active || now > expiresAt) {
        setIsExpired(true);
        setError('This lesson link has expired or is no longer active.');
        return;
      }

      setSharedLesson(sharedData);

      // Parse lesson materials - prioritize interactive_lesson_content
      if (sharedData.lesson?.interactive_lesson_content) {
        try {
          let interactiveContent;
          if (typeof sharedData.lesson.interactive_lesson_content === 'string') {
            interactiveContent = JSON.parse(sharedData.lesson.interactive_lesson_content);
          } else {
            interactiveContent = sharedData.lesson.interactive_lesson_content;
          }

          setLessonContent(interactiveContent);

          // Check for template in different possible locations
          if (interactiveContent.template) {
            setTemplate(interactiveContent.template);
          } else if (interactiveContent.sections) {
            // Create a mock template structure
            const mockTemplate = {
              template_json: {
                sections: interactiveContent.sections,
                colors: interactiveContent.colors || {}
              }
            };
            setTemplate(mockTemplate);
          } else {
            // Use the entire interactive content as template
            const mockTemplate = {
              template_json: interactiveContent
            };
            setTemplate(mockTemplate);
          }
        } catch (parseError) {
          setError('Error loading interactive lesson content');
        }
      } else if (sharedData.lesson?.materials && sharedData.lesson.materials.length > 0) {
        const rawMaterial = sharedData.lesson.materials[0];

        try {
          // Try to parse as JSON first
          const materialData = JSON.parse(rawMaterial);
          setLessonContent(materialData);

          if (materialData.template) {
            setTemplate(materialData.template);
          }
        } catch (parseError) {
          // If it's not JSON, treat it as plain text content
          setLessonContent({
            type: 'text',
            content: rawMaterial,
            title: sharedData.lesson_title || 'Lesson Content'
          });
        }
      } else {
        // Try to create a fallback display with available data
        if (sharedData.lesson_title) {
          setLessonContent({
            type: 'fallback',
            title: sharedData.lesson_title,
            content: 'This lesson is available but the content format is not supported for sharing. Please contact your tutor for assistance.'
          });
        } else if (sharedData.lesson?.generated_lessons && sharedData.lesson.generated_lessons.length > 0) {
          try {
            const firstGeneratedLesson = JSON.parse(sharedData.lesson.generated_lessons[0]);
            setLessonContent({
              type: 'generated',
              title: firstGeneratedLesson.title || 'Generated Lesson',
              content: firstGeneratedLesson
            });
          } catch (parseError) {
            setLessonContent({
              type: 'fallback',
              title: 'Lesson Content',
              content: 'This lesson contains generated content that cannot be displayed in the shared format. Please contact your tutor for assistance.'
            });
          }
        } else {
          setError('No lesson materials available');
        }
      }

    } catch (err: any) {
      console.error('Error fetching shared lesson:', err);
      setError(err.message || 'Failed to load shared lesson');
    } finally {
      setLoading(false);
    }
  }, [shareId]);

  useEffect(() => {
    if (shareId) {
      fetchSharedLesson();
    }
  }, [shareId, fetchSharedLesson]);

  // Helper functions to safely get values (mirroring tutor's implementation)
  const safeGetString = (obj: any, key: string, defaultValue: string = '') => {
    if (!obj || typeof obj !== 'object') return defaultValue;
    const value = obj[key];
    return typeof value === 'string' ? value : defaultValue;
  };

  const safeGetArray = (obj: any, key: string) => {
    if (!obj || typeof obj !== 'object') return [];
    const value = obj[key];
    return Array.isArray(value) ? value : [];
  };

  const safeStringify = (value: any) => {
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getBgColor = (colorVar?: string) => {
    if (!colorVar || !template?.template_json?.colors) return '';
    return template.template_json.colors[colorVar] || '';
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

  // Helper function to render exercise content based on content type
  const renderExerciseContent = (section: TemplateSection) => {
    const contentType = safeGetString(section, 'content_type', 'text');
    const sectionTitle = safeGetString(section, 'title', '').toLowerCase();

    // SPECIFIC DETECTION: Only target "Comprehension/Practice Questions" sections
    const isComprehensionQuestions = contentType === 'comprehension_questions' ||
      sectionTitle.includes('comprehension/practice questions') ||
      sectionTitle.includes('comprehension questions') ||
      (sectionTitle.includes('comprehension') && sectionTitle.includes('practice') && sectionTitle.includes('questions'));

    // EMERGENCY OVERRIDE: Only for specific "Comprehension/Practice Questions" sections
    if (sectionTitle.includes('comprehension/practice questions') ||
      sectionTitle.includes('comprehension questions') ||
      (sectionTitle.includes('comprehension') && sectionTitle.includes('practice') && sectionTitle.includes('questions'))) {
      // Try to find ANY array data in the section
      let emergencyQuestions: any[] = [];
      const allKeys = Object.keys(section || {});

      for (const key of allKeys) {
        const value = (section as any)[key];
        if (Array.isArray(value) && value.length > 0) {
          emergencyQuestions = value;
          break;
        }
      }

      if (emergencyQuestions.length > 0) {

        return (
          <div className="space-y-4">
            {emergencyQuestions.map((item: any, index: number) => {
              const questionText = safeGetString(item, 'left', '') ||
                safeGetString(item, 'term', '') ||
                safeGetString(item, 'question', '') ||
                safeGetString(item, 'text', '') ||
                (typeof item === 'string' ? item : `Question ${index + 1}`);

              const answer = safeGetString(item, 'right', '') ||
                safeGetString(item, 'definition', '') ||
                safeGetString(item, 'answer', '') ||
                'Answer not available';

              const questionId = `${section.id}_emergency_override_${index}`;

              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 dark:text-gray-100 flex-1 pr-4">
                      {questionText}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRevealedAnswers(prev => ({
                          ...prev,
                          [questionId]: !prev[questionId]
                        }));
                      }}
                      className="text-xs whitespace-nowrap"
                    >
                      {revealedAnswers[questionId] ? 'Hide Answer' : 'Show Answer'}
                    </Button>
                  </div>

                  {revealedAnswers[questionId] && answer && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        <strong>Answer:</strong> {answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      } else {
        return (
          <div className="text-center py-4 text-gray-500">
            <p>No comprehension questions available.</p>
          </div>
        );
      }
    }

    if (isComprehensionQuestions) {
      // Handle as comprehension questions with Show Answer buttons
      // Try multiple possible field names for questions data
      let questions = safeGetArray(section, 'questions');
      if (questions.length === 0) questions = safeGetArray(section, 'matching_pairs');
      if (questions.length === 0) questions = safeGetArray(section, 'items');
      if (questions.length === 0) questions = safeGetArray(section, 'content');

      // Also try to extract from nested objects
      if (questions.length === 0 && section.dialogue_elements) {
        const dialogueElements = safeGetArray(section, 'dialogue_elements');
        questions = dialogueElements.filter((element: any) =>
          element && (element.type === 'multiple_choice' || element.question || element.text)
        );
      }

      // Try to extract from any array field that contains question-like objects
      if (questions.length === 0) {
        const allKeys = Object.keys(section || {});
        for (const key of allKeys) {
          const value = (section as any)[key];
          if (Array.isArray(value) && value.length > 0) {
            // Check if this array contains question-like objects
            const firstItem = value[0];
            if (firstItem && typeof firstItem === 'object' &&
              (firstItem.question || firstItem.text || firstItem.left || firstItem.term)) {
              questions = value;

              break;
            }
          }
        }
      }



      if (questions.length === 0) {
        // Last resort: try to create questions from any available data
        const allKeys = Object.keys(section || {});
        const potentialData = [];

        for (const key of allKeys) {
          const value = (section as any)[key];
          if (value && (typeof value === 'string' || Array.isArray(value))) {
            potentialData.push({ key, value, type: typeof value });
          }
        }

        // EMERGENCY FALLBACK: If we detect this is supposed to be comprehension questions,
        // try to extract questions from matching_pairs even if they're not in the expected format
        if (isComprehensionQuestions && section.matching_pairs && Array.isArray(section.matching_pairs)) {
          const emergencyQuestions = section.matching_pairs;

          return (
            <div className="space-y-4">
              {emergencyQuestions.map((pair: any, index: number) => {
                const questionText = safeGetString(pair, 'left', '') ||
                  safeGetString(pair, 'term', '') ||
                  safeGetString(pair, 'question', '') ||
                  `Question ${index + 1}`;

                const answer = safeGetString(pair, 'right', '') ||
                  safeGetString(pair, 'definition', '') ||
                  safeGetString(pair, 'answer', '') ||
                  'Answer not available';

                const questionId = `${section.id}_emergency_${index}`;

                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 dark:text-gray-100 flex-1 pr-4">
                        {questionText}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRevealedAnswers(prev => ({
                            ...prev,
                            [questionId]: !prev[questionId]
                          }));
                        }}
                        className="text-xs whitespace-nowrap"
                      >
                        {revealedAnswers[questionId] ? 'Hide Answer' : 'Show Answer'}
                      </Button>
                    </div>

                    {revealedAnswers[questionId] && answer && (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          <strong>Answer:</strong> {answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        }

        return (
          <div className="text-center py-4 text-gray-500">
            <p>No comprehension questions available.</p>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-2 text-xs">
                <summary>Debug Info - Available Data</summary>
                <div className="text-left bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-60">
                  <p><strong>Section Keys:</strong> {allKeys.join(', ')}</p>
                  <p><strong>Content Type:</strong> {contentType}</p>
                  <p><strong>Section Title:</strong> {safeGetString(section, 'title', '')}</p>
                  <p><strong>Is Comprehension Questions:</strong> {isComprehensionQuestions ? 'Yes' : 'No'}</p>
                  <p><strong>Has matching_pairs:</strong> {section.matching_pairs ? 'Yes' : 'No'}</p>
                  <pre className="mt-2 text-xs">{JSON.stringify(section, null, 2)}</pre>
                </div>
              </details>
            )}
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {questions.map((question: any, index: number) => {
            // Handle both question objects and matching pair objects
            const questionText = safeGetString(question, 'question', '') ||
              safeGetString(question, 'text', '') ||
              safeGetString(question, 'left', '') ||
              safeGetString(question, 'term', '') ||
              'Question not available';

            const answer = safeGetString(question, 'answer', '') ||
              safeGetString(question, 'correct_answer', '') ||
              safeGetString(question, 'right', '') ||
              safeGetString(question, 'definition', '');

            const questionId = `${section.id}_question_${index}`;

            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 dark:text-gray-100 flex-1 pr-4">
                    {questionText}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRevealedAnswers(prev => ({
                        ...prev,
                        [questionId]: !prev[questionId]
                      }));
                    }}
                    className="text-xs whitespace-nowrap"
                  >
                    {revealedAnswers[questionId] ? 'Hide Answer' : 'Show Answer'}
                  </Button>
                </div>

                {revealedAnswers[questionId] && answer && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>Answer:</strong> {answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    switch (contentType) {
      case 'list': {
        // PRIORITY 1: Check AI-generated content first (same logic as tutor's view)
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
            <div className="text-center py-4 text-gray-500">
              <p>No items available for this exercise.</p>
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
                >
                  <span
                    className="font-medium"
                    dangerouslySetInnerHTML={{ __html: processedContent }}
                  />
                </div>
              );
            })}
          </div>
        );
      }

      case 'text': {
        // PRIORITY 1: Check AI-generated content first (same logic as tutor's view)
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
        
        // If still no content, use default
        if (!textContent || textContent === 'Content will be displayed here.') {
          textContent = 'Content will be displayed here.';
        }

        // AGGRESSIVE GRAMMAR DETECTION: Format ANY content that contains grammar patterns (exact same as tutor's view)
        // This ensures NO asterisks or raw markdown EVER appears in grammar explanations
        if (textContent.includes('**') || textContent.includes('* ') || textContent.includes('##') || textContent.includes('###') ||
          textContent.includes('Grammar Focus') || textContent.includes('Formation Rules') || textContent.includes('Examples') ||
          textContent.includes('Imperative Verbs') || textContent.includes('Modal Verbs') ||
          textContent.includes('Conditional Sentences') || textContent.includes('Passive voice') ||
          textContent.includes('emergency situations') || textContent.includes('grammatical structures')) {

          console.log('🎯 FORMATTING GRAMMAR CONTENT - Processing headers and markdown!');

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
                          <h2 key={lineIndex} className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-300 mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg ">
                            {headerText}
                          </h2>
                        );
                      }
                      
                      // Handle ### headers
                      else if (trimmedLine.startsWith('### ')) {
                        const headerText = trimmedLine.substring(4).trim();
                        return (
                          <h3 key={lineIndex} className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 mt-5 bg-gray-50 dark:bg-gray-800/50 p-3 rounded ">
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
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base">
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

        // Default text rendering for non-grammar content
        return (
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {textContent}
            </div>
          </div>
        );
      }

      case 'grammar_explanation': {
        let explanationContent = safeGetString(section, 'explanation_content', '') || safeGetString(section, 'content', '');
        if (!explanationContent) {
          explanationContent = 'Grammar explanation content will be displayed here.';
        }

        // AGGRESSIVE GRAMMAR DETECTION: Format ANY content that contains grammar patterns (exact same as tutor's view)
        // This ensures NO asterisks or raw markdown EVER appears in grammar explanations
        if (explanationContent.includes('**') || explanationContent.includes('* ') || explanationContent.includes('##') || explanationContent.includes('###') ||
          explanationContent.includes('Grammar Focus') || explanationContent.includes('Formation Rules') || explanationContent.includes('Examples') ||
          explanationContent.includes('Imperative Verbs') || explanationContent.includes('Modal Verbs') ||
          explanationContent.includes('Conditional Sentences') || explanationContent.includes('Passive voice') ||
          explanationContent.includes('emergency situations') || explanationContent.includes('grammatical structures')) {

          console.log('🎯 FORMATTING GRAMMAR CONTENT - Processing headers and markdown!');

          // Process grammar content with professional formatting
          const sections = explanationContent.split('\n\n').filter(s => s.trim());

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
                          <h2 key={lineIndex} className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-300 mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-400">
                            {headerText}
                          </h2>
                        );
                      }
                      
                      // Handle ### headers
                      else if (trimmedLine.startsWith('### ')) {
                        const headerText = trimmedLine.substring(4).trim();
                        return (
                          <h3 key={lineIndex} className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 mt-5 bg-gray-50 dark:bg-gray-800/50 p-3 rounded border-l-4 border-gray-400">
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
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base">
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

        // Default grammar explanation rendering for content without special patterns
        const processGrammarContent = (content: string) => {
          const cleanedContent = content
            .replace(/^\s+|\s+$/g, '')
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n');

          const paragraphs = cleanedContent.split('\n\n').filter(p => p.trim());

          return paragraphs.map((paragraph, index) => {
            const processedParagraph = paragraph
              .replace(/\*\*([^*\n]+)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-gray-100">$1</strong>')
              .replace(/\*([^*\n]+)\*/g, '<em class="italic text-gray-600 dark:text-gray-400">$1</em>')
              .replace(/\n/g, '<br>');

            return (
              <div
                key={index}
                className="mb-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{
                  __html: processedParagraph
                }}
              />
            );
          });
        };

        return (
          <div className="space-y-2">
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
                  <span className="text-sm">{safeStringify(sentence)}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      }

      case 'vocabulary_matching':
      case 'vocabulary': {
        const vocabularyItems = safeGetArray(section, 'vocabulary_items').map((item: any) => {
          // Extract word using the same logic as tutor's lesson material
          const word = safeStringify(item.word || item.name || 'Unknown word');
          const definition = safeStringify(item.definition || item.prompt || item.meaning || 'No definition available');
          
          // Extract part of speech with fallbacks
          let partOfSpeech = 'noun'; // default
          if (item.part_of_speech || item.partOfSpeech || item.pos) {
            partOfSpeech = safeStringify(item.part_of_speech || item.partOfSpeech || item.pos).toLowerCase();
          }
          
          // Extract phonetic with fallbacks
          let phonetic = item.phonetic || item.pronunciation || item.ipa || '';
          
          // Extract examples with multiple fallback properties
          let examples: string[] = [];
          if (item.examples && Array.isArray(item.examples)) {
            examples = item.examples.map((ex: any) => safeStringify(ex));
          } else if (item.example_sentences && Array.isArray(item.example_sentences)) {
            examples = item.example_sentences.map((ex: any) => safeStringify(ex));
          } else if (item.sentences && Array.isArray(item.sentences)) {
            examples = item.sentences.map((ex: any) => safeStringify(ex));
          }
          
          return {
            word,
            partOfSpeech,
            phonetic,
            definition,
            examples,
            level: sharedLesson?.lesson?.student?.level || 'intermediate'
          };
        });

        if (vocabularyItems.length === 0) {
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No vocabulary items available for this exercise.</p>
            </div>
          );
        }

        return (
          <EnhancedVocabularySection
            vocabularyItems={vocabularyItems}
            level={sharedLesson?.lesson?.student?.level || 'intermediate'}
            className="border-0 shadow-none p-0"
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
          <div className="space-y-4">
            {dialogueLines.map((line: any, index: number) => {
              const character = typeof line === 'object' ? line.character : parseDialogueLine(line).character;
              const text = typeof line === 'object' ? line.text : parseDialogueLine(line).text;
              const translation = typeof line === 'object' ? line.translation : undefined;

              return (
                <div key={index} className="flex items-start gap-3">
                  <DialogueAvatarErrorBoundary>
                    <DialogueAvatar character={character} size="sm" />
                  </DialogueAvatarErrorBoundary>
                  <div className="flex-1">
                    <div className="font-medium text-sm mb-1">{character}</div>
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
                      <p className="text-gray-800">{text}</p>
                      {translation && (
                        <p className="text-sm text-muted-foreground mt-2 italic border-t border-gray-200 pt-2">
                          {translation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'matching': {
        const matchingPairs = safeGetArray(section, 'matching_pairs');
        if (matchingPairs.length === 0) {
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No matching pairs available for this exercise.</p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-3 text-sm">Match the items:</h4>
              <div className="space-y-2">
                {matchingPairs.map((pair: any, index: number) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-sm font-medium">{safeStringify(pair.left || pair.term || pair.question)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">With these:</h4>
              <div className="space-y-2">
                {matchingPairs.map((pair: any, index: number) => (
                  <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-sm">{safeStringify(pair.right || pair.definition || pair.answer)}</span>
                  </div>
                ))}
              </div>
            </div>
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
              if (!element || typeof element !== 'object') {
                return (
                  <div key={index} className="p-3 border border-red-200 rounded-lg bg-red-50">
                    <p className="text-red-600 text-sm">Invalid dialogue element</p>
                  </div>
                );
              }

              let determinedElementType = safeGetString(element, 'type', 'unknown');
              if (element.character && element.text && determinedElementType === 'unknown') {
                determinedElementType = 'dialogue';
              }

              if (determinedElementType === 'dialogue') {
                const character = safeGetString(element, 'character', 'Speaker');
                const text = safeGetString(element, 'text', 'No text available');

                return (
                  <div key={index} className="flex items-start space-x-4 mb-4">
                    <div className="flex flex-col items-center space-y-1">
                      <DialogueAvatarErrorBoundary>
                        <DialogueAvatar character={character} size="sm" />
                      </DialogueAvatarErrorBoundary>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center">
                        {character}
                      </span>
                    </div>
                    <div className="flex-1 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
                      <p className="leading-relaxed text-gray-800">{text}</p>
                    </div>
                  </div>
                );
              } else if (determinedElementType === 'multiple_choice') {
                const question = safeGetString(element, 'question', '') || safeGetString(element, 'text', 'Question not available');
                const options = safeGetArray(element, 'options');
                // Note: We don't show the correct answer on the student's side

                return (
                  <div key={index} className="border border-cyber-400/20 rounded-lg p-4 bg-gradient-to-r from-yellow-50/50 to-amber-50/50 dark:from-yellow-900/20 dark:to-amber-900/20">
                    <p className="font-medium mb-3">{question}</p>
                    <div className="space-y-2">
                      {options.length > 0 ? options.map((option: any, optIndex: number) => (
                        <div key={optIndex} className="flex items-center space-x-2 p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer">
                          <div className="w-4 h-4 border border-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-500">{String.fromCharCode(65 + optIndex)}</span>
                          </div>
                          <span className="text-sm">{safeStringify(option)}</span>
                        </div>
                      )) : (
                        <p className="text-sm text-gray-500">No answer options available</p>
                      )}
                    </div>
                    {/* Student instruction */}
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                      <p className="text-blue-700 font-medium">📝 Choose the best answer and discuss with your tutor.</p>
                    </div>
                  </div>
                );
              } else {
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

      default:
        return (
          <div className="prose max-w-none">
            <p>{safeGetString(section, 'content', 'Exercise content will be displayed here.')}</p>
          </div>
        );
    }
  };

  const renderTemplateSection = (section: TemplateSection, lessonIndex: number = 0) => {
    if (!template || !section || typeof section !== 'object') {
      console.warn('Invalid section object:', section);
      return (
        <div key="invalid-section" className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-600">Invalid section data</p>
        </div>
      );
    }

    const sectionId = safeGetString(section, 'id', 'unknown-section');
    const sectionType = safeGetString(section, 'type', 'unknown');

    switch (sectionType) {
      case 'title':
        const lessonTitle = safeGetString(section, 'title', 'Lesson Title');
        const lessonSubtitle = section.subtitle ? safeGetString(section, 'subtitle', '') : undefined;

        return (
          <div key={sectionId} className="mb-8">
            <LessonBannerImage
              title={lessonTitle}
              subtitle={lessonSubtitle}
              subject={sharedLesson?.lesson?.student?.target_language}
              level={sharedLesson?.lesson?.student?.level}
              className="mb-6"
            />
          </div>
        );

      case 'info_card':
        const objectives = safeGetArray(section, 'items');
        
        // PRIORITY 1: Check AI-generated content first (same logic as tutor's view)
        const aiPlaceholderKey = safeGetString(section, 'ai_placeholder');
        let cardContent = safeGetString(section, 'content', '');
        
        // If content is empty, check if AI filled the placeholder field
        if (!cardContent && aiPlaceholderKey) {
          // Check if content is in the correct place (new field with ai_placeholder name)
          if (aiPlaceholderKey.length < 100) {
            const aiContent = (section as any)[aiPlaceholderKey];
            if (aiContent) {
              cardContent = safeStringify(aiContent);
              console.log(`✅ Using AI-generated content from CORRECT field "${aiPlaceholderKey}" for info_card`);
            }
          }
          
          // TEMPORARY FIX: Check if content is wrongly placed IN the ai_placeholder field itself
          if (!cardContent && aiPlaceholderKey.length > 100) {
            cardContent = aiPlaceholderKey;
            console.log(`⚠️ Using AI content WRONGLY placed in ai_placeholder field for info_card`);
          }
        }

        return (
          <Card key={sectionId} className={`mb-6 floating-card glass-effect border-cyber-400/20 ${getBgColor(section.background_color_var)}`}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-cyber-400" />
                {safeGetString(section, 'title', 'Information')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cardContent ? (
                <div className="prose max-w-none">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {cardContent}
                  </p>
                </div>
              ) : objectives.length > 0 ? (
                <ul className="space-y-2">
                  {objectives.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{safeStringify(item)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ Content not available for this section. Please contact your tutor.
                  </p>
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
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-900">
                    {safeGetString(section, 'instruction', '')}
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {renderExerciseContent(section)}
            </CardContent>
          </Card>
        );

      case 'vocabulary':
        const vocabularyItems = safeGetArray(section, 'vocabulary_items').map((item: any) => ({
          word: safeGetString(item, 'word', 'Unknown word'),
          partOfSpeech: safeGetString(item, 'part_of_speech', 'noun'),
          phonetic: safeGetString(item, 'phonetic', ''),
          definition: safeGetString(item, 'definition', 'No definition available'),
          examples: safeGetArray(item, 'examples'),
          level: sharedLesson?.lesson?.student?.level || 'intermediate'
        }));

        return (
          <Card key={sectionId} className="mb-6 floating-card glass-effect border-cyber-400/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-cyber-400" />
                {safeGetString(section, 'title', 'Vocabulary')}
              </CardTitle>
              {section.subtitle && (
                <p className="text-sm text-muted-foreground">{section.subtitle}</p>
              )}
              {section.instruction && (
                <div className={`p-3 rounded-lg ${getBgColor(section.instruction_bg_color_var)}`}>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-900">
                    {safeGetString(section, 'instruction', '')}
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <EnhancedVocabularySection
                vocabularyItems={vocabularyItems}
                level={sharedLesson?.lesson?.student?.level || 'intermediate'}
                className="border-0 shadow-none p-0"
              />
            </CardContent>
          </Card>
        );

      case 'dialogue':
        return (
          <Card key={sectionId} className="mb-6 floating-card glass-effect border-cyber-400/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-cyber-400" />
                {safeGetString(section, 'title', 'Dialogue')}
              </CardTitle>
              {section.subtitle && (
                <p className="text-sm text-muted-foreground">{section.subtitle}</p>
              )}
              {section.instruction && (
                <div className={`p-3 rounded-lg ${getBgColor(section.instruction_bg_color_var)}`}>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-900">
                    {safeGetString(section, 'instruction', '')}
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {section.dialogue_lines?.map((line: any, index: number) => {
                  const character = typeof line === 'object' ? line.character : parseDialogueLine(line).character;
                  const text = typeof line === 'object' ? line.text : parseDialogueLine(line).text;
                  const translation = typeof line === 'object' ? line.translation : undefined;

                  const characterInfo = getCharacterInfo(character);

                  return (
                    <div key={index} className="flex items-start gap-3">
                      <DialogueAvatarErrorBoundary>
                        <DialogueAvatar
                          character={character}
                          size="sm"
                        />
                      </DialogueAvatarErrorBoundary>
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1">{character}</div>
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
                          <p className="text-gray-800">{text}</p>
                          {translation && (
                            <p className="text-sm text-muted-foreground mt-2 italic border-t border-gray-200 pt-2">
                              {translation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );

      case 'comprehension_questions':
        const questions = safeGetArray(section, 'questions');
        if (questions.length === 0) {
          return (
            <Card key={sectionId} className="mb-6 floating-card glass-effect border-cyber-400/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-cyber-400" />
                  {safeGetString(section, 'title', 'Comprehension/Practice Questions')}
                </CardTitle>
                {section.subtitle && (
                  <p className="text-sm text-muted-foreground">{section.subtitle}</p>
                )}
                {section.instruction && (
                  <div className={`p-3 rounded-lg ${getBgColor(section.instruction_bg_color_var)}`}>
                    <p className="text-sm font-medium">
                      {safeGetString(section, 'instruction', '')}
                    </p>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-center py-4 text-gray-500">
                  <p>No comprehension questions available.</p>
                </div>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card key={sectionId} className="mb-6 floating-card glass-effect border-cyber-400/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-cyber-400" />
                {safeGetString(section, 'title', 'Comprehension/Practice Questions')}
              </CardTitle>
              {section.subtitle && (
                <p className="text-sm text-muted-foreground">{section.subtitle}</p>
              )}
              {section.instruction && (
                <div className={`p-3 rounded-lg ${getBgColor(section.instruction_bg_color_var)}`}>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-900">
                    {safeGetString(section, 'instruction', '')}
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questions.map((question: any, index: number) => {
                  const questionText = safeGetString(question, 'question', '') || safeGetString(question, 'text', 'Question not available');
                  const answer = safeGetString(question, 'answer', '') || safeGetString(question, 'correct_answer', '');
                  const questionId = `${section.id}_question_${index}`;

                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 dark:text-gray-100 flex-1 pr-4">
                          {questionText}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRevealedAnswers(prev => ({
                              ...prev,
                              [questionId]: !prev[questionId]
                            }));
                          }}
                          className="text-xs whitespace-nowrap"
                        >
                          {revealedAnswers[questionId] ? 'Hide Answer' : 'Show Answer'}
                        </Button>
                      </div>

                      {revealedAnswers[questionId] && answer && (
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                          <p className="text-sm text-green-800 dark:text-green-200">
                            <strong>Answer:</strong> {answer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );

      case 'text_content':
        return (
          <Card key={sectionId} className="mb-6 floating-card glass-effect border-cyber-400/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-cyber-400" />
                {safeGetString(section, 'title', 'Content')}
              </CardTitle>
              {section.subtitle && (
                <p className="text-sm text-muted-foreground">{section.subtitle}</p>
              )}
              {section.instruction && (
                <div className={`p-3 rounded-lg ${getBgColor(section.instruction_bg_color_var)}`}>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-900">
                    {safeGetString(section, 'instruction', '')}
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {section.content && (
                <div className="prose max-w-none mb-4">
                  <p className="leading-relaxed text-gray-700 dark:text-gray-300">{section.content}</p>
                </div>
              )}
              {section.items && section.items.length > 0 && (
                <ul className="space-y-2">
                  {section.items.map((item: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        );

      case 'audio':
        return (
          <Card key={sectionId} className="mb-6 floating-card glass-effect border-cyber-400/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Volume2 className="w-5 h-5 mr-2 text-cyber-400" />
                {safeGetString(section, 'title', 'Audio')}
              </CardTitle>
              {section.instruction && (
                <div className={`p-3 rounded-lg ${getBgColor(section.instruction_bg_color_var)}`}>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-900">
                    {safeGetString(section, 'instruction', '')}
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Volume2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground">Audio content available in interactive lesson</p>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card key={sectionId} className="mb-6 floating-card glass-effect border-cyber-400/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-cyber-400" />
                {safeGetString(section, 'title', 'Lesson Content')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Content type &quot;{sectionType}&quot; will be displayed here.</p>
                {section.content && (
                  <div className="mt-4 prose max-w-none">
                    <p>{section.content}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shared lesson...</p>
        </div>
      </div>
    );
  }

  if (error || isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                {isExpired ? 'Link Expired' : 'Error'}
              </h2>
              <p className="text-muted-foreground mb-4">
                {error || 'This lesson link has expired or is no longer available.'}
              </p>
              <p className="text-sm text-muted-foreground">
                Please contact your tutor for a new link.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sharedLesson) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Lesson Not Found</h2>
              <p className="text-muted-foreground">
                The requested lesson could not be found.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">
                    {sharedLesson.lesson_title}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>Student: <strong className="font-bold text-gray-900 dark:text-gray-100">{sharedLesson.student_name || sharedLesson.lesson?.student?.name || 'Student'}</strong></span>
                    </div>
                    {sharedLesson.lesson?.student && (
                      <>
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-4 h-4" />
                          <span>Level: <strong className="font-bold text-gray-900 dark:text-gray-100">{sharedLesson.lesson.student.level}</strong></span>
                        </div>
                        <Badge variant="outline">
                          {sharedLesson.lesson.student.target_language}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="w-4 h-4" />
                    <span>Shared: {new Date(sharedLesson.shared_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs">
                    Expires: {new Date(sharedLesson.expires_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>



        {/* Lesson Content */}
        <div id="shared-lesson-content">
          {template && template.template_json?.sections ? (
            template.template_json.sections.map((section: TemplateSection, index: number) =>
              renderTemplateSection(section, index)
            )
          ) : lessonContent ? (
            <Card>
              <CardHeader>
                <CardTitle>{lessonContent.title || 'Lesson Content'}</CardTitle>
              </CardHeader>
              <CardContent>
                {lessonContent.type === 'text' ? (
                  <div className="prose max-w-none">
                    <p className="text-lg text-gray-700 dark:text-gray-300">{lessonContent.content}</p>
                  </div>
                ) : lessonContent.type === 'fallback' ? (
                  <div className="prose max-w-none">
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Lesson Available</h3>
                      <p className="text-muted-foreground">{lessonContent.content}</p>
                    </div>
                  </div>
                ) : lessonContent.type === 'generated' ? (
                  <div className="prose max-w-none">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{lessonContent.title}</h3>
                      {lessonContent.content.objectives && (
                        <div>
                          <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Objectives:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {lessonContent.content.objectives.map((obj: string, index: number) => (
                              <li key={index} className="text-sm text-gray-700 dark:text-gray-300">{obj}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {lessonContent.content.activities && (
                        <div>
                          <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Activities:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {lessonContent.content.activities.map((activity: string, index: number) => (
                              <li key={index} className="text-sm text-gray-700 dark:text-gray-300">{activity}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {lessonContent.content.materials && (
                        <div>
                          <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Materials:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {lessonContent.content.materials.map((material: string, index: number) => (
                              <li key={index} className="text-sm text-gray-700 dark:text-gray-300">{material}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(lessonContent, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No lesson content available</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <Separator className="mb-4" />
          <p>This lesson was shared with you by your tutor.</p>
          <p className="mt-1">
            Link expires on {new Date(sharedLesson.expires_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default SharedLessonPage;