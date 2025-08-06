"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  const { getCharacterInfo } = useDialogueAvatars();

  const fetchSharedLesson = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch shared lesson data with lesson details
      console.log('Fetching shared lesson with ID:', shareId);

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
        .eq('id', shareId)
        .single();

      console.log('Database query result:', {
        hasSharedData: !!sharedData,
        sharedError,
        errorCode: sharedError?.code,
        errorMessage: sharedError?.message
      });

      if (sharedError) {
        console.error('Database error:', sharedError);
        console.error('Error details:', {
          code: sharedError.code,
          message: sharedError.message,
          details: sharedError.details,
          hint: sharedError.hint
        });
        throw new Error(`Shared lesson not found: ${sharedError.message}`);
      }

      if (!sharedData) {
        console.error('No shared lesson data returned');
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

      console.log('Full shared lesson data:', JSON.stringify(sharedData, null, 2));

      // Parse lesson materials - prioritize interactive_lesson_content
      if (sharedData.lesson?.interactive_lesson_content) {
        try {
          console.log('Raw interactive_lesson_content:', sharedData.lesson.interactive_lesson_content);

          let interactiveContent;
          if (typeof sharedData.lesson.interactive_lesson_content === 'string') {
            interactiveContent = JSON.parse(sharedData.lesson.interactive_lesson_content);
          } else {
            interactiveContent = sharedData.lesson.interactive_lesson_content;
          }

          console.log('Parsed interactive lesson content:', interactiveContent);
          setLessonContent(interactiveContent);

          // Check for template in different possible locations
          if (interactiveContent.template) {
            console.log('Found template in interactiveContent.template');
            setTemplate(interactiveContent.template);
          } else if (interactiveContent.sections) {
            console.log('Found sections directly in interactiveContent, creating mock template');
            // Create a mock template structure
            const mockTemplate = {
              template_json: {
                sections: interactiveContent.sections,
                colors: interactiveContent.colors || {}
              }
            };
            setTemplate(mockTemplate);
          } else {
            console.log('No template or sections found, using interactiveContent as template');
            // Use the entire interactive content as template
            const mockTemplate = {
              template_json: interactiveContent
            };
            setTemplate(mockTemplate);
          }
        } catch (parseError) {
          console.error('Error parsing interactive lesson content:', parseError);
          console.error('Raw content that failed to parse:', sharedData.lesson.interactive_lesson_content);
          setError('Error loading interactive lesson content');
        }
      } else if (sharedData.lesson?.materials && sharedData.lesson.materials.length > 0) {
        const rawMaterial = sharedData.lesson.materials[0];
        console.log('Raw lesson materials:', rawMaterial);

        try {
          // Try to parse as JSON first
          const materialData = JSON.parse(rawMaterial);
          console.log('Parsed lesson materials as JSON:', materialData);
          setLessonContent(materialData);

          if (materialData.template) {
            setTemplate(materialData.template);
          }
        } catch (parseError) {
          console.log('Materials are not JSON, treating as plain text:', rawMaterial);
          // If it's not JSON, treat it as plain text content
          setLessonContent({
            type: 'text',
            content: rawMaterial,
            title: sharedData.lesson_title || 'Lesson Content'
          });
        }
      } else {
        console.log('No lesson materials found:', sharedData.lesson);
        console.log('Lesson data structure:', {
          hasLesson: !!sharedData.lesson,
          hasInteractiveContent: !!sharedData.lesson?.interactive_lesson_content,
          hasMaterials: !!sharedData.lesson?.materials,
          materialsLength: sharedData.lesson?.materials?.length || 0,
          materialsContent: sharedData.lesson?.materials
        });

        // Try to create a fallback display with available data
        if (sharedData.lesson_title) {
          console.log('Creating fallback content with lesson title');
          setLessonContent({
            type: 'fallback',
            title: sharedData.lesson_title,
            content: 'This lesson is available but the content format is not supported for sharing. Please contact your tutor for assistance.'
          });
        } else if (sharedData.lesson?.generated_lessons && sharedData.lesson.generated_lessons.length > 0) {
          console.log('Found generated lessons, creating fallback content');
          try {
            const firstGeneratedLesson = JSON.parse(sharedData.lesson.generated_lessons[0]);
            setLessonContent({
              type: 'generated',
              title: firstGeneratedLesson.title || 'Generated Lesson',
              content: firstGeneratedLesson
            });
          } catch (parseError) {
            console.error('Error parsing generated lesson:', parseError);
            setLessonContent({
              type: 'fallback',
              title: 'Lesson Content',
              content: 'This lesson contains generated content that cannot be displayed in the shared format. Please contact your tutor for assistance.'
            });
          }
        } else {
          console.error('No usable lesson content found');
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
        return (
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {explanationContent}
            </div>
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
        const vocabularyItems = safeGetArray(section, 'vocabulary_items').map((item: any) => ({
          word: safeGetString(item, 'word', 'Unknown word'),
          partOfSpeech: safeGetString(item, 'part_of_speech', 'noun'),
          phonetic: safeGetString(item, 'phonetic', ''),
          definition: safeGetString(item, 'definition', 'No definition available'),
          examples: safeGetArray(item, 'examples'),
          level: sharedLesson?.lesson?.student?.level || 'intermediate'
        }));

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
        const cardContent = safeGetString(section, 'content', '');

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
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {cardContent}
                  </p>
                </div>
              ) : objectives.length > 0 ? (
                <ul className="space-y-2">
                  {objectives.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>{safeStringify(item)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="prose max-w-none">
                  <p className="text-sm text-muted-foreground">No content available</p>
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
                  <p className="text-sm font-medium">
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
                  <p className="text-sm font-medium">
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
                  <p className="text-sm font-medium">
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
                  {safeGetString(section, 'title', 'Comprehension Questions')}
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
                {safeGetString(section, 'title', 'Comprehension Questions')}
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
              <div className="space-y-6">
                {questions.map((question: any, index: number) => {
                  const questionText = safeGetString(question, 'question', '') || safeGetString(question, 'text', 'Question not available');
                  const options = safeGetArray(question, 'options');

                  return (
                    <div key={index} className="border border-cyber-400/20 rounded-lg p-4 bg-gradient-to-r from-yellow-50/50 to-amber-50/50 dark:from-yellow-900/20 dark:to-amber-900/20">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="w-6 h-6 bg-cyber-400 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <p className="font-medium text-gray-900">{questionText}</p>
                      </div>

                      {options.length > 0 && (
                        <div className="space-y-2 ml-9">
                          {options.map((option: any, optIndex: number) => (
                            <div key={optIndex} className="flex items-center space-x-2 p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer">
                              <div className="w-4 h-4 border border-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-500">{String.fromCharCode(65 + optIndex)}</span>
                              </div>
                              <span className="text-sm">{safeStringify(option)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Student instruction */}
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm ml-9">
                        <p className="text-blue-700 font-medium">📝 Choose the best answer and discuss with your tutor.</p>
                      </div>
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
                  <p className="text-sm font-medium">
                    {safeGetString(section, 'instruction', '')}
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {section.content && (
                <div className="prose max-w-none mb-4">
                  <p className="leading-relaxed">{section.content}</p>
                </div>
              )}
              {section.items && section.items.length > 0 && (
                <ul className="space-y-2">
                  {section.items.map((item: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>{item}</span>
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
                  <p className="text-sm font-medium">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shared lesson...</p>
        </div>
      </div>
    );
  }

  if (error || isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Lesson Not Found</h2>
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
    <div className="min-h-screen bg-gray-50">
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
                      <span>Student: {sharedLesson.student_name}</span>
                    </div>
                    {sharedLesson.lesson?.student && (
                      <>
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-4 h-4" />
                          <span>Level: {sharedLesson.lesson.student.level}</span>
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

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-yellow-800">Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs space-y-2">
                <div><strong>Has template:</strong> {template ? 'Yes' : 'No'}</div>
                <div><strong>Template sections:</strong> {template?.template_json?.sections?.length || 0}</div>
                <div><strong>Has lessonContent:</strong> {lessonContent ? 'Yes' : 'No'}</div>
                <div><strong>LessonContent type:</strong> {typeof lessonContent}</div>
                {template && (
                  <details>
                    <summary>Template Structure</summary>
                    <pre className="text-xs bg-white p-2 rounded mt-2 overflow-auto max-h-40">
                      {JSON.stringify(template, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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
                    <p className="text-lg">{lessonContent.content}</p>
                  </div>
                ) : lessonContent.type === 'fallback' ? (
                  <div className="prose max-w-none">
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                      <h3 className="text-lg font-semibold mb-2">Lesson Available</h3>
                      <p className="text-muted-foreground">{lessonContent.content}</p>
                    </div>
                  </div>
                ) : lessonContent.type === 'generated' ? (
                  <div className="prose max-w-none">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">{lessonContent.title}</h3>
                      {lessonContent.content.objectives && (
                        <div>
                          <h4 className="font-medium mb-2">Objectives:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {lessonContent.content.objectives.map((obj: string, index: number) => (
                              <li key={index} className="text-sm">{obj}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {lessonContent.content.activities && (
                        <div>
                          <h4 className="font-medium mb-2">Activities:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {lessonContent.content.activities.map((activity: string, index: number) => (
                              <li key={index} className="text-sm">{activity}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {lessonContent.content.materials && (
                        <div>
                          <h4 className="font-medium mb-2">Materials:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {lessonContent.content.materials.map((material: string, index: number) => (
                              <li key={index} className="text-sm">{material}</li>
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